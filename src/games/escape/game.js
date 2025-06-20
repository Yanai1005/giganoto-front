// src/games/escape/game.js
import Phaser from "phaser";
import EscapeScene from "./scenes/EscapeScene.js";

export const initializeGame = (Container) => {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: Container,
    backgroundColor: "#00008B1",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: true,
      },
    },
    scene: [EscapeScene],
  };

  const game = new Phaser.Game(config);
  return game;
};
