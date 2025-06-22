import BaseLevel from './BaseLevel.js';

export default class Level2 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = 'STORAGE_MASTER_2024';
    this.currentHintIndex = 0;
    this.hints = [
      '💡 ヒント1: ブラウザにはWebページのデータを保存する仕組みがあります...',
      '💡 ヒント2: コンソールで "localStorage" と入力してオブジェクトを確認してください',
      '💡 ヒント3: Object.keys(localStorage) で保存されているキーの一覧を見ることができます',
      '💡 ヒント4: "detective_code" というキーの値を localStorage.detective_code で取得してください'
    ];
  }

  setupLevel() {
    const hintContent = this.createHintContent(
      '🗄️ レベル2: JavaScriptストレージマスター',
      'LocalStorageにデータが保存されました。<strong>コンソール</strong>でJavaScript APIを使ってデータを取得してください。',
      'localStorage オブジェクトを使ってデータにアクセスしましょう'
    );

    this.uiManager.updateHintArea(hintContent);

    const inputGroup = this.createInputGroup(
      'ストレージの値:',
      '取得した値を入力',
      'level2-input',
      () => this.handleSubmit()
    );

    // ヒントボタンを作成
    const hintButton = this.createHintButton();

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);
    inputArea.appendChild(hintButton);

    // LocalStorageにデータを設定してコンソールに説明を出力
    this.setupStorageData();
  }

  createHintButton() {
    const hintButtonContainer = document.createElement('div');
    hintButtonContainer.className = 'hint-button-container';
    hintButtonContainer.style.cssText = `
      margin-top: 15px;
      text-align: center;
    `;

    const hintButton = document.createElement('button');
    hintButton.id = 'hint-button-level2';
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
      
      const hintButton = document.getElementById('hint-button-level2');
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

  setupStorageData() {
    // LocalStorageにデータを設定
    localStorage.setItem('detective_code', this.correctAnswer);
    localStorage.setItem('user_progress', 'level_2_active');
    localStorage.setItem('debug_mode', 'enabled');
    
    // シンプルなコンソール出力
    console.log('🗄️ Level 2: LocalStorageにデータが保存されました');
    console.log('💡 ヒントが必要な場合は「ヒントを見る」ボタンをクリックしてください');
  }

  handleSubmit() {
    const input = document.getElementById('level2-input');
    if (input) {
      const userAnswer = input.value.trim();
      this.checkAnswer(userAnswer, this.correctAnswer);
    }
  }

  checkAnswer(userAnswer, correctAnswer) {
    if (userAnswer === correctAnswer) {
      console.log('🎉 正解！ localStorage.detective_code の値を正しく取得しました！');
      console.log('JavaScriptのLocalStorage APIをマスターしました！');
      super.checkAnswer(userAnswer, correctAnswer);
    } else {
      // 部分的なヒント
      if (userAnswer.includes('STORAGE') || userAnswer.includes('MASTER')) {
        console.log('🔍 惜しい！正しい文字列が含まれています。完全な値を確認してください。');
      } else if (userAnswer.length === 0) {
        console.log('🤔 値が入力されていません。コンソールでLocalStorageを確認してください。');
      }
      super.checkAnswer(userAnswer, correctAnswer);
    }
  }

  getSuccessMessage() {
    return '🎉 素晴らしい！JavaScriptのLocalStorage APIを使いこなしました！';
  }

  getErrorMessage() {
    return '❌ 値が違います。コンソールでlocalStorageオブジェクトを確認してください。';
  }

  cleanup() {
    // Level2のLocalStorageデータをクリーンアップ
    localStorage.removeItem('detective_code');
    localStorage.removeItem('user_progress');
    localStorage.removeItem('debug_mode');
    super.cleanup();
  }
} 