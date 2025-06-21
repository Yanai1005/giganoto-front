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
        a: false, b: false, x: false, y: false,
        l: false, r: false, zl: false, zr: false,
        sl: false, sr: false,
        minus: false, plus: false, home: false, capture: false
      },
      rawButtons: { byte3: 0, byte4: 0, byte5: 0 } // 生のボタンデータを保持
    };
    
    // ボタンの基本状態を記録（キャリブレーション用）
    this.buttonBaseline = null;
    this.buttonCalibrated = false;
    
    // 振動探しゲーム専用のキャリブレーション設定
    this.stickCalibration = null;
    this.calibrationTimer = null;
    this.lastAz = 0;
    this.motionCooldown = false;
    this.lastDebugOutput = null;
    this.lastFullDebug = null;
    this.lastXButtonState = false;
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
      this.isRightJoyCon = this.device.productId === 0x2007;
      console.log('Joy-Con選択:', this.device.productName, this.isRightJoyCon ? '(Right)' : '(Left)');

      if (this.device.opened) {
        console.log('Joy-Conは既に接続済みです');
        return 'already-connected';
      }

      await this.device.open();
      console.log('Joy-Con接続成功');

      // 振動探しゲーム専用の設定
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      console.log('Joy-Con初期化開始...');
      
      // 標準フルモードを有効化
      console.log('標準フルモードを有効化中...');
      await this.#sendSubCommand(0x03, [0x30]);
      await sleep(100);
      
      // IMUを有効化
      console.log('IMUモードを有効化中...');
      await this.#sendSubCommand(0x40, [0x01]);
      await sleep(100);
      
      // 振動を有効化
      console.log('振動モードを有効化中...');
      await this.#sendSubCommand(0x48, [0x01]);
      await sleep(100);
      
      // プレイヤーライトを設定（接続確認用）
      console.log('プレイヤーライトを設定中...');
      await this.#sendSubCommand(0x30, [0x01]); // Player 1 light
      await sleep(100);

      // イベントリスナー設定
      this.device.addEventListener('inputreport', (e) => this.#onReport(e));

      console.log('Joy-Con初期化完了 - 振動探しゲーム用');
      return 'connected';
    } catch (error) {
      console.error('Joy-Con接続エラー:', error);
      return 'error';
    }
  }

  // 振動探しゲーム専用の入力状態取得
  getInputState() {
    // Xボタンが押された場合、手動キャリブレーションを実行
    if (this.inputState.buttons.x && !this.lastXButtonState) {
      console.log('Xボタンが押されました - 手動キャリブレーションを実行');
      this.stickCalibration = null; // キャリブレーションをリセット
      if (this.calibrationTimer) {
        clearTimeout(this.calibrationTimer);
        this.calibrationTimer = null;
      }
    }
    this.lastXButtonState = this.inputState.buttons.x;

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
      console.log(`[REPORT] 予期しないレポートID: ${e.reportId.toString(16)}`);
      return;
    }
    const d = new DataView(e.data.buffer);
    
    // レポート全体をデバッグ出力（全バイト）
    const reportBytes = [];
    for (let i = 0; i < e.data.byteLength; i++) {
      reportBytes.push(d.getUint8(i).toString(16).padStart(2, '0'));
    }
    
    // 10回に1回だけ全データを出力（ログを減らすため）
    if (this.reportCount % 10 === 0) {
      console.log(`[REPORT DATA] ${reportBytes.join(' ')}`);
      console.log(`[REPORT LENGTH] ${e.data.byteLength} bytes`);
    }
    
    // ---------------- ボタン解析 ----------------
    const buttons1 = d.getUint8(3); // 標準位置1
    const buttons2 = d.getUint8(4); // 標準位置2
    const buttons3 = d.getUint8(5); // 標準位置3
    
    // 他の可能性のある位置もチェック
    const altButtons1 = d.getUint8(1); // 代替位置1
    const altButtons2 = d.getUint8(2); // 代替位置2
    const altButtons3 = d.getUint8(12); // 代替位置3
    const altButtons4 = d.getUint8(13); // 代替位置4

    // 実際のボタンデータが存在する位置を使用
    // コンソールログから、代替位置にデータがあることが判明
    const actualButtons1 = altButtons1; // byte1にメインボタンデータ
    const actualButtons2 = altButtons2; // byte2に追加ボタンデータ
    const actualButtons3 = altButtons3; // byte12に追加データ
    
    // ボタンの基本状態をキャリブレーション（初回のみ）
    if (!this.buttonCalibrated && this.reportCount > 10) {
      // 10回レポートを受信した後に基本状態を記録
      this.buttonBaseline = {
        byte1: actualButtons1,
        byte2: actualButtons2,
        byte12: actualButtons3
      };
      this.buttonCalibrated = true;
      console.log('[BTN CALIBRATION] ボタン基本状態を記録:', {
        byte1: actualButtons1.toString(2).padStart(8,'0'),
        byte2: actualButtons2.toString(2).padStart(8,'0'),
        byte12: actualButtons3.toString(2).padStart(8,'0')
      });
    }
    
    // キャリブレーション完了後は、基本状態からの変化のみを検出
    let buttonPressed1 = 0;
    let buttonPressed2 = 0;
    
    if (this.buttonCalibrated && this.buttonBaseline) {
      // 基本状態から変化したビットのみを検出（XOR演算）
      buttonPressed1 = actualButtons1 ^ this.buttonBaseline.byte1;
      buttonPressed2 = actualButtons2 ^ this.buttonBaseline.byte2;
      
      // さらに、現在の値が基本状態より大きい場合のみ「押された」と判定
      buttonPressed1 = buttonPressed1 & actualButtons1;
      buttonPressed2 = buttonPressed2 & actualButtons2;
    } else {
      // キャリブレーション前は全て false
      buttonPressed1 = 0;
      buttonPressed2 = 0;
    }
    
    // 生データを保持（デバッグ用）
    this.inputState.rawButtons.byte3 = buttonPressed1;
    this.inputState.rawButtons.byte4 = buttonPressed2;
    this.inputState.rawButtons.byte5 = actualButtons3;

    // ボタンが押されている可能性のあるバイトを全て確認
    if (buttons1 !== 0 || buttons2 !== 0 || buttons3 !== 0 || 
        altButtons1 !== 0 || altButtons2 !== 0 || altButtons3 !== 0 || altButtons4 !== 0) {
      console.log('[BTN DEBUG] 標準位置 - byte3=', buttons1.toString(2).padStart(8,'0'), 
                  'byte4=', buttons2.toString(2).padStart(8,'0'),
                  'byte5=', buttons3.toString(2).padStart(8,'0'));
      console.log('[BTN DEBUG] 代替位置 - byte1=', altButtons1.toString(2).padStart(8,'0'),
                  'byte2=', altButtons2.toString(2).padStart(8,'0'),
                  'byte12=', altButtons3.toString(2).padStart(8,'0'),
                  'byte13=', altButtons4.toString(2).padStart(8,'0'));
    }

    if (this.isRightJoyCon) {
      // 実際のレポートデータに基づくボタンマッピング
      // キャリブレーション後の変化データからボタンを読み取り
      this.inputState.buttons.y      = !!(buttonPressed1 & 0x01); // bit 0
      this.inputState.buttons.x      = !!(buttonPressed1 & 0x02); // bit 1
      this.inputState.buttons.b      = !!(buttonPressed1 & 0x04); // bit 2
      this.inputState.buttons.a      = !!(buttonPressed2 & 0x01) || !!(buttonPressed2 & 0x02) || 
                                       !!(buttonPressed2 & 0x04) || !!(buttonPressed2 & 0x08) ||
                                       !!(buttonPressed2 & 0x10) || !!(buttonPressed2 & 0x20) ||
                                       !!(buttonPressed2 & 0x40) || !!(buttonPressed2 & 0x80); // byte2の任意のビット
      this.inputState.buttons.sr     = !!(buttonPressed1 & 0x10); // bit 4
      this.inputState.buttons.sl     = !!(buttonPressed1 & 0x20); // bit 5
      this.inputState.buttons.r      = !!(buttonPressed1 & 0x40); // bit 6
      this.inputState.buttons.zr     = !!(buttonPressed1 & 0x80); // bit 7
      
      // byte2 からシステムボタンを読み取り
      this.inputState.buttons.minus  = !!(buttonPressed2 & 0x01);
      this.inputState.buttons.plus   = !!(buttonPressed2 & 0x02);
      this.inputState.buttons.home   = !!(buttonPressed2 & 0x10);
      this.inputState.buttons.capture = !!(buttonPressed2 & 0x20);

      // 未使用のボタンは false にリセット
      this.inputState.buttons.l  = false;
      this.inputState.buttons.zl = false;

      // Aボタンデバッグ（押されている時のみ）
      if (this.inputState.buttons.a) {
        console.log('[BTN] A button pressed!');
      }
      
      // 全てのボタン状態をデバッグ出力（ボタンが押されている時のみ）
      if (buttonPressed1 !== 0 || buttonPressed2 !== 0) {
        console.log('[BTN] Button states:', {
          y: this.inputState.buttons.y,
          x: this.inputState.buttons.x,
          b: this.inputState.buttons.b,
          a: this.inputState.buttons.a,
          sr: this.inputState.buttons.sr,
          sl: this.inputState.buttons.sl,
          r: this.inputState.buttons.r,
          zr: this.inputState.buttons.zr
        });
        console.log('[BTN] Raw pressed data:', {
          buttonPressed1: buttonPressed1.toString(2).padStart(8,'0'),
          buttonPressed2: buttonPressed2.toString(2).padStart(8,'0')
        });
        
        // Aボタン専用の詳細デバッグ
        if (buttonPressed2 !== 0) {
          console.log('[A-BTN DEBUG] byte4変化検出:', {
            'bit0(0x01)': !!(buttonPressed2 & 0x01),
            'bit1(0x02)': !!(buttonPressed2 & 0x02),
            'bit2(0x04)': !!(buttonPressed2 & 0x04),
            'bit3(0x08)': !!(buttonPressed2 & 0x08),
            'bit4(0x10)': !!(buttonPressed2 & 0x10),
            'bit5(0x20)': !!(buttonPressed2 & 0x20),
            'bit6(0x40)': !!(buttonPressed2 & 0x40),
            'bit7(0x80)': !!(buttonPressed2 & 0x80)
          });
        }
      }
    } else {
      // Joy-Con L（未使用だが初期化）
      this.inputState.buttons.a = false;
    }

    // ---------------- スティック解析 ----------------
    let stickX, stickY;
    if (this.isRightJoyCon) {
      // Joy-Con R: bytes 9-11 に12bitずつ格納
      const byte9 = d.getUint8(9);
      const byte10 = d.getUint8(10);  
      const byte11 = d.getUint8(11);
      
      stickX = byte9 | ((byte10 & 0x0f) << 8);
      stickY = (byte10 >> 4) | (byte11 << 4);
      
      // デバッグ用：生のバイト値を表示
      console.log(`[RAW BYTES] byte9=${byte9} byte10=${byte10} byte11=${byte11} | stickX=${stickX} stickY=${stickY}`);
    } else {
      // Joy-Con L: bytes 6-8
      stickX = d.getUint8(6) | ((d.getUint8(7) & 0x0f) << 8);
      stickY = (d.getUint8(7) >> 4) | (d.getUint8(8) << 4);
    }

    // ----------- 動的キャリブレーション -----------
    if (!this.stickCalibration) {
      // 初回読み取り値を中央値として採用。一瞬でキャリブレーション完了させる。
      this.stickCalibration = {
        centerX: stickX,
        centerY: stickY,
        calibrated: true
      };
      console.log(`[JoyCon] 即時キャリブレーション: centerX=${stickX}, centerY=${stickY}`);
    }

    const centerX = this.stickCalibration.centerX;
    const centerY = this.stickCalibration.centerY;
    // Joy-Con縦持ち時の軸マッピング
    // 物理X軸（左右）→ 画面の上下方向
    // 物理Y軸（上下）→ 画面の左右方向
    const range = 1800;

    // 物理X軸を画面の上下方向に、物理Y軸を画面の左右方向にマッピング
    let screenY = (stickX - centerX) / range;
    let screenX = (stickY - centerY) / range;

    // 範囲をクランプ
    screenX = Math.max(-1, Math.min(1, screenX));
    screenY = Math.max(-1, Math.min(1, screenY));

    // デッドゾーン
    const deadzone = 0.05;
    if (Math.abs(screenX) < deadzone) screenX = 0;
    if (Math.abs(screenY) < deadzone) screenY = 0;

    this.inputState.rightStick.x = screenX;  // 画面左右
    this.inputState.rightStick.y = screenY;  // 画面上下

    // デバッグ
    if (this.reportCount % 50 === 0) { // 50回に1回だけ出力（ログを減らすため）
      console.log(`[JoyCon] Stick raw X=${stickX} Y=${stickY} | center X=${centerX} Y=${centerY} | screenX=${screenX.toFixed(3)} screenY=${screenY.toFixed(3)}`);
    }
    
    // Y軸の詳細デバッグ
    if (Math.abs(stickY - centerY) > 100 && this.reportCount % 10 === 0) {
      console.log(`[Y軸詳細] stickY=${stickY}, centerY=${centerY}, diff=${stickY - centerY}, screenY=${screenY.toFixed(3)}`);
    }
  }
} 