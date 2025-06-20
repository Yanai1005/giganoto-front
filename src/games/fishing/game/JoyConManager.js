export class JoyConManager {
  constructor(scene) {
    this.scene = scene;
    this.gamepads = {};
    this.prevButtonStates = {};
    this.prevAxes = {};
    this.motionCooldownUntil = 0;

    window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
  }

  handleGamepadConnected(e) {
    console.log(
      'ゲームパッド接続:',
      e.gamepad.id,
      `${e.gamepad.buttons.length} ボタン`,
      `${e.gamepad.axes.length} 軸`
    );
    this.gamepads[e.gamepad.index] = e.gamepad;
    this.prevButtonStates[e.gamepad.index] = e.gamepad.buttons.map(b => b.pressed);
    this.prevAxes[e.gamepad.index] = [...e.gamepad.axes];
  }

  handleGamepadDisconnected(e) {
    console.log('ゲームパッド切断:', e.gamepad.id);
    delete this.gamepads[e.gamepad.index];
    delete this.prevButtonStates[e.gamepad.index];
    delete this.prevAxes[e.gamepad.index];
  }

  isButtonPressed(gamepadIndex, buttonIndex) {
    const gamepad = this.gamepads[gamepadIndex];
    if (!gamepad?.buttons[buttonIndex]) return false;

    const wasPressed = this.prevButtonStates[gamepadIndex]?.[buttonIndex] ?? false;
    const isPressed = gamepad.buttons[buttonIndex].pressed;

    return isPressed && !wasPressed;
  }

  isAxisFlicked(gamepadIndex, axisIndex, direction) {
    const gamepad = this.gamepads[gamepadIndex];
    if (!gamepad) return false;

    const THRESHOLD = 0.8;
    const lastValue = this.prevAxes[gamepadIndex]?.[axisIndex] ?? 0;
    const currentValue = gamepad.axes[axisIndex] ?? 0;

    if (direction === 'up') { // 奥に倒す
        return lastValue > -THRESHOLD && currentValue <= -THRESHOLD;
    }
    if (direction === 'down') { // 手前に倒す
        return lastValue < THRESHOLD && currentValue >= THRESHOLD;
    }
    return false;
  }

  update() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {
        this.gamepads[gamepad.index] = gamepad;
      }
    }

    for (const index in this.gamepads) {
      const gamepad = this.gamepads[index];
      if (!gamepad) continue;

      if (!this.prevButtonStates[index]) {
        this.prevButtonStates[index] = gamepad.buttons.map(b => b.pressed);
        if (!this.prevAxes[index]) {
            this.prevAxes[index] = [...gamepad.axes];
        }
      }

      // --- 1. モーションコントロール (スティックフリック) ---
      const now = performance.now();
      if (now > this.motionCooldownUntil) {
        // Joy-Con(R)のスティックY軸は3番目の軸であることが多い
        const STICK_AXIS_Y = 3;
        const COOLDOWN_MS = 500;

        // 奥への動き (キャスト)
        if (this.isAxisFlicked(index, STICK_AXIS_Y, 'up')) {
            if (this.scene.float && !this.scene.float.visible && !this.scene.gameState.catchingFish) {
                console.log('キャスト (スティック操作)');
                this.scene.castLine();
                this.motionCooldownUntil = now + COOLDOWN_MS;
            }
        }
        // 手前への動き (リール)
        else if (this.isAxisFlicked(index, STICK_AXIS_Y, 'down')) {
            if (this.scene.float && this.scene.float.visible && !this.scene.gameState.catchingFish) {
                console.log('リール (スティック操作)');
                this.scene.reelLine();
                this.motionCooldownUntil = now + COOLDOWN_MS;
            }
        }
      }
      
      // --- 2. ボタンコントロール (フォールバック) ---
      // Aボタン（インデックス0）が押された瞬間の処理
      if (this.isButtonPressed(index, 0)) {
        if (this.scene.minigame.active) {
          if (this.scene.minigame.type === 'timing') {
            this.scene.minigameManager.onReelBtnMouseUp();
          }
        }
        /* else {
          if (this.scene.float && !this.scene.float.visible) {
            this.scene.castLine();
          } else if (this.scene.float && this.scene.float.visible) {
            this.scene.reelLine();
          }
        } */
      }
      
      if (this.scene.minigame.active && this.scene.minigame.type === 'tension') {
        this.scene.isPlayerPulling = gamepad.buttons[0]?.pressed ?? false;
      }

      // 状態の保存
      this.prevButtonStates[index] = gamepad.buttons.map(b => b.pressed);
      this.prevAxes[index] = [...gamepad.axes];
    }
  }

  destroy() {
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
  }
} 