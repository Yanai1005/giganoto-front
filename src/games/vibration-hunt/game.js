import Phaser from 'phaser';
import VibrationHuntScene from './VibrationHuntScene.js';

export const initializeGame = (container) => {
  const config = {
    type: Phaser.AUTO,
    width: 1000,  // 800から1000に変更（コンテナのmax-widthに合わせる）
    height: 600,  // 高さは600のまま維持
    parent: container || 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [VibrationHuntScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,  // アスペクト比を維持してフィット
      autoCenter: Phaser.Scale.CENTER_BOTH  // 中央に配置
    }
  };

  // Phaserゲームの初期化
  const game = new Phaser.Game(config);

  // ゲームインスタンスを返す
  return game;
}; 
