import Phaser from "phaser";

export default class BaseScene extends Phaser.Scene {
  constructor(key) {
    super(key);
    this.player1 = null;
    this.player2 = null;
    this.cursors = null;

    this.player1AtExit = false;
    this.player2AtExit = false;
  }

  createPlayers(player1Start, player2Start) {
    // Player 1
    this.player1 = this.physics.add.sprite(
      player1Start.x,
      player1Start.y,
      "player"
    );
    this.player1.setCollideWorldBounds(true);
    this.player1.setTint(0xff8888);

    // Player 2
    this.player2 = this.physics.add.sprite(
      player2Start.x,
      player2Start.y,
      "player"
    );
    this.player2.setCollideWorldBounds(true);
    this.player2.setTint(0x8888ff);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  setupFocusManagement() {
    // ゲームキャンバスがクリックされた時にフォーカスを当てる
    this.input.on("pointerdown", () => {
      this.game.canvas.focus();
    });

    // シーン開始の少し後（100ms後）に自動でフォーカスを試みる
    this.time.delayedCall(100, () => {
      if (this.game.canvas) {
        this.game.canvas.setAttribute("tabindex", "0");
        this.game.canvas.style.outline = "none";
        this.game.canvas.focus();
        console.log("Escape Game Canvas focused automatically.");
      }
    });
  }

  update() {
    if (!this.cursors) {
      return;
    }

    const speed = 200;

    // 全方向の速度をリセット
    this.player1.setVelocity(0);
    this.player2.setVelocity(0);

    // 水平方向の移動
    if (this.cursors.left.isDown) {
      this.player1.setVelocityX(-speed);
      this.player2.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player1.setVelocityX(speed);
      this.player2.setVelocityX(speed);
    }

    // 垂直方向の移動
    if (this.cursors.up.isDown) {
      this.player1.setVelocityY(-speed);
      this.player2.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player1.setVelocityY(speed);
      this.player2.setVelocityY(speed);
    }
  }
}
