import Phaser from 'phaser';
import { BULLET_CONFIG, GAME_CONFIG } from '../utils/Constants.js';

export class PlayerBullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, BULLET_CONFIG.PLAYER_BULLET.key);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.scene = scene;
        this.damage = 1;
        this.speed = BULLET_CONFIG.PLAYER_BULLET.speed;
    }
    
    fire(x, y, velocityX = 0, velocityY = -this.speed) {
        this.setPosition(x, y);
        this.setVelocity(velocityX, velocityY);
        this.setActive(true);
        this.setVisible(true);
    }
    
    update() {
        // 画面外に出たら削除
        if (this.y < -10 || this.x < -10 || this.x > GAME_CONFIG.WIDTH + 10) {
            this.destroy();
        }
    }
    
    onHit() {
        // 弾丸を非表示・非アクティブ化
        this.setActive(false);
        this.setVisible(false);
        // 必要ならエフェクトやスコア加算処理もここに
    }
}

export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, BULLET_CONFIG.ENEMY_BULLET.key);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.scene = scene;
        this.damage = 1;
        this.speed = BULLET_CONFIG.ENEMY_BULLET.speed;
    }
    
    fire(x, y, targetX = null, targetY = null) {
        this.setPosition(x, y);
        
        if (targetX !== null && targetY !== null) {
            // 目標に向かって発射
            const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
            this.setVelocity(
                Math.cos(angle) * this.speed,
                Math.sin(angle) * this.speed
            );
        } else {
            // 真下に発射
            this.setVelocityY(this.speed);
        }
        
        this.setActive(true);
        this.setVisible(true);
    }
    
    update() {
        // 画面外に出たら削除
        if (this.y > GAME_CONFIG.HEIGHT + 10 || 
            this.x < -10 || 
            this.x > GAME_CONFIG.WIDTH + 10) {
            this.destroy();
        }
    }
    
    onHit() {
        // ヒット時のエフェクトがあれば追加
        this.destroy();
    }
}

// 弾丸プール管理クラス
export class BulletPool extends Phaser.Physics.Arcade.Group {
    constructor(scene, BulletClass, maxSize = 50) {
        super(scene.physics.world, scene);
        
        this.scene = scene;
        this.BulletClass = BulletClass;
        this.maxSize = maxSize;
        
        // プールを事前に作成
        this.createPool();
    }
    
    createPool() {
        for (let i = 0; i < this.maxSize; i++) {
            const bullet = new this.BulletClass(this.scene, 0, 0);
            bullet.setActive(false);
            bullet.setVisible(false);
            this.add(bullet);
        }
    }
    
    fireBullet(x, y, velocityX = 0, velocityY = null) {
        // 非アクティブな弾丸を取得
        const bullet = this.getFirstDead();
        
        if (bullet) {
            if (this.BulletClass === PlayerBullet) {
                bullet.fire(x, y, velocityX, velocityY);
            } else if (this.BulletClass === EnemyBullet) {
                bullet.fire(x, y, velocityX, velocityY);
            }
            return bullet;
        }
        
        return null;
    }
    
    update() {
        // アクティブな弾丸を更新
        this.children.entries.forEach(bullet => {
            if (bullet.active) {
                bullet.update();
            }
        });
    }
    
    // 全ての弾丸を削除
    clear() {
        this.children.entries.forEach(bullet => {
            bullet.setActive(false);
            bullet.setVisible(false);
        });
    }
}