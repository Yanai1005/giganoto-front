import Phaser from 'phaser';

let rationalScore = 0;
let instinctScore = 0;
let neutralScore = 0;
let previousSoul = null;

class ScenarioGame extends Phaser.Scene {
  constructor() {
    super('ScenarioGame');
    this.dialogIndex = 0;
    this.currentSoul = 'logic'; // 'logic' or 'impulse'
    this.choiceButtons = [];
  }

  preload() {}

  create() {
    this.dialog = [
      { text: "……目が覚めたか？", soul: "logic" },
      { text: "今日は授業がある日だったはずだ。", soul: "logic" },
      {
        text: "どう動く？",
        soul: "logic",
        isChoice: true,
        choices: {
          logic: [
            { text: "計画通りに準備する", value: +1 },
            { text: "朝食をとってから行動する", value: +1 }
          ],
          impulse: [
            { text: "スマホでSNSチェック", value: +1 },
            { text: "二度寝する", value: +1 }
          ]
        }
      },
      { text: "次の展開へ進む……", soul: "impulse" }
    ];

    this.dialogText = this.add.text(100, 400, '', {
      font: '20px sans-serif',
      wordWrap: { width: 600 }
    });

    this.soulText = this.add.text(100, 360, '', {
      font: '16px sans-serif',
      color: '#999'
    });

    this.modeText = this.add.text(600, 20, '', {
      font: '14px sans-serif',
      color: '#00f'
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      this.nextLine();
    });

    this.input.keyboard.on('keydown-Q', () => {
      this.currentSoul = this.currentSoul === 'logic' ? 'impulse' : 'logic';
      this.updateSoulIndicator();
      const line = this.dialog[this.dialogIndex];
      if (line?.isChoice) this.showChoices(line.choices);
    });

    this.nextLine();
    this.updateSoulIndicator();
  }

  nextLine() {
    this.choiceButtons.forEach(btn => btn.destroy());
    this.choiceButtons = [];

    if (this.dialogIndex < this.dialog.length) {
      const line = this.dialog[this.dialogIndex];
      this.dialogText.setText(`${line.text}`);
      this.soulText.setText(`【${line.soul === 'logic' ? '理性' : '衝動'}の声】`);

      if (line.isChoice) {
        this.showChoices(line.choices);
      } else {
        this.dialogIndex++;
      }
    } else {
      const endingKey = this.evaluateEnding();
      this.scene.start('EndScene', { endingKey });
    }
  }

  showChoices(choices) {
    const selectedSet = this.currentSoul === 'logic' ? choices.logic : choices.impulse;

    selectedSet.forEach((choice, index) => {
      const btn = this.add.text(620, 50 + index * 40, `[${choice.text}]`, {
        font: '16px sans-serif',
        backgroundColor: '#333',
        padding: { x: 6, y: 4 },
        color: '#fff'
      })
      .setInteractive()
      .on('pointerdown', () => {
        if (this.currentSoul === 'logic') rationalScore += choice.value;
        else instinctScore += choice.value;

        if (previousSoul && previousSoul !== this.currentSoul) neutralScore += 1;
        previousSoul = this.currentSoul;

        this.choiceButtons.forEach(btn => btn.destroy());
        this.choiceButtons = [];
        this.dialogIndex++;
        this.nextLine();
      });

      this.choiceButtons.push(btn);
    });
  }

  updateSoulIndicator() {
    const label = this.currentSoul === 'logic' ? '理性モード' : '衝動モード';
    this.modeText.setText(label);
  }

  evaluateEnding() {
    if (rationalScore >= 7 && instinctScore <= 3) {
      return neutralScore >= 3 ? 'rational-happy' : 'rational-bad';
    } else if (instinctScore >= 7 && rationalScore <= 3) {
      return neutralScore >= 3 ? 'instinct-happy' : 'instinct-bad';
    } else if (rationalScore >= 4 && instinctScore >= 4) {
      return neutralScore >= 3 ? 'balanced-happy' : 'balanced-bad';
    } else {
      return 'unknown';
    }
  }
}

export default ScenarioGame;
