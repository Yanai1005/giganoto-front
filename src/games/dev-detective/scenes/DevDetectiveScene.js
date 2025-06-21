import UIManager from '../ui/UIManager.js';
import LevelManager from '../managers/LevelManager.js';
import GameDataManager from '../managers/GameDataManager.js';

export default class DevDetectiveScene {
  constructor(container) {
    this.container = container;
    this.uiManager = new UIManager(container);
    this.levelManager = new LevelManager(this.uiManager);
    this.gameDataManager = new GameDataManager();
  }

  create() {
    this.setupContainer();
    this.gameDataManager.initializeGameData();
    this.uiManager.createMainUI();
    this.levelManager.startGame();
  }

  setupContainer() {
    this.container.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
    this.container.style.color = '#ffffff';
    this.container.style.fontFamily = "'Courier New', monospace";
    this.container.style.overflow = 'auto';
    this.container.style.padding = '20px';
    this.container.innerHTML = '';
  }

  destroy() {
    this.uiManager.cleanup();
    this.levelManager.cleanup();
    this.gameDataManager.cleanup();
    
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