// GameScene.js
import Phaser from 'phaser';
import Chapter1 from './Chapters/Chapter1.js';
import Chapter2 from './Chapters/Chapter2.js';
import Chapter3 from './Chapters/Chapter3.js';
import Chapter4 from './Chapters/Chapter4.js';
import Chapter5 from './Chapters/Chapter5.js';

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

    this.canChangePersonality = true;

  }

  preload() {
    this.load.image('bg_home_morning', '/assets/bg_home_morning.jpg');
    this.load.image('bg_home_evening', '/assets/bg_home_evening.jpg');
    this.load.image('bg_street_morning', '/assets/bg_street_morning.jpg');
    this.load.image('bg_street_evening', '/assets/bg_street_evening.jpg');
    this.load.image('bg_school_gate', '/assets/bg_school_gate.jpg');
    this.load.image('bg_cafe', '/assets/bg_cafe.jpg');
    this.load.image('bg_campus', '/assets/bg_campus.jpg');
    this.load.image('bg_kitchen', '/assets/bg_kitchen.png');
    this.load.image('bg_entrance', '/assets/bg_entrance.jpg');
    this.load.image('bg_cityStreet', '/assets/bg_cityStreet.jpg');
  }

  create() {
    this.fadeRect = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000)
      .setOrigin(0)
      .setDepth(100)
      .setAlpha(1);

    this.currentBg = this.add.image(0, 0, 'bg_home_morning')
      .setOrigin(0)
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
      .setDepth(-1);

    this.tweens.add({
      targets: this.fadeRect,
      alpha: 0,
      duration: 1000,
      ease: 'Linear',
    });

    this.textBox = this.add.text(50, 450, '', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      wordWrap: { width: 700, useAdvancedWrap: true },
      lineSpacing: 6,
      padding: { top: 10, bottom: 10, left: 10, right: 10 },
    });

    this.choiceButtons = [];
    for (let i = 0; i < 2; i++) {
      const btn = this.add.text(550, 370 + i * 40, '', {
        fontSize: '18px',
        backgroundColor: '#333',
        color: '#fff',
        padding: { x: 10, y: 5 },
      }).setInteractive().setVisible(false);
      btn.on('pointerdown', () => this.selectChoice(i));
      this.choiceButtons.push(btn);
    }

    this.chapterTitle = this.add.text(20, 20, '', {
      fontSize: '24px',
      fontFamily: 'sans-serif',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 }
    }).setAlpha(1);

    this.statusPrefix = this.add.text(50, 420, '人格を ', {
      fontSize: '16px', color: '#ffffff', backgroundColor: '#222', padding: { x: 8, y: 4 },
    }).setVisible(false);

    this.statusHighlight = this.add.text(120, 420, '', {
      fontSize: '16px', color: '#00ccff', backgroundColor: '#222', padding: { x: 8, y: 4 },
    }).setVisible(false);

    this.statusSuffix = this.add.text(170, 420, ' に変更しました', {
      fontSize: '16px', color: '#ffffff', backgroundColor: '#222', padding: { x: 8, y: 4 },
    }).setVisible(false);

    this.input.keyboard.on('keydown-Q', () => { if (this.choicesVisible) this.setPersonality('logic'); });
    this.input.keyboard.on('keydown-E', () => { if (this.choicesVisible) this.setPersonality('impulse'); });
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
          duration: 500
        });
      }
    });
  }

  loadChapter() {
    const titles = ['第1章', '第2章', '第3章', '第4章', '第5章'];
    const data = [Chapter1, Chapter2, Chapter3, Chapter4, Chapter5];

    if (this.chapterIndex > titles.length) {
      this.endGame();
      return;
    }

    this.storyData = data[this.chapterIndex - 1];
    this.chapterTitle.setText(titles[this.chapterIndex - 1]);
    this.chapterTitle.setAlpha(1);
    this.currentLineIndex = 0;
    this.choicesVisible = false;
    this.textBox.setText('');
    this.showNextLine();

    this.tweens.add({
      targets: this.chapterTitle,
      alpha: 0,
      delay: 3000,
      duration: 1000
    });
  }

  processLine(line, onDone) {
  const bgMap = {
    '家朝': 'bg_home_morning',
    '家夜': 'bg_home_evening',
    '校門': 'bg_school_gate',
    '通学路': 'bg_street_morning',
    '通学路昼': 'bg_street_evening',
    '教室昼': 'bg_classroom_day',
    'キャンパス夕': 'bg_campus_evening',
    '玄関': 'bg_entrance',
    'カフェ': 'bg_cafe',
    '街中':'bg_cityStreet',
  };

  if (bgMap[line]) {
    this.changeBackground(bgMap[line]);
    // 背景が変わるだけでテキストは表示しない（明転後にonDone）
    this.time.delayedCall(600, onDone); // 背景切替後に次へ
  } else {
    this.textBox.setText(line);
    this.input.keyboard.once('keydown-SPACE', onDone);
  }
}

  showNextLine() {
  const lines = this.storyData.commonLines;
  if (this.currentLineIndex < lines.length) {
    const line = lines[this.currentLineIndex];
    this.currentLineIndex++;
    this.processLine(line, () => this.showNextLine());
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
    this.canChangePersonality = true;
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
    this.canChangePersonality = false;
    this.showResult(resultLines);
  }

  showResult(lines) {
  let i = 0;
  const nextLine = () => {
    if (i < lines.length) {
      this.processLine(lines[i], nextLine);
      i++;
    } else {
      if (this.chapterIndex >= 5) {
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
    if (logicTotal > impulseTotal) return logic_1 > logic_2 ? 'logic_bad' : 'logic_good';
    if (impulseTotal > logicTotal) return impulse_1 > impulse_2 ? 'impulse_bad' : 'impulse_good';
    return logic_2 > impulse_2 ? 'logic_good' : 'impulse_good';
  }

  setPersonality(type) {
    if (!this.canChangePersonality) return;
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
