import Phaser from 'phaser';

import Ending1Text from './Chapters/Ending1.js';
import Ending2Text from './Chapters/Ending2.js';
import Ending3Text from './Chapters/Ending3.js';
import Ending4Text from './Chapters/Ending4.js';

const ENDINGS = {
  logic_good: Ending1Text,
  logic_bad: Ending2Text,
  impulse_good: Ending3Text || ['インパルス・グッドエンド（作成中）'],
  impulse_bad: Ending4Text || ['インパルス・バッドエンド（作成中）'],
  true_ending: ['トゥルーエンド（作成中）'],
};

export default class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  init(data) {
    this.endingKey = data.endingKey;
  }

  create() {
    // 背景を黒に
    this.cameras.main.setBackgroundColor('#000000');

    const lines = ENDINGS[this.endingKey] || ['エンディングデータが見つかりません'];

    let i = 0;
    const textBox = this.add.text(100, 200, '', {
      font: '20px sans-serif',
      color: '#fff',
      wordWrap: { width: 600 },
      lineSpacing: 8
    });

    const nextLine = () => {
      if (i < lines.length) {
        textBox.setText(lines[i]);
        i++;
        this.input.keyboard.once('keydown-SPACE', nextLine);
      } else {
        textBox.setText('fin\n\nスペースキーでタイトルに戻る');
        this.input.keyboard.once('keydown-SPACE', () => {
          // localStorageをクリアして最初から
          localStorage.removeItem('choiceHistory');
          location.reload();
        });
      }
    };

    nextLine();
  }
}
