import Phaser from "phaser";
import Stage1 from "./scenes/Stage1.js";
import Stage2 from "./scenes/Stage2.js";
import Stage3 from "./scenes/Stage3.js";
import WinScene from "./scenes/WinScene.js";

// DOM�v�f�i�Q�[����`�悷��ꏊ�j��n���ăQ�[��������������
export const initializeGame = (container) => {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: container, // �R���e�i�v�f���w��
    backgroundColor: "#2d2d2d",
    // �S�ẴV�[�������X�g�A�b�v����B�z��̍ŏ��̃V�[�����J�n�����B
    scene: [Stage1, Stage2, Stage3, WinScene],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 }, // �v���C���[�ɏd�͂�K�p
        debug: true, // true�ɂ���Ɠ����蔻��Ȃǂ���������f�o�b�O�ɕ֗�
      },
    },
  };

  // Phaser�Q�[���C���X�^���X�𐶐����ĕԂ�
  return new Phaser.Game(config);
};

// ���̍s `initializeGame("game-container");` ���폜���܂����B
