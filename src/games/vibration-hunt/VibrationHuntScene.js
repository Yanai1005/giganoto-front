import Phaser from 'phaser';
import { VibrationHuntGame } from './VibrationHuntGame.js';

class VibrationHuntScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VibrationHuntScene' });
    this.joyConManager = null;
    this.currentScreen = 'title'; // 'title', 'connection', 'game'
  }

  create() {
    // タイトル画面から開始
    this.createTitleScreen();
  }

  createTitleScreen() {
    this.currentScreen = 'title';
    
    // 美しいグラデーション背景
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(
      0x0a0a1a, 0x1a1a3a, // 上部：深い紺色
      0x2a1a4a, 0x3a2a5a, // 下部：紫がかった色
      1
    );
    graphics.fillRect(0, 0, 800, 600);
    
    // 装飾的な円形要素（背景）
    const circle1 = this.add.graphics();
    circle1.fillStyle(0x4a3a6a, 0.1);
    circle1.fillCircle(150, 100, 80);
    
    const circle2 = this.add.graphics();
    circle2.fillStyle(0x5a4a7a, 0.08);
    circle2.fillCircle(650, 500, 120);
    
    const circle3 = this.add.graphics();
    circle3.fillStyle(0x6a5a8a, 0.06);
    circle3.fillCircle(700, 150, 60);

    // 振動エフェクトアイコン
    this.createVibrationIcon(400, 150);

    // メインタイトル
    const mainTitle = this.add.text(400, 220, '強震動探し', {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      stroke: '#00d4aa',
      strokeThickness: 3
    }).setOrigin(0.5);

    // サブタイトル
    this.add.text(400, 280, 'HD振動で隠された宝を見つけよう', {
      fontSize: '18px',
      fill: '#b8c6ff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // ゲーム説明
    this.add.text(400, 320, 'Joy-Conの振動を頼りに隠された宝を見つけよう！', {
      fontSize: '16px',
      fill: '#b8c6ff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Nintendo Switch 2のひみつ展風の説明
    this.add.text(400, 350, 'Nintendo Switch 2のひみつ展にインスパイアされたゲーム', {
      fontSize: '12px',
      fill: '#8899bb',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // スタートボタン
    const startButton = this.createStylishButton(400, 420, 'ゲームスタート', '#00d4aa', '#00b899');
    
    startButton.on('pointerdown', () => {
      this.transitionToConnection();
    });

    // 戻るボタン
    const backButton = this.createStylishButton(400, 490, 'ホームに戻る', '#4a9eff', '#3a8eef');
    
    backButton.on('pointerdown', () => {
      window.location.href = '/';
    });

    // タイトルアニメーション
    this.tweens.add({
      targets: mainTitle,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // パーティクル効果
    this.createParticleEffect();

    // 操作説明
    this.add.text(400, 560, 'マウス/Joy-Conで操作、クリック/Aボタンで決定', {
      fontSize: '14px',
      fill: '#6677aa',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
  }

  createVibrationIcon(x, y) {
    // 振動を表現するアイコン
    const iconContainer = this.add.container(x, y);
    
    // 中央の円
    const centerCircle = this.add.graphics();
    centerCircle.fillStyle(0x00d4aa, 1);
    centerCircle.fillCircle(0, 0, 20);
    
    // 振動波の表現
    const waves = [];
    for (let i = 1; i <= 3; i++) {
      const wave = this.add.graphics();
      wave.lineStyle(3, 0x00d4aa, 0.7 - i * 0.2);
      wave.strokeCircle(0, 0, 20 + i * 15);
      waves.push(wave);
      
      // 波のアニメーション
      this.tweens.add({
        targets: wave,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 1500,
        ease: 'Power2',
        repeat: -1,
        delay: i * 300
      });
    }
    
    iconContainer.add([centerCircle, ...waves]);
    
    // グロー効果
    const glow = this.add.graphics();
    glow.fillStyle(0x00d4aa, 0.3);
    glow.fillCircle(x, y, 60);
    
    this.tweens.add({
      targets: glow,
      alpha: 0.1,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  transitionToConnection() {
    // フェードアウト効果
    const fadeGraphics = this.add.graphics();
    fadeGraphics.fillStyle(0x000000, 0);
    fadeGraphics.fillRect(0, 0, 800, 600);
    
    this.tweens.add({
      targets: fadeGraphics,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // タイトル画面をクリア
        this.children.removeAll();
        
        // Joy-Con接続画面を表示
        this.createJoyConConnectionUI();
      }
    });
  }

  createJoyConConnectionUI() {
    this.currentScreen = 'connection';
    
    // 美しいグラデーション背景
    const graphics = this.add.graphics();
    
    // メインの背景グラデーション（Nintendo Switch風）
    graphics.fillGradientStyle(
      0x0a0a1a, 0x1a1a3a, // 上部：深い紺色
      0x2a1a4a, 0x3a2a5a, // 下部：紫がかった色
      1
    );
    graphics.fillRect(0, 0, 800, 600);
    
    // 装飾的な円形要素（背景）
    const circle1 = this.add.graphics();
    circle1.fillStyle(0x4a3a6a, 0.1);
    circle1.fillCircle(150, 100, 80);
    
    const circle2 = this.add.graphics();
    circle2.fillStyle(0x5a4a7a, 0.08);
    circle2.fillCircle(650, 500, 120);
    
    const circle3 = this.add.graphics();
    circle3.fillStyle(0x6a5a8a, 0.06);
    circle3.fillCircle(700, 150, 60);

    // Joy-Conアイコンの作成（シンプルな図形で表現）
    this.createJoyConIcon(400, 120);

    // メインタイトル（グロー効果付き）
    this.add.text(400, 180, 'Joy-Con接続', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      stroke: '#4a9eff',
      strokeThickness: 2
    }).setOrigin(0.5);

    // サブタイトル
    this.add.text(400, 220, 'HD振動で隠された宝を見つけよう', {
      fontSize: '18px',
      fill: '#b8c6ff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // 接続手順カード
    this.createInstructionCard();

    // スタイリッシュな接続ボタン
    const connectButton = this.createStylishButton(400, 420, 'Joy-Con接続', '#00d4aa', '#00b899');
    
    connectButton.on('pointerdown', async () => {
      await this.connectJoyCon(connectButton);
    });

    // 戻るボタン
    const backButton = this.createStylishButton(400, 490, 'タイトルに戻る', '#4a9eff', '#3a8eef');
    
    backButton.on('pointerdown', () => {
      this.transitionToTitle();
    });

    // WebHID APIサポート確認
    if (!('hid' in navigator)) {
      const warningBox = this.add.graphics();
      warningBox.fillStyle(0xff4444, 0.2);
      warningBox.fillRoundedRect(100, 530, 600, 50, 10);
      warningBox.lineStyle(2, 0xff6666, 1);
      warningBox.strokeRoundedRect(100, 530, 600, 50, 10);
      
      this.add.text(400, 555, '⚠️ このブラウザはWebHID APIに対応していません', {
        fontSize: '16px',
        fill: '#ff8888',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5);
    }

    // パーティクル効果
    this.createParticleEffect();
  }

  transitionToTitle() {
    // フェードアウト効果
    const fadeGraphics = this.add.graphics();
    fadeGraphics.fillStyle(0x000000, 0);
    fadeGraphics.fillRect(0, 0, 800, 600);
    
    this.tweens.add({
      targets: fadeGraphics,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // 接続画面をクリア
        this.children.removeAll();
        
        // タイトル画面を表示
        this.createTitleScreen();
      }
    });
  }

  createJoyConIcon(x, y) {
    // Joy-Con (R) のシンプルなアイコン
    const joyconGraphics = this.add.graphics();
    
    // メイン部分
    joyconGraphics.fillStyle(0x00d4aa, 1);
    joyconGraphics.fillRoundedRect(x - 25, y - 30, 50, 60, 8);
    
    // ボタン部分
    joyconGraphics.fillStyle(0x4a9eff, 1);
    joyconGraphics.fillCircle(x, y - 10, 6);
    joyconGraphics.fillCircle(x + 10, y, 4);
    joyconGraphics.fillCircle(x - 10, y, 4);
    joyconGraphics.fillCircle(x, y + 10, 4);
    
    // グロー効果
    const glowGraphics = this.add.graphics();
    glowGraphics.fillStyle(0x00d4aa, 0.3);
    glowGraphics.fillCircle(x, y, 40);
  }

  createInstructionCard() {
    // カード背景
    const cardGraphics = this.add.graphics();
    cardGraphics.fillStyle(0x2a2a4a, 0.8);
    cardGraphics.fillRoundedRect(150, 270, 500, 120, 15);
    cardGraphics.lineStyle(2, 0x4a9eff, 0.5);
    cardGraphics.strokeRoundedRect(150, 270, 500, 120, 15);

    // 手順テキスト
    const steps = [
      '1. Joy-Con (R) のペアリングボタンを長押し',
      '2. LEDが点滅するまで待つ',
      '3. 「Joy-Con接続」ボタンをクリック'
    ];

    steps.forEach((step, index) => {
      this.add.text(170, 295 + index * 25, step, {
        fontSize: '14px',
        fill: '#c8d6ff',
        fontFamily: 'Arial, sans-serif'
      });

      // ステップ番号の装飾
      const stepCircle = this.add.graphics();
      stepCircle.fillStyle(0x4a9eff, 1);
      stepCircle.fillCircle(160, 302 + index * 25, 8);
      
      this.add.text(160, 302 + index * 25, (index + 1).toString(), {
        fontSize: '12px',
        fill: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
      }).setOrigin(0.5);
    });
  }

  createStylishButton(x, y, text, primaryColor, hoverColor) {
    // ボタンのコンテナ
    const buttonContainer = this.add.container(x, y);

    // ボタン背景（グラデーション効果）
    const buttonBg = this.add.graphics();
    const primaryColorInt = parseInt(primaryColor.replace('#', ''), 16);
    const hoverColorInt = parseInt(hoverColor.replace('#', ''), 16);
    
    buttonBg.fillGradientStyle(
      primaryColorInt,
      primaryColorInt,
      hoverColorInt,
      hoverColorInt,
      1
    );
    buttonBg.fillRoundedRect(-120, -25, 240, 50, 25);

    // ボタンのグロー効果
    const glowBg = this.add.graphics();
    glowBg.fillStyle(primaryColorInt, 0.3);
    glowBg.fillRoundedRect(-125, -30, 250, 60, 30);

    // ボタンテキスト
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    // コンテナに追加
    buttonContainer.add([glowBg, buttonBg, buttonText]);
    buttonContainer.setSize(240, 50);
    buttonContainer.setInteractive();

    // ホバー効果
    buttonContainer.on('pointerover', () => {
      buttonContainer.setScale(1.05);
      this.tweens.add({
        targets: glowBg,
        alpha: 0.5,
        duration: 200,
        ease: 'Power2'
      });
    });

    buttonContainer.on('pointerout', () => {
      buttonContainer.setScale(1);
      this.tweens.add({
        targets: glowBg,
        alpha: 0.3,
        duration: 200,
        ease: 'Power2'
      });
    });

    // クリック効果
    buttonContainer.on('pointerdown', () => {
      buttonContainer.setScale(0.95);
    });

    buttonContainer.on('pointerup', () => {
      buttonContainer.setScale(1.05);
    });

    // 参照用にテキストオブジェクトを保存
    buttonContainer.buttonText = buttonText;
    buttonContainer.buttonBg = buttonBg;

    return buttonContainer;
  }

  createParticleEffect() {
    // 浮遊するパーティクル効果
    for (let i = 0; i < 15; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(0x4a9eff, 0.6);
      particle.fillCircle(0, 0, Math.random() * 3 + 1);
      
      particle.x = Math.random() * 800;
      particle.y = Math.random() * 600;
      
      // ゆっくりとした浮遊アニメーション
      this.tweens.add({
        targets: particle,
        y: particle.y - 50,
        alpha: 0,
        duration: Math.random() * 3000 + 2000,
        ease: 'Power1',
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          particle.y = 650;
          particle.alpha = 0.6;
          particle.x = Math.random() * 800;
        }
      });
    }
  }

  async connectJoyCon(button) {
    try {
      // ボタンの状態を更新
      button.buttonText.setText('接続中...');
      button.setScale(1);
      
      // ローディングアニメーション
      const loadingCircle = this.add.graphics();
      loadingCircle.lineStyle(4, 0x00d4aa, 1);
      loadingCircle.strokeCircle(400, 420, 30);
      
      this.tweens.add({
        targets: loadingCircle,
        rotation: Math.PI * 2,
        duration: 1000,
        repeat: -1,
        ease: 'Linear'
      });

      // 振動探しゲーム専用のJoyConHIDManagerをインポート
      const { JoyConHIDManager } = await import('./JoyConHIDManager.js');
      
      this.joyConManager = new JoyConHIDManager(this);
      const result = await this.joyConManager.connect();

      // ローディング停止
      loadingCircle.destroy();

      if (result === 'connected') {
        button.buttonText.setText('接続成功！');
        
        // 成功エフェクト
        this.createSuccessEffect(400, 420);
        
        // 2秒後にゲーム開始
        setTimeout(() => {
          this.startGame();
        }, 2000);
        
      } else if (result === 'already-connected') {
        button.buttonText.setText('既に接続済み');
        
        setTimeout(() => {
          this.startGame();
        }, 1000);
        
      } else {
        button.buttonText.setText('接続失敗 - 再試行');
        
        setTimeout(() => {
          button.buttonText.setText('Joy-Con接続');
        }, 2000);
      }
    } catch (error) {
      console.error('Joy-Con接続エラー:', error);
      button.buttonText.setText('接続エラー - 再試行');
      
      setTimeout(() => {
        button.buttonText.setText('Joy-Con接続');
      }, 2000);
    }
  }

  createSuccessEffect(x, y) {
    // 成功時のパーティクル爆発
    for (let i = 0; i < 20; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(0x00ff88, 1);
      particle.fillCircle(0, 0, 4);
      particle.x = x;
      particle.y = y;
      
      const angle = (i / 20) * Math.PI * 2;
      const speed = Math.random() * 100 + 50;
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  startGame() {
    this.currentScreen = 'game';
    
    // フェードアウト効果でゲーム開始
    const fadeGraphics = this.add.graphics();
    fadeGraphics.fillStyle(0x000000, 0);
    fadeGraphics.fillRect(0, 0, 800, 600);
    
    this.tweens.add({
      targets: fadeGraphics,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // 接続画面をクリア
        this.children.removeAll();
        
        // ゲーム開始
        this.vibrationHuntGame = new VibrationHuntGame(this, this.joyConManager);
        this.vibrationHuntGame.startGame();
      }
    });
  }

  destroy() {
    if (this.vibrationHuntGame) {
      this.vibrationHuntGame.destroy();
    }
    if (this.joyConManager) {
      this.joyConManager.destroy();
    }
  }
}

export default VibrationHuntScene; 