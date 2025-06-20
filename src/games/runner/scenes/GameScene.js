import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.obstacles = null;
        this.cursors = null;
        this.gameSpeed = 200;
        this.score = 0;
        this.scoreText = null;
        this.keyStatusText = null;
        this.gameOver = false;
        this.road = null;
        this.roadSpeed = 3;
        
        // DOMイベント用のキー状態
        this.keys = {
            left: false,
            right: false,
            a: false,
            d: false
        };
        
        // イベントリスナーの参照を保存
        this.keydownHandler = null;
        this.keyupHandler = null;
    }

    preload() {
        // 空のpreload - テクスチャはcreate()で生成
    }

    create() {
        console.log('GameScene created');
        
        // キー状態をリセット
        this.keys = {
            left: false,
            right: false,
            a: false,
            d: false
        };
        
        // 背景色を設定
        this.cameras.main.setBackgroundColor('#228B22');

        // テクスチャを動的に生成
        this.createTextures();

        // 道路の描画
        this.createRoad();

        // プレイヤーカーを作成
        this.player = this.add.sprite(400, 500, 'playerCar');
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        
        console.log('Player created at:', this.player.x, this.player.y);

        // 障害物グループを作成
        this.obstacles = this.physics.add.group();

        // キーボード入力を設定（Phaserと直接DOM両方）
        this.cursors = this.input.keyboard.createCursorKeys();
        console.log('Cursors created:', this.cursors);
        
        // 直接DOMイベントリスナーを追加
        this.setupDOMKeyboardEvents();
        
        console.log('DOM keyboard events setup complete');

        // スコア表示
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#FFFFFF'
        });

        // 操作説明を追加
        this.add.text(400, 50, 'Use Arrow Keys or A/D to move', {
            fontSize: '24px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        this.add.text(400, 80, 'Avoid the red obstacles!', {
            fontSize: '20px',
            fill: '#FFFF00'
        }).setOrigin(0.5);
        
        // デバッグ用：現在のキー状態を表示
        this.keyStatusText = this.add.text(16, 100, 'Keys: ', {
            fontSize: '16px',
            fill: '#FFFFFF'
        });

        // 障害物生成タイマー
        this.obstacleTimer = this.time.addEvent({
            delay: 2000, // 2秒間隔
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });
        
        console.log('Obstacle timer created');

        // 衝突判定
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        
        // マウス/タッチ入力も追加
        this.input.on('pointerdown', (pointer) => {
            console.log('Pointer clicked at:', pointer.x, pointer.y);
            if (pointer.x < 400) {
                this.player.x -= 50; // 左クリックで左移動
            } else {
                this.player.x += 50; // 右クリックで右移動
            }
            this.player.x = Phaser.Math.Clamp(this.player.x, 220, 580);
            console.log('Player moved to:', this.player.x);
        });
        
        console.log('GameScene setup complete');
        
        // 最初の障害物を1秒後に生成
        this.time.delayedCall(1000, () => {
            console.log('Spawning initial obstacle');
            this.spawnObstacle();
        });
        
        console.log('GameScene setup complete');
    }

    setupDOMKeyboardEvents() {
        // 既存のイベントリスナーを削除
        this.cleanupDOMEvents();
        
        // キーダウンイベント
        this.keydownHandler = (event) => {
            switch(event.code) {
                case 'ArrowLeft':
                    this.keys.left = true;
                    console.log('DOM: Left arrow down');
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    console.log('DOM: Right arrow down');
                    break;
                case 'KeyA':
                    this.keys.a = true;
                    console.log('DOM: A key down');
                    break;
                case 'KeyD':
                    this.keys.d = true;
                    console.log('DOM: D key down');
                    break;
            }
        };

        // キーアップイベント
        this.keyupHandler = (event) => {
            switch(event.code) {
                case 'ArrowLeft':
                    this.keys.left = false;
                    console.log('DOM: Left arrow up');
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    console.log('DOM: Right arrow up');
                    break;
                case 'KeyA':
                    this.keys.a = false;
                    console.log('DOM: A key up');
                    break;
                case 'KeyD':
                    this.keys.d = false;
                    console.log('DOM: D key up');
                    break;
                case 'Space':
                    if (this.gameOver) {
                        this.scene.restart();
                    }
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        
        console.log('DOM event listeners added');
    }
    
    spawnObstacleAlternative() {
        if (this.gameOver) return;

        console.log('Spawning alternative obstacle (rectangle)...');

        // ランダムな位置に障害物を生成（道路内）
        const x = Phaser.Math.Between(220, 580);
        const obstacle = this.add.rectangle(x, 100, 40, 60, 0xFF0000);
        
        console.log('Rectangle obstacle created at:', x, 100);
        
        this.physics.add.existing(obstacle);
        obstacle.body.setVelocity(0, this.gameSpeed);
        
        this.obstacles.add(obstacle);
        
        console.log('Rectangle obstacle added to group');

        // 画面外に出た障害物を削除
        obstacle.setData('spawned', true);
    }

    cleanupDOMEvents() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }
        if (this.keyupHandler) {
            document.removeEventListener('keyup', this.keyupHandler);
            this.keyupHandler = null;
        }
        console.log('DOM event listeners cleaned up');
    }
    
    shutdown() {
        // シーンが終了する時にイベントリスナーをクリーンアップ
        this.cleanupDOMEvents();
        super.shutdown();
    }
    
    destroy() {
        // シーンが破棄される時にイベントリスナーをクリーンアップ
        this.cleanupDOMEvents();
        super.destroy();
    }

    createTextures() {
        // プレイヤー用の青い四角形テクスチャを作成
        if (!this.textures.exists('playerCar')) {
            const playerGraphics = this.add.graphics();
            playerGraphics.fillStyle(0x0000FF);
            playerGraphics.fillRect(0, 0, 40, 60);
            playerGraphics.generateTexture('playerCar', 40, 60);
            playerGraphics.destroy();
            console.log('Player texture created');
        }

        // 障害物用の赤い四角形テクスチャを作成
        if (!this.textures.exists('obstacleCar')) {
            const obstacleGraphics = this.add.graphics();
            obstacleGraphics.fillStyle(0xFF0000);
            obstacleGraphics.fillRect(0, 0, 40, 60);
            obstacleGraphics.generateTexture('obstacleCar', 40, 60);
            obstacleGraphics.destroy();
            console.log('Obstacle texture created');
        }
        
        console.log('All textures ready');
    }

    createRoad() {
        // 道路の線を描画
        this.road = this.add.graphics();
        this.road.lineStyle(4, 0xFFFFFF);
        
        // 中央線
        for (let i = 0; i < 20; i++) {
            this.road.moveTo(400, i * 60);
            this.road.lineTo(400, i * 60 + 30);
        }
        
        // 左右の境界線
        this.road.lineStyle(8, 0xFFFFFF);
        this.road.moveTo(200, 0);
        this.road.lineTo(200, 600);
        this.road.moveTo(600, 0);
        this.road.lineTo(600, 600);
        
        this.road.strokePath();
    }

    spawnObstacle() {
        if (this.gameOver) return;

        console.log('Spawning obstacle...');

        // ランダムな位置に障害物を生成（道路内）
        const x = Phaser.Math.Between(220, 580);
        
        // rectangleを使用して確実に障害物を生成
        const obstacle = this.add.rectangle(x, 50, 40, 60, 0xFF0000);
        
        console.log('Rectangle obstacle created at:', x, 50);
        
        this.physics.add.existing(obstacle);
        obstacle.body.setVelocity(0, this.gameSpeed);
        
        this.obstacles.add(obstacle);
        
        console.log('Obstacle added to group, velocity:', this.gameSpeed);

        // 画面外に出た障害物を削除
        obstacle.setData('spawned', true);
    }

    hitObstacle(player, obstacle) {
        // ゲームオーバー処理
        this.gameOver = true;
        this.physics.pause();
        
        player.setTint(0xff0000);
        
        // ゲームオーバーテキスト
        this.add.text(400, 300, 'GAME OVER', {
            fontSize: '64px',
            fill: '#FF0000'
        }).setOrigin(0.5);
        
        this.add.text(400, 380, 'Press SPACE to restart', {
            fontSize: '32px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);

        // スペースキーでリスタート
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }

    update() {
        if (this.gameOver) return;

        // velocityベースの移動 - DOMイベントとPhaserイベント両方をチェック
        const velocitySpeed = 400;
        
        // キー入力の詳細なデバッグ
        const leftPressed = this.cursors.left.isDown || this.keys.left || this.keys.a;
        const rightPressed = this.cursors.right.isDown || this.keys.right || this.keys.d;
        
        if (leftPressed) {
            this.player.body.setVelocityX(-velocitySpeed);
            console.log('Moving left, velocity set to:', -velocitySpeed);
        } else if (rightPressed) {
            this.player.body.setVelocityX(velocitySpeed);
            console.log('Moving right, velocity set to:', velocitySpeed);
        } else {
            this.player.body.setVelocityX(0);
        }

        // デバッグ用：現在のキー状態を表示
        let keyStatus = 'Keys: ';
        if (this.cursors.left.isDown) keyStatus += 'LEFT ';
        if (this.cursors.right.isDown) keyStatus += 'RIGHT ';
        if (this.keys.a) keyStatus += 'A ';
        if (this.keys.d) keyStatus += 'D ';
        if (this.keys.left) keyStatus += 'DOM-LEFT ';
        if (this.keys.right) keyStatus += 'DOM-RIGHT ';
        this.keyStatusText.setText(keyStatus);

        // プレイヤーを道路内に制限
        if (this.player.x < 220) {
            this.player.x = 220;
            this.player.body.setVelocityX(0);
        } else if (this.player.x > 580) {
            this.player.x = 580;
            this.player.body.setVelocityX(0);
        }

        // 道路の動きをシミュレート
        this.road.y += this.roadSpeed;
        if (this.road.y > 60) {
            this.road.y = 0;
        }

        // 障害物の管理
        this.obstacles.children.entries.forEach((obstacle, index) => {
            if (obstacle.y > 650) {
                // スコア加算
                if (obstacle.getData('spawned')) {
                    this.score += 10;
                    this.scoreText.setText('Score: ' + this.score);
                    obstacle.setData('spawned', false);
                }
                obstacle.destroy();
            }
        });

        // ゲーム速度を徐々に上げる
        if (this.score > 0 && this.score % 100 === 0) {
            this.gameSpeed += 0.5;
        }
    }
}

export default GameScene;
