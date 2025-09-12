
import Phaser from 'phaser';
import { PLAYER_CONFIG, EFFECTS_CONFIG } from '../utils/Constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        // シーンに追加
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.scene = scene;
        this.initializePlayer();
    }
    
    initializePlayer() {
        // 物理設定
        this.setCollideWorldBounds(true);
        this.setDrag(300, 300); // 慣性制御
        
        // プレイヤーステータス
        this.hp = PLAYER_CONFIG.MAX_HP;
        this.maxHp = PLAYER_CONFIG.MAX_HP;
        this.speed = PLAYER_CONFIG.SPEED;
        
        // 射撃関連
        this.fireRate = PLAYER_CONFIG.FIRE_RATE;
        this.bulletSpeed = PLAYER_CONFIG.BULLET_SPEED;
        this.bulletCount = PLAYER_CONFIG.INITIAL_BULLET_COUNT;
        this.spreadAngle = PLAYER_CONFIG.INITIAL_SPREAD_ANGLE;
        this.lastFired = 0;
        
        // 無敵時間
        this.invulnerable = false;
        this.invulnerabilityDuration = 1000; // 1秒
    }
    
    update(time, cursors, wasdKeys) {
        this.handleMovement(cursors, wasdKeys);
        this.handleShooting(time, cursors, wasdKeys);
    }
    
    handleMovement(cursors, wasdKeys) {
        this.setVelocity(0);
        
        // 左右移動
        if (wasdKeys.A.isDown || cursors.left.isDown) {
            this.setVelocityX(-this.speed);
        } else if (wasdKeys.D.isDown || cursors.right.isDown) {
            this.setVelocityX(this.speed);
        }
        
        // 上下移動
        if (wasdKeys.W.isDown || cursors.up.isDown) {
            this.setVelocityY(-this.speed);
        } else if (wasdKeys.S.isDown || cursors.down.isDown) {
            this.setVelocityY(this.speed);
        }
    }
    
    handleShooting(time, cursors, wasdKeys) {
        const shouldFire = wasdKeys.SPACE.isDown || this.scene.input.activePointer.isDown;
        
        if (shouldFire && time > this.lastFired + this.fireRate) {
            this.fire();
            this.lastFired = time;
        }
    }
    
    fire() {
        const bullets = this.scene.playerBullets;
        
        if (this.bulletCount === 1) {
            // 単発
            const bullet = bullets.create(this.x, this.y - 15, 'player_bullet');
            bullet.setVelocityY(-this.bulletSpeed);
        } else {
            // 複数弾
            for (let i = 0; i < this.bulletCount; i++) {
                const angle = (i - (this.bulletCount - 1) / 2) * this.spreadAngle;
                const bullet = bullets.create(this.x, this.y - 15, 'player_bullet');
                const radians = Phaser.Math.DegToRad(angle);
                
                bullet.setVelocity(
                    Math.sin(radians) * this.bulletSpeed,
                    -Math.cos(radians) * this.bulletSpeed
                );
            }
        }
    }
    
    takeDamage() {
        if (this.invulnerable) return false;
        
        this.hp--;
        this.showDamageEffect();
        this.makeInvulnerable();
        
        // UI更新イベント発火
        this.scene.events.emit('playerHpChanged', this.hp);
        
        if (this.hp <= 0) {
            this.die();
            return true; // ゲームオーバー
        }
        
        return false;
    }
    
    showDamageEffect() {
        this.setTint(0xff0000);
        this.scene.time.delayedCall(EFFECTS_CONFIG.PLAYER_DAMAGE_TINT_DURATION, () => {
            this.clearTint();
        });
    }
    
    makeInvulnerable() {
        this.invulnerable = true;
        
        // 点滅エフェクト
        const blinkTween = this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 100,
            ease: 'Linear',
            yoyo: true,
            repeat: this.invulnerabilityDuration / 200
        });
        
        this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
            this.invulnerable = false;
            this.setAlpha(1);
            blinkTween.stop();
        });
    }
    
    die() {
        this.setTint(0x666666);
        this.scene.events.emit('playerDied');
    }
    
    // パワーアップ効果適用
    applyPowerUp(type) {
        switch (type) {
            case 'speed':
                this.bulletSpeed = Math.min(this.bulletSpeed + 50, 800);
                break;
            case 'rate':
                this.fireRate = Math.max(this.fireRate - 30, 50);
                break;
            case 'count':
                this.bulletCount = Math.min(this.bulletCount + 1, PLAYER_CONFIG.MAX_BULLET_COUNT);
                if (this.spreadAngle === 0) this.spreadAngle = 15;
                break;
            case 'spread':
                this.spreadAngle = Math.min(this.spreadAngle + 5, PLAYER_CONFIG.MAX_SPREAD_ANGLE);
                break;
        }
    }
    
    // ステータス取得
    getStats() {
        return {
            hp: this.hp,
            maxHp: this.maxHp,
            bulletSpeed: this.bulletSpeed,
            fireRate: this.fireRate,
            bulletCount: this.bulletCount,
            spreadAngle: this.spreadAngle
        };
    }
}