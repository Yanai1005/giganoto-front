import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.add.text(400, 300, 'とばくろ', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }
}

export default GameScene;