import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import EndScene from './scenes/EndScene.js';

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
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: [GameScene, EndScene]
    };

    const game = new Phaser.Game(config);
    return game;
};
