import Phaser from "phaser";
import Stage1 from "./scenes/Stage1.js";
import Stage2 from "./scenes/Stage2.js";
import Stage3 from "./scenes/Stage3.js";
import WinScene from "./scenes/WinScene.js";

// DOM要素（ゲームを描画する場所）を渡してゲームを初期化する
export const initializeGame = (container) => {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: container, // コンテナ要素を指定
    backgroundColor: "#2d2d2d",
    // 全てのシーンをリストアップする。配列の最初のシーンが開始される。
    scene: [Stage1, Stage2, Stage3, WinScene],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false, // デバッグ用の枠線を非表示
      },
    },
  };

  // Phaserゲームインスタンスを生成して返す
  return new Phaser.Game(config);
};
