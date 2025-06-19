export class JoyConHIDManager {
  constructor(scene) {
    this.scene = scene;
    this.device = null;
    this.castCooldown = false;        // キャスト連打防止用
    this.reelCooldownAfterCast = false; // キャスト直後のリール防止用
    this.reelActionCooldown = false;    // リール連打防止用
    this.lastAz = 0;                  // 前回のZ軸加速度
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

      // Enable IMU (sub-command 0x40 0x01)
      await this.#sendSubCommand(0x40, new Uint8Array([0x01]));

      // Enable standard full report mode 0x30 at 60 FPS (0x03)
      await this.#sendSubCommand(0x03, new Uint8Array([0x30]));

      device.addEventListener('inputreport', (e) => this.#onReport(e));
      console.log('[JoyConHID] Connected:', device.productName);
      return 'connected';
    } catch (err) {
      console.error('[JoyConHID] connect error', err);
      return 'error';
    }
  }

  async rumble(low_freq, high_freq, low_amp, high_amp) {
    if (!this.device) return;

    // Rumble data structure for Joy-Con
    // [hf_freq, hf_amp, lf_freq, lf_amp] * 2 (for L/R)
    // For a single Joy-Con, we only need the first 4 bytes.
    const rumbleData = new Uint8Array(8);

    // Clamp and encode frequencies
    // hf_freq: 80Hz - 1253Hz -> 0x00 - 0x7f
    // lf_freq: 41Hz - 626Hz -> 0x00 - 0x7f
    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const hf = clamp(Math.round(32 * Math.log2(high_freq / 10.0)), 0x00, 0xff);
    const hf_amp = clamp(Math.round(high_amp * 2), 0x00, 0x1c); // empirical limit
    const lf = clamp(Math.round(32 * Math.log2(low_freq / 10.0)), 0x00, 0xff);
    const lf_amp = clamp(Math.round(low_amp * 2), 0x00, 0x1c);
    
    // This is a simplified encoding. A more accurate one exists.
    // [hf_amp(upper 4bit), lf_freq] [hf_freq, lf_amp(upper 4bit)]
    rumbleData[0] = hf;
    rumbleData[1] = hf_amp;
    rumbleData[2] = lf;
    rumbleData[3] = lf_amp;

    // Output report 0x10: [reportId=0x10][packet#=0][rumble_data...]
    const buf = new Uint8Array(1 + 1 + rumbleData.length);
    buf[0] = 0x10; // reportId for rumble
    buf[1] = 0; // packet counter
    buf.set(rumbleData, 2);
    
    await this.device.sendReport(0x10, buf);
  }

  destroy() {
    if (this.device) {
      this.device.close();
    }
  }

  // --- Private ---------------------------------------------------------------
  async #sendSubCommand(cmd, data) {
    // Output report 0x01: [reportId=0x01][packet#=0][subCmd][data...]
    const buf = new Uint8Array(1 + 1 + 1 + data.length);
    buf[0] = 0x01; // report Id
    buf[1] = 0x00; // packet counter (0 fixed)
    buf[2] = cmd;
    buf.set(data, 3);
    await this.device.sendReport(0x01, buf);
  }

  #onReport(e) {
    if (e.reportId !== 0x30) return; // 0x30 = standard input report
    const d = new DataView(e.data.buffer);

    // 最後のサンプルが先頭12B
    const _ax = d.getInt16(13, true) / 4096; // ±4G -> G 単位 (未使用なのでプレフィックス)
    const _ay = d.getInt16(15, true) / 4096;
    const az = d.getInt16(17, true) / 4096;
    const deltaZ = az - this.lastAz; // 加速度の変化量を計算

    // --- しきい値（加速度の「変化量」に対して） ---
    const THR_CAST = -5.0; // 奥への急な振り
    const THR_REEL = 5.0;  // 手前への急な振り
    const COOLDOWN_CAST = 1000;
    const COOLDOWN_REEL_AFTER_CAST = 1500;
    const COOLDOWN_REEL_ACTION = 400; // 振り操作ごとのリールクールダウン

    // ミニゲーム中は傾き(絶対値)で判定
    if (this.scene.minigame?.active) {
      if (this.scene.minigame.type === 'tension') {
        this.scene.isPlayerPulling = az > 0.5;
      }
      this.lastAz = az; // 値を更新
      return;
    }

    // キャスト判定 (変化量で判定)
    if (!this.castCooldown && deltaZ < THR_CAST) {
      if (this.scene.float && !this.scene.float.visible && !this.scene.gameState.catchingFish) {
        console.log(`[JoyConHID] Cast by delta: ${deltaZ.toFixed(2)}`);
        this.scene.castLine();
        this.#startCooldown('castCooldown', COOLDOWN_CAST);
        this.#startCooldown('reelCooldownAfterCast', COOLDOWN_REEL_AFTER_CAST);
        this.lastAz = az; // 判定後は値をリセット
        return;
      }
    }

    // リール判定 (変化量で判定)
    if (this.scene.float && this.scene.float.visible && !this.scene.gameState.catchingFish && !this.reelCooldownAfterCast && !this.reelActionCooldown) {
      if (deltaZ > THR_REEL) {
        console.log(`[JoyConHID] Reel by delta: ${deltaZ.toFixed(2)}`);
        this.scene.reelLine(); // 振るたびに一定量巻く
        this.#startCooldown('reelActionCooldown', COOLDOWN_REEL_ACTION);
        this.lastAz = az; // 判定後は値をリセット
        return;
      }
    }

    this.lastAz = az; // 最後に現在の値を保存
  }

  #startCooldown(type, ms) {
    this[type] = true;
    setTimeout(() => (this[type] = false), ms);
  }
} 