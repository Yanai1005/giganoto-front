import Phaser from 'phaser';
import { EFFECTS_CONFIG, GAME_CONFIG } from '../utils/Constants.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, enemyType) {
        super(scene, x, y, enemyType.key);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.scene = scene;
        this.enemyType = enemyType;
        this.initializeEnemy();
    }
    
    initializeEnemy() {
        // 敵のステータス設定
        this.hp = this.enemyType.hp;
        this.maxHp = this.enemyType.hp;
        this.speed = this.enemyType.speed;
        this.scoreValue = this.enemyType.score;
        this.fireRate = this.enemyType.fireRate;
        
        // 移動設定
        this.setVelocityY(this.speed);
        
        // 発射タイマー
        this.lastFired = 0;
        this.fireInterval = Phaser.Math.Between(1000, 3000); // 1-3秒間隔
        
        // 移動パターン
        this.movementPattern = this.getRandomMovementPattern();
        this.movementTimer = 0;
        this.movementPhase = 0;
    }
    
    update(time, delta) {
        this.updateMovement(time, delta);
        this.updateShooting(time);
        this.checkBounds();
    }
    
    updateMovement(time, delta) {
        this.movementTimer += delta;
        
        switch (this.movementPattern) {
            case 'straight':
                // 直進のみ（デフォルト）
                break;
                
            case 'zigzag':
                // ジグザグ移動
                const zigzagSpeed = 100;
                const zigzagFreq = 0.003;
                this.setVelocityX(Math.sin(this.movementTimer * zigzagFreq) * zigzagSpeed);
                break;
                
            case 'sine':
                // サイン波移動
                const sineSpeed = 80;
                const sineFreq = 0.002;
                this.setVelocityX(Math.sin(this.movementTimer * sineFreq) * sineSpeed);
                break;
                
            case 'spiral':
                // らせん移動
                const spiralRadius = 50;
                const spiralFreq = 0.005;
                const spiralX = Math.cos(this.movementTimer * spiralFreq) * spiralRadius;
                this.setVelocityX(spiralX);
                break;
        }
    }
    
    updateShooting(time) {
        if (time > this.lastFired + this.fireInterval) {
            if (Math.random() < this.fireRate) {
                this.fire();
                this.lastFired = time;
                this.fireInterval = Phaser.Math.Between(1000, 3000);
            }
        }
    }
    
    fire() {
        // プレイヤーの位置を取得
        const player = this.scene.player;
        if (!player || !player.active) return;
        
        // 敵弾を発射
        const bullet = this.scene.enemyBullets.fireBullet(
            this.x, 
            this.y + 10,
            player.x,  // targetX
            player.y   // targetY
        );
        
        // 発射音効果などがあれば追加
    }
    
    takeDamage(damage = 1) {
        this.hp -= damage;
        this.showDamageEffect();
        
        if (this.hp <= 0) {
            this.die();
            return true; // 敵が死亡
        }
        
        return false;
    }
    
    showDamageEffect() {
        // ダメージエフェクト（赤く点滅）
        this.setTint(0xff0000);
        this.scene.time.delayedCall(EFFECTS_CONFIG.DAMAGE_TINT_DURATION, () => {
            if (this.active) {
                this.clearTint();
            }
        });
    }
    
    die() {
        // スコア加算イベント発火
        this.scene.events.emit('enemyKilled', this.scoreValue);
        
        // 死亡エフェクト
        this.setScale(EFFECTS_CONFIG.DEATH_SCALE);
        
        this.scene.time.delayedCall(EFFECTS_CONFIG.DEATH_DURATION, () => {
            this.destroy();
        });
    }
    
    checkBounds() {
        // 画面外に出たら削除
        if (this.y > GAME_CONFIG.HEIGHT + 50) {
            this.destroy();
        }
    }
    
    getRandomMovementPattern() {
        const patterns = ['straight', 'zigzag', 'sine', 'spiral'];
        return patterns[Phaser.Math.Between(0, patterns.length - 1)];
    }
    
    // 特定の敵タイプ用の特殊攻撃
    specialAttack() {
        // 派生クラスでオーバーライド
    }
    
    // 敵の種類に応じた特殊行動
    getSpecialBehavior() {
        switch (this.enemyType.key) {
            case 'enemy_type1':
                // タイプ1: 標準的な敵
                return 'normal';
                
            case 'enemy_type2':
                // タイプ2: 耐久力のある敵
                return 'tanky';
                
            case 'enemy_type3':
                // タイプ3: 高速移動
                return 'fast';
                
            case 'enemy_type4':
                // タイプ4: 素早く弱い
                return 'agile';
                
            case 'enemy_type5':
                // タイプ5: 重装甲、低速
                return 'heavy';
                
            default:
                return 'normal';
        }
    }
}