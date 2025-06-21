export class JoyConHIDManager {
  constructor(scene) {
    this.scene = scene;
    this.device = null;
    this.subcommandPacketCounter = 0;
    this.reportCount = 0;
    
    // 振動探しゲーム専用の入力状態
    this.inputState = {
      rightStick: { x: 0, y: 0 },
      buttons: {
        a: true, b: false, x: false, y: false,
        l: false, r: false, zl: false, zr: false,
        sl: false, sr: false,
        minus: false, plus: false, home: false, capture: false
      }
    };
    
    // 振動探しゲーム専用のキャリブレーション設定
    this.stickCalibration = null;
    this.calibrationTimer = null;
    this.lastAz = 0;
    this.motionCooldown = false;
  }

  async connect() {
    try {
      console.log('Joy-Con接続を開始します...');
      
      if (!('hid' in navigator)) {
        console.error('WebHID APIがサポートされていません');
        return 'not-supported';
      }

      const devices = await navigator.hid.requestDevice({
        filters: [
          { vendorId: 0x057e, productId: 0x2007 }, // Joy-Con (R)
          { vendorId: 0x057e, productId: 0x2006 }  // Joy-Con (L)
        ]
      });

      if (devices.length === 0) {
        console.log('Joy-Conが選択されませんでした');
        return 'cancelled';
      }

      this.device = devices[0];
      console.log('Joy-Con選択:', this.device.productName);

      if (this.device.opened) {
        console.log('Joy-Conは既に接続済みです');
        return 'already-connected';
      }

      await this.device.open();
      console.log('Joy-Con接続成功');

      // 振動探しゲーム専用の設定
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      // IMUを有効化
      await this.#sendSubCommand(0x40, [0x01]);
      await sleep(50);
      
      // 標準レポートモードに設定
      await this.#sendSubCommand(0x03, [0x30]);
      await sleep(50);

      // イベントリスナー設定
      this.device.addEventListener('inputreport', (e) => this.#onReport(e));

      console.log('Joy-Con設定完了 - 振動探しゲーム用');
      return 'connected';
    } catch (error) {
      console.error('Joy-Con接続エラー:', error);
      return 'error';
    }
  }

  // 振動探しゲーム専用の入力状態取得
  getInputState() {
    return this.inputState;
  }

  // キャリブレーション再実行
  recalibrate() {
    console.log('スティックキャリブレーションを再実行します...');
    
    // キャリブレーションをリセット
    this.stickCalibration = null;
    
    // タイマーもリセット
    if (this.calibrationTimer) {
      clearTimeout(this.calibrationTimer);
      this.calibrationTimer = null;
    }
    
    console.log('キャリブレーションリセット完了 - 新しいキャリブレーションを開始します');
  }

  async rumble(low_freq, high_freq, low_amp, high_amp) {
    if (!this.device) {
      return;
    }

    const rumbleData = new Uint8Array(8);

    // Set neutral rumble data for the LEFT Joy-Con (bytes 0-3)
    rumbleData[0] = 0x00;
    rumbleData[1] = 0x01;
    rumbleData[2] = 0x40;
    rumbleData[3] = 0x40;

    // Set desired rumble data for the RIGHT Joy-Con (bytes 4-7)
    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const hf = clamp(Math.round(32 * Math.log2(high_freq / 10.0)), 0x00, 0xff);
    const hf_amp = clamp(Math.round(high_amp * 2), 0x00, 0x1c);
    const lf = clamp(Math.round(32 * Math.log2(low_freq / 10.0)), 0x00, 0xff);
    const lf_amp = clamp(Math.round(low_amp * 2), 0x00, 0x1c);
    
    rumbleData[4] = hf;
    rumbleData[5] = hf_amp;
    rumbleData[6] = lf;
    rumbleData[7] = lf_amp;

    const buf = new Uint8Array(1 + rumbleData.length);
    buf[0] = this.subcommandPacketCounter;
    this.subcommandPacketCounter = (this.subcommandPacketCounter + 1) & 0x0f;
    buf.set(rumbleData, 1);
    
    await this.device.sendReport(0x10, buf);
  }

  destroy() {
    if (this.calibrationTimer) {
      clearTimeout(this.calibrationTimer);
    }
    if (this.device) {
      this.device.close();
    }
  }

  // --- Private ---------------------------------------------------------------
  async #sendSubCommand(cmd, data) {
    if (!this.device) return;

    const buf = new Uint8Array(10 + data.length);
    buf[0] = this.subcommandPacketCounter;
    this.subcommandPacketCounter = (this.subcommandPacketCounter + 1) & 0x0f;

    // Default neutral rumble data
    buf[1] = 0x00; buf[2] = 0x01; buf[3] = 0x40; buf[4] = 0x40;
    buf[5] = 0x00; buf[6] = 0x01; buf[7] = 0x40; buf[8] = 0x40;

    buf[9] = cmd;
    buf.set(data, 10);
    
    await this.device.sendReport(0x01, buf);
  }

  #onReport(e) {
    this.reportCount++;
    
    if (e.reportId !== 0x30) {
      return;
    }
    const d = new DataView(e.data.buffer);

    // ボタン入力の解析（Joy-Con R用）
    const buttons1 = d.getUint8(3);
    const buttons2 = d.getUint8(4);

    // 振動探しゲーム用のボタンマッピング
    this.inputState.buttons.a = !!(buttons1 & 0x01);
    this.inputState.buttons.b = !!(buttons1 & 0x02);
    this.inputState.buttons.x = !!(buttons1 & 0x04);
    this.inputState.buttons.y = !!(buttons1 & 0x08);
    this.inputState.buttons.sl = !!(buttons1 & 0x10);
    this.inputState.buttons.sr = !!(buttons1 & 0x20);
    this.inputState.buttons.r = !!(buttons1 & 0x40);
    this.inputState.buttons.zr = !!(buttons1 & 0x80);

    this.inputState.buttons.minus = !!(buttons2 & 0x01);
    this.inputState.buttons.plus = !!(buttons2 & 0x02);
    this.inputState.buttons.home = !!(buttons2 & 0x10);

    // 右スティック（Joy-Con R）の入力解析
    const rightStickRaw = [
      d.getUint8(9),
      d.getUint8(10),
      d.getUint8(11)
    ];

    const rightStickX = rightStickRaw[0] | ((rightStickRaw[1] & 0x0F) << 8);
    const rightStickY = (rightStickRaw[1] >> 4) | (rightStickRaw[2] << 4);

    // 振動探しゲーム専用のキャリブレーション（改良版）
    if (!this.stickCalibration) {
      this.stickCalibration = {
        centerX: rightStickX,
        centerY: rightStickY,
        calibrated: false,
        sampleCount: 1,
        samples: []
      };
      console.log(`振動探しゲーム - スティック初期値: X=${rightStickX}, Y=${rightStickY}`);
    }

    if (!this.stickCalibration.calibrated) {
      // より多くのサンプルを収集してより正確な中央値を計算
      this.stickCalibration.samples.push({ x: rightStickX, y: rightStickY });
      this.stickCalibration.sampleCount++;
      
      // 移動平均で中央値を更新
      const recentSamples = this.stickCalibration.samples.slice(-50); // 最新50サンプル
      const avgX = recentSamples.reduce((sum, s) => sum + s.x, 0) / recentSamples.length;
      const avgY = recentSamples.reduce((sum, s) => sum + s.y, 0) / recentSamples.length;
      
      this.stickCalibration.centerX = avgX;
      this.stickCalibration.centerY = avgY;
      
      if (!this.calibrationTimer) {
        this.calibrationTimer = setTimeout(() => {
          this.stickCalibration.calibrated = true;
          console.log(`振動探しゲーム - キャリブレーション完了: 中央値 X=${this.stickCalibration.centerX.toFixed(0)}, Y=${this.stickCalibration.centerY.toFixed(0)} (${this.stickCalibration.sampleCount}サンプル)`);
        }, 5000); // 5秒間キャリブレーション
      }
    }

    // 振動探しゲーム専用の正規化設定
    const centerX = this.stickCalibration.centerX;
    const centerY = this.stickCalibration.centerY;
    const range = 1800;

    const normalizedX = Math.max(-1, Math.min(1, (rightStickX - centerX) / range));
    const normalizedY = Math.max(-1, Math.min(1, (rightStickY - centerY) / range));

    this.inputState.rightStick.x = normalizedX;
    this.inputState.rightStick.y = normalizedY;

    // 振動探しゲーム専用のデッドゾーン（安定性最優先）
    const deadzone = 0.25; // デッドゾーンをさらに大きくして確実に意図しない移動を防止
    if (Math.abs(this.inputState.rightStick.x) < deadzone) {
      this.inputState.rightStick.x = 0;
    }
    if (Math.abs(this.inputState.rightStick.y) < deadzone) {
      this.inputState.rightStick.y = 0;
    }

    // デバッグ情報（振動探しゲーム用）- キャリブレーション問題の診断
    if (Math.abs(this.inputState.rightStick.x) > 0.01 || Math.abs(this.inputState.rightStick.y) > 0.01) {
      console.log(`[DEBUG] 生データ: rawX=${rightStickX}, rawY=${rightStickY}, 中央値: centerX=${this.stickCalibration.centerX.toFixed(0)}, centerY=${this.stickCalibration.centerY.toFixed(0)}`);
      console.log(`[DEBUG] 正規化後: normalizedX=${normalizedX.toFixed(3)}, normalizedY=${normalizedY.toFixed(3)}`);
      console.log(`[DEBUG] 最終値: X=${this.inputState.rightStick.x.toFixed(3)}, Y=${this.inputState.rightStick.y.toFixed(3)}`);
    }
  }
} 