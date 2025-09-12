import Enemy from './Enemy.js';
import { ENEMY_TYPES } from '../utils/Constants.js';

// タイプ1: 標準的な雑魚敵
export class EnemyType1 extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, ENEMY_TYPES.TYPE1);
        this.setupType1Behavior();
    }
    
    setupType1Behavior() {
        // 基本的な直進移動
        this.movementPattern = 'straight';
    }
}

// タイプ2: 耐久力のある敵
export class EnemyType2 extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, ENEMY_TYPES.TYPE2);
        this.setupType2Behavior();
    }
    
    setupType2Behavior() {
        // ジグザグ移動で回避行動
        this.movementPattern = 'zigzag';
        
        // より頻繁に射撃
        this.fireRate = ENEMY_TYPES.TYPE2.fireRate * 1.5;
    }
    
    takeDamage(damage = 1) {
        const isDead = super.takeDamage(damage);
        
        // HP半分以下で行動パターン変更
        if (!isDead && this.hp <= this.maxHp / 2) {
            this.setTint(0xffaa00); // オレンジに変色
            this.speed *= 1.2; // 速度上昇
            this.setVelocityY(this.speed);
        }
        
        return isDead;
    }
}

// タイプ3: 高速移動敵
export class EnemyType3 extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, ENEMY_TYPES.TYPE3);
        this.setupType3Behavior();
    }
    
    setupType3Behavior() {
        // サイン波移動
        this.movementPattern = 'sine';
        
        // 高速で画面を横切る
        this.dashTimer = 0;
        this.dashInterval = Phaser.Math.Between(2000, 4000);
    }
    
    update(time, delta) {
        super.update(time, delta);
        
        // ダッシュ攻撃
        this.dashTimer += delta;
        if (this.dashTimer > this.dashInterval) {
            this.performDash();
            this.dashTimer = 0;
            this.dashInterval = Phaser.Math.Between(2000, 4000);
        }
    }
    
    performDash() {
        // 一時的に速度大幅UP
        const originalSpeed = this.speed;
        this.speed *= 3;
        this.setVelocityY(this.speed);
        
        // 0.5秒後に元の速度に戻す
        this.scene.time.delayedCall(500, () => {
            if (this.active) {
                this.speed = originalSpeed;
                this.setVelocityY(this.speed);
            }
        });
    }
}

// タイプ4: 素早く弱い敵
export class EnemyType4 extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, ENEMY_TYPES.TYPE4);
        this.setupType4Behavior();
    }
    
    setupType4Behavior() {
        // らせん移動
        this.movementPattern = 'spiral';
        
        // 連射攻撃
        this.burstCount = 0;
        this.burstMax = 3;
        this.burstDelay = 100;
    }
    
    fire() {
        // バースト射撃
        this.fireBurst();
    }
    
    fireBurst() {
        if (this.burstCount < this.burstMax) {
            super.fire();
            this.burstCount++;
            
            this.scene.time.delayedCall(this.burstDelay, () => {
                if (this.active) {
                    this.fireBurst();
                }
            });
        } else {
            this.burstCount = 0;
        }
    }
}

// タイプ5: 重装甲、低速敵
export class EnemyType5 extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, ENEMY_TYPES.TYPE5);
        this.setupType5Behavior();
    }
    
    setupType5Behavior() {
        // 直進だが射撃パターンが特殊
        this.movementPattern = 'straight';
        
        // 扇状射撃の準備
        this.fanShotCount = 5;
        this.fanShotAngle = 30;
    }
    
    fire() {
        // 扇状に弾を発射
        this.fireFanShot();
    }
    
    fireFanShot() {
        const player = this.scene.player;
        if (!player || !player.active) return;
        
        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        
        for (let i = 0; i < this.fanShotCount; i++) {
            const angleOffset = (i - (this.fanShotCount - 1) / 2) * (this.fanShotAngle / (this.fanShotCount - 1));
            const shotAngle = baseAngle + Phaser.Math.DegToRad(angleOffset);
            
            const bullet = this.scene.enemyBullets.fireBullet(this.x, this.y + 10);
            if (bullet) {
                const speed = 120;
                bullet.setVelocity(
                    Math.cos(shotAngle) * speed,
                    Math.sin(shotAngle) * speed
                );
            }
        }
    }
    
    takeDamage(damage = 1) {
        // 装甲効果: 時々ダメージを無効化
        if (Math.random() < 0.3) { // 30%の確率で無効化
            this.showArmorEffect();
            return false;
        }
        
        return super.takeDamage(damage);
    }
    
    showArmorEffect() {
        // 装甲エフェクト（青く点滅）
        this.setTint(0x00ffff);
        this.scene.time.delayedCall(200, () => {
            if (this.active) {
                this.clearTint();
            }
        });
    }
}