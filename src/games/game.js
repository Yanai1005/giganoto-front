import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

export const initializeGame = (container) => {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: container,
        backgroundColor: '#2c3e50',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300 },
                debug: false
            }
        },
        scene: [GameScene]
    };

    const game = new Phaser.Game(config);
    return game;
};
