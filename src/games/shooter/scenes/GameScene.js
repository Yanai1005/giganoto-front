// src/games/shooter/scenes/GameScene.js (直接キーボード処理版)
import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        // 直接キー状態を管理
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false
        };
    }

    preload() {
        // ダミーファイルをロード
        this.load.image('dummy', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    create() {
        // まずテクスチャを作成
        this.createTextures();

        // タイトル
        this.add.text(400, 50, 'SPACE SHOOTER', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // プレイヤーを作成
        this.player = this.add.sprite(400, 500, 'playerSprite');
        this.playerSpeed = 200;

        // 直接キーボードイベントリスナーを設定
        this.setupDirectKeyboardHandling();

        // Phaserのキーボード入力も設定（比較用）
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // 操作説明
        this.add.text(400, 570, '矢印キーまたはWASDで移動、スペースで射撃 (直接処理版)', {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // デバッグ表示
        this.debugText = this.add.text(10, 10, '', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        // 弾と敵の配列
        this.bullets = [];
        this.enemies = [];

        // 敵生成タイマー
        this.enemyTimer = this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        this.score = 0;
        this.scoreText = this.add.text(700, 50, 'Score: 0', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        // フォーカス設定
        this.setupFocus();

        console.log('GameScene created successfully (Direct Keyboard version)');
        console.log('Player created at:', this.player.x, this.player.y);
    }

    createTextures() {
        // プレイヤー用のテクスチャを作成
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00ff00);
        playerGraphics.fillTriangle(16, 0, 0, 32, 32, 32);
        playerGraphics.generateTexture('playerSprite', 32, 32);
        playerGraphics.destroy();

        // 敵用のテクスチャ
        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(0xff0000);
        enemyGraphics.fillRect(0, 0, 24, 16);
        enemyGraphics.generateTexture('enemySprite', 24, 16);
        enemyGraphics.destroy();

        // 弾用のテクスチャ
        const bulletGraphics = this.add.graphics();
        bulletGraphics.fillStyle(0xffff00);
        bulletGraphics.fillRect(0, 0, 4, 8);
        bulletGraphics.generateTexture('bulletSprite', 4, 8);
        bulletGraphics.destroy();

        console.log('Textures created successfully');
    }

    setupDirectKeyboardHandling() {
        // 直接DOMイベントリスナーを使用
        const handleKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    event.preventDefault();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = true;
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = true;
                    event.preventDefault();
                    break;
                case 'Space':
                    this.keys.space = true;
                    event.preventDefault();
                    break;
            }
            console.log('Direct keydown:', event.code, 'Keys state:', this.keys);
        };

        const handleKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
                case 'Space':
                    this.keys.space = false;
                    break;
            }
            console.log('Direct keyup:', event.code, 'Keys state:', this.keys);
        };

        // イベントリスナーを追加
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // シーンが破棄されるときにリスナーを削除
        this.events.once('shutdown', () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        });
    }

    setupFocus() {
        this.input.keyboard.enabled = true;

        this.input.on('pointerdown', () => {
            console.log('Canvas clicked, setting focus');
            this.focusCanvas();
        });

        this.time.delayedCall(100, () => {
            this.focusCanvas();
        });
    }

    focusCanvas() {
        if (this.game.canvas) {
            this.game.canvas.tabIndex = 0;
            this.game.canvas.style.outline = 'none';
            this.game.canvas.focus();
            console.log('Focus set, activeElement:', document.activeElement);
        }
    }

    update(time, delta) {
        // プレイヤーが存在することを確認
        if (!this.player) {
            return;
        }

        // プレイヤー移動 - 直接キー状態を使用
        const moveDistance = (this.playerSpeed * delta) / 1000;

        // 水平移動
        if (this.keys.left) {
            this.player.x -= moveDistance;
        }
        if (this.keys.right) {
            this.player.x += moveDistance;
        }

        // 垂直移動
        if (this.keys.up) {
            this.player.y -= moveDistance;
        }
        if (this.keys.down) {
            this.player.y += moveDistance;
        }

        // 画面境界チェック
        this.player.x = Phaser.Math.Clamp(this.player.x, 16, 784);
        this.player.y = Phaser.Math.Clamp(this.player.y, 16, 584);

        // 射撃（キーが押された瞬間のみ）
        if (this.keys.space && !this.lastSpaceState) {
            this.shoot();
        }
        this.lastSpaceState = this.keys.space;

        // デバッグ情報
        this.debugText.setText(`Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})
Direct Keys: ←${this.keys.left} ↑${this.keys.up} →${this.keys.right} ↓${this.keys.down} Space${this.keys.space}
Phaser Keys: ←${this.cursors.left.isDown} ↑${this.cursors.up.isDown} →${this.cursors.right.isDown} ↓${this.cursors.down.isDown}
Phaser WASD: W${this.wasd.W.isDown} A${this.wasd.A.isDown} S${this.wasd.S.isDown} D${this.wasd.D.isDown}
Focus: ${document.activeElement === this.game.canvas}
Delta: ${Math.round(delta)}
MoveDistance: ${Math.round(moveDistance)}`);

        // 弾の更新
        this.bullets = this.bullets.filter(bullet => {
            if (bullet.active) {
                bullet.y -= 8;
                if (bullet.y < 0) {
                    bullet.destroy();
                    return false;
                }
                return true;
            }
            return false;
        });

        // 敵の更新
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.active) {
                enemy.y += 3;
                if (enemy.y > 600) {
                    enemy.destroy();
                    return false;
                }
                return true;
            }
            return false;
        });

        // 衝突判定
        this.checkCollisions();
    }

    shoot() {
        const bullet = this.add.sprite(this.player.x, this.player.y - 20, 'bulletSprite');
        this.bullets.push(bullet);
        console.log('Bullet shot at:', this.player.x, this.player.y - 20);
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(50, 750);
        const enemy = this.add.sprite(x, -20, 'enemySprite');
        this.enemies.push(enemy);
        console.log('Enemy spawned at:', x, -20);
    }

    checkCollisions() {
        // 弾と敵の衝突判定
        this.bullets.forEach((bullet, bulletIndex) => {
            if (!bullet.active) return;

            this.enemies.forEach((enemy, enemyIndex) => {
                if (!enemy.active) return;

                const distance = Phaser.Math.Distance.Between(
                    bullet.x, bullet.y, enemy.x, enemy.y
                );

                if (distance < 20) {
                    this.hitEnemy(bullet, enemy, bulletIndex, enemyIndex);
                }
            });
        });

        // プレイヤーと敵の衝突判定
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;

            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, enemy.x, enemy.y
            );

            if (distance < 25) {
                this.gameOver();
            }
        });
    }

    hitEnemy(bullet, enemy, bulletIndex, enemyIndex) {
        bullet.destroy();
        enemy.destroy();
        this.bullets.splice(bulletIndex, 1);
        this.enemies.splice(enemyIndex, 1);
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
        console.log('Enemy hit! Score:', this.score);
    }

    gameOver() {
        this.scene.pause();
        this.add.text(400, 300, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 350, 'Click to restart', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}

export default GameScene;
