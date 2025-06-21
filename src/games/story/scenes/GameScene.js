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
    this.stats = {
      logic_1: 0,
      logic_2: 0,
      impulse_1: 0,
      impulse_2: 0,
    };
    this.choiceHistory = JSON.parse(localStorage.getItem('choiceHistory')) || {
      logic_1: false,
      logic_2: false,
      impulse_1: false,
      impulse_2: false,
    };
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
      .setDepth(100)
      .setAlpha(0);

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
    }).setVisible(false);

    this.statusHighlight = this.add.text(120, 420, '', {
      fontSize: '16px',
      color: '#00ccff',
      backgroundColor: '#222',
      padding: { x: 8, y: 4 },
    }).setVisible(false);

    this.statusSuffix = this.add.text(170, 420, ' に変更しました', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#222',
      padding: { x: 8, y: 4 },
    }).setVisible(false);

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
    this.tweens.add({
      targets: this.fadeRect,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        this.currentBg.setTexture(key);
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
        this.endGame();
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

      if (line === '家朝') {
        this.changeBackground('bg_hoom_morning');
        this.currentLineIndex++;
        this.showNextLine();
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

    if (this.stats.hasOwnProperty(resultKey)) {
      this.stats[resultKey]++;
    }
    if (this.choiceHistory.hasOwnProperty(resultKey)) {
      this.choiceHistory[resultKey] = true;
      localStorage.setItem('choiceHistory', JSON.stringify(this.choiceHistory));
    }

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
        if (this.chapterIndex >= 3) {
          const endingKey = this.determineEnding();
          this.scene.start('EndScene', { endingKey });
        } else {
          this.chapterIndex++;
          this.loadChapter();
        }
      }
    };
    nextLine();
  }

  determineEnding() {
    const { logic_1, logic_2, impulse_1, impulse_2 } = this.stats;
    const logicTotal = logic_1 + logic_2;
    const impulseTotal = impulse_1 + impulse_2;

    const allChosen = Object.values(this.choiceHistory).every(flag => flag);
    if (allChosen) return 'true_ending';

    if (logicTotal > impulseTotal) {
      return logic_1 > logic_2 ? 'logic_bad' : 'logic_good';
    }
    if (impulseTotal > logicTotal) {
      return impulse_1 > impulse_2 ? 'impulse_bad' : 'impulse_good';
    }
    return logic_2 > impulse_2 ? 'logic_good' : 'impulse_good';
  }

  setPersonality(type) {
    this.personality = type;

    const color = type === 'logic' ? '#00ccff' : '#ff3333';
    const word = type === 'logic' ? '理性' : '本能';

    this.statusPrefix.setVisible(true);
    this.statusHighlight.setText(word).setColor(color).setVisible(true);
    this.statusSuffix.setVisible(true);

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

  endGame() {
    this.textBox.setText('終章です。ゲームを終了します。');
  }
}
