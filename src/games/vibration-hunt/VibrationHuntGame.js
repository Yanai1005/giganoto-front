import Phaser from 'phaser';

export class VibrationHuntGame {
  constructor(scene, joyConManager) {
    this.scene = scene;
    this.jc = joyConManager;
    this.gameActive = false;
    this.targetPosition = { x: 0, y: 0 };
    this.currentPosition = { x: 400, y: 350 }; // 初期位置を中央に設定
    this.gameArea = { width: 800, height: 600 };
    this.difficulty = 1;
    this.score = 0;
    this.round = 1;
    this.maxRounds = 5;
    
    // 実際のゲームエリアの境界定数
    this.GAME_AREA_BOUNDS = {
      left: 50,
      right: 750,
      top: 250,
      bottom: 550
    };
    
    // Joy-Con操作用の設定
    this.cursorSpeed = 8; // カーソル移動速度を上げる
    this.inputUpdateInterval = null;
    
    // ゲーム開始直後のボタン誤検出を防ぐための猶予期間
    this.gameStartTime = null;
    this.buttonGracePeriod = 1000; // 1秒の猶予期間（操作性重視）
    
    this.vibrationSettings = {
      baseFreq: { low: 80, high: 160 },
      maxAmplitude: 0.8,
      minAmplitude: 0.1,
      maxDistance: 300
    };
    this.uiGroup = null; // ゲームUI要素を管理するグループ
  }

  startGame() {
    console.log('VibrationHuntGame開始');
    
    // 既存のイベントハンドラーをクリア（安全のため）
    this.clearEventHandlers();
    
    // デバッグUI以外の要素を削除
    console.log('デバッグUI以外の要素を削除開始');
    this.scene.children.each((child) => {
      // デバッグテキストは削除しない
      if (child !== this.scene.debugText && child !== this.scene.debugUpdateTimer) {
        child.destroy();
      }
    });
    
    console.log('デバッグUI以外の要素を削除完了');
    
    this.gameActive = true;
    this.round = 1;
    this.score = 0;
    this.aButtonPressed = false; // Aボタン状態をリセット
    this.xButtonPressed = false; // Xボタン状態もリセット
    
    // ボタン状態を完全にリセットするため、少し待ってからラウンド開始
    setTimeout(() => {
      this.startNewRound();
    }, 500); // 500ms待機してからラウンド開始
  }

  clearEventHandlers() {
    console.log('VibrationHuntGame: イベントハンドラーをクリア開始');
    
    // ゲームを非アクティブに
    this.gameActive = false;
    
    // シーン内の全てのインタラクティブオブジェクトのイベントを削除
    this.scene.children.each((child) => {
      if (child.input && child.input.enabled) {
        child.removeAllListeners();
        child.disableInteractive();
        console.log('子オブジェクトのイベントハンドラーを削除:', child.constructor.name);
      }
    });
    
    // 入力監視を停止
    if (this.inputUpdateInterval) {
      clearInterval(this.inputUpdateInterval);
      this.inputUpdateInterval = null;
      console.log('入力監視インターバルを停止');
    }
    
    // UIグループもクリア
    if (this.uiGroup) {
      this.uiGroup.destroy(true);
      this.uiGroup = null;
    }
    
    console.log('VibrationHuntGame: イベントハンドラーをクリア完了');
  }

  startNewRound() {
    console.log(`=== startNewRound開始 (Round ${this.round}) ===`);
    console.log('現在のシーン状態:', this.scene.currentScreen);
    
    // ゲーム開始時刻を記録（ボタン誤検出防止用）
    this.gameStartTime = Date.now();
    
    // 実際のゲームエリアの境界に合わせて正解位置を生成
    const bounds = this.GAME_AREA_BOUNDS;
    
    this.targetPosition = {
      x: Math.random() * (bounds.right - bounds.left) + bounds.left,
      y: Math.random() * (bounds.bottom - bounds.top) + bounds.top
    };
    
    // カーソルを中央に初期化
    this.currentPosition = { x: 400, y: 350 };
    
    this.setupDummyVibrations();
    this.updateUI();
    
    // マウスとJoy-Con入力の両方を設定
    // this.setupMouseInput(); // マウス操作を無効化
    this.setupJoyConInput();
    
    console.log(`Round ${this.round}: 正解位置 (${this.targetPosition.x.toFixed(0)}, ${this.targetPosition.y.toFixed(0)})`);
    console.log(`ゲームエリア境界: X(${bounds.left}-${bounds.right}), Y(${bounds.top}-${bounds.bottom})`);
    console.log('=== startNewRound完了 ===');
  }

  setupDummyVibrations() {
    this.dummyPositions = [];
    if (this.difficulty >= 2) {
      const dummyCount = this.difficulty - 1;
      const bounds = this.GAME_AREA_BOUNDS;
      
      for (let i = 0; i < dummyCount; i++) {
        this.dummyPositions.push({
          x: Math.random() * (bounds.right - bounds.left) + bounds.left,
          y: Math.random() * (bounds.bottom - bounds.top) + bounds.top,
          strength: 0.3 + Math.random() * 0.4
        });
      }
      
      console.log(`ダミー振動位置を${dummyCount}個生成:`, this.dummyPositions.map(p => `(${p.x.toFixed(0)}, ${p.y.toFixed(0)})`));
    }
  }

  updateUI() {
    console.log('=== updateUI開始 ===');
    
    // UIグループをクリアして再作成
    if (this.uiGroup) {
      this.uiGroup.destroy(true);
    }
    this.uiGroup = this.scene.add.group();

    // 美しいグラデーション背景
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(
      0x0a0a1a, 0x1a1a3a, // 上部：深い紺色
      0x2a1a4a, 0x3a2a5a, // 下部：紫がかった色
      1
    );
    bg.fillRect(0, 0, 800, 600);
    this.uiGroup.add(bg);
    
    // 装飾的な背景要素
    const circle1 = this.scene.add.graphics();
    circle1.fillStyle(0x4a3a6a, 0.1);
    circle1.fillCircle(100, 100, 60);
    this.uiGroup.add(circle1);
    
    const circle2 = this.scene.add.graphics();
    circle2.fillStyle(0x5a4a7a, 0.08);
    circle2.fillCircle(700, 500, 80);
    this.uiGroup.add(circle2);
    
    // タイトル（美しいデザイン）
    const title1 = this.scene.add.text(402, 52, '強震動探し', {
      fontSize: '36px',
      fill: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      alpha: 0.3
    }).setOrigin(0.5);
    this.uiGroup.add(title1);
    
    const title2 = this.scene.add.text(400, 50, '強震動探し', {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      stroke: '#00d4aa',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.uiGroup.add(title2);
    
    // 情報パネル（スタイリッシュなカード風）
    const infoPanelBg = this.scene.add.graphics();
    infoPanelBg.fillStyle(0x2a2a4a, 0.9);
    infoPanelBg.fillRoundedRect(50, 80, 700, 60, 15);
    infoPanelBg.lineStyle(2, 0x00d4aa, 0.8);
    infoPanelBg.strokeRoundedRect(50, 80, 700, 60, 15);
    this.uiGroup.add(infoPanelBg);
    
    // ラウンド表示（左側）
    const roundLabel = this.scene.add.text(80, 95, 'ROUND', {
      fontSize: '14px',
      fill: '#00d4aa',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });
    this.uiGroup.add(roundLabel);
    
    const roundValue = this.scene.add.text(80, 115, `${this.round}/${this.maxRounds}`, {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });
    this.uiGroup.add(roundValue);
    
    // 難易度表示（中央）
    const diffLabel = this.scene.add.text(400, 95, 'DIFFICULTY', {
      fontSize: '14px',
      fill: '#ffaa00',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    this.uiGroup.add(diffLabel);
    
    const difficultyStars = '★'.repeat(this.difficulty) + '☆'.repeat(5 - this.difficulty);
    const diffValue = this.scene.add.text(400, 115, difficultyStars, {
      fontSize: '18px',
      fill: '#ffaa00',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(diffValue);
    
    // スコア表示（右側）
    const scoreLabel = this.scene.add.text(720, 95, 'SCORE', {
      fontSize: '14px',
      fill: '#ff6b6b',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(1, 0);
    this.uiGroup.add(scoreLabel);
    
    const scoreValue = this.scene.add.text(720, 115, this.score.toString(), {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(1, 0);
    this.uiGroup.add(scoreValue);
    
    // 操作説明（美しいカード風）
    const instructionBg = this.scene.add.graphics();
    instructionBg.fillStyle(0x2a2a4a, 0.9);
    instructionBg.fillRoundedRect(100, 160, 600, 40, 12);
    instructionBg.lineStyle(2, 0x4a9eff, 0.8);
    instructionBg.strokeRoundedRect(100, 160, 600, 40, 12);
    this.uiGroup.add(instructionBg);
    
    // 操作説明パネル
    const controlPanelBg = this.scene.add.graphics();
    controlPanelBg.fillStyle(0x1a1a3a, 0.8);
    controlPanelBg.fillRoundedRect(100, 155, 600, 50, 10);
    controlPanelBg.lineStyle(1, 0x4a9eff, 0.6);
    controlPanelBg.strokeRoundedRect(100, 155, 600, 50, 10);
    this.uiGroup.add(controlPanelBg);
    
    const controlText1 = this.scene.add.text(400, 170, '🕹️ スティックで移動  🅰 Aボタンで決定', {
      fontSize: '14px',
      fill: '#b8c6ff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(controlText1);
    
    const controlText2 = this.scene.add.text(400, 190, '✨ 振動の強さを頼りに隠された宝を見つけよう！', {
      fontSize: '13px',
      fill: '#8899bb',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(controlText2);
    
    // ゲームエリアの枠線
    const gameAreaFrame = this.scene.add.graphics();
    gameAreaFrame.lineStyle(3, 0x00d4aa, 0.7);
    gameAreaFrame.strokeRoundedRect(
      this.GAME_AREA_BOUNDS.left - 20, 
      this.GAME_AREA_BOUNDS.top - 20, 
      this.GAME_AREA_BOUNDS.right - this.GAME_AREA_BOUNDS.left + 40, 
      this.GAME_AREA_BOUNDS.bottom - this.GAME_AREA_BOUNDS.top + 40,
      15
    );
    this.uiGroup.add(gameAreaFrame);

    // 宝探しの雰囲気を演出する要素を追加
    this.addAtmosphericElements();
    
    // より魅力的なカーソル
    this.cursor = this.scene.add.graphics();
    this.cursor.fillStyle(0xff4444, 1);
    this.cursor.fillCircle(0, 0, 10);
    this.cursor.lineStyle(3, 0xffffff, 0.9);
    this.cursor.strokeCircle(0, 0, 10);
    this.cursor.lineStyle(1, 0xff8888, 0.7);
    this.cursor.strokeCircle(0, 0, 15);
    this.uiGroup.add(this.cursor);
    
    // カーソルのグロー効果
    this.cursorGlow = this.scene.add.graphics();
    this.cursorGlow.fillStyle(0xff4444, 0.3);
    this.cursorGlow.fillCircle(0, 0, 20);
    this.uiGroup.add(this.cursorGlow);
    
    // 初期位置設定
    this.cursor.setPosition(this.currentPosition.x, this.currentPosition.y);
    this.cursorGlow.setPosition(this.currentPosition.x, this.currentPosition.y);
    
    // カーソルをインタラクティブにしてマウス操作を有効化
    this.cursor.setInteractive();
    
    // カーソルの微細な動きアニメーション
    this.scene.tweens.add({
      targets: this.cursor,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    console.log('=== updateUI完了 ===');
  }
  
  addAtmosphericElements() {
    // 宝探しの雰囲気を演出する要素
    
    // 1. ランダムに配置された光る粒子
    this.createFloatingParticles();
    
    // 2. 神秘的な光のオーラ
    this.createMysticalAura();
    
    // 3. 宝の手がかりとなるサーチライン
    this.createSearchGrid();
  }
  
  createFloatingParticles() {
    // ゲームエリア内にランダムに配置された光る粒子
    const bounds = this.GAME_AREA_BOUNDS;
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.graphics();
      const x = Math.random() * (bounds.right - bounds.left) + bounds.left;
      const y = Math.random() * (bounds.bottom - bounds.top) + bounds.top;
      
      particle.fillStyle(0x88ddff, 0.3);
      particle.fillCircle(0, 0, 2);
      particle.setPosition(x, y);
      this.uiGroup.add(particle);
      
      // ふわふわと浮遊するアニメーション
      this.scene.tweens.add({
        targets: particle,
        y: y - 20 + Math.random() * 40,
        alpha: 0.1 + Math.random() * 0.4,
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // 回転アニメーション
      this.scene.tweens.add({
        targets: particle,
        scaleX: 0.5 + Math.random() * 0.8,
        scaleY: 0.5 + Math.random() * 0.8,
        duration: 1500 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Power2'
      });
    }
  }
  
  createMysticalAura() {
    // ゲームエリアの周囲に神秘的な光のオーラ
    const bounds = this.GAME_AREA_BOUNDS;
    
    const aura = this.scene.add.graphics();
    aura.lineStyle(2, 0x44aaff, 0.3);
    aura.strokeRoundedRect(
      bounds.left - 10, bounds.top - 10,
      bounds.right - bounds.left + 20, bounds.bottom - bounds.top + 20,
      10
    );
    
    aura.lineStyle(1, 0x88ccff, 0.2);
    aura.strokeRoundedRect(
      bounds.left - 25, bounds.top - 25,
      bounds.right - bounds.left + 50, bounds.bottom - bounds.top + 50,
      15
    );
    
    this.uiGroup.add(aura);
    
    // パルスアニメーション
    this.scene.tweens.add({
      targets: aura,
      alpha: 0.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  createSearchGrid() {
    // 微細な探索グリッド（宝探しの雰囲気）
    const bounds = this.GAME_AREA_BOUNDS;
    const gridSize = 50;
    
    const grid = this.scene.add.graphics();
    grid.lineStyle(1, 0x333366, 0.15);
    
    // 縦線
    for (let x = bounds.left; x <= bounds.right; x += gridSize) {
      grid.moveTo(x, bounds.top);
      grid.lineTo(x, bounds.bottom);
    }
    
    // 横線
    for (let y = bounds.top; y <= bounds.bottom; y += gridSize) {
      grid.moveTo(bounds.left, y);
      grid.lineTo(bounds.right, y);
    }
    
    grid.strokePath();
    this.uiGroup.add(grid);
  }
  


  setupJoyConInput() {
    // マウス操作は常に有効
    this.setupMouseInput();
    
    if (!this.jc) {
      console.log('Joy-Conマネージャーが見つかりません - マウス移動のみ、決定ボタンなし');
      return;
    }
    
    console.log('Joy-Con入力設定開始 - Aボタンでの決定のみ有効');
    
    // 定期的にJoy-Conの入力をチェック（ボタンのみ）
    this.inputUpdateInterval = setInterval(() => {
      this.updateJoyConInput();
    }, 16); // 約60FPS
    
    console.log('Joy-Con入力設定完了 - マウス移動 + Joy-Con決定');
  }
  
  setupMouseInput() {
    console.log('マウス操作設定開始');
    
    // マウス移動でカーソルを制御
    this.scene.input.on('pointermove', (pointer) => {
      if (!this.gameActive) return;
      
      // ゲームエリア内でのマウス位置を取得
      const bounds = this.GAME_AREA_BOUNDS;
      const mouseX = Math.max(bounds.left, Math.min(bounds.right, pointer.x));
      const mouseY = Math.max(bounds.top, Math.min(bounds.bottom, pointer.y));
      
      // カーソル位置を更新
      this.currentPosition.x = mouseX;
      this.currentPosition.y = mouseY;
      
      if (this.cursor) {
        this.cursor.setPosition(this.currentPosition.x, this.currentPosition.y);
        this.cursorGlow.setPosition(this.currentPosition.x, this.currentPosition.y);
      }
      
      // 振動を計算・再生
      this.calculateAndPlayVibration();
    });
    
    // マウスクリックは無効（Joy-ConのAボタンのみで決定）
    // this.scene.input.on('pointerdown', () => {
    //   // マウスクリックでの決定は無効
    // });
    
    console.log('マウス操作設定完了');
  }

  updateJoyConInput() {
    if (!this.gameActive || !this.jc) return;
    
    try {
      const inputState = this.jc.getInputState();
      if (!inputState) return;
      
      // スティック入力は無効（マウスのみでカーソル移動）
      // const stickX = inputState.rightStick.x; // -1 to 1
      // const stickY = inputState.rightStick.y; // -1 to 1
      // スティックでのカーソル移動は無効化
      
      // Aボタンで決定
      if (inputState.buttons.a && !this.aButtonPressed) {
        this.aButtonPressed = true;
        
        // ゲーム開始からの経過時間をチェック（誤検出防止）
        const elapsed = Date.now() - this.gameStartTime;
        if (elapsed > this.buttonGracePeriod) {
          console.log('[A-BUTTON] 決定ボタンが押されました');
          this.submitAnswer();
        } else {
          console.log(`[A-BUTTON] ボタン猶予期間中 (${elapsed}ms < ${this.buttonGracePeriod}ms)`);
        }
      } else if (!inputState.buttons.a) {
        this.aButtonPressed = false;
      }
      
      // Xボタンでキャリブレーション再実行
      if (inputState.buttons.x && !this.xButtonPressed) {
        this.xButtonPressed = true;
        console.log('[X-BUTTON] キャリブレーション再実行');
        this.jc.recalibrate();
      } else if (!inputState.buttons.x) {
        this.xButtonPressed = false;
      }
    } catch (error) {
      console.error('Joy-Con入力エラー:', error);
    }
  }

  calculateAndPlayVibration() {
    if (!this.gameActive) return;
    
    const distance = this.getDistance(this.currentPosition, this.targetPosition);
    let vibrationStrength = this.calculateVibrationStrength(distance);
    
    // ダミー振動の処理
    if (this.dummyPositions) {
      for (const dummy of this.dummyPositions) {
        const dummyDistance = this.getDistance(this.currentPosition, dummy);
        if (dummyDistance < 100) {
          const dummyStrength = (100 - dummyDistance) / 100 * dummy.strength;
          vibrationStrength = Math.max(vibrationStrength, dummyStrength);
        }
      }
    }
    
    // Joy-Conが接続されている場合のみ振動
    if (this.jc) {
      this.playVibration(vibrationStrength);
    }
    
    // カーソルのグロー効果を振動の強さに応じて変更
    this.updateCursorGlow(vibrationStrength);
  }

  updateCursorGlow(strength) {
    // 振動の強さに応じてカーソルのグロー効果を変更
    const alpha = Math.max(0.2, strength);
    const scale = 1 + strength * 0.8;
    
    this.cursorGlow.clear();
    
    // 複層のグロー効果
    // 外側のグロー
    this.cursorGlow.fillStyle(0xff4444, alpha * 0.3);
    this.cursorGlow.fillCircle(0, 0, 35 * scale);
    
    // 中間のグロー
    this.cursorGlow.fillStyle(0xff6666, alpha * 0.5);
    this.cursorGlow.fillCircle(0, 0, 25 * scale);
    
    // 内側のグロー
    this.cursorGlow.fillStyle(0xff8888, alpha * 0.7);
    this.cursorGlow.fillCircle(0, 0, 15 * scale);
    
    // 宝に非常に近い場合の特別効果
    if (strength > 0.8) {
      this.cursorGlow.lineStyle(2, 0xffff00, alpha);
      this.cursorGlow.strokeCircle(0, 0, 40 * scale);
      
      // パルス効果
      this.scene.tweens.add({
        targets: this.cursorGlow,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      });
    }
  }

  getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  calculateVibrationStrength(distance) {
    const maxDist = this.vibrationSettings.maxDistance;
    if (distance >= maxDist) return 0;
    
    const normalizedDistance = distance / maxDist;
    const strength = Math.pow(1 - normalizedDistance, 2);
    
    return Math.max(this.vibrationSettings.minAmplitude, 
                   strength * this.vibrationSettings.maxAmplitude);
  }

  playVibration(strength) {
    if (strength <= 0) {
      this.jc.rumble(0, 0, 0, 0);
      return;
    }
    
    const { baseFreq } = this.vibrationSettings;
    const freqMultiplier = 1 + strength;
    
    const lowFreq = baseFreq.low * freqMultiplier;
    const highFreq = baseFreq.high * freqMultiplier;
    const lowAmp = strength * 0.7;
    const highAmp = strength;
    
    this.jc.rumble(lowFreq, highFreq, lowAmp, highAmp);
  }

  submitAnswer() {
    console.log('=== submitAnswer開始 ===');
    console.log('現在のシーン状態:', this.scene.currentScreen);
    
    // ゲームを一時的に非アクティブにする（イベントハンドラーはクリアしない）
    this.gameActive = false;
    if (this.jc) {
      this.jc.rumble(0, 0, 0, 0);
    }
    
    // 入力監視を停止
    if (this.inputUpdateInterval) {
      clearInterval(this.inputUpdateInterval);
      this.inputUpdateInterval = null;
    }
    
    const distance = this.getDistance(this.currentPosition, this.targetPosition);
    const accuracy = Math.max(0, 100 - (distance / 3));
    const roundScore = Math.round(accuracy);
    
    this.score += roundScore;
    
    // 美しい結果画面を作成
    this.createBeautifulResultScreen(distance, roundScore);
    
    // 成功エフェクト
    if (distance < 50) {
      this.createSuccessEffect();
    }
    
    console.log('=== submitAnswer完了、3秒後に次の処理 ===');
    
    setTimeout(() => {
      console.log('=== 次ラウンド/ゲーム終了処理開始 ===');
      if (this.round < this.maxRounds) {
        this.round++;
        if (this.round % 2 === 0) this.difficulty = Math.min(5, this.difficulty + 1);
        console.log(`Round ${this.round}開始準備`);
        this.gameActive = true; // ゲームを再アクティブ化
        this.startNewRound();
      } else {
        console.log('ゲーム終了処理開始');
        this.endGame();
      }
    }, 3000);
  }

  createBeautifulResultScreen(distance, roundScore) {
    // 半透明の背景オーバーレイ
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, 800, 600);
    this.uiGroup.add(overlay);
    
    // 左側に位置表示パネルを作成
    this.createPositionPanel(distance);
    
    // メインの結果パネル（右側に配置）
    const panelWidth = 320;
    const panelHeight = 400;
    const panelX = 600;
    const panelY = 300;
    
    // グラデーション背景パネル
    const panel = this.scene.add.graphics();
    panel.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x533483);
    panel.fillRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 20);
    
    // パネルの枠線
    panel.lineStyle(3, 0x00d4ff, 0.8);
    panel.strokeRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 20);
    this.uiGroup.add(panel);
    
    // タイトル「結果発表」
    const titleText = this.scene.add.text(panelX, panelY - 160, '結果発表', {
      fontSize: '28px',
      fill: '#00d4ff',
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(titleText);
    
    // 精度評価
    let accuracyRating = '';
    let accuracyColor = '';
    if (distance <= 20) {
      accuracyRating = '完璧！';
      accuracyColor = '#00ff88';
    } else if (distance <= 50) {
      accuracyRating = '素晴らしい！';
      accuracyColor = '#00ff88';
    } else if (distance <= 100) {
      accuracyRating = '良い！';
      accuracyColor = '#ffff00';
    } else if (distance <= 150) {
      accuracyRating = 'まずまず';
      accuracyColor = '#ff8800';
    } else {
      accuracyRating = 'もう少し！';
      accuracyColor = '#ff4444';
    }
    
    const accuracyText = this.scene.add.text(panelX, panelY - 100, accuracyRating, {
      fontSize: '24px',
      fill: accuracyColor,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(accuracyText);
    
    // 誤差表示（スタイリッシュ）
    const errorContainer = this.scene.add.graphics();
    errorContainer.fillStyle(0x2a2a2a, 0.8);
    errorContainer.fillRoundedRect(panelX - 120, panelY - 50, 240, 35, 8);
    errorContainer.lineStyle(2, 0x00d4ff, 0.6);
    errorContainer.strokeRoundedRect(panelX - 120, panelY - 50, 240, 35, 8);
    this.uiGroup.add(errorContainer);
    
    const errorText = this.scene.add.text(panelX, panelY - 32, `誤差: ${distance.toFixed(0)}px`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(errorText);
    
    // スコア表示（輝くエフェクト付き）
    const scoreContainer = this.scene.add.graphics();
    scoreContainer.fillStyle(0x4a4a00, 0.9);
    scoreContainer.fillRoundedRect(panelX - 130, panelY + 10, 260, 45, 12);
    scoreContainer.lineStyle(3, 0xffff00, 0.8);
    scoreContainer.strokeRoundedRect(panelX - 130, panelY + 10, 260, 45, 12);
    this.uiGroup.add(scoreContainer);
    
    const scoreText = this.scene.add.text(panelX, panelY + 32, `獲得スコア: ${roundScore}点`, {
      fontSize: '18px',
      fill: '#ffff00',
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.uiGroup.add(scoreText);
    
    // 現在のラウンド情報
    const roundInfo = this.scene.add.text(panelX, panelY + 80, `ラウンド ${this.round}/${this.maxRounds}`, {
      fontSize: '16px',
      fill: '#aaaaaa',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(roundInfo);
    
    // 総スコア表示
    const totalScoreText = this.scene.add.text(panelX, panelY + 105, `総スコア: ${this.score}点`, {
      fontSize: '16px',
      fill: '#88ccff',
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(totalScoreText);
    
    // 次のラウンドまたは終了の案内
    let nextText = '';
    if (this.round < this.maxRounds) {
      nextText = `次のラウンド ${this.round + 1}/${this.maxRounds} へ...`;
    } else {
      nextText = 'ゲーム終了！最終結果を表示します...';
    }
    
    const nextRoundText = this.scene.add.text(panelX, panelY + 140, nextText, {
      fontSize: '14px',
      fill: '#aaaaaa',
      fontStyle: 'italic',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(nextRoundText);
    
    // スコアのキラキラエフェクト
    this.scene.tweens.add({
      targets: scoreText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 600,
      yoyo: true,
      repeat: 2,
      ease: 'Back.easeInOut'
    });
    
    // パネル全体のフェードインアニメーション
    panel.setAlpha(0);
    titleText.setAlpha(0);
    accuracyText.setAlpha(0);
    errorContainer.setAlpha(0);
    errorText.setAlpha(0);
    scoreContainer.setAlpha(0);
    scoreText.setAlpha(0);
    roundInfo.setAlpha(0);
    totalScoreText.setAlpha(0);
    nextRoundText.setAlpha(0);
    
    this.scene.tweens.add({
      targets: [panel, titleText, accuracyText, errorContainer, errorText, scoreContainer, scoreText, roundInfo, totalScoreText, nextRoundText],
      alpha: 1,
      duration: 800,
      delay: this.scene.tweens.stagger(80),
      ease: 'Power2'
    });
  }
  
  createPositionPanel(distance) {
    // 左側パネルの設定
    const panelWidth = 300;
    const panelHeight = 400;
    const panelX = 200;
    const panelY = 300;
    
    // 左側パネルの背景
    const leftPanel = this.scene.add.graphics();
    leftPanel.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x533483);
    leftPanel.fillRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 20);
    leftPanel.lineStyle(3, 0x00d4ff, 0.8);
    leftPanel.strokeRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 20);
    this.uiGroup.add(leftPanel);
    
    // パネルタイトル
    const panelTitle = this.scene.add.text(panelX, panelY - 160, '位置比較', {
      fontSize: '24px',
      fill: '#00d4ff',
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(panelTitle);
    
    // ミニマップエリアの設定
    const mapWidth = 240;
    const mapHeight = 180;
    const mapX = panelX;
    const mapY = panelY - 40;
    
    // ミニマップの背景
    const mapBg = this.scene.add.graphics();
    mapBg.fillStyle(0x0a0a1a, 0.8);
    mapBg.fillRoundedRect(mapX - mapWidth/2, mapY - mapHeight/2, mapWidth, mapHeight, 10);
    mapBg.lineStyle(2, 0x333366, 0.8);
    mapBg.strokeRoundedRect(mapX - mapWidth/2, mapY - mapHeight/2, mapWidth, mapHeight, 10);
    this.uiGroup.add(mapBg);
    
    // ゲームエリアの境界を取得
    const bounds = this.GAME_AREA_BOUNDS;
    const gameAreaWidth = bounds.right - bounds.left;
    const gameAreaHeight = bounds.bottom - bounds.top;
    
    // 座標変換関数（ゲーム座標 → ミニマップ座標）
    const toMapX = (gameX) => {
      const ratio = (gameX - bounds.left) / gameAreaWidth;
      return mapX - mapWidth/2 + ratio * mapWidth;
    };
    
    const toMapY = (gameY) => {
      const ratio = (gameY - bounds.top) / gameAreaHeight;
      return mapY - mapHeight/2 + ratio * mapHeight;
    };
    
    // 正解位置をミニマップに表示
    const correctMapX = toMapX(this.targetPosition.x);
    const correctMapY = toMapY(this.targetPosition.y);
    
    const correctCircle = this.scene.add.graphics();
    correctCircle.fillStyle(0x00ff88, 1);
    correctCircle.fillCircle(correctMapX, correctMapY, 6);
    correctCircle.lineStyle(2, 0xffffff, 1);
    correctCircle.strokeCircle(correctMapX, correctMapY, 6);
    this.uiGroup.add(correctCircle);
    
    // 正解位置の光る効果（位置は固定）
    const correctGlow = this.scene.add.graphics();
    correctGlow.fillStyle(0x00ff88, 0.3);
    correctGlow.fillCircle(correctMapX, correctMapY, 12);
    this.uiGroup.add(correctGlow);
    
    // 回答位置をミニマップに表示
    const answerMapX = toMapX(this.currentPosition.x);
    const answerMapY = toMapY(this.currentPosition.y);
    
    const answerCircle = this.scene.add.graphics();
    answerCircle.fillStyle(0xff4444, 1);
    answerCircle.fillCircle(answerMapX, answerMapY, 5);
    answerCircle.lineStyle(2, 0xffffff, 1);
    answerCircle.strokeCircle(answerMapX, answerMapY, 5);
    this.uiGroup.add(answerCircle);
    
    // 回答位置の光る効果（位置は固定）
    const answerGlow = this.scene.add.graphics();
    answerGlow.fillStyle(0xff4444, 0.3);
    answerGlow.fillCircle(answerMapX, answerMapY, 10);
    this.uiGroup.add(answerGlow);
    
    // 正解位置と回答位置を結ぶ線
    const connectionLine = this.scene.add.graphics();
    connectionLine.lineStyle(2, 0xffffff, 0.6);
    connectionLine.moveTo(answerMapX, answerMapY);
    connectionLine.lineTo(correctMapX, correctMapY);
    connectionLine.strokePath();
    this.uiGroup.add(connectionLine);
    
    // 凡例
    const legendY = panelY + 80;
    
    // 正解の凡例
    const correctLegendCircle = this.scene.add.graphics();
    correctLegendCircle.fillStyle(0x00ff88, 0.9);
    correctLegendCircle.fillCircle(panelX - 80, legendY, 8);
    correctLegendCircle.lineStyle(2, 0xffffff, 0.9);
    correctLegendCircle.strokeCircle(panelX - 80, legendY, 8);
    this.uiGroup.add(correctLegendCircle);
    
    const correctLegendText = this.scene.add.text(panelX - 60, legendY, '正解位置', {
      fontSize: '14px',
      fill: '#00ff88',
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0, 0.5);
    this.uiGroup.add(correctLegendText);
    
    // 回答の凡例
    const answerLegendCircle = this.scene.add.graphics();
    answerLegendCircle.fillStyle(0xff4444, 0.8);
    answerLegendCircle.fillCircle(panelX - 80, legendY + 30, 8);
    answerLegendCircle.lineStyle(2, 0xffffff, 0.9);
    answerLegendCircle.strokeCircle(panelX - 80, legendY + 30, 8);
    this.uiGroup.add(answerLegendCircle);
    
    const answerLegendText = this.scene.add.text(panelX - 60, legendY + 30, 'あなたの回答', {
      fontSize: '14px',
      fill: '#ff8888',
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0, 0.5);
    this.uiGroup.add(answerLegendText);
    
    // 距離情報
    const distanceText = this.scene.add.text(panelX, legendY + 70, `距離: ${distance.toFixed(0)}px`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(distanceText);
    
    // アニメーション（グロー効果のみ、位置マーカーは固定）
    this.scene.tweens.add({
      targets: correctGlow,
      alpha: 0.1,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.scene.tweens.add({
      targets: answerGlow,
      alpha: 0.1,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // パネル要素のフェードイン
    leftPanel.setAlpha(0);
    panelTitle.setAlpha(0);
    mapBg.setAlpha(0);
    correctCircle.setAlpha(0);
    correctGlow.setAlpha(0);
    answerCircle.setAlpha(0);
    answerGlow.setAlpha(0);
    connectionLine.setAlpha(0);
    correctLegendCircle.setAlpha(0);
    correctLegendText.setAlpha(0);
    answerLegendCircle.setAlpha(0);
    answerLegendText.setAlpha(0);
    distanceText.setAlpha(0);
    
    this.scene.tweens.add({
      targets: [leftPanel, panelTitle, mapBg, correctCircle, correctGlow, answerCircle, answerGlow, connectionLine, correctLegendCircle, correctLegendText, answerLegendCircle, answerLegendText, distanceText],
      alpha: 1,
      duration: 800,
      delay: this.scene.tweens.stagger(60),
      ease: 'Power2'
    });
  }

  createSuccessEffect() {
    // 成功時のパーティクル効果
    for (let i = 0; i < 15; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0x00ff88, 1);
      particle.fillCircle(0, 0, 3);
      particle.x = this.currentPosition.x;
      particle.y = this.currentPosition.y;
      
      const angle = (i / 15) * Math.PI * 2;
      const speed = Math.random() * 80 + 40;
      
      this.scene.tweens.add({
        targets: particle,
        x: this.currentPosition.x + Math.cos(angle) * speed,
        y: this.currentPosition.y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  endGame() {
    this.gameActive = false;
    console.log(`ゲーム終了 - 最終スコア: ${this.score}`);
    
    // ゲームUIをクリア
    if (this.uiGroup) {
      this.uiGroup.destroy(true);
      this.uiGroup = null;
    }
    
    // 新しいUIグループを作成して終了画面を表示
    this.uiGroup = this.scene.add.group();
    
    // 美しいグラデーション背景
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(
      0x0a0a1a, 0x1a1a3a,
      0x2a1a4a, 0x3a2a5a,
      1
    );
    bg.fillRect(0, 0, 800, 600);
    this.uiGroup.add(bg);
    
    // ゲーム終了タイトル
    const gameOverTitle = this.scene.add.text(400, 150, 'ゲーム終了！', {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      stroke: '#00d4aa',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.uiGroup.add(gameOverTitle);
    
    // 最終スコア表示
    const finalScoreText = this.scene.add.text(400, 250, `最終スコア: ${this.score}点`, {
      fontSize: '36px',
      fill: '#ffff00',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    this.uiGroup.add(finalScoreText);
    
    // スコア評価
    let evaluation = '';
    if (this.score >= 400) evaluation = '素晴らしい！';
    else if (this.score >= 300) evaluation = 'とても良い！';
    else if (this.score >= 200) evaluation = '良い！';
    else if (this.score >= 100) evaluation = 'まずまず';
    else evaluation = 'もう一度挑戦してみよう！';
    
    const evaluationText = this.scene.add.text(400, 320, evaluation, {
      fontSize: '24px',
      fill: '#00ff88',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    this.uiGroup.add(evaluationText);
    
    // ホームに戻るボタン
    const homeButton = this.scene.add.graphics();
    homeButton.fillStyle(0x4a9eff, 1);
    homeButton.fillRoundedRect(-100, -25, 200, 50, 25);
    homeButton.lineStyle(2, 0xffffff, 1);
    homeButton.strokeRoundedRect(-100, -25, 200, 50, 25);
    homeButton.x = 400;
    homeButton.y = 450;
    homeButton.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains);
    this.uiGroup.add(homeButton);
    
    const homeButtonText = this.scene.add.text(400, 450, 'ホームに戻る', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    this.uiGroup.add(homeButtonText);
    
    // ホームボタンのクリックイベント
    homeButton.on('pointerdown', () => {
      console.log('ホームに戻るボタンがクリックされました');
      window.location.href = '/';
    });
    
    // マウス操作の説明
    const instructionText = this.scene.add.text(400, 520, 'Joy-Conスティックで操作、Aボタンで決定', {
      fontSize: '16px',
      fill: '#888888',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.uiGroup.add(instructionText);
    
    // 入力監視を停止
    if (this.inputUpdateInterval) {
      clearInterval(this.inputUpdateInterval);
      this.inputUpdateInterval = null;
    }
    
    if (this.jc) {
      this.jc.rumble(0, 0, 0, 0);
    }
  }

  destroy() {
    this.gameActive = false;
    
    // 入力監視を停止
    if (this.inputUpdateInterval) {
      clearInterval(this.inputUpdateInterval);
      this.inputUpdateInterval = null;
    }
    
    if (this.jc) {
      this.jc.rumble(0, 0, 0, 0);
    }
  }
} 