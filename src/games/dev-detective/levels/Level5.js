import BaseLevel from './BaseLevel.js';

export default class Level5 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = "HACK'Z_HACKATHON_GIGANOTO_2025";
    this.finalSecretElement = null;
    this.currentHintIndex = 0;
    this.hints = [
      '💡 ヒント1: このハッカソンイベントに関連する重要な情報が隠されています...',
      '💡 ヒント2: イベント名、開催年、そして特別なコードが様々な場所に散らばっています',
      '💡 ヒント3: ストレージ、DOM、CSSの3つの領域を調査してください',
      '💡 ヒント4: 手がかりをアンダースコアで繋げて完全なイベント識別子を作成してください'
    ];
  }

  setupLevel() {
    const hintContent = this.createHintContent(
      '🏆 最終レベル: ハッカソンマスター',
      'このハッカソンイベントの<strong>完全な識別子</strong>を解読してください。',
      'イベント情報が複数の場所に分散して隠されています...'
    );

    this.uiManager.updateHintArea(hintContent);

    const inputGroup = this.createInputGroup(
      'イベント識別子:',
      '完全な識別子を入力',
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
    localStorage.setItem('hackathon_event', "HACK'Z");
    localStorage.setItem('event_type', 'HACKATHON');
    
    // SessionStorageに手がかりを設定
    sessionStorage.setItem('project_name', 'GIGANOTO');
    sessionStorage.setItem('event_year', '2025');
    
    // 隠しDOM要素を作成
    this.createHiddenElements();
  }

  createHiddenElements() {
    const hintArea = document.getElementById('hint-area');
    
    // 複数の隠し要素を作成（デコイ含む）
    const hiddenElements = [
      { id: 'analytics-element', style: 'color: #ANALYTICS; opacity: 0.001;', content: 'analytics tracking' },
      { id: 'config-element', style: 'color: #CONFIG; opacity: 0.001;', content: 'configuration data' },
      { id: 'event-element', style: 'color: #EVENT2024; opacity: 0.001;', content: 'event information' },
      { id: 'project-element', style: 'color: #PROJECT; opacity: 0.001;', content: 'project details' }
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
    this.finalSecretElement = document.getElementById('event-element');
  }

  activateClueDiscovery() {
    console.log('🔍 ハッカソンイベント情報の探索を開始します...');
    console.log('');
    console.log('📊 探索領域:');
    console.log('• ブラウザストレージ（Local & Session）');
    console.log('• DOM要素の隠された属性');
    console.log('• CSS スタイルプロパティ');
    console.log('');
    console.log('🏆 このハッカソンイベントの完全な識別子を構築してください');
    console.log('💡 各部分をアンダースコアで繋げる必要があります');
  }

  outputMysteriousMessage() {
    console.log('🏆 Level 5: ハッカソンイベントの完全な識別子が必要です...');
    console.log('🎯 このイベントに関する重要な情報を収集してください');
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
      console.log('🎉 正解！ハッカソンイベントの完全な識別子を解読しました！');
      console.log('🏆 HACK\'Z HACKATHON GIGANOTO 2025 - 完全制覇おめでとうございます！');
      super.checkAnswer(userAnswer, correctAnswer);
    } else {
      // 部分的な手がかりをチェック
      if (userAnswer.includes("HACK'Z") && userAnswer.includes('HACKATHON') && userAnswer.includes('GIGANOTO') && userAnswer.includes('2025')) {
        console.log('🔍 すべての要素が含まれていますが、形式が違うかもしれません！');
      } else if (userAnswer.includes("HACK'Z") || userAnswer.includes('HACKATHON')) {
        console.log('🔍 イベント名の一部を発見しました。他の要素も探してください！');
      } else if (userAnswer.includes('GIGANOTO')) {
        console.log('🔍 プロジェクト名を発見しましたね。他の情報も必要です！');
      } else if (userAnswer.includes('2025')) {
        console.log('🔍 開催年を発見しました。他の要素も収集してください！');
      } else if (userAnswer.length === 0) {
        console.log('🤔 値が入力されていません。手がかり探索ボタンを使って調査してください。');
      }
      super.checkAnswer(userAnswer, correctAnswer);
    }
  }

  getSuccessMessage() {
    return '🎉 HACK\'Z HACKATHON GIGANOTO 2025 完全制覇！あなたは真のハッカソンマスターになりました！すべての開発者ツールを使いこなすスキルを習得しました！';
  }

  getErrorMessage() {
    return '❌ イベント識別子が違います。すべてのハッカソン情報を収集し、正しい形式で組み合わせてください。';
  }

  cleanup() {
    super.cleanup();
    // 最終レベルの手がかりをクリーンアップ
    localStorage.removeItem('hackathon_event');
    localStorage.removeItem('event_type');
    sessionStorage.removeItem('project_name');
    sessionStorage.removeItem('event_year');
    
    // 隠し要素を削除
    const hiddenElements = ['analytics-element', 'config-element', 'event-element', 'project-element'];
    hiddenElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
    
    this.finalSecretElement = null;
  }
} 