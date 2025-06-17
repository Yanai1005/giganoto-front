import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
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
    
    // スタートボタン
    const startButton = document.createElement('button');
    startButton.textContent = 'スタート';
    startButton.style.marginTop = '3rem';
    startButton.style.padding = '1rem 3rem';
    startButton.style.fontSize = '1.8rem';
    startButton.style.fontWeight = 'bold';
    startButton.style.color = '#fff';
    startButton.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '50px';
    startButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    startButton.style.cursor = 'pointer';
    startButton.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    startButton.style.opacity = '0';
    // アニメーション：さらに遅れて表示
    startButton.style.animation = 'fadeInUp 1s 0.8s ease-out forwards';
    
    // マウスオーバー時のインタラクション
    startButton.onmouseover = () => {
      startButton.style.transform = 'translateY(-4px)';
      startButton.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
    };
    startButton.onmouseout = () => {
      startButton.style.transform = 'translateY(0)';
      startButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    };

    // クリックでゲームシーンへ
    startButton.onclick = () => {
      // クリックアニメーション
      startButton.style.transform = 'translateY(2px)';
      // UIをフェードアウトさせてからシーン遷移
      titleContainer.style.transition = 'opacity 0.5s ease';
      titleContainer.style.opacity = '0';
      setTimeout(() => {
        this.scene.start('GameScene');
      }, 500);
    };
    titleContainer.appendChild(startButton);

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
    `;
    document.head.appendChild(style);
  }
} 