import Phaser from 'phaser';
import GameScene from './scenes/PuzzleScene.js';

export const initializeGame = (container) => {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: container,
        backgroundColor: '#2c3e50',
        scene: [GameScene],
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 600 }, // platformer用。shooter/puzzleは0でもOK
                debug: false
            }
        }
    };
    return new Phaser.Game(config);
};
