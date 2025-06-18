import Phaser from 'phaser';

// スコア（後で別のファイルに分離する予定）
let rationalScore = 0;
let instinctScore = 0;
let neutralScore = 0; 

class ScenarioGame extends Phaser.Scene {
  constructor() {
    super('ScenarioGame');
    this.dialogIndex = 0;
    this.currentSoul = 'logic'; // 'logic' or 'impulse'
    this.choiceButtons = [];
  }

  preload() {}

  create() {
    // セリフ (セリフは後でほとんど修正)
    this.dialog = [
      { text: "ふぁ……ん？もうこんな時間か。", soul: "logic" },
      { text: "今日は授業がある日だったはずだ。", soul: "logic" },
      {
        text: "どう動く？",
        soul: "logic",
        isChoice: true,
        choices: {
          logic: [
            { text: "いつも通りに準備する", value: +1 },
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

    // セリフ表示用テキスト
    this.dialogText = this.add.text(100, 400, '', {
      font: '20px sans-serif',
      wordWrap: { width: 600 }
    });

    // 表人格ラベル
    this.soulText = this.add.text(100, 360, '', {
      font: '16px sans-serif',
      color: '#999'
    });

    // 現在の人格表示（右上）
    this.modeText = this.add.text(600, 20, '', {
      font: '14px sans-serif',
      color: '#00f'
    });

    // スペース入力で次へ
    this.input.keyboard.on('keydown-SPACE', () => {
      this.nextLine();
    });

    // Qキーで人格切替
    this.input.keyboard.on('keydown-Q', () => {
      this.currentSoul = this.currentSoul === 'logic' ? 'impulse' : 'logic';
      this.updateSoulIndicator();
      // 選択肢表示中なら更新
      const currentLine = this.dialog[this.dialogIndex];
      if (currentLine?.isChoice) {
        this.showChoices(currentLine.choices);
      }
    });

    this.nextLine(); // 最初のセリフ表示
    this.updateSoulIndicator(); // 人格表示
  }

  nextLine() {
    // 選択肢削除
    this.choiceButtons.forEach(btn => btn.destroy());
    this.choiceButtons = [];

    if (this.dialogIndex < this.dialog.length) {
      const line = this.dialog[this.dialogIndex];
      this.dialogText.setText(`${line.text}`);
      this.soulText.setText(`【${line.soul === 'logic' ? '理性' : '衝動'}の声】`);

      // 選択肢シーンかどうか
      if (line.isChoice) {
        this.showChoices(line.choices);
        // ※ dialogIndex は選択後に進める
      } else {
        this.dialogIndex++;
      }
    } else {
      const endingKey = this.evaluateEnding();
      this.scene.start('EndScene', { endingKey });
    }
    
  }

  showChoices(choices) {
    // 現在の人格に応じて選択肢を表示（基本、各人格につき２つ選択肢がある）
    const selectedSet = this.currentSoul === 'logic' ? choices.logic : choices.impulse;

    // 画面右上に配置
    selectedSet.forEach((choice, index) => {
      const btn = this.add.text(620, 50 + index * 40, `[${choice.text}]`, {
        font: '16px sans-serif',
        backgroundColor: '#333',
        padding: { x: 6, y: 4 },
        color: '#fff'
      })
      .setInteractive()
      .on('pointerdown', () => {
        // スコア加算 (スコアはエンディング分岐の判定で使用)
        if (this.currentSoul === 'logic') rationalScore += choice.value;
        else instinctScore += choice.value;

        // 選択肢削除＆次の行へ
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

  //各ルートのエンディング判定（ハッピーエンド,バットエンド）
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
