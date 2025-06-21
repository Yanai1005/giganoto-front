export class VibrationHuntGame {
  constructor(scene, joyConManager) {
    this.scene = scene;
    this.jc = joyConManager;
    this.gameActive = false;
    this.targetPosition = { x: 0, y: 0 };
    this.currentPosition = { x: 0, y: 0 };
    this.gameArea = { width: 800, height: 600 };
    this.difficulty = 1;
    this.score = 0;
    this.round = 1;
    this.maxRounds = 5;
    
    this.vibrationSettings = {
      baseFreq: { low: 80, high: 160 },
      maxAmplitude: 0.8,
      minAmplitude: 0.1,
      maxDistance: 300
    };
  }

  startGame() {
    this.gameActive = true;
    this.round = 1;
    this.score = 0;
    this.startNewRound();
  }

  startNewRound() {
    this.targetPosition = {
      x: Math.random() * (this.gameArea.width - 100) + 50,
      y: Math.random() * (this.gameArea.height - 200) + 100
    };
    
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
    
    // 背景
    this.scene.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
    
    // タイトル
    this.scene.add.text(400, 50, '強震動探し', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // ラウンド表示
    this.scene.add.text(400, 100, `Round ${this.round}/${this.maxRounds} - 難易度: ${this.difficulty}`, {
      fontSize: '20px',
      fill: '#ffff00'
    }).setOrigin(0.5);
    
    // スコア表示
    this.scene.add.text(400, 130, `スコア: ${this.score}`, {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // 説明
    this.scene.add.text(400, 180, 'マウスを動かして最も強い振動の場所を探してください', {
      fontSize: '16px',
      fill: '#cccccc'
    }).setOrigin(0.5);
    
    this.scene.add.text(400, 200, 'クリックして決定', {
      fontSize: '16px',
      fill: '#cccccc'
    }).setOrigin(0.5);
    
    // ゲームエリアの枠
    this.scene.add.rectangle(400, 350, 760, 360, null).setStrokeStyle(2, 0x666666);
    
    // カーソル
    this.cursor = this.scene.add.circle(400, 350, 8, 0xff0000);
    
    this.setupInput();
  }

  setupInput() {
    this.scene.input.on('pointermove', (pointer) => {
      if (!this.gameActive) return;
      
      const gameAreaX = Math.max(20, Math.min(780, pointer.x));
      const gameAreaY = Math.max(170, Math.min(530, pointer.y));
      
      this.currentPosition = { x: gameAreaX, y: gameAreaY };
      this.cursor.setPosition(gameAreaX, gameAreaY);
      
      this.calculateAndPlayVibration();
    });
    
    this.scene.input.on('pointerdown', () => {
      if (!this.gameActive) return;
      this.submitAnswer();
    });
  }

  calculateAndPlayVibration() {
    if (!this.jc || !this.gameActive) return;
    
    const distance = this.getDistance(this.currentPosition, this.targetPosition);
    let vibrationStrength = this.calculateVibrationStrength(distance);
    
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
    
    const distance = this.getDistance(this.currentPosition, this.targetPosition);
    const accuracy = Math.max(0, 100 - (distance / 3));
    const roundScore = Math.round(accuracy);
    
    this.score += roundScore;
    
    // 正解位置を表示
    this.scene.add.circle(this.targetPosition.x, this.targetPosition.y, 12, 0x00ff00);
    this.scene.add.text(this.targetPosition.x, this.targetPosition.y - 30, '正解', {
      fontSize: '16px',
      fill: '#00ff00'
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

  endGame() {
    this.scene.children.removeAll();
    
    this.scene.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
    this.scene.add.text(400, 200, 'ゲーム終了！', {
      fontSize: '36px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.scene.add.text(400, 280, `最終スコア: ${this.score}点`, {
      fontSize: '28px',
      fill: '#ffff00'
    }).setOrigin(0.5);
    
    let evaluation = '';
    if (this.score >= 400) evaluation = 'パーフェクト！';
    else if (this.score >= 300) evaluation = '素晴らしい！';
    else if (this.score >= 200) evaluation = '良い！';
    else if (this.score >= 100) evaluation = 'まあまあ';
    else evaluation = 'もう一度挑戦！';
    
    this.scene.add.text(400, 320, evaluation, {
      fontSize: '24px',
      fill: '#00ff00'
    }).setOrigin(0.5);
    
    const restartBtn = this.scene.add.text(400, 400, 'もう一度プレイ', {
      fontSize: '20px',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();
    
    restartBtn.on('pointerdown', () => {
      this.startGame();
    });
  }

  destroy() {
    this.gameActive = false;
    if (this.jc) {
      this.jc.rumble(0, 0, 0, 0);
    }
  }
} 