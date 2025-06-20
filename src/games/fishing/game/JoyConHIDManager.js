export class JoyConHIDManager {
  constructor(scene) {
    this.scene = scene;
    this.device = null;
    this.motionCooldown = false;        // モーション操作全体のクールダウン
    this.lastAz = 0;                  // 前回のZ軸加速度
    this.subcommandPacketCounter = 0;
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
      
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // 1. Enable standard full report mode 0x30
      await this.#sendSubCommand(0x03, new Uint8Array([0x30]));
      await sleep(100); // Wait for the Joy-Con to process the command
      // 2. Enable IMU
      await this.#sendSubCommand(0x40, new Uint8Array([0x01]));
      await sleep(100);

      device.addEventListener('inputreport', (e) => this.#onReport(e));
      console.log('[JoyConHID] Connected:', device.productName);
      return 'connected';
    } catch (err) {
      console.error('[JoyConHID] connect error', err);
      return 'error';
    }
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
    if (e.reportId !== 0x30) return;
    const d = new DataView(e.data.buffer);

    const az1 = d.getInt16(17, true) / 4096;
    const az2 = d.getInt16(29, true) / 4096;
    const az3 = d.getInt16(41, true) / 4096;
    const az = (az1 + az2 + az3) / 3;
    const deltaZ = az - this.lastAz;

    const THR_CAST = -8.0;
    const THR_REEL = 8.0;
    const COOLDOWN_MOTION = 800;

    if (this.scene.minigame?.active) {
      if (this.scene.minigame.type === 'tension') {
        if (deltaZ > THR_REEL && !this.motionCooldown) {
          this.scene.minigameManager.onPlayerReelAction();
          this.#startCooldown('motionCooldown', 80);
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