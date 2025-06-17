import BaseScene from "./BaseScene.js";

export default class WinScene extends BaseScene {
  constructor() {
    super("WinScene");
  }

  // (preloadは共通アセットなら不要)

  create() {
    this.add
      .text(400, 300, "Congratulations!", { fontSize: "48px", fill: "#fff" })
      .setOrigin(0.5);
    this.add
      .text(400, 350, "You Escaped!", { fontSize: "32px", fill: "#fff" })
      .setOrigin(0.5);

    // ここではプレイヤーは生成せず、クリア画面を表示するだけ
  }
}
