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
    
    // Joy-Con操作用の設定
    this.cursorSpeed = 8; // カーソル移動速度を上げる
    this.inputUpdateInterval = null;
    
    this.vibrationSettings = {
      baseFreq: { low: 80, high: 160 },
      maxAmplitude: 0.8,
      minAmplitude: 0.1,
      maxDistance: 300
    };
  }

  startGame() {
    console.log('VibrationHuntGame開始');
    this.gameActive = true;
    this.round = 1;
    this.score = 0;
    this.aButtonPressed = false; // Aボタン状態をリセット
    this.startNewRound();
  }

  startNewRound() {
    this.targetPosition = {
      x: Math.random() * (this.gameArea.width - 100) + 50,
      y: Math.random() * (this.gameArea.height - 200) + 100
    };
    
    // カーソルを中央に初期化
    this.currentPosition = { x: 400, y: 350 };
    
    this.setupDummyVibrations();
    this.updateUI();
    
    console.log(`Round ${this.round}: 正解位置 (${this.targetPosition.x.toFixed(0)}, ${this.targetPosition.y.toFixed(0)})`);
  }

  setupDummyVibrations() {
    this.dummyPositions = [];
    if (this.difficulty >= 2) {
      const dummyCount = this.difficulty - 1;
      for (let i = 0; i < dummyCount; i++) {
        this.dummyPositions.push({
          x: Math.random() * this.gameArea.width,
          y: Math.random() * this.gameArea.height,
          strength: 0.3 + Math.random() * 0.4
        });
      }
    }
  }

  updateUI() {
    this.scene.children.removeAll();
    
    // 美しいグラデーション背景
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(
      0x0a0a1a, 0x1a1a3a, // 上部：深い紺色
      0x2a1a4a, 0x3a2a5a, // 下部：紫がかった色
      1
    );
    bg.fillRect(0, 0, 800, 600);
    
    // 装飾的な背景要素
    const circle1 = this.scene.add.graphics();
    circle1.fillStyle(0x4a3a6a, 0.1);
    circle1.fillCircle(100, 100, 60);
    
    const circle2 = this.scene.add.graphics();
    circle2.fillStyle(0x5a4a7a, 0.08);
    circle2.fillCircle(700, 500, 80);
    
    // タイトル（美しいデザイン）
    this.scene.add.text(402, 52, '強震動探し', {
      fontSize: '36px',
      fill: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      alpha: 0.3
    }).setOrigin(0.5);
    
    this.scene.add.text(400, 50, '強震動探し', {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      stroke: '#00d4aa',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // 情報パネル（スタイリッシュなカード風）
    const infoPanelBg = this.scene.add.graphics();
    infoPanelBg.fillStyle(0x2a2a4a, 0.9);
    infoPanelBg.fillRoundedRect(50, 80, 700, 60, 15);
    infoPanelBg.lineStyle(2, 0x00d4aa, 0.8);
    infoPanelBg.strokeRoundedRect(50, 80, 700, 60, 15);
    
    // ラウンド表示（左側）
    this.scene.add.text(80, 95, 'ROUND', {
      fontSize: '14px',
      fill: '#00d4aa',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });
    
    this.scene.add.text(80, 115, `${this.round}/${this.maxRounds}`, {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });
    
    // 難易度表示（中央）
    this.scene.add.text(400, 95, 'DIFFICULTY', {
      fontSize: '14px',
      fill: '#ffaa00',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    const difficultyStars = '★'.repeat(this.difficulty) + '☆'.repeat(5 - this.difficulty);
    this.scene.add.text(400, 115, difficultyStars, {
      fontSize: '18px',
      fill: '#ffaa00',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // スコア表示（右側）
    this.scene.add.text(720, 95, 'SCORE', {
      fontSize: '14px',
      fill: '#ff6b6b',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(1, 0);
    
    this.scene.add.text(720, 115, this.score.toString(), {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(1, 0);
    
    // 操作説明パネル
    const controlPanelBg = this.scene.add.graphics();
    controlPanelBg.fillStyle(0x1a1a3a, 0.8);
    controlPanelBg.fillRoundedRect(100, 155, 600, 50, 10);
    controlPanelBg.lineStyle(1, 0x4a9eff, 0.6);
    controlPanelBg.strokeRoundedRect(100, 155, 600, 50, 10);
    
    this.scene.add.text(400, 170, '🎮 Joy-Con/マウスで移動  🅰 Aボタン/クリックで決定', {
      fontSize: '14px',
      fill: '#b8c6ff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    this.scene.add.text(400, 190, '✨ 振動の強さを頼りに隠された宝を見つけよう！', {
      fontSize: '13px',
      fill: '#8899bb',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    
    // キャリブレーション再実行ボタン（スタイリッシュに）
    const calibrationBg = this.scene.add.graphics();
    calibrationBg.fillStyle(0x2a2a2a, 0.7);
    calibrationBg.fillRoundedRect(10, 570, 200, 25, 5);
    
    this.scene.add.text(15, 575, '🔧 Xボタン: キャリブレーション再実行', {
      fontSize: '11px',
      fill: '#ffaa00',
      fontFamily: 'Arial, sans-serif'
    });
    
    // キャリブレーション状態表示
    this.calibrationText = this.scene.add.text(400, 210, 'スティックをキャリブレーション中...', {
      fontSize: '12px',
      fill: '#ffaa00'
    }).setOrigin(0.5);
    
    // 5秒後にキャリブレーション完了メッセージを更新
    setTimeout(() => {
      if (this.calibrationText) {
        this.calibrationText.setText('キャリブレーション完了！スティックを大きく動かしてみてください');
        this.calibrationText.setStyle({ fill: '#00ff00' });
        
        // さらに2秒後にメッセージを消去
        setTimeout(() => {
          if (this.calibrationText) {
            this.calibrationText.destroy();
          }
        }, 2000);
      }
    }, 5000); // 5秒に変更
    
    // ゲームエリア（Nintendo Switch風の美しいデザイン）
    const gameAreaShadow = this.scene.add.graphics();
    gameAreaShadow.fillStyle(0x000000, 0.3);
    gameAreaShadow.fillRoundedRect(25, 225, 760, 360, 15);
    
    const gameAreaBg = this.scene.add.graphics();
    gameAreaBg.fillGradientStyle(
      0x1a1a2e, 0x2a2a3e,
      0x3a3a4e, 0x2a2a3e,
      1
    );
    gameAreaBg.fillRoundedRect(20, 220, 760, 360, 15);
    
    const gameAreaBorder = this.scene.add.graphics();
    gameAreaBorder.lineStyle(3, 0x00d4aa, 1);
    gameAreaBorder.strokeRoundedRect(20, 220, 760, 360, 15);
    
    // 内側のグロー効果
    const innerGlow = this.scene.add.graphics();
    innerGlow.lineStyle(1, 0x00d4aa, 0.3);
    innerGlow.strokeRoundedRect(22, 222, 756, 356, 13);
    
    // ゲームエリアのコーナー装飾
    const cornerGraphics = this.scene.add.graphics();
    cornerGraphics.lineStyle(2, 0x4a9eff, 0.8);
    
    // 左上
    cornerGraphics.moveTo(30, 240);
    cornerGraphics.lineTo(30, 230);
    cornerGraphics.lineTo(40, 230);
    
    // 右上
    cornerGraphics.moveTo(770, 240);
    cornerGraphics.lineTo(770, 230);
    cornerGraphics.lineTo(760, 230);
    
    // 左下
    cornerGraphics.moveTo(30, 560);
    cornerGraphics.lineTo(30, 570);
    cornerGraphics.lineTo(40, 570);
    
    // 右下
    cornerGraphics.moveTo(770, 560);
    cornerGraphics.lineTo(770, 570);
    cornerGraphics.lineTo(760, 570);
    
    cornerGraphics.strokePath();
    
    // カーソル（美しいNintendo Switch風デザイン）
    this.cursorGlow = this.scene.add.graphics();
    this.cursorGlow.fillStyle(0xff4444, 0.4);
    this.cursorGlow.fillCircle(0, 0, 25);
    
    this.cursor = this.scene.add.graphics();
    // 外側のリング
    this.cursor.lineStyle(3, 0xffffff, 1);
    this.cursor.strokeCircle(0, 0, 12);
    // 内側の円
    this.cursor.fillStyle(0xff4444, 1);
    this.cursor.fillCircle(0, 0, 8);
    // 中央のハイライト
    this.cursor.fillStyle(0xffffff, 0.8);
    this.cursor.fillCircle(-2, -2, 3);
    
    // 初期位置設定
    this.cursor.setPosition(this.currentPosition.x, this.currentPosition.y);
    this.cursorGlow.setPosition(this.currentPosition.x, this.currentPosition.y);
    
    // カーソルをインタラクティブにしてマウス操作を有効化
    this.cursor.setInteractive();
    
    this.setupJoyConInput();
    this.setupMouseInput();
  }

  setupJoyConInput() {
    // Joy-Con接続状態を確認
    console.log('Joy-Con入力監視を開始します');
    console.log('Joy-Conデバイス:', this.jc.device ? '接続済み' : '未接続');
    
    // Joy-Con入力の監視を開始
    this.inputUpdateInterval = setInterval(() => {
      this.updateJoyConInput();
    }, 8); // 約120FPS - より滑らかな動き
  }

  setupMouseInput() {
    // マウス/トラックパッドでの操作を設定
    console.log('マウス操作を有効化します');
    
    // ゲームエリア全体でマウス移動を監視
    this.scene.input.on('pointermove', (pointer) => {
      if (!this.gameActive) return;
      
      // ゲームエリア内（20-780, 220-580）に制限
      const newX = Math.max(30, Math.min(770, pointer.x));
      const newY = Math.max(230, Math.min(570, pointer.y));
      
      // カーソル位置を更新
      this.currentPosition.x = newX;
      this.currentPosition.y = newY;
      
      // カーソルの表示位置を更新
      if (this.cursor && this.cursorGlow) {
        this.cursor.setPosition(this.currentPosition.x, this.currentPosition.y);
        this.cursorGlow.setPosition(this.currentPosition.x, this.currentPosition.y);
      }
      
      // 振動計算・再生
      this.calculateAndPlayVibration();
    });
    
    // マウスクリックで決定
    this.scene.input.on('pointerdown', (pointer) => {
      if (!this.gameActive) return;
      
      // ゲームエリア内でのクリックのみ有効
      if (pointer.x >= 20 && pointer.x <= 780 && pointer.y >= 220 && pointer.y <= 580) {
        console.log('マウスクリックで回答提出');
        this.submitAnswer();
      }
    });
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
      
      // 常に入力状態をログ出力（デバッグ用）
      console.log('取得した入力状態:', {
        exists: !!inputState,
        rightStick: inputState?.rightStick,
        buttons: inputState?.buttons
      });
      
      if (inputState) {
        // 右スティック（Joy-Con R）の入力を取得
        const stickX = inputState.rightStick?.x || 0;
        const stickY = inputState.rightStick?.y || 0;
        
        console.log(`VibrationHuntGame受信スティック値: X=${stickX.toFixed(3)}, Y=${stickY.toFixed(3)}`);
        
        // デッドゾーンを厳格に設定して意図しない移動を完全に防止
        const deadzone = 0.3; // デッドゾーンを大幅に拡大
        let adjustedX = stickX;
        let adjustedY = stickY;
        
        // デッドゾーン内の値は0にする
        if (Math.abs(stickX) <= deadzone) {
          adjustedX = 0;
        }
        if (Math.abs(stickY) <= deadzone) {
          adjustedY = 0;
        }
        
        console.log(`デッドゾーン適用後: adjustedX=${adjustedX.toFixed(3)}, adjustedY=${adjustedY.toFixed(3)}`);
        
        // スティック入力がある場合、カーソルを移動（明確な意図のある入力のみ）
        if (Math.abs(adjustedX) > 0.1 || Math.abs(adjustedY) > 0.1) {
          console.log(`カーソル移動実行: 現在位置(${this.currentPosition.x.toFixed(0)}, ${this.currentPosition.y.toFixed(0)})`);
          
          const oldX = this.currentPosition.x;
          const oldY = this.currentPosition.y;
          
          // スティック入力をより直接的にカーソル移動に反映
          const moveX = adjustedX * this.cursorSpeed;
          const moveY = -adjustedY * this.cursorSpeed; // Yは反転（上が負、下が正）
          
          this.currentPosition.x += moveX;
          this.currentPosition.y += moveY;
          
          // ゲームエリア内に制限
          this.currentPosition.x = Math.max(30, Math.min(770, this.currentPosition.x));
          this.currentPosition.y = Math.max(230, Math.min(570, this.currentPosition.y));
          
          console.log(`カーソル移動: (${oldX.toFixed(0)}, ${oldY.toFixed(0)}) → (${this.currentPosition.x.toFixed(0)}, ${this.currentPosition.y.toFixed(0)}), 移動量=(${moveX.toFixed(1)}, ${moveY.toFixed(1)})`);
          
          // カーソル位置更新
          if (this.cursor && this.cursorGlow) {
            this.cursor.setPosition(this.currentPosition.x, this.currentPosition.y);
            this.cursorGlow.setPosition(this.currentPosition.x, this.currentPosition.y);
            console.log(`カーソル描画位置更新完了: (${this.currentPosition.x.toFixed(0)}, ${this.currentPosition.y.toFixed(0)})`);
          } else {
            console.log('カーソルオブジェクトが存在しません:', {
              cursor: !!this.cursor,
              cursorGlow: !!this.cursorGlow
            });
          }
          
          // 振動計算・再生
          this.calculateAndPlayVibration();
        } else {
          // スティック入力が小さい場合のログ出力（より高い閾値）
          if (Math.abs(stickX) > 0.08 || Math.abs(stickY) > 0.08) {
            console.log(`スティック入力が小さすぎます: X=${stickX.toFixed(3)}, Y=${stickY.toFixed(3)}, デッドゾーン=${deadzone}`);
          }
        }
        
      // Aボタンの状態をチェック（ゲームが進行中の場合のみ）
      if (this.gameActive && inputState.buttons?.a && !this.aButtonPressed) {
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
    
    this.scene.add.text(this.targetPosition.x, this.targetPosition.y - 35, '正解！', {
      fontSize: '18px',
      fill: '#00ff00',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    // 結果表示
    this.scene.add.text(400, 450, `誤差: ${distance.toFixed(0)}px`, {
      fontSize: '20px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.scene.add.text(400, 480, `獲得スコア: ${roundScore}点`, {
      fontSize: '20px',
      fill: '#ffff00'
    }).setOrigin(0.5);
    
    // 成功エフェクト
    if (distance < 50) {
      this.createSuccessEffect();
    }
    
    setTimeout(() => {
      if (this.round < this.maxRounds) {
        this.round++;
        if (this.round % 2 === 0) this.difficulty = Math.min(5, this.difficulty + 1);
        this.gameActive = true;
        this.startNewRound();
      } else {
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
    // 入力監視を停止
    if (this.inputUpdateInterval) {
      clearInterval(this.inputUpdateInterval);
      this.inputUpdateInterval = null;
    }
    
    this.scene.children.removeAll();
    
    // 美しいグラデーション背景
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(
      0x0a0a1a, 0x1a1a3a, // 上部：深い紺色
      0x2a1a4a, 0x3a2a5a, // 下部：紫がかった色
      1
    );
    bg.fillRect(0, 0, 800, 600);
    
    // 装飾的な背景要素
    const circle1 = this.scene.add.graphics();
    circle1.fillStyle(0x4a3a6a, 0.15);
    circle1.fillCircle(150, 150, 100);
    
    const circle2 = this.scene.add.graphics();
    circle2.fillStyle(0x5a4a7a, 0.12);
    circle2.fillCircle(650, 450, 120);
    
    const circle3 = this.scene.add.graphics();
    circle3.fillStyle(0x6a5a8a, 0.1);
    circle3.fillCircle(700, 100, 80);
    
    // 成功エフェクト（パーティクル）
    this.createEndGameParticles();
    
    // メインタイトル（美しいデザイン）
    this.scene.add.text(402, 102, 'ゲーム終了！', {
      fontSize: '48px',
      fill: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      alpha: 0.3
    }).setOrigin(0.5);
    
    this.scene.add.text(400, 100, 'ゲーム終了！', {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      stroke: '#00d4aa',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // スコア表示パネル
    const scorePanelBg = this.scene.add.graphics();
    scorePanelBg.fillStyle(0x2a2a4a, 0.9);
    scorePanelBg.fillRoundedRect(200, 160, 400, 80, 20);
    scorePanelBg.lineStyle(3, 0xffaa00, 0.8);
    scorePanelBg.strokeRoundedRect(200, 160, 400, 80, 20);
    
    this.scene.add.text(400, 180, '最終スコア', {
      fontSize: '18px',
      fill: '#ffaa00',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    this.scene.add.text(400, 210, `${this.score}点`, {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    // 評価表示
    let evaluation = '';
    let evaluationColor = '#00ff00';
    if (this.score >= 400) {
      evaluation = '🏆 パーフェクト！';
      evaluationColor = '#ffd700';
    } else if (this.score >= 300) {
      evaluation = '⭐ 素晴らしい！';
      evaluationColor = '#00ff88';
    } else if (this.score >= 200) {
      evaluation = '👍 良い！';
      evaluationColor = '#00d4aa';
    } else if (this.score >= 100) {
      evaluation = '😊 まあまあ';
      evaluationColor = '#4a9eff';
    } else {
      evaluation = '💪 もう一度挑戦！';
      evaluationColor = '#ff6b6b';
    }
    
    this.scene.add.text(400, 270, evaluation, {
      fontSize: '24px',
      fill: evaluationColor,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    // ボタンエリア
    this.createStylishEndGameButton(300, 340, 'もう一度プレイ', '#00d4aa', '#00b899', () => {
      this.startGame();
    });
    
    this.createStylishEndGameButton(300, 420, 'タイトルに戻る', '#4a9eff', '#3a8eef', () => {
      // タイトル画面に戻る
      this.scene.scene.start('VibrationHuntScene');
    });
    
    this.createStylishEndGameButton(300, 500, 'ホームに戻る', '#ff6b6b', '#ff5252', () => {
      window.location.href = '/';
    });
  }

  createEndGameParticles() {
    // エンドゲーム用のパーティクル効果
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.graphics();
      const colors = [0x00d4aa, 0x4a9eff, 0xffaa00, 0xff6b6b];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.fillStyle(color, 0.8);
      particle.fillCircle(0, 0, Math.random() * 4 + 2);
      
      particle.x = Math.random() * 800;
      particle.y = Math.random() * 600;
      
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - 100,
        x: particle.x + (Math.random() - 0.5) * 50,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: Math.random() * 3000 + 2000,
        ease: 'Power1',
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          particle.y = 650;
          particle.alpha = 0.8;
          particle.x = Math.random() * 800;
          particle.scaleX = 1;
          particle.scaleY = 1;
        }
      });
    }
  }

  createStylishEndGameButton(x, y, text, primaryColor, hoverColor, callback) {
    // ボタンの影
    const buttonShadow = this.scene.add.graphics();
    buttonShadow.fillStyle(0x000000, 0.3);
    buttonShadow.fillRoundedRect(x + 5, y + 5, 200, 60, 30);
    
    // ボタン背景
    const buttonBg = this.scene.add.graphics();
    const primaryColorInt = parseInt(primaryColor.replace('#', ''), 16);
    const hoverColorInt = parseInt(hoverColor.replace('#', ''), 16);
    
    buttonBg.fillGradientStyle(
      primaryColorInt,
      primaryColorInt,
      hoverColorInt,
      hoverColorInt,
      1
    );
    buttonBg.fillRoundedRect(x, y, 200, 60, 30);
    
    // ボタンの境界線
    buttonBg.lineStyle(2, 0xffffff, 0.8);
    buttonBg.strokeRoundedRect(x, y, 200, 60, 30);
    
    // ボタンテキスト
    const buttonText = this.scene.add.text(x + 100, y + 30, text, {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    // インタラクティブ設定
    const buttonContainer = this.scene.add.container(0, 0);
    buttonContainer.add([buttonShadow, buttonBg, buttonText]);
    buttonContainer.setSize(200, 60);
    buttonContainer.setInteractive(new Phaser.Geom.Rectangle(x, y, 200, 60), Phaser.Geom.Rectangle.Contains);
    
    // ホバー効果
    buttonContainer.on('pointerover', () => {
      buttonContainer.setScale(1.05);
      this.scene.tweens.add({
        targets: buttonBg,
        alpha: 0.9,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    buttonContainer.on('pointerout', () => {
      buttonContainer.setScale(1);
      this.scene.tweens.add({
        targets: buttonBg,
        alpha: 1,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    // クリック効果
    buttonContainer.on('pointerdown', () => {
      buttonContainer.setScale(0.95);
      callback();
    });
    
    buttonContainer.on('pointerup', () => {
      buttonContainer.setScale(1.05);
    });
    
    return buttonContainer;
  }

  destroy() {
    this.gameActive = false;
    
    // 入力監視を停止
    if (this.inputUpdateInterval) {
      clearInterval(this.inputUpdateInterval);
      this.inputUpdateInterval = null;
    }
    
    // マウスイベントリスナーを削除
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerdown');
    
    if (this.jc) {
      this.jc.rumble(0, 0, 0, 0);
    }
  }
} 