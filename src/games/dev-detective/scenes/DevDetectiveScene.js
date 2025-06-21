import UIManager from '../ui/UIManager.js';
import LevelManager from '../managers/LevelManager.js';
import GameDataManager from '../managers/GameDataManager.js';
import TitleScene from './TitleScene.js';

export default class DevDetectiveScene {
  constructor(container) {
    this.container = container;
    this.uiManager = null;
    this.levelManager = null;
    this.gameDataManager = null;
    this.titleScene = null;
    this.currentScene = 'title';
  }

  create() {
    this.showTitleScreen();
  }

  showTitleScreen() {
    this.currentScene = 'title';
    this.titleScene = new TitleScene(this.container, () => this.startMainGame());
    this.titleScene.create();
  }

  startMainGame() {
    this.currentScene = 'game';
    if (this.titleScene) {
      this.titleScene.destroy();
      this.titleScene = null;
    }
    
    this.setupContainer();
    this.gameDataManager = new GameDataManager();
    this.uiManager = new UIManager(this.container);
    this.levelManager = new LevelManager(this.uiManager);
    
    this.gameDataManager.initializeGameData();
    this.uiManager.createMainUI();
    this.setupBackToTitleButton();
    this.levelManager.startGame();
  }

  setupBackToTitleButton() {
    const backButton = document.getElementById('back-to-title-button');
    if (backButton) {
      backButton.onclick = () => {
        this.backToTitle();
      };
    }
  }

  backToTitle() {
    // フェードアウトアニメーション
    this.container.style.transition = 'opacity 0.5s ease';
    this.container.style.opacity = '0';
    
    setTimeout(() => {
      // 現在のゲーム状態をクリーンアップ
      if (this.uiManager) {
        this.uiManager.cleanup();
        this.uiManager = null;
      }
      
      if (this.levelManager) {
        this.levelManager.cleanup();
        this.levelManager = null;
      }
      
      if (this.gameDataManager) {
        this.gameDataManager.cleanup();
        this.gameDataManager = null;
      }
      
      // コンテナをリセット
      this.container.style.opacity = '';
      this.container.style.transition = '';
      
      // タイトル画面に戻る
      this.showTitleScreen();
    }, 500);
  }

  setupContainer() {
    this.container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    this.container.style.color = '#ffffff';
    this.container.style.fontFamily = "'JetBrains Mono', 'Courier New', monospace";
    this.container.style.overflow = 'auto';
    this.container.style.padding = '20px';
    this.container.style.minHeight = '100vh';
    this.container.style.position = 'relative';
    this.container.style.width = '100%';
    this.container.style.boxSizing = 'border-box';
    this.container.innerHTML = '';
    
    // 背景にサブtle なパターンを追加
    this.addBackgroundPattern();
  }
  
  addBackgroundPattern() {
    const pattern = document.createElement('div');
    pattern.style.position = 'absolute';
    pattern.style.top = '0';
    pattern.style.left = '0';
    pattern.style.width = '100%';
    pattern.style.height = '100%';
    pattern.style.opacity = '0.03';
    pattern.style.backgroundImage = `
      radial-gradient(circle at 25px 25px, white 3%, transparent 3%),
      radial-gradient(circle at 75px 75px, white 3%, transparent 3%)
    `;
    pattern.style.backgroundSize = '100px 100px';
    pattern.style.pointerEvents = 'none';
    pattern.style.zIndex = '1';
    this.container.appendChild(pattern);
  }

  destroy() {
    if (this.titleScene) {
      this.titleScene.destroy();
      this.titleScene = null;
    }
    
    if (this.uiManager) {
      this.uiManager.cleanup();
      this.uiManager = null;
    }
    
    if (this.levelManager) {
      this.levelManager.cleanup();
      this.levelManager = null;
    }
    
    if (this.gameDataManager) {
      this.gameDataManager.cleanup();
      this.gameDataManager = null;
    }
    
    if (this.container) {
      this.container.innerHTML = '';
      this.container.style.background = '';
      this.container.style.color = '';
      this.container.style.fontFamily = '';
      this.container.style.overflow = '';
      this.container.style.padding = '';
    }
  }
} 