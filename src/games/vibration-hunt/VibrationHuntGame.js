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
    this.setupMouseInput();
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
    
    // 操作説明パネル
    const controlPanelBg = this.scene.add.graphics();
    controlPanelBg.fillStyle(0x1a1a3a, 0.8);
    controlPanelBg.fillRoundedRect(100, 155, 600, 50, 10);
    controlPanelBg.lineStyle(1, 0x4a9eff, 0.6);
    controlPanelBg.strokeRoundedRect(100, 155, 600, 50, 10);
    this.uiGroup.add(controlPanelBg);
    
    const controlText1 = this.scene.add.text(400, 170, '🖱️ マウスで移動  🅰 Aボタンで決定', {
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

    // カーソル
    this.cursor = this.scene.add.graphics();
    this.cursor.fillStyle(0xff0000, 0.9);
    this.cursor.fillCircle(0, 0, 8);
    this.uiGroup.add(this.cursor);
    
    // カーソルのグロー効果
    this.cursorGlow = this.scene.add.graphics();
    this.cursorGlow.fillStyle(0xff0000, 0.3);
    this.cursorGlow.fillCircle(0, 0, 16);
    this.uiGroup.add(this.cursorGlow);
    
    // 初期位置設定
    this.cursor.setPosition(this.currentPosition.x, this.currentPosition.y);
    this.cursorGlow.setPosition(this.currentPosition.x, this.currentPosition.y);
    
    // カーソルをインタラクティブにしてマウス操作を有効化
    this.cursor.setInteractive();
    
    console.log('=== updateUI完了 ===');
  }

  setupMouseInput() {
    this.scene.input.on('pointermove', (pointer) => {
      if (!this.gameActive) return;

      this.currentPosition.x = pointer.x;
      this.currentPosition.y = pointer.y;

      // ゲームエリア内に制限
      const bounds = this.GAME_AREA_BOUNDS;
      this.currentPosition.x = Math.max(bounds.left, Math.min(bounds.right, this.currentPosition.x));
      this.currentPosition.y = Math.max(bounds.top, Math.min(bounds.bottom, this.currentPosition.y));

      if (this.cursor) {
        this.cursor.setPosition(this.currentPosition.x, this.currentPosition.y);
        this.cursorGlow.setPosition(this.currentPosition.x, this.currentPosition.y);
      }

      this.calculateAndPlayVibration();
    });
    console.log('マウス入力設定完了');
  }

  setupJoyConInput() {
    // Joy-Con入力の監視を開始
    console.log('Joy-Con入力監視を開始します');
    
    // 既存のインターバルがある場合は削除
    if (this.inputUpdateInterval) {
      clearInterval(this.inputUpdateInterval);
      this.inputUpdateInterval = null;
    }
    
    // ボタン状態を再度リセット（安全のため）
    this.aButtonPressed = false;
    this.xButtonPressed = false;
    
    this.inputUpdateInterval = setInterval(() => {
      this.updateJoyConInput();
    }, 8); // 120FPS相当の高頻度更新
    
    console.log('Joy-Con入力監視設定完了');
  }

  updateJoyConInput() {
    if (!this.gameActive || !this.jc) {
      if (!this.lastDebugLog || Date.now() - this.lastDebugLog > 2000) {
        console.log('ゲーム非アクティブまたはJoy-Con未接続', {
          gameActive: this.gameActive,
          joyConExists: !!this.jc
        });
        this.lastDebugLog = Date.now();
      }
      return;
    }
    
    // Joy-Conデバイスの接続状態を確認
    if (!this.jc.device) {
      if (!this.lastDeviceLog || Date.now() - this.lastDeviceLog > 2000) {
        console.log('Joy-Conデバイスが切断されています');
        this.lastDeviceLog = Date.now();
      }
      return;
    }
    
    try {
      // Joy-Conの入力状態を取得
      const inputState = this.jc.getInputState();
      
      // 入力状態をログ出力（5秒に1回）
      if (!this.lastInputLog || Date.now() - this.lastInputLog > 5000) {
        console.log('取得した入力状態:', {
          exists: !!inputState,
          rightStick: inputState?.rightStick,
          buttons: inputState?.buttons
        });
        this.lastInputLog = Date.now();
      }
      
      if (inputState) {
        // スティックでのカーソル移動は無効化
        
        // Aボタンの状態をチェック（ゲームが進行中かつ猶予期間経過後のみ）
        const currentTime = Date.now();
        const gracePeriodPassed = !this.gameStartTime || (currentTime - this.gameStartTime) > this.buttonGracePeriod;
        
        console.log('Aボタン状態チェック:', {
          gameActive: this.gameActive,
          aButtonState: inputState.buttons?.a,
          aButtonPressed: this.aButtonPressed,
          gracePeriodPassed: gracePeriodPassed,
          timeElapsed: this.gameStartTime ? currentTime - this.gameStartTime : 'N/A'
        });
        
        if (this.gameActive && gracePeriodPassed && inputState.buttons?.a && !this.aButtonPressed) {
          this.aButtonPressed = true;
          console.log('Joy-Con Aボタンが押されました - 回答提出');
          this.submitAnswer();
        } else if (!inputState.buttons?.a) {
          this.aButtonPressed = false;
        }
        
        // Xボタンでキャリブレーション再実行
        if (inputState.buttons?.x && !this.xButtonPressed) {
          this.xButtonPressed = true;
          console.log('Joy-Con Xボタンが押されました - キャリブレーション再実行');
          this.jc.recalibrate();
        } else if (!inputState.buttons?.x) {
          this.xButtonPressed = false;
        }
      } else {
        // 5秒に1回だけログを出力（スパム防止）
        if (!this.lastLogTime || Date.now() - this.lastLogTime > 5000) {
          console.log('Joy-Con入力状態がnullです');
          this.lastLogTime = Date.now();
        }
      }
    } catch (error) {
      console.error('Joy-Con入力エラー:', error);
    }
  }

  calculateAndPlayVibration() {
    if (!this.jc || !this.gameActive) return;
    
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
    
    this.playVibration(vibrationStrength);
    
    // カーソルのグロー効果を振動の強さに応じて変更
    this.updateCursorGlow(vibrationStrength);
  }

  updateCursorGlow(strength) {
    // 振動の強さに応じてカーソルのグロー効果を変更
    const alpha = Math.max(0.2, strength);
    const scale = 1 + strength * 0.5;
    
    this.cursorGlow.clear();
    this.cursorGlow.fillStyle(0xff4444, alpha);
    this.cursorGlow.fillCircle(0, 0, 20 * scale);
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
    this.jc.rumble(0, 0, 0, 0);
    
    // 入力監視を停止
    if (this.inputUpdateInterval) {
      clearInterval(this.inputUpdateInterval);
      this.inputUpdateInterval = null;
    }
    
    const distance = this.getDistance(this.currentPosition, this.targetPosition);
    const accuracy = Math.max(0, 100 - (distance / 3));
    const roundScore = Math.round(accuracy);
    
    this.score += roundScore;
    
    // 正解位置を表示（美しいエフェクト付き）
    const correctCircle = this.scene.add.graphics();
    correctCircle.fillStyle(0x00ff00, 0.8);
    correctCircle.fillCircle(this.targetPosition.x, this.targetPosition.y, 15);
    correctCircle.lineStyle(3, 0xffffff, 1);
    correctCircle.strokeCircle(this.targetPosition.x, this.targetPosition.y, 15);
    this.uiGroup.add(correctCircle);
    
    const correctText = this.scene.add.text(this.targetPosition.x, this.targetPosition.y - 35, '正解！', {
      fontSize: '18px',
      fill: '#00ff00',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    this.uiGroup.add(correctText);
    
    // 結果表示
    const errorText = this.scene.add.text(400, 450, `誤差: ${distance.toFixed(0)}px`, {
      fontSize: '20px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    this.uiGroup.add(errorText);
    
    // 結果表示
    const scoreText = this.scene.add.text(400, 480, `獲得スコア: ${roundScore}点`, {
      fontSize: '20px',
      fill: '#ffff00'
    }).setOrigin(0.5);
    this.uiGroup.add(scoreText);
    
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
    const instructionText = this.scene.add.text(400, 520, 'マウスで操作、クリックで決定', {
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