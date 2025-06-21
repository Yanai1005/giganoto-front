import BaseLevel from './BaseLevel.js';

export default class Level1 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = 'DEBUG';
    this.hintStep = 0;
    this.hintTimer = null;
    this.maxHints = 4;
  }

  setupLevel() {
    const hintContent = this.createHintContent(
      '🎯 レベル1: 暗号解読チャレンジ',
      'システムエラーが発生しました。開発者ツール（F12）を開いてコンソールを確認し、<strong>暗号化されたメッセージ</strong>を解読してください。',
      '数字の羅列には意味があります...'
    );

    this.uiManager.updateHintArea(hintContent);

    const inputGroup = this.createInputGroup(
      'デコード結果:',
      '解読した文字列を入力',
      'level1-input',
      () => this.handleSubmit()
    );

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);

    // 暗号化されたエラーメッセージを出力
    this.outputEncryptedError();
    
    // 段階的ヒントを開始
    this.startProgressiveHints();
  }

  outputEncryptedError() {
    console.error('🚨 システムエラー: 4-5-2-21-7');
    console.log('Error Code: CIPHER_UNKNOWN');
    console.log('Status: ENCRYPTED_MESSAGE_DETECTED');
    console.log('解読が必要です...');
  }

  startProgressiveHints() {
    this.hintStep = 0;
    this.hintTimer = setInterval(() => {
      this.showProgressiveHint();
    }, 8000); // 8秒ごとにヒント
  }

  showProgressiveHint() {
    const hints = [
      '💡 ヒント1: 数字は何かの位置を表しているようです...',
      '💡 ヒント2: アルファベットの順番と関係があるかもしれません（A=1, B=2...）',
      '💡 ヒント3: 4番目の文字は何でしょうか？ 21番目の文字は？',
      '💡 ヒント4: 開発者が使う重要な機能の名前です'
    ];

    if (this.hintStep < this.maxHints) {
      console.log(hints[this.hintStep]);
      this.hintStep++;
    } else {
      this.clearHintTimer();
    }
  }

  clearHintTimer() {
    if (this.hintTimer) {
      clearInterval(this.hintTimer);
      this.hintTimer = null;
    }
  }

  handleSubmit() {
    const input = document.getElementById('level1-input');
    if (input) {
      const userAnswer = input.value.trim().toUpperCase();
      this.checkAnswer(userAnswer, this.correctAnswer);
    }
  }

  checkAnswer(userAnswer, correctAnswer) {
    if (userAnswer === correctAnswer) {
      this.clearHintTimer();
      console.log('🎉 正解！ 4-5-2-21-7 = D-E-B-U-G = DEBUG');
      console.log('暗号解読完了！開発者ツールの基本機能「DEBUG」でした！');
      super.checkAnswer(userAnswer, correctAnswer);
    } else {
      // 部分的な正解チェック
      if (userAnswer.includes('D') || userAnswer.includes('E') || userAnswer.includes('B') || userAnswer.includes('U') || userAnswer.includes('G')) {
        console.log('🔍 惜しい！正しい文字が含まれています。もう一度確認してください。');
      } else if (userAnswer.match(/^\d+$/)) {
        console.log('🤔 数字のままではありません。何に変換する必要があるでしょうか？');
      }
      super.checkAnswer(userAnswer, correctAnswer);
    }
  }

  getSuccessMessage() {
    return '🎉 素晴らしい暗号解読スキルです！開発者の基本ツール「DEBUG」を発見しました！';
  }

  getErrorMessage() {
    return '❌ 暗号解読に失敗しました。コンソールのエラーメッセージとヒントを確認してください。';
  }

  cleanup() {
    this.clearHintTimer();
    super.cleanup();
  }
} 