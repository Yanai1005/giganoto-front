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
    this.add.text(400, 280, '一番振動が強い場所を探そう！', {
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
    this.add.text(400, 350, 'Nintendo Switch 2のひみつ展のオマージュ', {
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
    this.add.text(400, 560, 'マウスで操作、クリックで決定', {
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
    circle1.fillCircle(150, 80, 80);
    
    const circle2 = this.add.graphics();
    circle2.fillStyle(0x5a4a7a, 0.08);
    circle2.fillCircle(650, 480, 120);
    
    const circle3 = this.add.graphics();
    circle3.fillStyle(0x6a5a8a, 0.06);
    circle3.fillCircle(700, 120, 60);

    // Joy-Conアイコンの作成（シンプルな図形で表現）
    this.joyconIcon = this.createJoyConIcon(400, 100);

    // メインタイトル（グロー効果付き）
    this.titleText = this.add.text(400, 160, 'Joy-Con接続', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      stroke: '#4a9eff',
      strokeThickness: 2
    }).setOrigin(0.5);

    // 接続手順カード
    this.instructionBox = this.createInstructionCard();

    // スタイリッシュな接続ボタン
    this.connectButton = this.createStylishButton(400, 440, 'Joy-Con接続', '#00d4aa', '#00b899');
    
    this.connectButton.on('pointerdown', async () => {
      await this.connectJoyCon(this.connectButton);
    });

    // 戻るボタン
    this.backButton = this.createStylishButton(400, 500, 'タイトルに戻る', '#4a9eff', '#3a8eef');
    
    this.backButton.on('pointerdown', () => {
      this.transitionToTitle();
    });

    // WebHID APIサポート確認
    if (!('hid' in navigator)) {
      const warningBox = this.add.graphics();
      warningBox.fillStyle(0xff4444, 0.2);
      warningBox.fillRoundedRect(80, 520, 640, 50, 10);
      warningBox.lineStyle(2, 0xff6666, 1);
      warningBox.strokeRoundedRect(80, 520, 640, 50, 10);
      
      this.add.text(400, 545, '⚠️ このブラウザはWebHID APIに対応していません', {
        fontSize: '16px',
        fill: '#ff8888',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5);
    }

    // パーティクル効果
    this.createParticleEffect();
    
    // 操作説明（画面下部）
    this.add.text(400, 580, 'マウスで操作、クリックで決定', {
      fontSize: '12px',
      fill: '#8899bb',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic'
    }).setOrigin(0.5);
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

  // ゲーム終了時にタイトル画面に戻るためのメソッド
  returnToTitleFromGame() {
    console.log('ゲームからタイトルに戻る処理開始');
    
    // 全てのイベントハンドラーをクリア
    this.clearAllEventHandlers();
    
    // 現在のゲームを停止
    if (this.vibrationHuntGame) {
      this.vibrationHuntGame.destroy();
      this.vibrationHuntGame = null;
    }
    
    // 画面をクリア
    this.children.removeAll();
    
    // タイトル画面を表示
    this.createTitleScreen();
    
    console.log('タイトル画面に戻る処理完了');
  }

  createJoyConIcon(x, y) {
    // Joy-Con (R) のシンプルなアイコン
    const joyconGraphics = this.add.graphics();
    
    // メイン部分
    joyconGraphics.fillStyle(0x00d4aa, 1);
    joyconGraphics.fillRoundedRect(-25, -30, 50, 60, 8);
    
    // ボタン部分
    joyconGraphics.fillStyle(0x4a9eff, 1);
    joyconGraphics.fillCircle(0, -10, 6);
    joyconGraphics.fillCircle(10, 0, 4);
    joyconGraphics.fillCircle(-10, 0, 4);
    joyconGraphics.fillCircle(0, 10, 4);
    
    // グロー効果
    const glowGraphics = this.add.graphics();
    glowGraphics.fillStyle(0x00d4aa, 0.3);
    glowGraphics.fillCircle(0, 0, 40);
    
    // コンテナとして返すために両方の要素をまとめる
    const iconContainer = this.add.container(x, y);
    iconContainer.add([joyconGraphics, glowGraphics]);
    
    return iconContainer;
  }

  createInstructionCard() {
    // カード背景（より美しいデザイン）
    const cardGraphics = this.add.graphics();
    
    // グラデーション背景
    cardGraphics.fillGradientStyle(
      0x2a2a4a, 0x2a2a4a,
      0x3a3a5a, 0x3a3a5a,
      0.9
    );
    cardGraphics.fillRoundedRect(120, 240, 560, 140, 20);
    
    // 外側のグロー効果
    cardGraphics.fillStyle(0x4a9eff, 0.2);
    cardGraphics.fillRoundedRect(115, 235, 570, 150, 25);
    
    // 境界線
    cardGraphics.lineStyle(3, 0x4a9eff, 0.6);
    cardGraphics.strokeRoundedRect(120, 240, 560, 140, 20);

    // カードタイトル
    const cardTitle = this.add.text(400, 260, '接続手順', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      stroke: '#4a9eff',
      strokeThickness: 1
    }).setOrigin(0.5);

    // 手順テキスト
    const steps = [
      'Joy-Con (R) のペアリングボタンを長押し',
      'LEDが点滅するまで待つ',
      '下の「Joy-Con接続」ボタンをクリック'
    ];

    const stepElements = [];
    steps.forEach((step, index) => {
      // ステップ番号の装飾（より美しく）
      const stepBg = this.add.graphics();
      stepBg.fillStyle(0x4a9eff, 1);
      stepBg.fillCircle(150, 295 + index * 30, 12);
      stepBg.lineStyle(2, 0xffffff, 1);
      stepBg.strokeCircle(150, 295 + index * 30, 12);
      
      const stepNumber = this.add.text(150, 295 + index * 30, (index + 1).toString(), {
        fontSize: '14px',
        fill: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
      }).setOrigin(0.5);

      // ステップテキスト
      const stepText = this.add.text(180, 295 + index * 30, step, {
        fontSize: '16px',
        fill: '#c8d6ff',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0, 0.5);
      
      stepElements.push(stepBg, stepNumber, stepText);
    });
    
    // コンテナとして返すために全ての要素をまとめる
    const cardContainer = this.add.container(0, 0);
    cardContainer.add([cardGraphics, cardTitle, ...stepElements]);
    
    return cardContainer;
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
    // パーティクル配列を初期化
    this.particles = [];
    this.particleTweens = [];
    
    // 浮遊するパーティクル効果
    for (let i = 0; i < 15; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(0x4a9eff, 0.6);
      particle.fillCircle(0, 0, Math.random() * 3 + 1);
      
      particle.x = Math.random() * 800;
      particle.y = Math.random() * 600;
      
      this.particles.push(particle);
      
      // ゆっくりとした浮遊アニメーション
      const tween = this.tweens.add({
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
      
      this.particleTweens.push(tween);
    }
  }

  stopParticleEffect() {
    // パーティクルアニメーションを停止
    if (this.particleTweens) {
      this.particleTweens.forEach(tween => {
        if (tween) tween.remove();
      });
      this.particleTweens = [];
    }
    
    // パーティクルを非表示
    if (this.particles) {
      this.particles.forEach(particle => {
        if (particle) particle.setVisible(false);
      });
    }
  }

  resumeParticleEffect() {
    // パーティクルを再表示
    if (this.particles) {
      this.particles.forEach(particle => {
        if (particle) particle.setVisible(true);
      });
    }
  }

  async connectJoyCon(button) {
    try {
      // ボタンの状態を更新
      button.buttonText.setText('接続中...');
      button.setScale(1);
      
      // パーティクル効果を停止
      this.stopParticleEffect();

      // 振動探しゲーム専用のJoyConHIDManagerをインポート
      const { JoyConHIDManager } = await import('./JoyConHIDManager.js');
      
      this.joyConManager = new JoyConHIDManager(this);
      const result = await this.joyConManager.connect();

      if (result === 'connected') {
        button.buttonText.setText('接続成功！');
        
        // 成功エフェクト
        this.createSuccessEffect(400, 440);
        
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
        
        // パーティクル効果を再開
        this.resumeParticleEffect();
        
        setTimeout(() => {
          button.buttonText.setText('Joy-Con接続');
        }, 2000);
      }
    } catch (error) {
      console.error('Joy-Con接続エラー:', error);
      button.buttonText.setText('接続エラー - 再試行');
      
      // パーティクル効果を再開
      this.resumeParticleEffect();
      
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
    console.log('VibrationHuntScene: ゲーム開始処理開始');
    
    // 画面状態をゲームに設定
    this.currentScreen = 'game';
    
    // 既存のイベントハンドラーをクリア
    this.clearAllEventHandlers();
    
    // パーティクル効果を停止
    this.stopParticleEffect();
    
    // フェードアウト効果でゲーム開始
    const fadeGraphics = this.add.graphics();
    fadeGraphics.fillStyle(0x000000, 0);
    fadeGraphics.fillRect(0, 0, 800, 600);
    
    this.tweens.add({
      targets: fadeGraphics,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
      onComplete: async () => {
        // 接続画面の要素のみを個別に削除（デバッグUIは残す）
        console.log('接続画面の要素を削除開始');
        
        // 接続画面の要素を個別に削除
        if (this.joyconIcon) this.joyconIcon.destroy();
        if (this.titleText) this.titleText.destroy();
        if (this.instructionBox) this.instructionBox.destroy();
        if (this.connectButton) this.connectButton.destroy();
        if (this.backButton) this.backButton.destroy();
        
        // デバッグUIを先に作成
        this.createJoyConDebugUI();
        this.input.keyboard.on('keydown-D', () => {
          if (this.debugText) this.debugText.visible = !this.debugText.visible;
        });
        
        // ゲーム開始
        console.log('VibrationHuntGame インスタンス作成開始');
        
        try {
          console.log('VibrationHuntGameクラスをインポート中...');
          const { VibrationHuntGame } = await import('./VibrationHuntGame.js');
          console.log('VibrationHuntGameクラスのインポート完了');
          
          console.log('VibrationHuntGameインスタンス作成中...');
          this.vibrationHuntGame = new VibrationHuntGame(this, this.joyConManager);
          console.log('VibrationHuntGameインスタンス作成完了');
          
          console.log('VibrationHuntGame.startGame()実行中...');
          await this.vibrationHuntGame.startGame();
          console.log('VibrationHuntGame.startGame()実行完了');
          
          // ゲーム開始後にデバッグUIを再作成（確実に表示するため）
          console.log('ゲーム開始後のデバッグUI再作成開始');
          if (!this.debugText || this.debugText.scene === null) {
            this.createJoyConDebugUI();
            console.log('デバッグUIを再作成しました');
          } else {
            // 既存のデバッグUIを最前面に移動
            this.debugText.setDepth(2000);
            console.log('既存のデバッグUIを最前面に移動しました');
          }
          
        } catch (error) {
          console.error('VibrationHuntGame作成・開始エラー:', error);
          console.error('エラースタック:', error.stack);
          
          // エラー表示
          this.add.text(400, 300, 'ゲーム開始エラーが発生しました', {
            fontSize: '24px',
            fill: '#ff4444',
            fontFamily: 'Arial, sans-serif'
          }).setOrigin(0.5);
          
          this.add.text(400, 340, 'コンソールを確認してください', {
            fontSize: '16px',
            fill: '#ff8888',
            fontFamily: 'Arial, sans-serif'
          }).setOrigin(0.5);
          
          // 戻るボタンを表示
          const errorBackButton = this.createStylishButton(400, 400, 'タイトルに戻る', '#ff4444', '#ff6666');
          errorBackButton.on('pointerdown', () => {
            this.transitionToTitle();
          });
        }
        
        console.log('VibrationHuntScene: ゲーム開始処理完了');
      }
    });
  }

  clearAllEventHandlers() {
    // シーンの全てのイベントハンドラーをクリア
    console.log('VibrationHuntScene: 全てのイベントハンドラーをクリア開始');
    
    // シーンレベルの入力イベントをクリア
    this.input.removeAllListeners();
    console.log('シーンレベルの入力イベントをクリア');
    
    // 全ての子オブジェクトのイベントハンドラーをクリア
    let clearedCount = 0;
    this.children.each((child) => {
      if (child.input && child.input.enabled) {
        child.removeAllListeners();
        child.disableInteractive();
        clearedCount++;
        console.log('子オブジェクトのイベントハンドラーを削除:', child.constructor.name);
      }
    });
    
    console.log(`合計 ${clearedCount} 個の子オブジェクトのイベントハンドラーをクリア`);
    
    // パーティクル効果のTweenをクリア
    if (this.particleTweens) {
      this.particleTweens.forEach(tween => {
        if (tween) tween.remove();
      });
      this.particleTweens = [];
      console.log('パーティクルTweenをクリア');
    }
    
    console.log('VibrationHuntScene: 全てのイベントハンドラーをクリア完了');
  }

  createJoyConDebugUI() {
    console.log('デバッグUI作成開始');
    
    // デバッグ情報表示用のテキスト
    this.debugText = this.add.text(10, 10, 'Joy-Con Debug Info (Dキーで切替)\n接続状態: 確認中...\nマネージャー: ' + (this.joyConManager ? '有効' : '無効'), {
      fontSize: '14px',
      fill: '#00ff00',
      fontFamily: 'Courier, monospace',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    });
    
    this.debugText.setDepth(2000); // より確実に最前面に表示
    this.debugText.setScrollFactor(0); // カメラの影響を受けない
    
    console.log('デバッグUI作成完了');
    
    // Joy-Conの状態を定期的に更新
    if (this.joyConManager) {
      this.debugUpdateTimer = this.time.addEvent({
        delay: 100, // 100ms間隔
        callback: this.updateDebugInfo,
        callbackScope: this,
        loop: true
      });
    }
  }

  updateDebugInfo() {
    if (!this.debugText || !this.joyConManager) return;
    
    // JoyConHIDManagerの実際のプロパティを使用
    const device = this.joyConManager.device;
    const inputState = this.joyConManager.inputState;
    
    if (!device || !device.opened) {
      this.debugText.setText('Joy-Con Debug Info (Dキーで切替)\n接続状態: 未接続\nデバイス: ' + (device ? '存在するが未接続' : '存在しない'));
      return;
    }
    
    const debugInfo = [
      'Joy-Con Debug Info (Dキーで切替)',
      `接続状態: 接続済み (${device.productName})`,
      `デバイスID: ${device.productId.toString(16)}`,
      `スティックX: ${inputState.rightStick.x.toFixed(3)}`,
      `スティックY: ${inputState.rightStick.y.toFixed(3)}`,
      `生データ byte3: ${inputState.rawButtons.byte3.toString(2).padStart(8,'0')}`,
      `生データ byte4: ${inputState.rawButtons.byte4.toString(2).padStart(8,'0')}`,
      `生データ byte5: ${inputState.rawButtons.byte5.toString(2).padStart(8,'0')}`,
      `Aボタン: ${inputState.buttons.a ? 'ON' : 'OFF'}`,
      `レポート数: ${this.joyConManager.reportCount || 0}`
    ];
    
    this.debugText.setText(debugInfo.join('\n'));
  }

  destroy() {
    if (this.vibrationHuntGame) {
      this.vibrationHuntGame.destroy();
    }
    if (this.joyConManager) {
      this.joyConManager.destroy();
    }
    if (this.debugUpdateTimer) {
      this.debugUpdateTimer.destroy();
    }
  }
}

export default VibrationHuntScene; 