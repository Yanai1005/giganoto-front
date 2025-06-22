export default class GameDataManager {
  constructor() {
    this.gameKeys = {
      secretKey: 'dev_detective_secret_key',
      codeFragment: 'hidden_code_fragment',
      tempClue: 'temp_clue'
    };
  }

  initializeGameData() {
    // LocalStorageにゲームデータを設定
    localStorage.setItem(this.gameKeys.secretKey, 'UNLOCK_NEXT_LEVEL');
    localStorage.setItem(this.gameKeys.codeFragment, 'DEBUG');
    
    // SessionStorageにゲームデータを設定
    sessionStorage.setItem(this.gameKeys.tempClue, '42');
    
    // コンソールに初期メッセージを出力
    this.outputInitialConsoleMessages();
  }

  outputInitialConsoleMessages() {
    // 初期化完了のログのみ出力
    console.log('🎮 Developer Detective - ゲームデータ初期化完了');
  }

  getSecretKey() {
    return localStorage.getItem(this.gameKeys.secretKey);
  }

  getCodeFragment() {
    return localStorage.getItem(this.gameKeys.codeFragment);
  }

  getTempClue() {
    return sessionStorage.getItem(this.gameKeys.tempClue);
  }

  cleanup() {
    // ゲーム終了時にデータをクリーンアップ（必要に応じて）
    // 今回はプレイヤーが複数回プレイできるようにデータを残す
  }

  // レベル4用のネットワークリクエスト送信
  sendNetworkRequest() {
    return fetch('/api/dummy-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Code': 'NETWORK_MASTER_2024'
      },
      body: JSON.stringify({ challenge: 'level4' })
    }).catch(() => {
      console.log('🔍 ネットワークリクエストが送信されました。Networkタブでヘッダーを確認してください！');
    });
  }

  // レベル3用のDOM要素にdata属性を設定
  createSecretElement(container) {
    const secretElement = document.createElement('div');
    secretElement.id = 'secret-element';
    secretElement.setAttribute('data-secret-value', 'CONSOLE_IS_YOUR_FRIEND');
    secretElement.style.opacity = '0.01';
    secretElement.style.fontSize = '1px';
    secretElement.innerHTML = '<!-- 隠されたメッセージ: DOM検査で見つけてください -->';
    
    if (container) {
      container.appendChild(secretElement);
    }
    
    return secretElement;
  }

  // レベル5用の隠し要素を作成
  createFinalSecretElement(container) {
    const finalSecret = document.createElement('div');
    finalSecret.id = 'final-secret';
    finalSecret.style.color = '#007';
    finalSecret.style.opacity = '0.01';
    finalSecret.innerHTML = '<!-- 検査してstyle.colorを確認してください。007が隠れています -->';
    
    if (container) {
      container.appendChild(finalSecret);
    }
    
    return finalSecret;
  }
} 