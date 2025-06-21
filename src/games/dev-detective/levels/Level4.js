import BaseLevel from './BaseLevel.js';

export default class Level4 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = 'NETWORK_MASTER_2024';
    this.networkButton = null;
  }

  setupLevel() {
    const hintContent = this.createHintContent(
      '🌐 レベル4: ネットワーク分析官',
      'Networkタブを開いて、下のボタンをクリックしてください。送信されるリクエストの<strong>特別なヘッダー</strong>を見つけてください。',
      'X-Secret-Code ヘッダーの値を探してください'
    );

    // ネットワークトリガーボタンを作成
    const networkButtonHtml = `
      <button id="network-trigger" 
              style="padding: 15px 25px; font-size: 1.2rem; background: #FF6B6B; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 10px 0;">
        🔍 ネットワークリクエスト送信
      </button>
    `;

    this.uiManager.updateHintArea(hintContent + networkButtonHtml);

    const inputGroup = this.createInputGroup(
      '秘密のコード:',
      'X-Secret-Code ヘッダーの値',
      'level4-input',
      () => this.handleSubmit()
    );

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);

    // ネットワークボタンのイベントを設定
    this.setupNetworkButton();
  }

  setupNetworkButton() {
    this.networkButton = document.getElementById('network-trigger');
    if (this.networkButton) {
      this.networkButton.onclick = () => this.triggerNetworkRequest();
    }
  }

  triggerNetworkRequest() {
    // ダミーのAPIリクエストを送信
    fetch('/api/dummy-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Code': 'NETWORK_MASTER_2024'
      },
      body: JSON.stringify({ challenge: 'level4' })
    }).catch(() => {
      // エラーは無視（目的はNetworkタブでヘッダーを見ることなので）
      console.log('🔍 ネットワークリクエストが送信されました。Networkタブでヘッダーを確認してください！');
    });
  }

  handleSubmit() {
    const input = document.getElementById('level4-input');
    if (input) {
      this.checkAnswer(input.value, this.correctAnswer);
    }
  }

  getSuccessMessage() {
    return '素晴らしい！ネットワーク分析のエキスパートです！';
  }

  getErrorMessage() {
    return '違います。まずボタンをクリックして、Networkタブでリクエストヘッダーを確認してください。';
  }

  cleanup() {
    super.cleanup();
    if (this.networkButton) {
      this.networkButton.onclick = null;
      this.networkButton = null;
    }
  }
} 