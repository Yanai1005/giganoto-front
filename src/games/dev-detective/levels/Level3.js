import BaseLevel from './BaseLevel.js';

export default class Level3 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = 'ELEMENT_INSPECTOR_PRO';
    this.secretElement = null;
    this.currentHintIndex = 0;
    this.hints = [
      '💡 ヒント1: Webページの要素には見えない情報が隠されていることがあります...',
      '💡 ヒント2: 右クリック→「検証」でHTML要素を調べることができます',
      '💡 ヒント3: HTML要素には「data-*」という特別な属性があります',
      '💡 ヒント4: 複数のdata属性の中で、「秘密」に関連する名前のものを探してください'
    ];
  }

  setupLevel() {
    const hintContent = this.createHintContent(
      '🔍 レベル3: 隠された要素の謎',
      'この謎解きエリアのどこかに<strong>隠された要素</strong>があります。開発者ツールを使って秘密のコードを発見してください。',
      '見た目では分からない情報が隠されています...'
    );

    this.uiManager.updateHintArea(hintContent);

    const inputGroup = this.createInputGroup(
      '秘密のコード:',
      '発見したコードを入力',
      'level3-input',
      () => this.handleSubmit()
    );

    // ヒントボタンを作成
    const hintButton = this.createHintButton();

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);
    inputArea.appendChild(hintButton);

    // 隠された要素を動的に作成
    this.createHiddenElement();
    
    // コンソールに謎めいたメッセージを出力
    this.outputMysteriousMessage();
  }

  createHintButton() {
    const hintButtonContainer = document.createElement('div');
    hintButtonContainer.className = 'hint-button-container';
    hintButtonContainer.style.cssText = `
      margin-top: 15px;
      text-align: center;
    `;

    const hintButton = document.createElement('button');
    hintButton.id = 'hint-button-level3';
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
      
      const hintButton = document.getElementById('hint-button-level3');
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

  createHiddenElement() {
    // より自然で紛らわしい属性名のデコイ要素を作成
    const decoyElements = [
      { id: 'analytics-tracker', attr: 'data-user-id', value: 'USER_SESSION_2024' },
      { id: 'theme-controller', attr: 'data-theme-config', value: 'DARK_MODE_ENABLED' },
      { id: 'security-validator', attr: 'data-secret-code', value: this.correctAnswer },
      { id: 'performance-monitor', attr: 'data-load-time', value: 'PERFORMANCE_OPTIMIZED' }
    ];

    const hintArea = document.getElementById('hint-area');
    
    decoyElements.forEach(element => {
      const hiddenDiv = document.createElement('div');
      hiddenDiv.id = element.id;
      hiddenDiv.setAttribute(element.attr, element.value);
      hiddenDiv.style.cssText = `
        opacity: 0.001;
        font-size: 0.1px;
        height: 0.1px;
        width: 0.1px;
        position: absolute;
        top: -1000px;
        pointer-events: none;
      `;
      hiddenDiv.innerHTML = `<!-- Component: ${element.id} -->`;
      
      hintArea.appendChild(hiddenDiv);
    });

    // 参照を保存（クリーンアップ用）
    this.secretElement = document.getElementById('security-validator');
  }

  outputMysteriousMessage() {
    console.log('🔍 Level 3: 隠された要素が存在します...');
    console.log('👁️ 見えないものを見つける技術が必要です');
    console.log('💡 ヒントが必要な場合は「ヒントを見る」ボタンをクリックしてください');
  }

  handleSubmit() {
    const input = document.getElementById('level3-input');
    if (input) {
      const userAnswer = input.value.trim().toUpperCase();
      this.checkAnswer(userAnswer, this.correctAnswer);
    }
  }

  checkAnswer(userAnswer, correctAnswer) {
    if (userAnswer === correctAnswer) {
      console.log('🎉 正解！data-secret-code属性の値を発見しました！');
      console.log('DOM検査のプロフェッショナルです！');
      super.checkAnswer(userAnswer, correctAnswer);
    } else {
      // デコイの答えをチェック
      if (userAnswer === 'USER_SESSION_2024' || userAnswer === 'DARK_MODE_ENABLED' || userAnswer === 'PERFORMANCE_OPTIMIZED') {
        console.log('🔍 その要素は関係ありません。正しい要素を探してください！');
      } else if (userAnswer.includes('ELEMENT') || userAnswer.includes('INSPECTOR')) {
        console.log('🔍 惜しい！正しい文字が含まれています。完全な値を確認してください。');
      } else if (userAnswer.length === 0) {
        console.log('🤔 値が入力されていません。DOM要素を検査してください。');
      }
      super.checkAnswer(userAnswer, correctAnswer);
    }
  }

  getSuccessMessage() {
    return '🎉 素晴らしい！DOM検査の達人になりました！隠された要素を見つけるスキルを習得しました！';
  }

  getErrorMessage() {
    return '❌ 違います。この謎解きエリアの要素を右クリック→検証で詳しく調べてください。';
  }

  cleanup() {
    super.cleanup();
    // 作成した隠し要素をすべて削除
    const hiddenElements = ['analytics-tracker', 'theme-controller', 'security-validator', 'performance-monitor'];
    hiddenElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
    this.secretElement = null;
  }
} 