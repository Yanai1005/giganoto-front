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
    // �Q�[���L�����o�X���N���b�N���ꂽ���Ƀt�H�[�J�X�𓖂Ă�
    this.input.on("pointerdown", () => {
      this.game.canvas.focus();
    });

    // �V�[���J�n�̏�����i100ms��j�Ɏ����Ńt�H�[�J�X�����݂�
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

    // �S�����̑��x�����Z�b�g
    this.player1.setVelocity(0);
    this.player2.setVelocity(0);

    // ���������̈ړ�
    if (this.cursors.left.isDown) {
      this.player1.setVelocityX(-speed);
      this.player2.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player1.setVelocityX(speed);
      this.player2.setVelocityX(speed);
    }

    // ���������̈ړ�
    if (this.cursors.up.isDown) {
      this.player1.setVelocityY(-speed);
      this.player2.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player1.setVelocityY(speed);
      this.player2.setVelocityY(speed);
    }
  }
}
