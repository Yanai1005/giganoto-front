import Phaser from 'phaser';
import Chapter1 from './Chapters/Chapter1.js';
import Chapter2 from './Chapters/Chapter2.js';
import Chapter3 from './Chapters/Chapter3.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.chapterIndex = 1;
    this.storyData = null;
    this.currentLineIndex = 0;
    this.personality = 'logic'; 
    this.choicesVisible = false;
  }

  preload() {
    this.load.image('bg_hoom_morning', '/assets/bg_hoom_morning.jpg');
    this.load.image('bg_hoom_evening', '/assets/bg_hoom_evening.jpg');
    this.load.image('bg_street_morning', '/assets/bg_street_morning.jpg');
    this.load.image('bg_school_gate', '/assets/bg_school_gate.jpg');
  }

  create() {
   this.currentBg = this.add.image(0, 0, 'bg_hoom_morning')
    .setOrigin(0)
    .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

   this.fadeRect = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000)
    .setOrigin(0)
    .setDepth(100) // 前面に表示
    .setAlpha(0);  // 最初は透明

   this.textBox = this.add.text(50, 450, '', {
     fontSize: '20px',
     color: '#ffffff',
     wordWrap: { width: 700, useAdvancedWrap: true },
     lineSpacing: 6,
     padding: { top: 10, bottom: 10, left: 10, right: 10 },
    });

    this.choiceButtons = [];
    for (let i = 0; i < 2; i++) {
      const btn = this.add.text(600, 370 + i * 40, '', {
        fontSize: '18px',
        backgroundColor: '#333',
        color: '#fff',
        padding: { x: 10, y: 5 },
      }).setInteractive().setVisible(false);

      btn.on('pointerdown', () => this.selectChoice(i));
      this.choiceButtons.push(btn);
    }

    this.statusPrefix = this.add.text(50, 420, '人格を ', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#222',
        padding: { x: 8, y: 4 },
    })
    .setVisible(false);

    this.statusHighlight = this.add.text(120, 420, '', {
        fontSize: '16px',
        color: '#00ccff', // default 青
        backgroundColor: '#222',
        padding: { x: 8, y: 4 },      
    })
    .setVisible(false);

    this.statusSuffix = this.add.text(170, 420, ' に変更しました', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#222',
        padding: { x: 8, y: 4 },
    })
    .setVisible(false);

    this.input.keyboard.on('keydown-Q', () => {
        if (this.choicesVisible) this.setPersonality('logic');
    });
    
    this.input.keyboard.on('keydown-E', () => {
        if (this.choicesVisible) this.setPersonality('impulse');
    });

    this.input.keyboard.on('keydown-SPACE', () => this.advanceText());

    this.loadChapter();
  }

  changeBackground(key) {
  // フェードアウト（暗転）
  this.tweens.add({
    targets: this.fadeRect,
    alpha: 1,
    duration: 500,
    onComplete: () => {
      // 背景変更
      this.currentBg.setTexture(key);

      // フェードイン（明転）
      this.tweens.add({
        targets: this.fadeRect,
        alpha: 0,
        duration: 500,
        });
      }
    });
  }

  loadChapter() {
    switch (this.chapterIndex) {
      case 1:
        this.storyData = Chapter1;
        break;
      case 2:
        this.storyData = Chapter2;
        break;
      case 3:
        this.storyData = Chapter3;
        break;
      default:
        this.textBox.setText('終章です。ゲームを終了します。');
        return;
    }

    this.currentLineIndex = 0;
    this.choicesVisible = false;
    this.textBox.setText('');
    this.showNextLine();
  }

  showNextLine() {
  const lines = this.storyData.commonLines;
  if (this.currentLineIndex < lines.length) {
    const line = lines[this.currentLineIndex];

    // 特定のキーワードで背景変更
    if (line === '家朝') {
      this.changeBackground('bg_hoom_morning');
      this.currentLineIndex++;
      this.showNextLine(); // 空行扱いでスキップ
      return;
    }

    if (line === '家夜') {
      this.changeBackground('bg_hoom_evening');
      this.currentLineIndex++;
      this.showNextLine();
      return;
    }

    this.textBox.setText(line);
    this.currentLineIndex++;
  } else {
    this.showChoices();
  }
}


  showChoices() {
    const choiceLines = this.storyData.choices[this.personality];
    for (let i = 0; i < this.choiceButtons.length; i++) {
      this.choiceButtons[i].setText(choiceLines[i]);
      this.choiceButtons[i].setVisible(true);
    }
    this.choicesVisible = true;
  }

  selectChoice(index) {
    const resultKey = `${this.personality}_${index + 1}`;
    const resultLines = this.storyData.results[resultKey];
    if (!resultLines) {
      this.textBox.setText('分岐データが見つかりません');
      return;
    }
    this.choiceButtons.forEach(btn => btn.setVisible(false));
    this.showResult(resultLines);
  }

  showResult(lines) {
    let i = 0;
    const nextLine = () => {
      if (i < lines.length) {
        this.textBox.setText(lines[i]);
        i++;
        this.input.keyboard.once('keydown-SPACE', nextLine);
      } else {
        this.chapterIndex++;
        this.loadChapter();
      }
    };
    nextLine();
  }

  setPersonality(type) {
  this.personality = type;

  const color = type === 'logic' ? '#00ccff' : '#ff3333';
  const word = type === 'logic' ? '理性' : '本能';

  this.statusPrefix.setVisible(true);
  this.statusHighlight.setText(word).setColor(color).setVisible(true);
  this.statusSuffix.setVisible(true);

  //人格表示UIの表示時間
  this.time.delayedCall(4000, () => {
    this.statusPrefix.setVisible(false);
    this.statusHighlight.setVisible(false);
    this.statusSuffix.setVisible(false);
  });

  if (this.choicesVisible) {
  this.showChoices(); 
 }

}


  advanceText() {
    if (!this.choicesVisible) {
      this.showNextLine();
    }
  }
}
