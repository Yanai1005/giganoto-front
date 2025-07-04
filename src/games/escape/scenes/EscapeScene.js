import Phaser from "phaser";
import RankManager from "../utils/RankManager.js";

const alllevels = [
  {
    //index 0
    map: [
      "WWWWWWWWWWWWWWWWWWWWWWWW",
      "W          W   S       W",
      "W S        W     A     W",
      "W          W           W",
      "W    S     W   S   t S W",
      "W   T      W           W",
      "W     S    W  S        W",
      "W          W   S       W",
      "W     a    W     b     W",
      "W   S      W        S  W",
      "W    S     W     P     W",
      "W          W           W",
      "W       B  W  S      S W",
      "W  SS      W           W",
      "W     p    W   S       W",
      "WWWWWWWWWWWWWWWWWWWWWWWW",
    ],
  },
  {
    //index1
    map: [
      "WWWWWWWWWFFWffWWWWWWWWWW",
      "W        LlWrR  S      W",
      "W S      LlWrR    a    W",
      "W        LlWrR         W",
      "W    S     W   S   t S W",
      "W   T      W           W",
      "W     S    W  S        W",
      "W          W   S       W",
      "W          W           W",
      "W   S      W        S  W",
      "W    S     W     P     W",
      "W          W           W",
      "W          W  S      S W",
      "W  SS   b  W           W",
      "W     p    W   S       W",
      "WWWWWWWWWWWWWWWWWWWWWWWW",
    ],
  },
  {
    //index2
    map: [
      "WWWWWWWWWWWWWWWWWWWWWWWW",
      "W      i   W   i       W",
      "W   B      W           W",
      "W        p W  i        W",
      "W    i     W       t   W",
      "Wi         W           W",
      "W     i    W    i      W",
      "W   i      W    iii   iW",
      "W       i  W    A      W",
      "W   T      W           W",
      "W    i    iW     i     W",
      "W    iii   Wi       P  W",
      "W          W  i        W",
      "W  ii      W           W",
      "W         aWb  i       W",
      "WWWWWWWWWWWWWWWWWWWWWWWW",
    ],
  },
  {
    //index3
    map: [
      "WffWWWWWWWWWWWWWWWWWWFFW",
      "WrR    i   W   i     LlW",
      "WrR b      W         LlW",
      "W        p W  i        W",
      "W    i     W       t   W",
      "W          W           W",
      "W     i    W    i      W",
      "W   i      W    iii    W",
      "W       i  W    a      W",
      "W   T      W           W",
      "W    i    iW     i     W",
      "W    iii   W        P  W",
      "W          W  i        W",
      "W  ii      W           W",
      "W         aWb  i       W",
      "WWWWWWWWWWWWWWWWWWWWWWWW",
    ],
  },
  {
    //index4
    map: [
      "WWWWWWWWWWWWWWWWWWWWWWW",
      "W     W   D W  S       W",
      "W     W  T  W       A  W",
      "W    tSW   W  S  g  S  W",
      "W   SSS   W        p SSW",
      "W         WWWWWWWWWWWWWW",
      "W    SS    W    S      W",
      "WSSSS      W    S  G   W",
      "W       S  W        B  W",
      "W          W    S      W",
      "WWWWWW         S  WWWWWW",
      "W    S   S        P    W",
      "W      d   W  S        W",
      "W  S    WWWWWWW        W",
      "Wb   WWWxxxxxxxWWWW   aW",
      "WWWWWxxxxxxxxxxxxxxWWWWW",
    ],
  },
  {
    //index5
    map: [
      "WffWWWWWWWWWWWWWWWWWWWW",
      "WrR   W   D W  S       W",
      "WrR   W  T  W       a  W",
      "W    tSW   W  S  g  S  W",
      "W   SSS   W        p SSW",
      "W         WWWWWWWWWWWFFW",
      "W    SS    W    S    LlW",
      "WSSSS      W    S  G LlW",
      "W       S  W        b  W",
      "W          W    S      W",
      "WWWWWW         S  WWWWWW",
      "W    S   S        P    W",
      "W      d   W  S        W",
      "W  S    WWWWWWW        W",
      "Wb   WWWxxxxxxxWWWW   aW",
      "WWWWWxxxxxxxxxxxxxxWWWWW",
    ],
  },
  {
    //index6
    map: [
      "WWWWWWWWWWWWWWWWWW",
      "W           i     W",
      "W                  WW",
      "WT      i     AG    WW",
      "W   iiid             aWW",
      "W                   WWWW",
      "W     i         i  W",
      "WWWWWWWWWWWWWWWWWWW",
      "WDg     i   t      W",
      "W              iB   W",
      "W            P WWWWW",
      "W    i   i    WWW",
      "W        p   W",
      "W  i       WW",
      "Wb   WWWWWW",
      "WWWWW",
    ],
  },
];

class EscapeScene extends Phaser.Scene {
  constructor() {
    super({ key: "EscapeScene" });
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      z: false, // デバッグ用Zキー
    };
    this.currentLevelIndex = 0;
    this.canTeleport = true;
    this.isGameCleared = false;

    // ランクマネージャーを初期化
    this.rankManager = new RankManager();
  }
  init(data) {
    this.currentLevelIndex = data.levelIndex || 0;
    this.isGameCleared = false;
    this.canTeleport = true;

    this.initialPlayer1Pos = data.player1_startPos || null;
    this.initialPlayer2Pos = data.player2_startPos || null;

    this.initialTime = data.startTime || 0;

    // ランクマネージャーのデータを読み込み
    this.rankManager.load();

    // 初回プレイの場合はデータをリセット
    if (this.currentLevelIndex === 0 && !data.continueGame) {
      this.rankManager.reset();
    }
  }
  preload() {
    // ダミーファイルをロード
    this.load.image(
      "dummy",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    );
    this.load.image("wallSprite", "assets/wall.png");
    this.load.image("stoneSprite", "assets/ishi.png");
    this.load.image("icestoneSprite", "assets/iceishi.png");
    this.load.image("floorSprite", "assets/floor.png");
    this.load.image("teleportTriggerSprite", "assets/trigger.png");
    this.load.image("teleportDestinationSprite", "assets/destination.png");
    this.load.image("goalSprite1", "assets/button_green_off.png");
    this.load.image("goalSprite2", "assets/button_red_off.png");
    this.load.image("fin_goalSprite1", "assets/button_green_on.png");
    this.load.image("fin_goalSprite2", "assets/button_red_on.png");
    this.load.image("l_stairsSprite", "assets/L_stairs.png");
    this.load.image("r_stairsSprite", "assets/R_stairs.png");
    this.load.image("f_r_stairsSprite", "assets/F_R_stairs.png");
    this.load.image("f_l_stairsSprite", "assets/F_L_stairs.png");
    this.load.image("fakewall1Sprite", "assets/wall(2).png");
    this.load.image("fakewall2Sprite", "assets/wall(2).png");
    this.load.image("icefloorSprite", "assets/icefloor.png");

    // 下向き (1-3)
    this.load.image("p1_down_1", "assets/woman2_free_01.png");
    this.load.image("p1_down_2", "assets/woman2_free_02.png");
    this.load.image("p1_down_3", "assets/woman2_free_03.png");
    // 左向き (4-6)
    this.load.image("p1_left_1", "assets/woman2_free_04.png");
    this.load.image("p1_left_2", "assets/woman2_free_05.png");
    this.load.image("p1_left_3", "assets/woman2_free_06.png");
    // 右向き (7-9)
    this.load.image("p1_right_1", "assets/woman2_free_07.png");
    this.load.image("p1_right_2", "assets/woman2_free_08.png");
    this.load.image("p1_right_3", "assets/woman2_free_09.png");
    // 上向き (10-12)
    this.load.image("p1_up_1", "assets/woman2_free_10.png");
    this.load.image("p1_up_2", "assets/woman2_free_11.png");
    this.load.image("p1_up_3", "assets/woman2_free_12.png");
    // 下向き (1-3)
    this.load.image("p2_down_1", "assets/man2_free_01.png");
    this.load.image("p2_down_2", "assets/man2_free_02.png");
    this.load.image("p2_down_3", "assets/man2_free_03.png");
    // 左向き (4-6)
    this.load.image("p2_left_1", "assets/man2_free_04.png");
    this.load.image("p2_left_2", "assets/man2_free_05.png");
    this.load.image("p2_left_3", "assets/man2_free_06.png");
    // 右向き (7-9)
    this.load.image("p2_right_1", "assets/man2_free_07.png");
    this.load.image("p2_right_2", "assets/man2_free_08.png");
    this.load.image("p2_right_3", "assets/man2_free_09.png");
    // 上向き (10-12)
    this.load.image("p2_up_1", "assets/man2_free_10.png");
    this.load.image("p2_up_2", "assets/man2_free_11.png");
    this.load.image("p2_up_3", "assets/man2_free_12.png");
  }
  buildLevel(levelData, offsetX, offsetY) {
    // グループを作成
    this.collidableGroup = this.physics.add.staticGroup();
    this.chests = this.physics.add.staticGroup();
    const tileSize = 32;

    levelData.map.forEach((row, rowIndex) => {
      row.split("").forEach((tile, colIndex) => {
        const x = colIndex * tileSize + tileSize / 2 + offsetX;
        const y = rowIndex * tileSize + tileSize / 2 + offsetY;

        const isTrigger = /^[TtGg]/.test(tile);
        const isDestination = /^[PpDd]/.test(tile);
        const isBarrier = /^[Si]/.test(tile);
        const isGoal = /^[AB]/.test(tile);

        let floorSpriteKey = "floorSprite"; // デフォルトは通常の床
        if (
          this.currentLevelIndex === 2 ||
          this.currentLevelIndex === 3 ||
          this.currentLevelIndex === 6
        ) {
          floorSpriteKey = "icefloorSprite"; // ステージ2なら氷の床
        }

        const shouldPlaceFloor =
          tile === " " ||
          tile === "a" ||
          tile === "b" ||
          isTrigger ||
          isBarrier ||
          isGoal ||
          isDestination;

        if (shouldPlaceFloor) {
          this.add.sprite(x, y, floorSpriteKey).setDepth(-1);
        }
        if (tile === "W") {
          this.collidableGroup.create(x, y, "wallSprite");
        } else if (tile === "F") {
          const next = this.fakewall.create(x, y, "fakewall1Sprite");
          next.setData("player", 1);
          const wall = this.collidableGroup.create(x, y - tileSize, "dummy");
          wall.setSize(tileSize, tileSize);
          wall.setVisible(false);
        } else if (tile === "f") {
          const next = this.fakewall.create(x, y, "fakewall2Sprite");
          next.setData("player", 2);
          const wall = this.collidableGroup.create(x, y - tileSize, "dummy");
          wall.setSize(tileSize, tileSize);
          wall.setVisible(false);
        } else if (tile === "S") {
          this.collidableGroup.create(x, y, "stoneSprite");
        } else if (tile === "i") {
          this.collidableGroup.create(x, y, "icestoneSprite");
        } else if (tile === "a") {
          this.player1Start = { x: x, y: y };
        } else if (tile === "b") {
          this.player2Start = { x: x, y: y };
        } else if (isTrigger) {
          const destinationKey = tile.replace(/^[TtGg]/, (match) => {
            if (match === "T") return "P";
            if (match === "t") return "p";
            if (match === "G") return "D";
            if (match === "g") return "d";
          });
          const triggerSprite = this.teleportTriggers.create(
            x,
            y,
            "teleportTriggerSprite"
          );
          triggerSprite.setData("destinationKey", destinationKey);
        } else if (isDestination) {
          this.teleportDestinations[tile] = { x: x, y: y };
          this.add.sprite(x, y, "teleportDestinationSprite");
        } else if (tile === "A") {
          // プレイヤー1のゴール
          const goal = this.goalTiles.create(x, y, "goalSprite1");
          goal.setData("player", 1);
        } else if (tile === "B") {
          // プレイヤー2のゴール
          const goal = this.goalTiles.create(x, y, "goalSprite2");
          goal.setData("player", 2);
        } else if (tile === "l") {
          this.stairsTiles.create(x, y, "f_l_stairsSprite");
        } else if (tile === "r") {
          this.stairsTiles.create(x, y, "f_r_stairsSprite");
        } else if (tile === "L") {
          this.add.sprite(x, y, "l_stairsSprite").setDepth(-1);
          const halfWall = this.collidableGroup.create(
            x - tileSize / 4,
            y,
            "dummy"
          );
          halfWall.setSize(tileSize / 3, tileSize);
          halfWall.setVisible(false);
        } else if (tile === "R") {
          this.add.sprite(x, y, "r_stairsSprite").setDepth(-1);
          const halfWall = this.collidableGroup.create(
            x + tileSize / 4,
            y,
            "dummy"
          );
          halfWall.setSize(tileSize / 3, tileSize);
          halfWall.setVisible(false);
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
  handleNextStageTrigger(player, fakewall) {
    if (this.isGameCleared) return;
    console.log("次のステージへ移動します");

    // つなぎステージの場合はランク記録をせず、直接次のステージへ
    if (this.rankManager.isActualStage(this.currentLevelIndex)) {
      // 実際のステージの場合のみランクを記録
      this.rankManager.recordStageTime(
        this.currentLevelIndex,
        this.timeElapsed
      );
      this.rankManager.calculateStageRank(
        this.currentLevelIndex,
        this.timeElapsed
      );
      this.rankManager.save();
    }

    const nextStageData = {
      levelIndex: this.currentLevelIndex + 1,
      startTime: 0, // 次のステージは0から開始
      continueGame: true,
    };
    this.scene.restart(nextStageData);
  }
  gameClear() {
    if (this.isGameCleared) return;
    this.isGameCleared = true;
    this.physics.pause();
    if (this.timeEvent) this.timeEvent.remove();

    // つなぎステージの場合はランク表示をせず、直接次のステージへ
    if (!this.rankManager.isActualStage(this.currentLevelIndex)) {
      console.log("つなぎステージ: 直接次のステージへ進みます");
      const nextStageData = {
        levelIndex: this.currentLevelIndex + 1,
        startTime: 0,
        continueGame: true,
      };
      this.scene.restart(nextStageData);
      return;
    }

    // 実際のステージの場合のみランクを記録
    this.rankManager.recordStageTime(this.currentLevelIndex, this.timeElapsed);
    const currentRank = this.rankManager.calculateStageRank(
      this.currentLevelIndex,
      this.timeElapsed
    );
    this.rankManager.save();

    const cam = this.cameras.main;
    const centerX = cam.width / 2;
    const centerY = cam.height / 2;

    // 背景
    const rect = this.add
      .rectangle(centerX, centerY, cam.width, cam.height, 0x000000)
      .setScrollFactor(0)
      .setDepth(10);

    // 最終ステージかどうかを判定
    const isFinalStage = this.currentLevelIndex === alllevels.length - 1;

    if (isFinalStage) {
      // 最終ステージ：総合ランク表示
      this.showFinalRankScreen(centerX, centerY);
    } else {
      // 通常ステージ：ステージ別ランク表示
      this.showStageRankScreen(centerX, centerY, currentRank);
    }
  }

  showStageRankScreen(centerX, centerY, rank) {
    const rankColor = this.rankManager.getRankColor(rank);
    const rankDescription = this.rankManager.getRankDescription(rank);
    const actualStageNumber = this.rankManager.getActualStageNumber(
      this.currentLevelIndex
    );

    // ステージ番号
    this.add
      .text(centerX, centerY - 120, `ステージ ${actualStageNumber} クリア！`, {
        fontSize: "36px",
        fill: "#ffffff",
        fontFamily: "sans-serif",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11);

    // ランク表示
    const rankLabelStyle = {
      fontSize: "40px",
      fill: "#ffffff",
      fontFamily: "sans-serif",
      stroke: "#000000",
      strokeThickness: 8,
    };
    const rankLetterStyle = {
      fontSize: "80px",
      fill: rankColor,
      fontFamily: "sans-serif",
      stroke: "#000000",
      strokeThickness: 8,
    };

    const rankLabelText = this.add
      .text(0, 0, "RANK ", rankLabelStyle)
      .setOrigin(1, 0.5);
    const rankLetterText = this.add
      .text(0, 0, rank, rankLetterStyle)
      .setOrigin(0, 0.5);

    const totalWidth = rankLabelText.width + rankLetterText.width;
    const container = this.add.container(
      centerX - totalWidth / 8,
      centerY - 40
    );
    container.add(rankLabelText);
    rankLetterText.x = rankLabelText.width;
    container.add(rankLetterText);
    container.setScrollFactor(0).setDepth(11);

    // クリアタイム
    this.add
      .text(centerX, centerY + 40, `クリアタイム: ${this.timeElapsed} 秒`, {
        fontSize: "24px",
        fill: "#ffffff",
        fontFamily: "sans-serif",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11);

    // ボタン
    this.createButton(centerX - 120, centerY + 100, "次へ進む", () => {
      const nextStageData = {
        levelIndex: this.currentLevelIndex + 1,
        continueGame: true,
      };
      this.scene.restart(nextStageData);
    });

    this.createButton(centerX + 120, centerY + 100, "ホームに戻る", () => {
      window.location.href = "/";
    });
  }

  showFinalRankScreen(centerX, centerY) {
    // 総合ランクを計算
    const finalRank = this.rankManager.calculateFinalRank();
    const rankColor = this.rankManager.getRankColor(finalRank);
    const rankDescription = this.rankManager.getRankDescription(finalRank);
    const totalTime = this.rankManager.getTotalTime();
    const allStageRanks = this.rankManager.getAllStageRanks();

    // タイトル
    this.add
      .text(centerX, centerY - 200, "全ステージクリア！", {
        fontSize: "40px",
        fill: "#ffffff",
        fontFamily: "sans-serif",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11);

    // 総合ランク表示
    const rankLabelStyle = {
      fontSize: "50px",
      fill: "#ffffff",
      fontFamily: "sans-serif",
      stroke: "#000000",
      strokeThickness: 8,
    };
    const rankLetterStyle = {
      fontSize: "100px",
      fill: rankColor,
      fontFamily: "sans-serif",
      stroke: "#000000",
      strokeThickness: 8,
    };

    const rankLabelText = this.add
      .text(0, 0, "総合ランク ", rankLabelStyle)
      .setOrigin(1, 0.5);
    const rankLetterText = this.add
      .text(0, 0, finalRank, rankLetterStyle)
      .setOrigin(0, 0.5);

    const totalWidth = rankLabelText.width + rankLetterText.width;
    const container = this.add.container(
      centerX - totalWidth / 8,
      centerY - 120
    );
    container.add(rankLabelText);
    rankLetterText.x = rankLabelText.width;
    container.add(rankLetterText);
    container.setScrollFactor(0).setDepth(11);

    // 総合クリアタイム
    this.add
      .text(centerX, centerY - 20, `総合クリアタイム: ${totalTime} 秒`, {
        fontSize: "28px",
        fill: "#ffffff",
        fontFamily: "sans-serif",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11);

    // 各ステージのランク表示
    let stageRankY = centerY + 20;
    allStageRanks.forEach((stageData, index) => {
      const stageRankColor = this.rankManager.getRankColor(stageData.rank);
      this.add
        .text(centerX - 100, stageRankY, `ステージ${stageData.stage}:`, {
          fontSize: "20px",
          fill: "#ffffff",
          fontFamily: "sans-serif",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(11);

      this.add
        .text(centerX, stageRankY, stageData.rank, {
          fontSize: "24px",
          fill: stageRankColor,
          fontFamily: "sans-serif",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(11);

      this.add
        .text(centerX + 100, stageRankY, `${stageData.time}秒`, {
          fontSize: "20px",
          fill: "#ffffff",
          fontFamily: "sans-serif",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(11);

      stageRankY += 30;
    });

    // ボタン
    this.createButton(centerX - 120, centerY + 180, "もう一度プレイ", () => {
      this.rankManager.reset();
      this.rankManager.save();
      const restartData = {
        levelIndex: 0,
        continueGame: false,
      };
      this.scene.restart(restartData);
    });

    this.createButton(centerX + 120, centerY + 180, "ホームに戻る", () => {
      window.location.href = "/";
    });
  }

  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);

    const background = this.add.sprite(0, 0, "buttonSprite");
    const buttonText = this.add
      .text(0, 0, text, {
        fontSize: "20px",
        fill: "#ffffff",
        fontFamily: "sans-serif",
      })
      .setOrigin(0.5);

    button.add([background, buttonText]);
    button.setSize(background.width, background.height);
    button.setScrollFactor(0).setDepth(11);

    // インタラクティブにする
    button.setInteractive({ useHandCursor: true });

    // マウスオーバー/アウトの処理
    button.on("pointerover", () => background.setTint(0x888888));
    button.on("pointerout", () => background.clearTint());

    // クリック処理
    button.on("pointerdown", () => {
      // ボタンが押された感じを出す
      button.setScale(0.95);
    });
    button.on("pointerup", () => {
      button.setScale(1);
      callback(); // ボタンに設定された処理を実行
    });

    return button;
  }

  create() {
    this.physics.resume();
    this.createTextures();
    this.createUI();

    this.goalTiles = this.physics.add.staticGroup();
    this.teleportTriggers = this.physics.add.group({ allowGravity: false });
    this.teleportDestinations = {}; // ワープ先座標の保存用
    this.stairsTiles = this.physics.add.staticGroup();
    this.fakewall = this.physics.add.staticGroup();

    this.buildLevel(alllevels[this.currentLevelIndex], 18, 50);
    this.createPlayer1();
    this.createPlayer2();
    this.setupInput();
    this.setupGameplay();
    this.createAnimations();
    if (this.currentLevelIndex > 0) {
      this.startTimer();
    }

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
    const buttonGraphics = this.add.graphics();
    buttonGraphics.fillStyle(0x555555); // ボタンの色
    buttonGraphics.fillRoundedRect(0, 0, 180, 50, 16); // 横180, 縦50, 角丸16
    buttonGraphics.generateTexture("buttonSprite", 180, 50);
    buttonGraphics.destroy();

    console.log("Additional textures created successfully");
  }

  createAnimations() {
    // --- プレイヤー1のアニメーション ---
    this.anims.create({
      key: "p1_down_anim",
      frames: [
        { key: "p1_down_1" },
        { key: "p1_down_2" },
        { key: "p1_down_3" },
      ],
      frameRate: 9,
      repeat: -1,
    });
    this.anims.create({
      key: "p1_left_anim",
      frames: [
        { key: "p1_left_1" },
        { key: "p1_left_2" },
        { key: "p1_left_3" },
      ],
      frameRate: 9,
      repeat: -1,
    });
    this.anims.create({
      key: "p1_right_anim",
      frames: [
        { key: "p1_right_1" },
        { key: "p1_right_2" },
        { key: "p1_right_3" },
      ],
      frameRate: 9,
      repeat: -1,
    });
    this.anims.create({
      key: "p1_up_anim",
      frames: [{ key: "p1_up_1" }, { key: "p1_up_2" }, { key: "p1_up_3" }],
      frameRate: 9,
      repeat: -1,
    });
    // --- プレイヤー2のアニメーション ---
    this.anims.create({
      key: "p2_down_anim",
      frames: [
        { key: "p2_down_1" },
        { key: "p2_down_2" },
        { key: "p2_down_3" },
      ],
      frameRate: 9,
      repeat: -1,
    });
    this.anims.create({
      key: "p2_left_anim",
      frames: [
        { key: "p2_left_1" },
        { key: "p2_left_2" },
        { key: "p2_left_3" },
      ],
      frameRate: 9,
      repeat: -1,
    });
    this.anims.create({
      key: "p2_right_anim",
      frames: [
        { key: "p2_right_1" },
        { key: "p2_right_2" },
        { key: "p2_right_3" },
      ],
      frameRate: 9,
      repeat: -1,
    });
    this.anims.create({
      key: "p2_up_anim",
      frames: [{ key: "p2_up_1" }, { key: "p2_up_2" }, { key: "p2_up_3" }],
      frameRate: 9,
      repeat: -1,
    });
  }

  createUI() {
    // ステージ番号表示
    const actualStageNumber = this.rankManager.getActualStageNumber(
      this.currentLevelIndex
    );
    const stageDisplayText =
      actualStageNumber > 0
        ? `ステージ ${actualStageNumber}`
        : `つなぎステージ ${this.currentLevelIndex + 1}`;

    // デバッグ情報
    this.debugText = this.add.text(10, 10, "", {
      fontSize: "14px",
      fill: "#ffffff",
      fontFamily: "sans-serif",
    });

    // タイム表示
    this.timeText = this.add.text(680, 10, "Time: 0", {
      fontSize: "24px",
      fill: "#ffffff",
      fontFamily: "sans-serif",
    });
  }

  showRankCriteria() {
    const criteria = this.rankManager.getRankCriteria(this.currentLevelIndex);
    const criteriaText = this.add.text(
      10,
      70,
      `ランク基準: S≤${criteria.S}s A≤${criteria.A}s B≤${criteria.B}s C≤${criteria.C}s`,
      {
        fontSize: "12px",
        fill: "#cccccc",
        fontFamily: "sans-serif",
      }
    );
  }

  createPlayer1() {
    let startX, startY;
    if (this.initialPlayer1Pos) {
      startX = this.initialPlayer1Pos.x;
      startY = this.initialPlayer1Pos.y;
    } else {
      startX = this.player1Start.x;
      startY = this.player1Start.y;
    }
    this.player1 = this.physics.add.sprite(startX, startY, "p1_down_1");
    this.player1.setCollideWorldBounds(true);
    if (
      this.currentLevelIndex === 2 ||
      this.currentLevelIndex === 3 ||
      this.currentLevelIndex === 6
    ) {
      this.player1.setBounce(0);
    } else {
      this.player1.setBounce(0.2);
    }
    this.player1.setVelocity(0, 0);
    if (
      this.currentLevelIndex === 2 ||
      this.currentLevelIndex === 3 ||
      this.currentLevelIndex === 6
    ) {
      this.player1.setDrag(0);
    } else {
      this.player1.setDrag(2000);
    }
    this.player1Speed = 200; // プレイヤー1の移動速度
    this.player1.body.setSize(20, 28).setOffset(6, 4);
  }

  createPlayer2() {
    let startX, startY;
    if (this.initialPlayer2Pos) {
      startX = this.initialPlayer2Pos.x;
      startY = this.initialPlayer2Pos.y;
    } else {
      startX = this.player2Start.x;
      startY = this.player2Start.y;
    }
    this.player2 = this.physics.add.sprite(startX, startY, "p2_down_1");

    this.player2.setCollideWorldBounds(true);
    if (
      this.currentLevelIndex === 2 ||
      this.currentLevelIndex === 3 ||
      this.currentLevelIndex === 6
    ) {
      this.player2.setBounce(0);
    } else {
      this.player2.setBounce(0.2);
    }
    this.player2.setVelocity(0, 0);
    if (
      this.currentLevelIndex === 2 ||
      this.currentLevelIndex === 3 ||
      this.currentLevelIndex === 6
    ) {
      this.player2.setDrag(0);
    } else {
      this.player2.setDrag(2000);
    }
    this.player2Speed = 200; // プレイヤー2の移動速度
    this.player2.body.setSize(20, 28).setOffset(6, 4);
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

        case "z":
        case "Z":
          this.keys.z = true;
          // デバッグ用：Zキーでステージクリア
          if (!this.isGameCleared) {
            console.log("デバッグ: Zキーでステージクリア");
            this.gameClear();
          }
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

        case "z":
        case "Z":
          this.keys.z = false;
          break;

        default:
          if (event.key >= "0" && event.key <= "9") {
            this.keys.numbers[parseInt(event.key, 10)] = false;
          }
      }
    });
  }

  setupGameplay() {
    this.initialTime = this.initialTime || 0; // initで設定された値を使う
    this.timeElapsed = this.initialTime;
    this.timeText.setText(`Time: ${this.timeElapsed}`);
    this.timerStarted = false;
  }
  startTimer() {
    if (this.timerStarted) {
      return;
    }
    this.timerStarted = true;
    this.timeEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeElapsed += 1;
        this.timeText.setText(`Time: ${this.timeElapsed}`);
      },
      loop: true,
    });
  }

  update() {
    if (this.isGameCleared) {
      return;
    }
    // プレイヤー1の移動とアニメーション
    if (this.keys.left) {
      this.player1.setVelocityX(-this.player1Speed);
      this.player1.anims.play("p1_left_anim", true);
      this.startTimer();
    } else if (this.keys.right) {
      this.player1.setVelocityX(this.player1Speed);
      this.player1.anims.play("p1_right_anim", true);
      this.startTimer();
    } else {
      if (
        this.currentLevelIndex !== 2 &&
        this.currentLevelIndex !== 3 &&
        this.currentLevelIndex !== 6
      ) {
        this.player1.setVelocityX(0);
      }
    }
    if (this.keys.up) {
      this.player1.setVelocityY(-this.player1Speed);
      this.player1.anims.play("p1_up_anim", true);
      this.startTimer();
    } else if (this.keys.down) {
      this.player1.setVelocityY(this.player1Speed);
      this.player1.anims.play("p1_down_anim", true);
      this.startTimer();
    } else {
      if (
        this.currentLevelIndex !== 2 &&
        this.currentLevelIndex !== 3 &&
        this.currentLevelIndex !== 6
      ) {
        this.player1.setVelocityY(0);
      }
    }
    if (
      !this.keys.left &&
      !this.keys.right &&
      !this.keys.up &&
      !this.keys.down
    ) {
      this.player1.anims.stop();
      this.player1.setTexture("p1_down_1"); // 正面向きの静止画キー
    }
    // プレイヤー2の移動

    if (this.keys.left) {
      this.player2.setVelocityX(-this.player2Speed);
      this.player2.anims.play("p2_left_anim", true);
      this.startTimer();
    } else if (this.keys.right) {
      this.player2.setVelocityX(this.player2Speed);
      this.player2.anims.play("p2_right_anim", true);
      this.startTimer();
    } else {
      if (
        this.currentLevelIndex !== 2 &&
        this.currentLevelIndex !== 3 &&
        this.currentLevelIndex !== 6
      ) {
        this.player2.setVelocityX(0);
      }
    }
    if (this.keys.up) {
      this.player2.setVelocityY(-this.player2Speed);
      this.player2.anims.play("p2_up_anim", true);
      this.startTimer();
    } else if (this.keys.down) {
      this.player2.setVelocityY(this.player2Speed);
      this.player2.anims.play("p2_down_anim", true);
      this.startTimer();
    } else {
      if (
        this.currentLevelIndex !== 2 &&
        this.currentLevelIndex !== 3 &&
        this.currentLevelIndex !== 6
      ) {
        this.player2.setVelocityY(0);
      }
    }
    if (
      !this.keys.left &&
      !this.keys.right &&
      !this.keys.up &&
      !this.keys.down
    ) {
      this.player2.anims.stop();
      this.player2.setTexture("p2_down_1"); // 正面向きの静止画キー
    }
    // デバッグ情報の更新
    const currentRank = this.rankManager.isActualStage(this.currentLevelIndex)
      ? this.rankManager.calculateStageRank(
          this.currentLevelIndex,
          this.timeElapsed
        )
      : "なし";

    this.debugText.setText(
      `Player 1: (${Math.round(this.player1.x)}, ${Math.round(
        this.player1.y
      )})\nPlayer 2: (${Math.round(this.player2.x)}, ${Math.round(
        this.player2.y
      )}`
    );

    let player1OnGoal1 = false;
    let player2OnGoal1 = false;
    this.goalTiles.getChildren().forEach((goal) => {
      const goalForPlayer = goal.getData("player");
      if (goalForPlayer === 1) {
        goal.setTexture("goalSprite1");
      } else if (goalForPlayer === 2) {
        goal.setTexture("goalSprite2");
      }
    });
    this.goalTiles.getChildren().forEach((goal) => {
      const goalForPlayer = goal.getData("player");

      // プレイヤー1が、プレイヤー1用のゴールに重なっているか？

      if (goalForPlayer === 1 && this.physics.overlap(this.player1, goal)) {
        player1OnGoal1 = true;
        goal.setTexture("fin_goalSprite1");
      }
      if (goalForPlayer === 2 && this.physics.overlap(this.player2, goal)) {
        player2OnGoal1 = true;
        goal.setTexture("fin_goalSprite2");
      }
    });
    if (player1OnGoal1 && player2OnGoal1) {
      this.gameClear();
    }
    if (this.fakewall.countActive(true) > 0) {
      let player1OnFakewall2 = false;
      let player2OnFakewall2 = false;

      this.fakewall.getChildren().forEach((wall) => {
        const wallForPlayer = wall.getData("player");

        if (wallForPlayer === 1 && this.physics.overlap(this.player1, wall)) {
          player1OnFakewall2 = true;
        }
        if (wallForPlayer === 2 && this.physics.overlap(this.player2, wall)) {
          player2OnFakewall2 = true;
        }
      });
      if (player1OnFakewall2 && player2OnFakewall2) {
        this.handleNextStageTrigger();
      }
    }
  }
}

export default EscapeScene;
