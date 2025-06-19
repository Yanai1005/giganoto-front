import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import EndScene from './scenes/EndScene.js';

window.addEventListener('DOMContentLoaded', () => {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    scene: [GameScene, EndScene]
  };

  new Phaser.Game(config);
});
