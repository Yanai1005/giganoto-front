import Phaser from 'phaser';

import Ending1 from './Ending1.js';
import Ending2 from './Ending2.js';
import Ending3 from './Ending3.js';
import Ending4 from './Ending4.js';
import EndingTrue from './EndingTrue.js';

const ENDINGS = {
  logic_good: Ending1,
  logic_bad: Ending2,
  impulse_good: Ending3,
  impulse_bad: Ending4,
  true_ending: EndingTrue,
};

export default class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  init(data) {
    this.endingKey = data.endingKey;
  }

  create() {
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
        textBox.setText('fin');
        this.input.keyboard.once('keydown-SPACE', () => {
          location.reload();
        });
      }
    };

    nextLine();
  }
}
