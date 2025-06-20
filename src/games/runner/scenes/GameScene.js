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

    init() {
        // シーン初期化時にすべての状態をリセット
        this.gameOver = false;
        this.score = 0;
        
        // キー状態をリセット
        this.keys = {
            left: false,
            right: false,
            a: false,
            d: false
        };
    }

    preload() {
        // 空のpreload - テクスチャはcreate()で生成
    }

    create() {
        // ゲーム状態を確実にリセット
        this.gameOver = false;
        this.score = 0;
        
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
        
        // Y軸を完全に固定（重力の影響を受けないように）
        this.player.body.setGravityY(-100); // 重力を完全に相殺
        this.player.body.setMaxVelocity(400, 0); // Y軸の最大速度を0に制限

        // 障害物グループを作成
        this.obstacles = this.physics.add.group();

        // キーボード入力を設定（Phaserと直接DOM両方）
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // 直接DOMイベントリスナーを追加
        this.setupDOMKeyboardEvents();

        // スコア表示
        this.scoreText = this.add.text(16, 16, 'スコア: 0', {
            fontSize: '32px',
            fill: '#FFFFFF'
        });

        this.add.text(400, 50, '赤い障害物を避けよう！', {
            fontSize: '20px',
            fill: '#FFFF00'
        }).setOrigin(0.5);

        // 障害物生成タイマー
        this.obstacleTimer = this.time.addEvent({
            delay: 2000, // 2秒間隔
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        // 衝突判定
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        
        // マウス/タッチ入力も追加
        this.input.on('pointerdown', (pointer) => {
            if (pointer.x < 400) {
                this.player.x -= 50; // 左クリックで左移動
            } else {
                this.player.x += 50; // 右クリックで右移動
            }
            this.player.x = Phaser.Math.Clamp(this.player.x, 220, 580);
        });
        
        // 最初の障害物を1秒後に生成
        this.time.delayedCall(1000, () => {
            this.spawnObstacle();
        });
    }

    setupDOMKeyboardEvents() {
        // 既存のイベントリスナーを削除
        this.cleanupDOMEvents();
        
        // キーダウンイベント
        this.keydownHandler = (event) => {
            // ゲームオーバー時は入力を無視
            if (this.gameOver) return;
            
            switch(event.code) {
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'KeyA':
                    this.keys.a = true;
                    break;
                case 'KeyD':
                    this.keys.d = true;
                    break;
            }
        };

        // キーアップイベント
        this.keyupHandler = (event) => {
            switch(event.code) {
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'KeyA':
                    this.keys.a = false;
                    break;
                case 'KeyD':
                    this.keys.d = false;
                    break;
                case 'Space':
                    if (this.gameOver) {
                        this.cleanupDOMEvents();
                        this.scene.restart();
                    }
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }
    
    spawnObstacleAlternative() {
        if (this.gameOver) return;

        // ランダムな位置に障害物を生成（道路内）
        const x = Phaser.Math.Between(220, 580);
        const obstacle = this.add.rectangle(x, 100, 40, 60, 0xFF0000);
        
        this.physics.add.existing(obstacle);
        obstacle.body.setVelocity(0, this.gameSpeed);
        
        this.obstacles.add(obstacle);

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
        }

        // 障害物用の赤い四角形テクスチャを作成
        if (!this.textures.exists('obstacleCar')) {
            const obstacleGraphics = this.add.graphics();
            obstacleGraphics.fillStyle(0xFF0000);
            obstacleGraphics.fillRect(0, 0, 40, 60);
            obstacleGraphics.generateTexture('obstacleCar', 40, 60);
            obstacleGraphics.destroy();
        }
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

        // ランダムな位置に障害物を生成（道路内）
        const x = Phaser.Math.Between(220, 580);
        
        // rectangleを使用して確実に障害物を生成
        const obstacle = this.add.rectangle(x, 50, 40, 60, 0xFF0000);
        
        this.physics.add.existing(obstacle);
        obstacle.body.setVelocity(0, this.gameSpeed);
        
        this.obstacles.add(obstacle);

        // 画面外に出た障害物を削除
        obstacle.setData('spawned', true);
    }

    hitObstacle(player, obstacle) {
        // ゲームオーバー処理
        this.gameOver = true;
        this.physics.pause();
        
        // タイマーを停止
        if (this.obstacleTimer) {
            this.obstacleTimer.destroy();
        }
        
        player.setTint(0xff0000);
        
        // ゲームオーバーテキスト
        this.add.text(400, 300, 'ゲームオーバー', {
            fontSize: '64px',
            fill: '#FF0000'
        }).setOrigin(0.5);
        
        this.add.text(400, 380, 'スペースキーでリスタート', {
            fontSize: '32px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);

        // スペースキーでリスタート（一度だけ）
        this.input.keyboard.once('keydown-SPACE', () => {
            this.cleanupDOMEvents();
            this.scene.restart();
        });
    }

    update() {
        // ゲームオーバー時は処理を停止
        if (this.gameOver || !this.player || !this.player.body) return;

        // プレイヤーのY座標を固定
        this.player.y = 500;
        this.player.body.setVelocityY(0);

        // velocityベースの移動 - DOMイベントとPhaserイベント両方をチェック
        const velocitySpeed = 400;
        
        // キー入力の詳細なデバッグ
        const leftPressed = this.cursors.left.isDown || this.keys.left || this.keys.a;
        const rightPressed = this.cursors.right.isDown || this.keys.right || this.keys.d;
        
        if (leftPressed) {
            this.player.body.setVelocityX(-velocitySpeed);
        } else if (rightPressed) {
            this.player.body.setVelocityX(velocitySpeed);
        } else {
            this.player.body.setVelocityX(0);
        }

        // プレイヤーを道路内に制限
        if (this.player.x < 220) {
            this.player.x = 220;
            this.player.body.setVelocityX(0);
        } else if (this.player.x > 580) {
            this.player.x = 580;
            this.player.body.setVelocityX(0);
        }

        // 道路の動きをシミュレート
        if (this.road) {
            this.road.y += this.roadSpeed;
            if (this.road.y > 60) {
                this.road.y = 0;
            }
        }

        // 障害物の管理
        if (this.obstacles) {
            this.obstacles.children.entries.forEach((obstacle, index) => {
                if (obstacle.y > 650) {
                    // スコア加算
                    if (obstacle.getData('spawned')) {
                        this.score += 10;
                        if (this.scoreText) {
                            this.scoreText.setText('スコア: ' + this.score);
                        }
                        obstacle.setData('spawned', false);
                    }
                    obstacle.destroy();
                }
            });
        }

        // ゲーム速度を徐々に上げる
        if (this.score > 0 && this.score % 100 === 0) {
            this.gameSpeed += 0.5;
        }
    }
}

export default GameScene;
