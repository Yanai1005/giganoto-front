import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
    this.titleContainer = null;
  }

  preload() {}

  create() {
    // DOM要素を配置するためのコンテナを取得
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
      console.error('game-container not found!');
      return;
    }
    // シーン遷移時に前のシーンのUIが残らないようにクリア
    gameContainer.innerHTML = '';

    // スタイリッシュな背景をCSSで設定
    gameContainer.style.background = 'linear-gradient(160deg, #4facfe 0%, #00f2fe 100%)';
    gameContainer.style.overflow = 'hidden'; // アニメーション要素がはみ出ないように

    // タイトル画面用のコンテナを作成
    const titleContainer = document.createElement('div');
    this.titleContainer = titleContainer; // コンテナへの参照を保存
    titleContainer.style.width = '100%';
    titleContainer.style.height = '100%';
    titleContainer.style.display = 'flex';
    titleContainer.style.flexDirection = 'column';
    titleContainer.style.justifyContent = 'center';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.textAlign = 'center';
    titleContainer.style.color = 'white';
    titleContainer.style.textShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    titleContainer.style.fontFamily = "'Helvetica Neue', 'Arial', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', sans-serif";
    gameContainer.appendChild(titleContainer);

    // タイトルロゴ
    const title = document.createElement('h1');
    title.textContent = '釣りマスター3D';
    title.style.fontSize = '5rem';
    title.style.fontWeight = 'bold';
    title.style.margin = '0';
    title.style.letterSpacing = '0.1em';
    // アニメーション：下からふわっと表示
    title.style.animation = 'fadeInUp 1s ease-out forwards';
    titleContainer.appendChild(title);

    // サブタイトル
    const subtitle = document.createElement('p');
    subtitle.textContent = 'リアルな3D釣り体験を楽しもう！';
    subtitle.style.fontSize = '1.5rem';
    subtitle.style.marginTop = '1rem';
    subtitle.style.opacity = '0';
    // アニメーション：少し遅れて表示
    subtitle.style.animation = 'fadeIn 1s 0.5s ease-out forwards';
    titleContainer.appendChild(subtitle);
    
    // ボタンコンテナ
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '20px';
    buttonContainer.style.marginTop = '3rem';
    // アニメーション：コンテナごと表示
    buttonContainer.style.opacity = '0';
    buttonContainer.style.animation = 'fadeInUp 1s 0.8s ease-out forwards';
    titleContainer.appendChild(buttonContainer);

    // ボタンを作成するヘルパー関数
    const createButton = (text, background) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.padding = '1rem 3rem';
        button.style.fontSize = '1.8rem';
        button.style.fontWeight = 'bold';
        button.style.color = '#fff';
        button.style.background = background;
        button.style.border = 'none';
        button.style.borderRadius = '50px';
        button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
        button.style.cursor = 'pointer';
        button.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        
        button.onmouseover = () => {
            button.style.transform = 'translateY(-4px)';
            button.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
        };
        button.onmouseout = () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
        };
        return button;
    };

    // スタートボタン
    const startButton = createButton('スタート', 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)');
    startButton.onclick = () => {
      // UIをフェードアウトさせてからシーン遷移
      this.titleContainer.style.transition = 'opacity 0.5s ease';
      this.titleContainer.style.opacity = '0';
      setTimeout(() => {
        this.scene.start('GameScene');
      }, 500);
    };
    buttonContainer.appendChild(startButton);

    // Joy-Conテストボタン
    const debugButton = createButton('Joy-Conテスト', 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)');
    debugButton.onclick = () => {
        // UIをフェードアウトさせてからシーン遷移
        this.titleContainer.style.transition = 'opacity 0.5s ease';
        this.titleContainer.style.opacity = '0';
        setTimeout(() => {
            this.scene.start('JoyConDebugScene');
        }, 500);
    };
    buttonContainer.appendChild(debugButton);

    // コピーライト
    const footer = document.createElement('footer');
    footer.textContent = '© 2024 釣りマスター開発チーム';
    footer.style.position = 'absolute';
    footer.style.bottom = '20px';
    footer.style.fontSize = '0.9rem';
    footer.style.opacity = '0.7';
    footer.style.letterSpacing = '0.05em';
    titleContainer.appendChild(footer);
    
    // アニメーション用のCSSを動的に追加
    const style = document.createElement('style');
    style.id = 'fishing-game-styles';
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
        /* カスタム確認ダイアログ */
        #custom-confirm-modal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex; justify-content: center; align-items: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        }
        #custom-confirm-modal .modal-content {
            background: #2a3b4c; /* 単色のダークブルー */
            padding: 30px 40px;
            border-radius: 8px; /* 角丸を少し抑える */
            text-align: center;
            color: #fff;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: none; /* ボーダーを削除 */
            animation: slideInUp 0.4s ease-out;
        }
        #custom-confirm-modal p {
            margin: 0 0 25px 0;
            font-size: 1.2rem;
            line-height: 1.6;
        }
        #custom-confirm-modal .modal-buttons button {
            padding: 10px 30px;
            border: none;
            border-radius: 6px; /* ボタンの角丸を調整 */
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            margin: 0 10px;
            min-width: 120px;
        }
        #confirm-ok {
            background: #d9534f; /* 赤系の色 */
            color: white;
        }
        #confirm-ok:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 5px 15px rgba(217, 83, 79, 0.4); 
            background: #c9302c;
        }
        #confirm-cancel {
            background: #6c757d; /* グレー系の色 */
            color: #eee;
        }
        #confirm-cancel:hover { background: #5a6268; }
        
        /* カスタムアラート */
        #custom-alert {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2a3b4c; /* 確認ダイアログとデザインを統一 */
            color: white;
            padding: 20px 35px;
            border-radius: 8px; /* 確認ダイアログとデザインを統一 */
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); /* 確認ダイアログとデザインを統一 */
            display: flex;
            align-items: center;
            opacity: 0;
            animation: fadeInScaleUp 0.5s ease-out forwards;
            transition: opacity 0.5s ease;
        }
        .alert-icon {
            font-size: 22px; /* アイコンサイズを微調整 */
            font-weight: bold;
            color: #2ecc71;
            margin-right: 15px;
            border: 2px solid #2ecc71;
            width: 30px; /* アイコンサイズを微調整 */
            height: 30px; /* アイコンサイズを微調整 */
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            line-height: 1;
        }
        .alert-message {
            font-size: 1.1rem;
        }
        
        @keyframes fadeInScaleUp {
          from { transform: translate(-50%, -40%); opacity: 0; }
          to { transform: translate(-50%, -50%); opacity: 1; }
        }
    `;
    if (!document.getElementById(style.id)) {
        document.head.appendChild(style);
    }

    // セーブデータ削除ボタン
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'セーブデータ削除';
    deleteButton.style.position = 'absolute';
    deleteButton.style.bottom = '20px';
    deleteButton.style.right = '20px';
    deleteButton.style.padding = '0.5rem 1rem';
    deleteButton.style.fontSize = '1rem';
    deleteButton.style.fontWeight = 'bold';
    deleteButton.style.color = '#fff';
    deleteButton.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    deleteButton.style.border = 'none';
    deleteButton.style.borderRadius = '50px';
    deleteButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    deleteButton.style.opacity = '0';
    // アニメーション：さらに遅れて表示
    deleteButton.style.animation = 'fadeInUp 1s 0.8s ease-out forwards';
    
    // マウスオーバー時のインタラクション
    deleteButton.onmouseover = () => {
      deleteButton.style.transform = 'translateY(-4px)';
      deleteButton.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
    };
    deleteButton.onmouseout = () => {
      deleteButton.style.transform = 'translateY(0)';
      deleteButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    };

    // クリックでセーブデータ削除
    deleteButton.onclick = () => {
        this.showCustomConfirm('本当にセーブデータを削除しますか？<br>この操作は取り消せません。', 
            () => {
                localStorage.removeItem('fishing_game_upgrades');
                localStorage.removeItem('fishing_game_fish_dex');
                this.showCustomAlert('セーブデータを削除しました。');
            }
        );
    };
    titleContainer.appendChild(deleteButton);
  }
  
  // カスタム確認ダイアログを表示する関数
  showCustomConfirm(message, onConfirm) {
    // 既存のモーダルがあれば削除
    const existingModal = document.getElementById('custom-confirm-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'custom-confirm-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            <div class="modal-buttons">
                <button id="confirm-ok">OK</button>
                <button id="confirm-cancel">キャンセル</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('confirm-ok').onclick = () => {
        onConfirm();
        modal.remove();
    };
    document.getElementById('confirm-cancel').onclick = () => {
        modal.remove();
    };
  }
  
  // カスタムアラートを表示する関数
  showCustomAlert(message) {
      const existingAlert = document.getElementById('custom-alert');
      if(existingAlert) existingAlert.remove();
      
      const alertBox = document.createElement('div');
      alertBox.id = 'custom-alert';
      alertBox.innerHTML = `
        <div class="alert-icon">✓</div>
        <div class="alert-message">${message}</div>
      `;
      document.body.appendChild(alertBox);

      setTimeout(() => {
          alertBox.style.opacity = '0';
          setTimeout(() => {
            alertBox.remove();
          }, 500);
      }, 2500);
  }

  shutdown() {
    // このシーンで作成したDOM要素をクリーンアップ
    if (this.titleContainer) {
        this.titleContainer.remove();
        this.titleContainer = null;
    }
    const styleElement = document.getElementById('fishing-game-styles');
    if (styleElement) {
        styleElement.remove();
    }
    // game-container に設定したスタイルをリセット
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.background = '';
        gameContainer.style.overflow = '';
    }
  }
} 