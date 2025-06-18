//各エンディングに到達した際に表示されるシーン
import Phaser from 'phaser';

class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  init(data) {
    this.endingKey = data.endingKey;
  }

  create() {
    let endingText = '';

     //endingTextの文言は後で修正
    switch (this.endingKey) {
      case 'rational-happy':
        endingText = '理性エンド（ハッピー）：穏やかな日常を手に入れた。';
        break;
      case 'rational-bad':
        endingText = '理性エンド（バッド）：整った人生、でも虚しさが残る。';
        break;
      case 'instinct-happy':
        endingText = '本能エンド（ハッピー）：自由で情熱的な未来へ！';
        break;
      case 'instinct-bad':
        endingText = '本能エンド（バッド）：社会から孤立し、混乱の中へ。';
        break;
      case 'balanced-happy':
        endingText = 'バランスエンド（ハッピー）：人格は融合し、真の自分に。';
        break;
      case 'balanced-bad':
        endingText = 'バランスエンド（バッド）：人格は統合されず、混乱へ。';
        break;
      default:
        endingText = 'エンディング判定失敗。';
    }

    this.add.text(100, 200, endingText, {
      font: '20px sans-serif',
      wordWrap: { width: 600 }
    });
  }
}

export default EndScene;
