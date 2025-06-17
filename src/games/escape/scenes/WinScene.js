import BaseScene from "./BaseScene.js";

export default class WinScene extends BaseScene {
  constructor() {
    super("WinScene");
  }

  // (preload�͋��ʃA�Z�b�g�Ȃ�s�v)

  create() {
    this.add
      .text(400, 300, "Congratulations!", { fontSize: "48px", fill: "#fff" })
      .setOrigin(0.5);
    this.add
      .text(400, 350, "You Escaped!", { fontSize: "32px", fill: "#fff" })
      .setOrigin(0.5);

    // �����ł̓v���C���[�͐��������A�N���A��ʂ�\�����邾��
  }
}
