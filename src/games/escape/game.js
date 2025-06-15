import Phaser from "phaser";
import EscapeScene from "./scenes/EscapeScene.js";

export const initializeGame = (container) => {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: container,
    backgroundColor: "#2c3e50",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 }, // gravityは0でOK
        debug: true, // デバッグモードをオン
      },
    },
    scene: [EscapeScene], // EscapeSceneを配列に追加
  };

  return new Phaser.Game(config);
};

const config = {
  scene: [EscapeScene], // 配列に追加
};
