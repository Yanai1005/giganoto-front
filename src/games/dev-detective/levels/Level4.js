import BaseLevel from './BaseLevel.js';

export default class Level4 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = 'NETWORK_DETECTIVE_MASTER';
    this.networkButton = null;
    this.currentHintIndex = 0;
    this.hints = [
      '💡 ヒント1: Webページは見えないところで様々な通信を行っています...',
      '💡 ヒント2: 開発者ツールの「Network」タブでHTTPリクエストを監視できます',
      '💡 ヒント3: HTTPリクエストには「ヘッダー」という追加情報が含まれています',
      '💡 ヒント4: カスタムヘッダーは「X-」で始まることが多く、特別な情報を含みます'
    ];
  }

  setupLevel() {
    const hintContent = this.createHintContent(
      '🌐 レベル4: 通信の秘密を暴け',
      'この謎解きエリアでは<strong>隠された通信</strong>が行われています。ネットワーク分析ツールを使って秘密の情報を発見してください。',
      '見えない通信の中に答えが隠されています...'
    );

    this.uiManager.updateHintArea(hintContent);

    const inputGroup = this.createInputGroup(
      '秘密のコード:',
      '発見したコードを入力',
      'level4-input',
      () => this.handleSubmit()
    );

    // ヒントボタンを作成
    const hintButton = this.createHintButton();

    // ネットワークトリガーボタンを作成
    const networkButton = this.createNetworkButton();

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);
    inputArea.appendChild(hintButton);
    inputArea.appendChild(networkButton);

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
    hintButton.id = 'hint-button-level4';
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

  createNetworkButton() {
    const networkButtonContainer = document.createElement('div');
    networkButtonContainer.className = 'network-button-container';
    networkButtonContainer.style.cssText = `
      margin-top: 15px;
      text-align: center;
    `;

    const networkButton = document.createElement('button');
    networkButton.id = 'network-trigger';
    networkButton.textContent = '🔍 通信を開始する';
    networkButton.style.cssText = `
      background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
      color: white;
      border: none;
      padding: 12px 25px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
    `;

    networkButton.addEventListener('mouseenter', () => {
      networkButton.style.transform = 'translateY(-2px)';
      networkButton.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
    });

    networkButton.addEventListener('mouseleave', () => {
      networkButton.style.transform = 'translateY(0)';
      networkButton.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
    });

    networkButton.addEventListener('click', () => this.triggerNetworkRequest());

    networkButtonContainer.appendChild(networkButton);
    this.networkButton = networkButton;
    return networkButtonContainer;
  }

  showNextHint() {
    if (this.currentHintIndex < this.hints.length) {
      console.log(this.hints[this.currentHintIndex]);
      this.currentHintIndex++;
      
      const hintButton = document.getElementById('hint-button-level4');
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

  outputMysteriousMessage() {
    console.log('🌐 Level 4: 隠された通信が検出されました...');
    console.log('📡 ネットワーク分析が必要です');
    console.log('💡 ヒントが必要な場合は「ヒントを見る」ボタンをクリックしてください');
  }

  triggerNetworkRequest() {
    console.log('📡 通信を開始します...');
    console.log('🔍 Networkタブを開いてリクエストを監視してください');
    
    // 複数のダミーリクエストを送信して難易度を上げる
    const requests = [
      {
        endpoint: '/api/analytics',
        headers: { 'X-Analytics-ID': 'TRACKING_DATA_2024' }
      },
      {
        endpoint: '/api/auth',
        headers: { 'X-Auth-Token': 'SESSION_TOKEN_INVALID' }
      },
      {
        endpoint: '/api/detective-challenge',
        headers: { 'X-Detective-Code': this.correctAnswer }
      },
      {
        endpoint: '/api/metrics',
        headers: { 'X-Performance': 'METRICS_COLLECTED' }
      }
    ];

    // 順番に送信
    requests.forEach((request, index) => {
      setTimeout(() => {
        fetch(request.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...request.headers
          },
          body: JSON.stringify({ level: 4, request: index + 1 })
        }).catch(() => {
          // エラーは無視（目的はNetworkタブでヘッダーを見ることなので）
        });
      }, index * 200); // 200ms間隔で送信
    });

    setTimeout(() => {
      console.log('📊 通信完了。複数のリクエストが送信されました');
      console.log('🕵️ どのリクエストが重要な情報を含んでいるでしょうか？');
    }, 1000);
  }

  handleSubmit() {
    const input = document.getElementById('level4-input');
    if (input) {
      const userAnswer = input.value.trim().toUpperCase();
      this.checkAnswer(userAnswer, this.correctAnswer);
    }
  }

  checkAnswer(userAnswer, correctAnswer) {
    if (userAnswer === correctAnswer) {
      console.log('🎉 正解！X-Detective-Codeヘッダーの値を発見しました！');
      console.log('ネットワーク分析のマスターです！');
      super.checkAnswer(userAnswer, correctAnswer);
    } else {
      // デコイの答えをチェック
      if (userAnswer === 'TRACKING_DATA_2024' || userAnswer === 'SESSION_TOKEN_INVALID' || userAnswer === 'METRICS_COLLECTED') {
        console.log('🔍 そのヘッダーは関係ありません。正しいリクエストを探してください！');
      } else if (userAnswer.includes('NETWORK') || userAnswer.includes('DETECTIVE')) {
        console.log('🔍 惜しい！正しい文字が含まれています。完全な値を確認してください。');
      } else if (userAnswer.length === 0) {
        console.log('🤔 値が入力されていません。Networkタブでリクエストヘッダーを確認してください。');
      }
      super.checkAnswer(userAnswer, correctAnswer);
    }
  }

  getSuccessMessage() {
    return '🎉 素晴らしい！ネットワーク分析の達人になりました！隠された通信を解析するスキルを習得しました！';
  }

  getErrorMessage() {
    return '❌ 違います。まず「通信を開始する」ボタンをクリックして、Networkタブでリクエストヘッダーを詳しく調べてください。';
  }

  cleanup() {
    super.cleanup();
    if (this.networkButton) {
      this.networkButton.onclick = null;
      this.networkButton = null;
    }
  }
} 