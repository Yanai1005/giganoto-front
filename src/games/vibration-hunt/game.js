import Phaser from 'phaser';
import VibrationHuntScene from './VibrationHuntScene.js';

export const initializeGame = (container) => {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: container || 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [VibrationHuntScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    }
  };
  
  // Phaserゲームの初期化
  const game = new Phaser.Game(config);
  
  // ゲームインスタンスを返す
  return game;
}; 