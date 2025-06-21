import Phaser from 'phaser';
import * as THREE from 'three';
import GameScene from './scenes/FishingScene.js';
import TitleScene from './scenes/TitleScene.js';
import JoyConDebugScene from './scenes/JoyConDebugScene.js';

export const initializeGame = () => {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a85ff',
    scene: [TitleScene, GameScene, JoyConDebugScene],
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
