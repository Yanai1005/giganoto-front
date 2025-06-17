import Phaser from "phaser";

class EscapeScene extends Phaser.Scene {
  constructor() {
    super({ key: "EscapeScene" });
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
      numbers: Array.from({ length: 10 }, (_, i) => false), // 0-9キー
    };
  }

  preload() {
    // ダミーファイルをロード
    this.load.image(
      "dummy",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    );
  }

  create() {
    this.createTextures();
    this.createUI();
    this.createPlayer1();
    this.createPlayer2();
    this.setupInput();
    this.setupGameplay1();
    this.setupGameplay2();

    console.log("EscapeScene created successfully");
  }

  createTextures() {
    // プレイヤー1用のテクスチャを作成
    const player1Graphics = this.add.graphics();
    player1Graphics.fillStyle(0x40bfbf);
    player1Graphics.fillCircle(16, 16, 16);
    player1Graphics.generateTexture("player1Sprite", 24, 24);
    player1Graphics.destroy();

    // プレイヤー2用のテクスチャを作成
    const player2Graphics = this.add.graphics();
    player2Graphics.fillStyle(0xcf3030);
    player2Graphics.fillCircle(16, 16, 16);
    player2Graphics.generateTexture("player2Sprite", 24, 24);
    player2Graphics.destroy();

    console.log("Textures created successfully");

    const stoneGraphics = this.add.graphics();
    stoneGraphics.fillStyle(0x808080);
    stoneGraphics.fillRect(0, 0, 24, 24);
    stoneGraphics.generateTexture("stoneSprite", 24, 24);
    stoneGraphics.destroy();

    const grassGraphics = this.add.graphics();
    grassGraphics.fillStyle(0x00ff00);
    grassGraphics.fillRect(0, 0, 24, 24);
    grassGraphics.generateTexture("grassSprite", 24, 24);
    grassGraphics.destroy();

    const doorGraphics = this.add.graphics();
    doorGraphics.fillStyle(0x8b4513);
    doorGraphics.fillRect(0, 0, 24, 48);
    doorGraphics.generateTexture("doorSprite", 24, 48);
    doorGraphics.destroy();

    const keyGraphics = this.add.graphics();
    keyGraphics.fillStyle(0xffff00);
    keyGraphics.fillRect(0, 0, 12, 12);
    keyGraphics.generateTexture("keySprite", 12, 12);
    keyGraphics.destroy();

    const exitGraphics = this.add.graphics();
    exitGraphics.fillStyle(0x0000ff);
    exitGraphics.fillRect(0, 0, 24, 48);
    exitGraphics.generateTexture("exitSprite", 24, 48);
    exitGraphics.destroy();

    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(0x000000);
    wallGraphics.fillRect(0, 0, 24, 24);
    wallGraphics.generateTexture("wallSprite", 24, 24);
    wallGraphics.destroy();

    const floorGraphics = this.add.graphics();
    floorGraphics.fillStyle(0x808080);
    floorGraphics.fillRect(0, 0, 24, 24);
    floorGraphics.generateTexture("floorSprite", 24, 24);
    floorGraphics.destroy();

    const chestGraphics = this.add.graphics();
    chestGraphics.fillStyle(0x8b4513);
    chestGraphics.fillRect(0, 0, 24, 24);
    chestGraphics.generateTexture("chestSprite", 24, 24);
    chestGraphics.destroy();

    console.log("Additional textures created successfully");
  }
  createUI() {
    // タイトル
    this.add
      .text(400, 50, "ESCAPE GAME", {
        fontSize: "32px",
        fill: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 操作説明
    this.add
      .text(
        400,
        570,
        "矢印キーで移動、スペースでアクション、数字キーで暗証番号入力",
        {
          fontSize: "16px",
          fill: "#cccccc",
          fontFamily: "Arial",
        }
      )
      .setOrigin(0.5);

    // デバッグ表示
    this.debugText = this.add.text(10, 10, "", {
      fontSize: "14px",
      fill: "#ffffff",
      fontFamily: "Arial",
    });

    // タイム表示
    this.timeText = this.add.text(10, 30, "タイム: 0", {
      fontSize: "14px",
      fill: "#ffffff",
      fontFamily: "Arial",
    });
  }

  createPlayer1() {
    this.player1 = this.physics.add.sprite(100, 100, "player1Sprite");
    this.player1.setCollideWorldBounds(true);
    this.player1.setBounce(0.2);
    this.player1.setVelocity(0, 0);
    this.player1.setDrag(100, 100); // 摩擦を設定
    this.player1Speed = 200; // プレイヤー1の移動速度
  }

  createPlayer2() {
    this.player2 = this.physics.add.sprite(200, 100, "player2Sprite");
    this.player2.setCollideWorldBounds(true);
    this.player2.setBounce(0.2);
    this.player2.setVelocity(0, 0);
    this.player2.setDrag(100, 100); // 摩擦を設定
    this.player2Speed = 200; // プレイヤー2の移動速度
  }

  setupInput() {
    this.input.keyboard.on("keydown", (event) => {
      switch (event.key) {
        case "ArrowLeft":
          this.keys.left = true;
          break;
        case "ArrowRight":
          this.keys.right = true;
          break;
        case "ArrowUp":
          this.keys.up = true;
          break;
        case "ArrowDown":
          this.keys.down = true;
          break;
        case " ":
          this.keys.space = true;
          break;
        default:
          if (event.key >= "0" && event.key <= "9") {
            this.keys.numbers[parseInt(event.key, 10)] = true;
          }
      }
    });

    this.input.keyboard.on("keyup", (event) => {
      switch (event.key) {
        case "ArrowLeft":
          this.keys.left = false;
          break;
        case "ArrowRight":
          this.keys.right = false;
          break;
        case "ArrowUp":
          this.keys.up = false;
          break;
        case "ArrowDown":
          this.keys.down = false;
          break;
        case " ":
          this.keys.space = false;
          break;
        default:
          if (event.key >= "0" && event.key <= "9") {
            this.keys.numbers[parseInt(event.key, 10)] = false;
          }
      }
    });
  }
  setupGameplay1() {
    // プレイヤー1のゲームプレイロジックをここに追加
    this.timeText.setText("タイム: 0");
    this.timeElapsed = 0;
    this.timeEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeElapsed += 1;
        this.timeText.setText(`タイム: ${this.timeElapsed}`);
      },
      loop: true,
    });
  }
}
