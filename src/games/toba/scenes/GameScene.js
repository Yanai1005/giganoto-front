import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { EnemyType1, EnemyType2, EnemyType3, EnemyType4, EnemyType5 } from '../entities/EnemyTypes.js';
import { PlayerBullet, EnemyBullet, BulletPool } from '../entities/Bullet.js';
import PowerUp from '../entities/PowerUp.js';
import { 
    GAME_CONFIG, 
    PLAYER_CONFIG, 
    ENEMY_TYPES, 
    BULLET_CONFIG, 
    POWERUP_CONFIG, 
    SPAWN_CONFIG 
} from '../utils/Constants.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // ゲーム状態初期化
        this.gameOver = false;
        this.score = 0;
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
    }

    preload() {
        // 動的にアセットを作成
        this.createAssets();
    }

    createAssets() {
        // プレイヤー
        this.add.graphics()
            .fillStyle(0x00ff00)
            .fillTriangle(0, 0, 15, 30, -15, 30)
            .generateTexture('player', 30, 30);

        // プレイヤーの弾丸
        this.add.graphics()
            .fillStyle(BULLET_CONFIG.PLAYER_BULLET.color)
            .fillCircle(0, 0, BULLET_CONFIG.PLAYER_BULLET.size / 2)
            .generateTexture(BULLET_CONFIG.PLAYER_BULLET.key, BULLET_CONFIG.PLAYER_BULLET.size, BULLET_CONFIG.PLAYER_BULLET.size);

        // 敵の弾丸
        this.add.graphics()
            .fillStyle(BULLET_CONFIG.ENEMY_BULLET.color)
            .fillCircle(0, 0, BULLET_CONFIG.ENEMY_BULLET.size / 2)
            .generateTexture(BULLET_CONFIG.ENEMY_BULLET.key, BULLET_CONFIG.ENEMY_BULLET.size, BULLET_CONFIG.ENEMY_BULLET.size);

        // 敵キャラクター（5種類）
        Object.values(ENEMY_TYPES).forEach(enemyType => {
            this.add.graphics()
                .fillStyle(enemyType.color)
                .fillRect(0, 0, enemyType.size.width, enemyType.size.height)
                .generateTexture(enemyType.key, enemyType.size.width, enemyType.size.height);
        });

        // パワーアップアイテム
        const starGraphics = this.add.graphics();
        starGraphics.fillStyle(0xffd700);
        const points = [];
        const cx = 16, cy = 16, spikes = 5, outerRadius = 16, innerRadius = 8;
        let rot = Math.PI / 2 * 3;
        let x = cx, y = cy;
        let step = Math.PI / spikes;

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            points.push(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            points.push(x, y);
            rot += step;
        }
        starGraphics.beginPath();
        starGraphics.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            starGraphics.lineTo(points[i], points[i + 1]);
        }
        starGraphics.closePath();
        starGraphics.fillPath();
        starGraphics.generateTexture('powerup', 32, 32);
        starGraphics.destroy();

        // 星空背景用
        this.add.graphics()
            .fillStyle(0xffffff)
            .fillCircle(0, 0, 1)
            .generateTexture('star', 2, 2);
    }

    create() {
        // 背景作成
        this.createBackground();

        // プレイヤー作成
        this.createPlayer();

        // 弾丸プール作成
        this.createBulletPools();

        // 敵グループ作成
        this.createEnemyGroup();

        // パワーアップグループ作成
        this.createPowerUpGroup();

        // 入力設定
        this.setupInput();

        // 衝突判定設定
        this.setupCollisions();

        // UI作成
        this.createUI();

        // スポーン設定
        this.setupSpawning();

        // イベントリスナー設定
        this.setupEventListeners();
    }

    createBackground() {
        // 星空背景
        this.starfield = this.add.group();
        for (let i = 0; i < 100; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, GAME_CONFIG.WIDTH),
                Phaser.Math.Between(0, GAME_CONFIG.HEIGHT),
                'star'
            );
            star.speed = Phaser.Math.Between(20, 100);
            this.starfield.add(star);
        }
    }

    createPlayer() {
        this.player = new Player(this, GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 100);
    }

    createBulletPools() {
        this.playerBullets = new BulletPool(this, PlayerBullet, 50);
        this.enemyBullets = new BulletPool(this, EnemyBullet, 100);
    }

    createEnemyGroup() {
        this.enemies = this.add.group();
    }

    createPowerUpGroup() {
        this.powerUps = this.add.group();
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasdKeys = this.input.keyboard.addKeys('W,S,A,D,SPACE');
    }

    setupCollisions() {
        // プレイヤーの弾丸 vs 敵
        this.physics.add.overlap(
            this.playerBullets,
            this.enemies,
            this.hitEnemy,
            null,
            this
        );

        // プレイヤー vs 敵
        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.hitPlayer,
            null,
            this
        );

        // プレイヤー vs 敵の弾丸
        this.physics.add.overlap(
            this.player,
            this.enemyBullets,
            this.hitPlayer,
            null,
            this
        );

        // プレイヤー vs パワーアップ
        this.physics.add.overlap(
            this.player,
            this.powerUps,
            this.collectPowerUp,
            null,
            this
        );
    }

    createUI() {
        // スコア表示
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '20px',
            fill: '#ffffff'
        });

        // HP表示
        this.hpText = this.add.text(GAME_CONFIG.WIDTH - 16, 16, 'HP: 3', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(1, 0);

        // パワーアップ状況表示
        this.powerUpStatusText = this.add.text(16, GAME_CONFIG.HEIGHT - 50, '', {
            fontSize: '14px',
            fill: '#ffff00'
        });
    }

    setupSpawning() {
        // 敵生成タイマー
        this.enemySpawnEvent = this.time.addEvent({
            delay: SPAWN_CONFIG.ENEMY_SPAWN_RATE,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // パワーアップ生成タイマー
        this.powerUpSpawnEvent = this.time.addEvent({
            delay: POWERUP_CONFIG.SPAWN_RATE,
            callback: this.spawnPowerUp,
            callbackScope: this,
            loop: true
        });
    }

    setupEventListeners() {
        // プレイヤーHP変更イベント
        this.events.on('playerHpChanged', (hp) => {
            this.hpText.setText('HP: ' + hp);
        });

        // プレイヤー死亡イベント
        this.events.on('playerDied', () => {
            this.gameOver = true;
            this.showGameOver();
        });

        // 敵撃破イベント
        this.events.on('enemyKilled', (scoreValue) => {
            this.score += scoreValue;
            this.scoreText.setText('Score: ' + this.score);
        });

        // パワーアップ取得イベント
        this.events.on('powerUpCollected', (scoreValue, powerType) => {
            this.score += scoreValue;
            this.scoreText.setText('Score: ' + this.score);
            this.updatePowerUpStatus();
        });
    }

    update(time, delta) {
        if (this.gameOver) return;

        // 背景更新
        this.updateBackground();

        // プレイヤー更新
        this.player.update(time, this.cursors, this.wasdKeys);

        // 弾丸プール更新
        this.playerBullets.update();
        this.enemyBullets.update();

        // 敵更新
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                enemy.update(time, delta);
            }
        });

        // パワーアップ更新
        this.powerUps.children.entries.forEach(powerUp => {
            if (powerUp.active) {
                powerUp.update(time, delta);
            }
        });
    }

    updateBackground() {
        // 星空スクロール
        this.starfield.children.entries.forEach(star => {
            star.y += star.speed * (1/60);
            if (star.y > GAME_CONFIG.HEIGHT) {
                star.y = 0;
                star.x = Phaser.Math.Between(0, GAME_CONFIG.WIDTH);
            }
        });
    }

    spawnEnemy() {
        // ランダムに敵タイプを選択
        const enemyClasses = [EnemyType1, EnemyType2, EnemyType3, EnemyType4, EnemyType5];
        const EnemyClass = enemyClasses[Phaser.Math.Between(0, enemyClasses.length - 1)];
        
        const x = Phaser.Math.Between(SPAWN_CONFIG.ENEMY_SPAWN_X_MIN, SPAWN_CONFIG.ENEMY_SPAWN_X_MAX);
        const enemy = new EnemyClass(this, x, SPAWN_CONFIG.ENEMY_SPAWN_Y);
        
        this.enemies.add(enemy);
    }

    spawnPowerUp() {
        const x = Phaser.Math.Between(50, GAME_CONFIG.WIDTH - 50);
        const powerUp = new PowerUp(this, x, -30);
        
        this.powerUps.add(powerUp);
    }

        hitEnemy(bullet, enemy) {
        // bulletがonHitメソッドを持つか確認して安全に呼び出す
        if (typeof bullet.onHit === 'function') {
            bullet.onHit();
        } else {
            bullet.setActive(false);
            bullet.setVisible(false);
        }

        // enemyがtakeDamageメソッドを持つか確認して安全に呼び出す
        if (typeof enemy.takeDamage === 'function') {
            const isDead = enemy.takeDamage(1);
            if (isDead) {
                this.enemies.remove(enemy);
            }
        } else {
            // 万が一takeDamageが無い場合は敵を削除のみ行う
            this.enemies.remove(enemy);
        }
    }

    hitPlayer(player, object) {
        object.destroy();
        
        const isGameOver = player.takeDamage();
        if (isGameOver) {
            this.enemies.remove(object);
        }
    }

    collectPowerUp(player, powerUp) {
        powerUp.onCollect(player);
        this.powerUps.remove(powerUp);
    }

    updatePowerUpStatus() {
        const stats = this.player.getStats();
        const statusText = `Speed: ${stats.bulletSpeed} | Rate: ${200 - stats.fireRate + 50}% | Count: ${stats.bulletCount} | Spread: ${stats.spreadAngle}°`;
        this.powerUpStatusText.setText(statusText);
    }

    showGameOver() {
        // ゲームオーバー表示
        const gameOverText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const finalScoreText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 60, `Final Score: ${this.score}`, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const restartText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 100, 'Press F5 to Restart', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // スポーン停止
        this.enemySpawnEvent.destroy();
        this.powerUpSpawnEvent.destroy();
    }
}

export default GameScene;