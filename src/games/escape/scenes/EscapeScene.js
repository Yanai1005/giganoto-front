import Phaser from "phaser";
const levelMapmain = [
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "W              W       S       W",
  "W           D  W               W",
  "W              W  S            W",
  "W      S       W           t1  W",
  "W              W               W",
  "W              W   S           W",
  "W   T1         W               W",
  "W        S     W               W",
  "W              W    S          W",
  "W         a    W     b         W",
  "W              W      S        W",
  "W              W         P1    W",
  "W      S       W               W",
  "W              W               W",
  "W           h  W      S        W",
  "W      S       W               W",
  "W              W               W",
  "W     p1       W   S         g W",
  "W              W               W",
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
]; //S:石, D::ドア, W::壁, C::チェスト

const levelMapsub = [
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "W              W               W",
  "W              W               W",
  "W              W            C  W",
  "W     SSS      W               W",
  "W              W               W",
  "W              W   S           W",
  "W   b          WWWWWWWWWWWW    W",
  "W       C S    W               W",
  "W              W     S         W",
  "W          C   W               W",
  "W     S        W       SSS     W",
  "W              W          a    W",
  "W            C W               W",
  "WWWWWWWWWWWWWWWW               W",
  "W              W       S       W",
  "W    C S       W               W",
  "W              W      SSS      W",
  "W              W   S           W",
  "W   b          W               W",
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
]; //S:石, D::ドア, W::壁, C::チェスト
class EscapeScene extends Phaser.Scene {
  constructor() {
    super({ key: "EscapeScene" });
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      numbers: Array.from({ length: 10 }, (_, i) => false), // 0-9キー
    };
    this.canTeleport = true;
    this.isGameCleared = false;
  }
  preload() {
    // ダミーファイルをロード
    this.load.image(
      "dummy",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    );
  }
  createLevel(offsetX, offsetY) {
    // グループを作成

    this.collidableGroup = this.physics.add.staticGroup();
    this.chests = this.physics.add.staticGroup();
    const tileSize = 24; // createTexturesのサイズと合わせる

    levelMapmain.forEach((row, rowIndex) => {
      row.split("").forEach((tile, colIndex) => {
        const x = colIndex * tileSize + tileSize / 2 + offsetX;
        const y = rowIndex * tileSize + tileSize / 2 + offsetY;

        const isTrigger = /^[Tt]/.test(tile);
        const isDestination = /^[Pp]/.test(tile);

        // 床を敷く
        if (
          tile === " " ||
          tile === "a" ||
          tile === "b" ||
          isTrigger ||
          isDestination
        ) {
          this.add.sprite(x, y, "floorSprite").setDepth(-1);
        }
        if (tile === "W") {
          this.collidableGroup.create(x, y, "wallSprite");
        } else if (tile === "S") {
          this.collidableGroup.create(x, y, "stoneSprite");
        } else if (tile === "a") {
          this.player1Start = { x: x, y: y };
        } else if (tile === "b") {
          this.player2Start = { x: x, y: y };
        } else if (isTrigger) {
          const destinationKey = tile.replace(/^[Tt]/, (match) =>
            match === "T" ? "P" : "p"
          );
          const triggerSprite = this.teleportTriggers.create(
            x,
            y,
            "teleportTriggerSprite"
          );
          triggerSprite.setData("destinationKey", destinationKey);
        } else if (isDestination) {
          this.teleportDestinations[tile] = { x: x, y: y };
          this.add.sprite(x, y, "teleportDestinationSprite");
        } else if (tile === "g") {
          // プレイヤー1のゴール
          const goal = this.goalTiles.create(x, y, "goalSprite1");
          goal.setData("player", 1);
        } else if (tile === "h") {
          // プレイヤー2のゴール
          const goal = this.goalTiles.create(x, y, "goalSprite2");
          goal.setData("player", 2);
        }
      });
    });
  }

  handleTeleport(player, trigger) {
    // クールダウン中でなければ処理を実行
    if (!this.canTeleport) {
      return;
    }
    const destinationKey = trigger.getData("destinationKey");
    const destination = this.teleportDestinations[destinationKey];
    if (destination) {
      // 一時的にワープ不可にする
      this.canTeleport = false;
      // プレイヤーをワープ先の座標へ移動
      player.setPosition(destination.x, destination.y);

      console.log(`プレイヤーをワープさせました: ${destinationKey} へ`);
      // 1秒後に再びワープ可能にする
      this.time.delayedCall(1000, () => {
        this.canTeleport = true;
      });
    } else {
      console.warn(`ワープ先が見つかりません: キー ${destinationKey}`);
    }
  }

  gameClear() {
    this.isGameCleared = true; // クリアフラグを立てて、処理が何度も呼ばれないようにする
    this.physics.pause(); // 物理エンジンを停止し、プレイヤーの動きを止める
    if (this.timeEvent) this.timeEvent.remove(); // タイムカウントを停止

    // 画面中央にゲームクリアのテキストを表示
    this.add
      .text(400, 300, "GAME CLEAR!", {
        fontSize: "64px",
        fill: "#ffd700", // 金色
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setDepth(1)
      .setOrigin(0.5)
      .setScrollFactor(0); // カメラが動いても中央に固定

    this.add
      .text(400, 350, `クリアタイム: ${this.timeElapsed} 秒`, {
        fontSize: "32px",
        fill: "#ffffff",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
  }

  create() {
    this.createTextures();
    this.createUI();

    this.goalTiles = this.physics.add.staticGroup();
    this.teleportTriggers = this.physics.add.group({ allowGravity: false });
    this.teleportDestinations = {}; // ワープ先座標の保存用
    this.createLevel(18, 50);
    this.createPlayer1();
    this.createPlayer2();
    this.setupInput();
    this.setupGameplay();
    this.physics.add.collider(this.player1, this.player2);
    this.physics.add.collider(this.player1, this.collidableGroup);
    this.physics.add.collider(this.player2, this.collidableGroup);
    this.physics.add.overlap(
      this.player1,
      this.teleportTriggers,
      this.handleTeleport,
      null,
      this
    );
    this.physics.add.overlap(
      this.player2,
      this.teleportTriggers,
      this.handleTeleport,
      null,
      this
    );

    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    console.log("EscapeScene created successfully");
  }

  createTextures() {
    // プレイヤー1用のテクスチャを作成

    const player1Graphics = this.add.graphics();
    player1Graphics.fillStyle(0x0000ff);
    player1Graphics.fillCircle(12, 12, 12);
    player1Graphics.generateTexture("player1Sprite", 24, 24);
    player1Graphics.destroy(); // プレイヤー2用のテクスチャを作成

    const player2Graphics = this.add.graphics();
    player2Graphics.fillStyle(0xcf3030);
    player2Graphics.fillCircle(12, 12, 12);
    player2Graphics.generateTexture("player2Sprite", 24, 24);
    player2Graphics.destroy();

    console.log("Textures created successfully");

    const stoneGraphics = this.add.graphics();
    stoneGraphics.fillStyle(0x808080);
    stoneGraphics.fillRect(0, 0, 24, 24);
    stoneGraphics.generateTexture("stoneSprite", 24, 24);
    stoneGraphics.destroy();

    const gateGraphics = this.add.graphics();
    gateGraphics.fillStyle(0xf8b400);
    gateGraphics.fillRect(0, 0, 24, 24);
    gateGraphics.generateTexture("grassSprite", 24, 24);
    gateGraphics.destroy();

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
    floorGraphics.fillStyle(0x000000);
    floorGraphics.fillRect(0, 0, 24, 24);
    floorGraphics.generateTexture("floorSprite", 24, 24);
    floorGraphics.destroy();

    const triggerGraphics = this.add.graphics();
    triggerGraphics.fillStyle(0xffff00);
    triggerGraphics.fillCircle(12, 12, 12);
    triggerGraphics.generateTexture("teleportTriggerSprite", 24, 24);
    triggerGraphics.destroy();

    const destinationGraphics = this.add.graphics();
    destinationGraphics.lineStyle(2, 0xffff00);
    destinationGraphics.strokeCircle(12, 12, 12);
    destinationGraphics.generateTexture("teleportDestinationSprite", 24, 24);
    destinationGraphics.destroy();

    const goalGraphics1 = this.add.graphics();
    goalGraphics1.lineStyle(2, 0x0000ff);
    goalGraphics1.strokeRect(0, 0, 24, 24);
    goalGraphics1.generateTexture("goalSprite1", 24, 24);
    goalGraphics1.destroy();

    const goalGraphics2 = this.add.graphics();
    goalGraphics2.lineStyle(2, 0xcf3030);
    goalGraphics2.strokeRect(0, 0, 24, 24);
    goalGraphics2.generateTexture("goalSprite2", 24, 24);
    goalGraphics2.destroy();

    console.log("Additional textures created successfully");
  }

  createUI() {
    // 操作説明
    this.add
      .text(400, 570, "矢印キーで移動", {
        fontSize: "16px",
        fill: "#cccccc",
        fontFamily: "Arial",
      })
      .setOrigin(0.5); // デバッグ表示

    this.debugText = this.add.text(10, 10, "", {
      fontSize: "14px",
      fill: "#ffffff",
      fontFamily: "Arial",
    }); // タイム表示

    this.timeText = this.add.text(680, 10, "タイム: 0", {
      fontSize: "14px",
      fill: "#ffffff",
      fontFamily: "Arial",
    });
  }

  createPlayer1() {
    this.player1 = this.physics.add.sprite(
      this.player1Start.x,
      this.player1Start.y,
      "player1Sprite"
    );

    this.player1.setCollideWorldBounds(true);
    this.player1.setBounce(0.2);
    this.player1.setVelocity(0, 0);
    this.player1.setDrag(2000);
    this.player1Speed = 200; // プレイヤー1の移動速度
    this.player1.body.setCircle(12);
  }
  createPlayer2() {
    this.player2 = this.physics.add.sprite(
      this.player2Start.x,
      this.player2Start.y,
      "player2Sprite"
    );

    this.player2.setCollideWorldBounds(true);
    this.player2.setBounce(0.2);
    this.player2.setVelocity(0, 0);
    this.player2.setDrag(2000);
    this.player2Speed = 200; // プレイヤー2の移動速度
    this.player2.body.setCircle(12);
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

  setupGameplay() {
    //経過タイマー

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

  update() {
    if (this.isGameCleared) {
      return;
    }
    // プレイヤー1の移動
    if (this.keys.left) {
      this.player1.setVelocityX(-this.player1Speed);
    } else if (this.keys.right) {
      this.player1.setVelocityX(this.player1Speed);
    }
    if (this.keys.up) {
      this.player1.setVelocityY(-this.player1Speed);
    } else if (this.keys.down) {
      this.player1.setVelocityY(this.player1Speed);
    } // プレイヤー2の移動

    if (this.keys.left) {
      this.player2.setVelocityX(-this.player2Speed);
    } else if (this.keys.right) {
      this.player2.setVelocityX(this.player2Speed);
    }
    if (this.keys.up) {
      this.player2.setVelocityY(-this.player2Speed);
    } else if (this.keys.down) {
      this.player2.setVelocityY(this.player2Speed);
    } // デバッグ情報の更新

    this.debugText.setText(
      `Player 1: (${Math.round(this.player1.x)}, ${Math.round(
        this.player1.y
      )})\nPlayer 2: (${Math.round(this.player2.x)}, ${Math.round(
        this.player2.y
      )})`
    );

    let player1OnGoal = false;
    let player2OnGoal = false;
    this.goalTiles.getChildren().forEach((goal) => {
      const goalForPlayer = goal.getData("player");
      // プレイヤー1が、プレイヤー1用のゴールに重なっているか？
      if (goalForPlayer === 1 && this.physics.overlap(this.player1, goal)) {
        player1OnGoal = true;
      }
      if (goalForPlayer === 2 && this.physics.overlap(this.player2, goal)) {
        player2OnGoal = true;
      }
    });
    if (player1OnGoal && player2OnGoal) {
      this.gameClear();
    }
  }
}

export default EscapeScene;
