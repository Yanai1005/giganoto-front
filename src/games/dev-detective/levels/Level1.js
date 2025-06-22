import BaseLevel from './BaseLevel.js';

export default class Level1 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = 'DEBUG';
    this.currentHintIndex = 0;
    this.hints = [
      '💡 ヒント1: 数字は何かの位置を表しているようです...',
      '💡 ヒント2: アルファベットの順番と関係があるかもしれません（A=1, B=2...）',
      '💡 ヒント3: 4番目の文字は何でしょうか？ 21番目の文字は？',
      '💡 ヒント4: 開発者が使う重要な機能の名前です'
    ];
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

    // ヒントボタンを作成
    const hintButton = this.createHintButton();

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);
    inputArea.appendChild(hintButton);

    // 暗号化されたエラーメッセージを出力
    this.outputEncryptedError();
  }

  createHintButton() {
    const hintButtonContainer = document.createElement('div');
    hintButtonContainer.className = 'hint-button-container';
    hintButtonContainer.style.cssText = `
      margin-top: 15px;
      text-align: center;
    `;

    const hintButton = document.createElement('button');
    hintButton.id = 'hint-button';
    hintButton.textContent = `💡 ヒントを見る (${this.currentHintIndex}/${this.hints.length})`;
    hintButton.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    `;

    hintButton.addEventListener('mouseenter', () => {
      hintButton.style.transform = 'translateY(-2px)';
      hintButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    });

    hintButton.addEventListener('mouseleave', () => {
      hintButton.style.transform = 'translateY(0)';
      hintButton.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
    });

    hintButton.addEventListener('click', () => this.showNextHint());

    hintButtonContainer.appendChild(hintButton);
    return hintButtonContainer;
  }

  showNextHint() {
    if (this.currentHintIndex < this.hints.length) {
      console.log(this.hints[this.currentHintIndex]);
      this.currentHintIndex++;
      
      const hintButton = document.getElementById('hint-button');
      if (hintButton) {
        if (this.currentHintIndex >= this.hints.length) {
          hintButton.textContent = '💡 全てのヒントを表示済み';
          hintButton.disabled = true;
          hintButton.style.opacity = '0.6';
          hintButton.style.cursor = 'not-allowed';
        } else {
          hintButton.textContent = `💡 ヒントを見る (${this.currentHintIndex}/${this.hints.length})`;
        }
      }
    }
  }

  outputEncryptedError() {
    console.error('🚨 システムエラー: 4-5-2-21-7');
    console.log('Error Code: CIPHER_UNKNOWN');
    console.log('Status: ENCRYPTED_MESSAGE_DETECTED');
    console.log('解読が必要です...');
    console.log('💡 ヒントが必要な場合は「ヒントを見る」ボタンをクリックしてください');
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
    // ヒントボタンのクリーンアップは親クラスで処理される
    super.cleanup();
  }
} 