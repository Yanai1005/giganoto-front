import Phaser from 'phaser';
import ScenarioGame from './ScenarioGame.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: [ScenarioGame]
};

new Phaser.Game(config);
