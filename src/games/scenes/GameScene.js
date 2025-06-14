import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // プレイヤー用の小さな画像を作成
        this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        // 地面用の画像を作成
        this.load.image('ground', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    create() {
        // プレイヤー作成（スプライトを使用）
        this.player = this.add.sprite(100, 450, 'player');
        this.player.setDisplaySize(32, 48);
        this.player.setTint(0x3498db); // 青色
        this.physics.add.existing(this.player);
        this.player.body.setBounce(0.2);
        this.player.body.setCollideWorldBounds(true);

        // 地面作成
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(800, 64).refreshBody();
        this.platforms.create(600, 400, 'ground').setScale(400, 32).refreshBody();
        this.platforms.create(50, 250, 'ground').setScale(400, 32).refreshBody();
        this.platforms.create(750, 220, 'ground').setScale(400, 32).refreshBody();

        // 敵作成（rectangleを使用して確実に赤色にする）
        this.enemies = this.physics.add.group();
        for (let i = 0; i < 5; i++) {
            const enemy = this.add.rectangle(
                Phaser.Math.Between(200, 700),
                Phaser.Math.Between(50, 200),
                20, 20, 0xe74c3c // 赤色
            );
            this.physics.add.existing(enemy);
            enemy.body.setBounce(1);
            enemy.body.setCollideWorldBounds(true);
            enemy.body.setVelocity(Phaser.Math.Between(-200, 200), 20);
            this.enemies.add(enemy);
        }

        // 物理判定設定
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

        // キーボード入力設定
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    }

    update() {
        // プレイヤー移動制御
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.body.setVelocityX(-160);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.body.setVelocityX(160);
        } else {
            this.player.body.setVelocityX(0);
        }

        if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.player.body.touching.down) {
            this.player.body.setVelocityY(-330);
        }
    }

    hitEnemy(player, enemy) {
        // ゲームオーバー処理
        this.physics.pause();

        // スプライトの色を赤に変更
        player.setTint(0xff0000);

        this.add.text(400, 300, 'GAME OVER', {
            fontSize: '64px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(400, 360, 'Click to restart', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}

export default GameScene;
