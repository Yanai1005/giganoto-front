import BaseScene from "./BaseScene.js";

export default class Stage3 extends BaseScene {
  constructor() {
    super("Stage3");
  }

  preload() {
    // 必要ならステージ2固有のアセットを読み込む
    this.load.image("floor", "assets/platform.png");
    this.load.image("player", "assets/player.png");
    this.load.image("door", "assets/door.png");
  }

  create() {
    this.createControls();

    // --- ステージ2のレイアウトを作成 ---
    const platforms = this.physics.add.staticGroup();
    platforms.create(400, 580, "floor").setScale(2).refreshBody();
    // 例：ステージ2では壁の位置を変える
    platforms.create(200, 450, "floor").setScale(0.1, 5).refreshBody();
    platforms.create(600, 300, "floor");

    // プレイヤーを生成
    this.createPlayers({ x: 100, y: 300 }, { x: 700, y: 500 });

    // 脱出ドア
    const exitDoor1 = this.physics.add.staticSprite(750, 240, "door");
    const exitDoor2 = this.physics.add.staticSprite(50, 520, "door");

    // 当たり判定
    this.physics.add.collider(this.player1, platforms);
    this.physics.add.collider(this.player2, platforms);
    this.physics.add.overlap(
      this.player1,
      exitDoor1,
      () => {
        this.player1AtExit = true;
      },
      null,
      this
    );
    this.physics.add.overlap(
      this.player2,
      exitDoor2,
      () => {
        this.player2AtExit = true;
      },
      null,
      this
    );

    this.add
      .text(400, 50, "Stage 3", { fontSize: "32px", fill: "#fff" })
      .setOrigin(0.5);
  }

  update() {
    super.update();

    // 脱出条件
    if (this.player1AtExit && this.player2AtExit) {
      this.scene.start("WinScene");
    }
  }
}
