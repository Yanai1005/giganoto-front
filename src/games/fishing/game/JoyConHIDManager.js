export class JoyConHIDManager {
  constructor(scene) {
    this.scene = scene;
    this.device = null;
    this.motionCooldown = false;        // モーション操作全体のクールダウン
    this.lastAz = 0;                  // 前回のZ軸加速度
    this.subcommandPacketCounter = 0;
    
    // 入力状態を保存するオブジェクト
    this.inputState = {
      buttons: {
        a: false,
        b: false,
        x: false,
        y: false,
        l: false,
        r: false,
        zl: false,
        zr: false,
        plus: false,
        minus: false,
        home: false,
        capture: false,
        sl: false,
        sr: false
      },
      rightStick: {
        x: 0,
        y: 0
      },
      leftStick: {
        x: 0,
        y: 0
      }
        };
    
    // スティックキャリブレーション用
    this.stickCalibration = null;
    this.calibrationTimer = null;
  }

  // --- Public ----------------------------------------------------------------
  async connect() {
    if (this.device) {
      console.log('[JoyConHID] Already connected.');
      return 'already-connected';
    }
    try {
      const filters = [
        { vendorId: 0x057e, productId: 0x2007 } // Joy-Con (R)
      ];
      const [device] = await navigator.hid.requestDevice({ filters });
      if (!device) return;
      this.device = device;
      await device.open();
      this.subcommandPacketCounter = 0;
      
      console.log('[JoyConHID] デバイス情報:', {
        productName: device.productName,
        vendorId: device.vendorId,
        productId: device.productId
      });
      
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      console.log('[JoyConHID] レポートモード0x30を有効化中...');
      // 1. Enable standard full report mode 0x30
      await this.#sendSubCommand(0x03, new Uint8Array([0x30]));
      await sleep(100); // Wait for the Joy-Con to process the command
      
      console.log('[JoyConHID] IMUを有効化中...');
      // 2. Enable IMU
      await this.#sendSubCommand(0x40, new Uint8Array([0x01]));
      await sleep(100);

      console.log('[JoyConHID] イベントリスナーを設定中...');
      device.addEventListener('inputreport', (e) => this.#onReport(e));
      
      console.log('[JoyConHID] Connected:', device.productName);
      
      // 接続完了後、数秒間レポート受信状況を監視
      this.reportCount = 0;
      const reportMonitor = setInterval(() => {
        console.log(`[JoyConHID] レポート受信数: ${this.reportCount}`);
        if (this.reportCount === 0) {
          console.warn('[JoyConHID] レポートが受信されていません。接続に問題がある可能性があります。');
        }
        this.reportCount = 0;
      }, 2000);
      
      // 10秒後に監視を停止
      setTimeout(() => {
        clearInterval(reportMonitor);
        console.log('[JoyConHID] レポート監視を終了しました');
      }, 10000);
      
      return 'connected';
    } catch (err) {
      console.error('[JoyConHID] connect error', err);
      return 'error';
    }
  }

  // 現在の入力状態を取得
  getInputState() {
    return this.inputState;
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
    if (this.device) {
      this.device.close();
    }
  }

  // --- Private ---------------------------------------------------------------
  async #sendSubCommand(cmd, data) {
    if (!this.device) return;

    // The payload for a subcommand (report 0x01) must be at least 10 bytes.
    // [Packet Counter(1)] [Rumble Data(8)] [Subcommand ID(1)] [Subcommand Data(...)]
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
    // レポート受信カウンター
    if (this.reportCount !== undefined) {
      this.reportCount++;
    }
    
    if (e.reportId !== 0x30) {
      console.log('予期しないレポートID:', e.reportId);
      return;
    }
    const d = new DataView(e.data.buffer);

    // 詳細なデバッグ情報
    console.log('Joy-Conレポート受信:', {
      reportId: e.reportId,
      dataLength: e.data.byteLength
    });

    // 全バイトをデバッグ出力（最初の20バイト）
    const allBytes = [];
    for (let i = 0; i < Math.min(20, e.data.byteLength); i++) {
      allBytes.push(`${i}:0x${d.getUint8(i).toString(16).padStart(2, '0')}`);
    }
    console.log('レポート全バイト:', allBytes.join(', '));

    // ボタン入力の解析（Joy-Con R用）
    const buttons1 = d.getUint8(3); // Button status 1
    const buttons2 = d.getUint8(4); // Button status 2

    // Joy-Con (R) のボタンマッピング（修正版）
    this.inputState.buttons.a = !!(buttons1 & 0x01);      // A button
    this.inputState.buttons.b = !!(buttons1 & 0x02);      // B button  
    this.inputState.buttons.x = !!(buttons1 & 0x04);      // X button
    this.inputState.buttons.y = !!(buttons1 & 0x08);      // Y button
    this.inputState.buttons.sl = !!(buttons1 & 0x10);     // SL button
    this.inputState.buttons.sr = !!(buttons1 & 0x20);     // SR button
    this.inputState.buttons.r = !!(buttons1 & 0x40);      // R button
    this.inputState.buttons.zr = !!(buttons1 & 0x80);     // ZR button

    this.inputState.buttons.minus = !!(buttons2 & 0x01);  // Minus button
    this.inputState.buttons.plus = !!(buttons2 & 0x02);   // Plus button
    this.inputState.buttons.home = !!(buttons2 & 0x10);   // Home button

    // 右スティック（Joy-Con R）の入力解析（修正版）
    // Joy-Con Rの場合、スティックデータは異なる位置にある
    const rightStickRaw = [
      d.getUint8(9),   // X axis byte 1
      d.getUint8(10),  // X axis byte 2 (lower 4 bits) + Y axis byte 1 (upper 4 bits)
      d.getUint8(11)   // Y axis byte 2
    ];

    // 12ビットの値を抽出（0-4095の範囲）
    const rightStickX = rightStickRaw[0] | ((rightStickRaw[1] & 0x0F) << 8);
    const rightStickY = (rightStickRaw[1] >> 4) | (rightStickRaw[2] << 4);

    // 常にスティック値をログ出力（デバッグ用）
    console.log(`生スティック値: X=${rightStickX}, Y=${rightStickY}, 生データ=[${rightStickRaw[0]}, ${rightStickRaw[1]}, ${rightStickRaw[2]}]`);
    console.log(`ボタン状態: buttons1=0x${buttons1.toString(16)}, buttons2=0x${buttons2.toString(16)}`);

    // Joy-Conスティックの実際の中央値を動的に調整
    // 初回接続時に中央値をキャリブレーション
    if (!this.stickCalibration) {
      this.stickCalibration = {
        centerX: rightStickX,
        centerY: rightStickY,
        calibrated: false
      };
      console.log(`スティック中央値設定: X=${rightStickX}, Y=${rightStickY}`);
    }

    // キャリブレーション完了後の処理
    if (!this.stickCalibration.calibrated) {
      // 最初の数秒間は中央値を更新
      this.stickCalibration.centerX = (this.stickCalibration.centerX + rightStickX) / 2;
      this.stickCalibration.centerY = (this.stickCalibration.centerY + rightStickY) / 2;
      
      // 3秒後にキャリブレーション完了
      if (!this.calibrationTimer) {
        this.calibrationTimer = setTimeout(() => {
          this.stickCalibration.calibrated = true;
          console.log(`キャリブレーション完了: 中央値 X=${this.stickCalibration.centerX.toFixed(0)}, Y=${this.stickCalibration.centerY.toFixed(0)}`);
        }, 3000);
      }
    }

    // キャリブレーションされた中央値を使用して正規化
    const centerX = this.stickCalibration.centerX;
    const centerY = this.stickCalibration.centerY;
    const range = 1800; // スティックの有効範囲を拡大

    // -1.0 から 1.0 の範囲に正規化
    const normalizedX = Math.max(-1, Math.min(1, (rightStickX - centerX) / range));
    const normalizedY = Math.max(-1, Math.min(1, (rightStickY - centerY) / range));

    console.log(`正規化前: centerX=${centerX.toFixed(0)}, centerY=${centerY.toFixed(0)}`);
    console.log(`正規化後: X=${normalizedX.toFixed(3)}, Y=${normalizedY.toFixed(3)}`);

    this.inputState.rightStick.x = normalizedX;
    this.inputState.rightStick.y = normalizedY;

    // デッドゾーンを小さくして感度を上げる
    const deadzone = 0.1; // 釣りゲーム用の元の設定に戻す
    if (Math.abs(this.inputState.rightStick.x) < deadzone) {
      this.inputState.rightStick.x = 0;
    }
    if (Math.abs(this.inputState.rightStick.y) < deadzone) {
      this.inputState.rightStick.y = 0;
    }

    console.log(`デッドゾーン適用後: X=${this.inputState.rightStick.x.toFixed(3)}, Y=${this.inputState.rightStick.y.toFixed(3)}`);

    // ボタン状態もログ出力
    if (this.inputState.buttons.a) {
      console.log('Aボタンが押されています');
    }

    // IMU（加速度センサー）の処理（既存の釣りゲーム用）
    const az1 = d.getInt16(17, true) / 4096;
    const az2 = d.getInt16(29, true) / 4096;
    const az3 = d.getInt16(41, true) / 4096;
    const az = (az1 + az2 + az3) / 3;
    const deltaZ = az - this.lastAz;

    const THR_CAST = -9.0;
    const THR_REEL = 9.0;
    const COOLDOWN_MOTION = 1000;

    if (this.scene.minigame?.active) {
      if (this.scene.minigame.type === 'tension') {
        const MINIGAME_THR_REEL = 4.0;
        if (deltaZ > MINIGAME_THR_REEL && !this.motionCooldown) {
          console.log(`ミニゲーム中リール検知: deltaZ=${deltaZ.toFixed(2)}`);
          this.scene.minigameManager.onPlayerReelAction();
          this.#startCooldown('motionCooldown', 60);
        }
      }
      this.lastAz = az;
      return;
    }
    
    if (this.motionCooldown) {
      this.lastAz = az;
      return;
    }

    // Cast
    if (deltaZ < THR_CAST) {
      if (this.scene.float && !this.scene.float.visible && !this.scene.gameState.catchingFish) {
        this.scene.castLine();
        this.rumble(160, 320, 0, 0.8);
        setTimeout(() => this.rumble(160, 160, 0, 0), 150);
        this.#startCooldown('motionCooldown', COOLDOWN_MOTION);
        this.lastAz = az;
        return;
      }
    }

    // Reel
    if (deltaZ > THR_REEL) {
      if (this.scene.float && this.scene.float.visible && !this.scene.gameState.catchingFish) {
        this.scene.reelLine();
        this.rumble(120, 240, 0, 0.6);
        setTimeout(() => this.rumble(160, 160, 0, 0), 100);
        this.#startCooldown('motionCooldown', COOLDOWN_MOTION);
        this.lastAz = az;
        return;
      }
    }

    this.lastAz = az;
  }

  #startCooldown(type, ms) {
    this[type] = true;
    setTimeout(() => (this[type] = false), ms);
  }
} 