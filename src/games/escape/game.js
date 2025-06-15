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
        gravity: { y: 0 }, // gravity��0��OK
        debug: true, // �f�o�b�O���[�h���I��
      },
    },
    scene: [EscapeScene], // EscapeScene��z��ɒǉ�
  };

  return new Phaser.Game(config);
};

const config = {
  scene: [EscapeScene], // �z��ɒǉ�
};
