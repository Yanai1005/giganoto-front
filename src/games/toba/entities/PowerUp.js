// ~/games/toba/entities/PowerUp.js

import Phaser from 'phaser';
import { POWERUP_CONFIG, GAME_CONFIG, SCORE_CONFIG } from '../utils/Constants.js';

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, powerType = null) {
        // パワーアップタイプがランダムの場合
        if (!powerType) {
            const types = Object.keys(POWERUP_CONFIG.TYPES);
            powerType = types[Phaser.Math.Between(0, types.length - 1)];
        }
        
        super(scene, x, y, 'powerup');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.scene = scene;
        this.powerType = powerType;
        this.setupPowerUp();
    }
    
    setupPowerUp() {
        // 落下速度設定
        this.setVelocityY(POWERUP_CONFIG.FALL_SPEED);
        
        // 画像サイズ調整
        this.setDisplaySize(32, 32);
        
        // パワーアップタイプに応じた色設定
        const typeConfig = POWERUP_CONFIG.TYPES[this.powerType.toUpperCase()];
        if (typeConfig) {
            this.setTint(typeConfig.color);
        }
        
        // 回転エフェクト
        this.rotationSpeed = 2; // ラジアン/秒
        
        // 点滅エフェクト
        this.createBlinkEffect();
        
        // 浮遊エフェクト
        this.createFloatingEffect();
        
        // スコア値
        this.scoreValue = POWERUP_CONFIG.SCORE_VALUE;
    }
    
    createBlinkEffect() {
        // 微妙な点滅エフェクト
        this.scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    createFloatingEffect() {
        // 縦の浮遊エフェクト
        const originalY = this.y;
        this.scene.tweens.add({
            targets: this,
            y: originalY - 10,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    update(time, delta) {
        // 回転
        this.rotation += this.rotationSpeed * (delta / 1000);
        
        // 境界チェック
        this.checkBounds();
        
        // 軽い横移動（ゆらゆら効果）
        const sway = Math.sin(time * 0.003) * 20;
        this.setVelocityX(sway);
    }
    
    checkBounds() {
        // 画面外に出たら削除
        if (this.y > GAME_CONFIG.HEIGHT + 50) {
            this.destroy();
        }
    }
    
    onCollect(player) {
        // パワーアップ効果をプレイヤーに適用
        player.applyPowerUp(this.powerType);
        
        // スコア加算イベント発火
        this.scene.events.emit('powerUpCollected', this.scoreValue, this.powerType);
        
        // 収集エフェクト
        this.createCollectEffect();
        
        // メッセージ表示
        this.showPowerUpMessage();
        
        // アイテム削除
        this.destroy();
    }
    
    createCollectEffect() {
        // 収集時のエフェクト（拡大して消失）
        this.scene.tweens.add({
            targets: this,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                // パーティクル効果があれば追加
            }
        });
    }
    
    showPowerUpMessage() {
        const typeConfig = POWERUP_CONFIG.TYPES[this.powerType.toUpperCase()];
        if (!typeConfig) return;
        
        // メッセージテキスト作成
        const message = this.scene.add.text(
            this.x, 
            this.y - 30, 
            typeConfig.name, 
            {
                fontSize: '18px',
                fill: '#ffff00',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // メッセージアニメーション
        this.scene.tweens.add({
            targets: message,
            y: message.y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                message.destroy();
            }
        });
    }
    
    // 静的メソッド: ランダムなパワーアップタイプを取得
    static getRandomType() {
        const types = Object.keys(POWERUP_CONFIG.TYPES);
        return types[Phaser.Math.Between(0, types.length - 1)].toLowerCase();
    }
    
    // 静的メソッド: パワーアップの説明を取得
    static getDescription(powerType) {
        const descriptions = {
            speed: 'プレイヤーの弾速度が上昇します',
            rate: '弾の発射間隔が短縮されます',
            count: '弾の発射数が増加します',
            spread: '弾の拡散角度が変更されます'
        };
        
        return descriptions[powerType] || '不明なパワーアップです';
    }
    
    // パワーアップの効果値を取得
    getEffectValues() {
        switch (this.powerType) {
            case 'speed':
                return { increase: 50, max: 800 };
            case 'rate':
                return { decrease: 30, min: 50 };
            case 'count':
                return { increase: 1, max: 5 };
            case 'spread':
                return { increase: 5, max: 45 };
            default:
                return {};
        }
    }
}