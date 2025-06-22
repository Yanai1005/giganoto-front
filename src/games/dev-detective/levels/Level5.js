import BaseLevel from './BaseLevel.js';

export default class Level5 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = 'MASTER42DETECTIVE007';
    this.finalSecretElement = null;
    this.currentHintIndex = 0;
    this.hints = [
      '💡 ヒント1: 今までのレベルで学んだすべての技術が必要です...',
      '💡 ヒント2: 複数の場所に散らばった手がかりを収集してください',
      '💡 ヒント3: ストレージ、DOM、CSSの3つの領域を調査してください',
      '💡 ヒント4: 手がかりを正しい順序で組み合わせることが重要です'
    ];
  }

  setupLevel() {
    const hintContent = this.createHintContent(
      '🏆 最終レベル: マスター探偵への道',
      'これまでに習得したすべてのスキルを駆使して、<strong>最終暗号</strong>を解読してください。',
      '複数の手がかりが様々な場所に隠されています...'
    );

    this.uiManager.updateHintArea(hintContent);

    const inputGroup = this.createInputGroup(
      '最終暗号:',
      '解読した暗号を入力',
      'level5-input',
      () => this.handleSubmit()
    );

    // ヒントボタンを作成
    const hintButton = this.createHintButton();

    // 手がかり発見ボタンを作成
    const discoverButton = this.createDiscoverButton();

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);
    inputArea.appendChild(hintButton);
    inputArea.appendChild(discoverButton);

    // 隠された要素と手がかりを設定
    this.setupFinalChallenge();
    
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
    hintButton.id = 'hint-button-level5';
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
      margin-right: 10px;
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

  createDiscoverButton() {
    const discoverButtonContainer = document.createElement('div');
    discoverButtonContainer.className = 'discover-button-container';
    discoverButtonContainer.style.cssText = `
      margin-top: 15px;
      text-align: center;
    `;

    const discoverButton = document.createElement('button');
    discoverButton.id = 'discover-clues';
    discoverButton.textContent = '🔍 手がかりを探索する';
    discoverButton.style.cssText = `
      background: linear-gradient(135deg, #FFA726 0%, #FF7043 100%);
      color: white;
      border: none;
      padding: 12px 25px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 167, 38, 0.3);
    `;

    discoverButton.addEventListener('mouseenter', () => {
      discoverButton.style.transform = 'translateY(-2px)';
      discoverButton.style.boxShadow = '0 6px 20px rgba(255, 167, 38, 0.4)';
    });

    discoverButton.addEventListener('mouseleave', () => {
      discoverButton.style.transform = 'translateY(0)';
      discoverButton.style.boxShadow = '0 4px 15px rgba(255, 167, 38, 0.3)';
    });

    discoverButton.addEventListener('click', () => this.activateClueDiscovery());

    discoverButtonContainer.appendChild(discoverButton);
    return discoverButtonContainer;
  }

  showNextHint() {
    if (this.currentHintIndex < this.hints.length) {
      console.log(this.hints[this.currentHintIndex]);
      this.currentHintIndex++;
      
      const hintButton = document.getElementById('hint-button-level5');
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

  setupFinalChallenge() {
    // LocalStorageに手がかりを設定
    localStorage.setItem('master_fragment', 'MASTER');
    
    // SessionStorageに手がかりを設定
    sessionStorage.setItem('cipher_key', '42');
    
    // 隠しDOM要素を作成
    this.createHiddenElements();
  }

  createHiddenElements() {
    const hintArea = document.getElementById('hint-area');
    
    // 複数の隠し要素を作成（デコイ含む）
    const hiddenElements = [
      { id: 'tracker-element', style: 'color: #123; opacity: 0.001;', content: 'tracking data' },
      { id: 'config-element', style: 'color: #456; opacity: 0.001;', content: 'configuration' },
      { id: 'detective-element', style: 'color: #DETECTIVE; opacity: 0.001;', content: 'detective code' },
      { id: 'security-element', style: 'color: #007; opacity: 0.001;', content: 'security token' }
    ];

    hiddenElements.forEach(element => {
      const hiddenDiv = document.createElement('div');
      hiddenDiv.id = element.id;
      hiddenDiv.style.cssText = `
        ${element.style}
        font-size: 0.1px;
        height: 0.1px;
        width: 0.1px;
        position: absolute;
        top: -1000px;
        pointer-events: none;
      `;
      hiddenDiv.innerHTML = `<!-- ${element.content} -->`;
      
      hintArea.appendChild(hiddenDiv);
    });

    // 参照を保存
    this.finalSecretElement = document.getElementById('detective-element');
  }

  activateClueDiscovery() {
    console.log('🔍 手がかり探索を開始します...');
    console.log('');
    console.log('📊 探索領域:');
    console.log('• ブラウザストレージ（Local & Session）');
    console.log('• DOM要素の隠された属性');
    console.log('• CSS スタイルプロパティ');
    console.log('');
    console.log('🕵️ 各領域から重要な手がかりを収集してください');
    console.log('💡 手がかりは特定の順序で組み合わせる必要があります');
  }

  outputMysteriousMessage() {
    console.log('🏆 Level 5: 最終暗号の解読が必要です...');
    console.log('🧩 これまでのすべてのスキルを結集してください');
    console.log('💡 ヒントが必要な場合は「ヒントを見る」ボタンをクリックしてください');
  }

  handleSubmit() {
    const input = document.getElementById('level5-input');
    if (input) {
      const userAnswer = input.value.trim().toUpperCase();
      this.checkAnswer(userAnswer, this.correctAnswer);
    }
  }

  checkAnswer(userAnswer, correctAnswer) {
    if (userAnswer === correctAnswer) {
      console.log('🎉 正解！最終暗号を完全に解読しました！');
      console.log('🏆 あなたは真のDeveloper Detectiveマスターです！');
      super.checkAnswer(userAnswer, correctAnswer);
    } else {
      // 部分的な手がかりをチェック
      if (userAnswer.includes('MASTER') && userAnswer.includes('42') && userAnswer.includes('DETECTIVE')) {
        console.log('🔍 すべての手がかりが含まれていますが、順序が違うかもしれません！');
      } else if (userAnswer.includes('MASTER') || userAnswer.includes('DETECTIVE')) {
        console.log('🔍 正しい手がかりが含まれています。他の手がかりも探してください！');
      } else if (userAnswer.includes('42')) {
        console.log('🔍 数字の手がかりを発見しましたね。他の文字列も必要です！');
      } else if (userAnswer.length === 0) {
        console.log('🤔 値が入力されていません。手がかり探索ボタンを使って調査してください。');
      }
      super.checkAnswer(userAnswer, correctAnswer);
    }
  }

  getSuccessMessage() {
    return '🎉 完全制覇！あなたは真のDeveloper Detectiveマスターになりました！すべての開発者ツールを使いこなすスキルを習得しました！';
  }

  getErrorMessage() {
    return '❌ 最終暗号が違います。すべての手がかりを収集し、正しい順序で組み合わせてください。';
  }

  cleanup() {
    super.cleanup();
    // 最終レベルの手がかりをクリーンアップ
    localStorage.removeItem('master_fragment');
    sessionStorage.removeItem('cipher_key');
    
    // 隠し要素を削除
    const hiddenElements = ['tracker-element', 'config-element', 'detective-element', 'security-element'];
    hiddenElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
    
    this.finalSecretElement = null;
  }
} 