//src/games/shooter/game.js
import Phaser from "phaser";
import EscapeScene from "./scenes/EscapeScene.js";

export const initializeGame = (Container) => {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    present: Container,
    backgroundColor: "#1a1a2e",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: true, // デバッグを有効化
      },
    },
    scene: [EscapeScene],
  };

  const game = new Phaser.Game(config);
  return game;
};
