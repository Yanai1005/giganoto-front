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

  preload() {}

  create() {
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


    this.input.keyboard.on('keydown-ONE', () => this.setPersonality('logic'));
    this.input.keyboard.on('keydown-TWO', () => this.setPersonality('impulse'));
    this.input.keyboard.on('keydown-SPACE', () => this.advanceText());

    this.loadChapter();
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
      this.textBox.setText(lines[this.currentLineIndex]);
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
    this.textBox.setText(`人格を ${type === 'logic' ? '理性' : '本能'} に変更しました。スペースキーで進行。`);
  }

  advanceText() {
    if (!this.choicesVisible) {
      this.showNextLine();
    }
  }
}
