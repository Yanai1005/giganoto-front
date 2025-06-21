import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

export const initializeGame = (container) => {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: container,
        backgroundColor: '#1a1a2e',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 100 },
                debug: false
            }
        },
        scene: [GameScene]
    };

    const game = new Phaser.Game(config);
    return game;
};
