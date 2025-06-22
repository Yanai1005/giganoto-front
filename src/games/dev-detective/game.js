import DevDetectiveScene from './scenes/DevDetectiveScene.js';

export const initializeGame = (container) => {
  // DOM要素を直接操作するタイプのゲームなので、Phaserは使わない
  const gameInstance = new DevDetectiveGame(container);
  return gameInstance;
};

class DevDetectiveGame {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.isDestroyed = false;
    this.init();
  }

  init() {
    this.scene = new DevDetectiveScene(this.container);
    this.scene.create();
  }

  destroy() {
    if (this.scene && typeof this.scene.destroy === 'function') {
      this.scene.destroy();
    }
    this.isDestroyed = true;
  }
} 