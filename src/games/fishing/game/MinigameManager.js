import { UpgradeManager } from '../utils/UpgradeManager.js';

export class MinigameManager {
  constructor(scene) {
    this.scene = scene;
    this.ui = scene.ui;
  }

  start(fish) {
    if (this.scene.minigame.active) return;
    
    this.scene.catchingFishObj = fish;
    fish.state = 'hooked';
    this.scene.minigame.active = true;
    this.scene.gameState.catchingFish = true;
    this.scene.minigame.overallProgress = 30; // 初期プログレスを増加

    // ランダムにミニゲームを選択
    this.scene.minigame.type = Math.random() < 0.5 ? 'tension' : 'timing';

    // ボタンのテキストを変更
    const reelBtn = document.getElementById('reel-btn');
    if (reelBtn) reelBtn.textContent = this.scene.minigame.type === 'tension' ? 'PULL!' : 'HIT!';
    const castBtn = document.getElementById('cast-btn');
    if (castBtn) castBtn.style.display = 'none';

    if (this.scene.minigame.type === 'tension') {
        // テンションゲームの初期化
        const reelLevel = UpgradeManager.getLevel('reel');
        const basePullStrength = 1.5;
        this.scene.minigame.tension.pullStrength = basePullStrength + (reelLevel - 1) * 0.1;

        this.scene.minigame.tension.value = 50;
        this.scene.minigame.tension.fishAction = 'normal';
        this.scene.minigame.tension.actionTimer = this.scene.time.now + 2000 + Math.random() * 2000;
        this.scene.minigame.tension.nextActionPreview = false;
        document.getElementById('minigame-ui-tension').style.display = 'block';
    } else {
        // タイミングゲームの初期化
        this.scene.minigame.timing.misses = 0; // ミスカウントをリセット
        document.getElementById('timing-miss-count').textContent = `ミス: 0 / 3`;

        const fishDifficulty = this.scene.catchingFishObj.type.timingDifficulty || 1.0;
        const baseSpeed = 1.2; // 基本速度
        this.scene.minigame.timing.markerPosition = 0;
        this.scene.minigame.timing.markerSpeed = (baseSpeed * fishDifficulty) * (Math.random() < 0.5 ? 1 : -1);

        const safeZone = this.scene.minigame.timing.safeZone;
        safeZone.start = Math.random() * (100 - safeZone.width);
        const safeZoneEl = document.getElementById('timing-safe-zone');
        safeZoneEl.style.left = `${safeZone.start}%`;
        safeZoneEl.style.width = `${safeZone.width}%`;
        document.getElementById('timing-marker').style.left = `0%`; // マーカーを初期位置に
        document.getElementById('minigame-ui-timing').style.display = 'block';
    }
    
    this.ui.showMessage("HIT! 魚とのファイト開始！");
  }

  end(success) {
    if (!this.scene.minigame.active) return;
    
    this.scene.minigame.active = false;
    this.scene.isPlayerPulling = false;

    const caughtFish = this.scene.catchingFishObj;
    this.scene.catchingFishObj = null; // 参照をクリア

    if (success && caughtFish) {
      // 釣り成功
      this.scene.fishDex.recordCatch(caughtFish.type.name, caughtFish.size); // 釣果を記録
      this.scene.gameState.score += caughtFish.type.points;
      this.ui.updateScoreUI();
      this.ui.showMessage(`やった！${caughtFish.size}cmの${caughtFish.type.name}を釣り上げた！`, 3000);
    } else if (!success && caughtFish) {
      // 釣り失敗
      this.ui.showMessage('逃げられてしまった...', 3000);
      caughtFish.state = 'swim';
    } else if (!caughtFish) {
      // 予期せぬエラーケース
      console.error("Minigame ended without a fish.");
      this.ui.showMessage('あれ？魚がいない...', 3000);
    }
    
    this.scene.gameState.catchingFish = false;

    // 釣り糸とウキを非表示にして、キャスト前の状態に戻す
    if (this.scene.float) this.scene.float.visible = false;
    if (this.scene.line) this.scene.line.visible = false;

    // UIを元に戻す
    const reelBtn = document.getElementById('reel-btn');
    if (reelBtn) reelBtn.textContent = 'リールを巻く';
    const castBtn = document.getElementById('cast-btn');
    if (castBtn) castBtn.style.display = 'inline-block';
    
    document.getElementById('minigame-ui-tension').style.display = 'none';
    document.getElementById('minigame-ui-timing').style.display = 'none';
  }

  update(time) {
    if (!this.scene.minigame.active) return;

    // --- ミニゲーム共通のプログレス更新 ---
    this.scene.minigame.overallProgress = Math.max(0, this.scene.minigame.overallProgress);
    
    // --- ミニゲームの種類に応じたロジック ---
    switch (this.scene.minigame.type) {
        case 'tension':
            this.updateTension(time);
            break;
        case 'timing':
            this.updateTiming();
            break;
    }

    // --- 終了判定 ---
    if (this.scene.minigame.overallProgress >= 100) {
        this.end(true);
    } else if (this.scene.minigame.overallProgress <= 0) {
        this.end(false);
    }
  }

  updateTension(time) {
    let tensionChange = 0;
    if (this.scene.isPlayerPulling) tensionChange += this.scene.minigame.tension.pullStrength;
    else tensionChange -= this.scene.minigame.tension.speed;

    switch (this.scene.minigame.tension.fishAction) {
      case 'struggle': tensionChange += (Math.random() - 0.5) * 5.0; break;
      case 'rush': tensionChange += 1.8; break;
      case 'dive': tensionChange -= 1.5; break;
      default: tensionChange += (Math.random() - 0.5) * 2.5; break;
    }
    this.scene.minigame.tension.value += tensionChange;
    this.scene.minigame.tension.value = Math.max(0, Math.min(100, this.scene.minigame.tension.value));

    const actionIcon = document.getElementById('minigame-action-icon');
    if (time > this.scene.minigame.tension.actionTimer - 1000 && !this.scene.minigame.tension.nextActionPreview) {
      this.scene.minigame.tension.nextActionPreview = true;
      const nextAction = ['struggle', 'rush', 'dive'][Math.floor(Math.random() * 3)];
      if (actionIcon) {
        actionIcon.src = `/assets/icons/icon_${nextAction}.svg`;
        actionIcon.style.opacity = '1';
      }
      this.scene.minigame.tension.actionTimer_nextAction = nextAction;
    }
    
    if (time > this.scene.minigame.tension.actionTimer) {
      this.scene.minigame.tension.fishAction = this.scene.minigame.tension.actionTimer_nextAction || 'normal';
      this.scene.minigame.tension.actionTimer = time + 2000 + Math.random() * 2000;
      this.scene.minigame.tension.nextActionPreview = false;
      if (actionIcon) actionIcon.style.opacity = '0';
    }

    const { value, safeZone } = this.scene.minigame.tension;
    if (value > safeZone.start && value < safeZone.end) this.scene.minigame.overallProgress += 0.4;
    else this.scene.minigame.overallProgress -= 0.2;

    document.getElementById('tension-bar').style.width = `${this.scene.minigame.tension.value}%`;
    document.getElementById('tension-progress-bar').style.width = `${this.scene.minigame.overallProgress}%`;

    if(this.scene.minigame.tension.value <=0 || this.scene.minigame.tension.value >= 100) this.scene.minigame.overallProgress -= 0.8;
  }

  updateTiming() {
    const { timing } = this.scene.minigame;
    timing.markerPosition += timing.markerSpeed;
    if (timing.markerPosition > 100 || timing.markerPosition < 0) {
        timing.markerSpeed *= -1; // 壁で跳ね返る
        timing.markerPosition = Math.max(0, Math.min(100, timing.markerPosition));
    }
    document.getElementById('timing-marker').style.left = `${timing.markerPosition}%`;
    document.getElementById('timing-progress-bar').style.width = `${this.scene.minigame.overallProgress}%`;
  }

  onReelBtnMouseUp() {
    // テンションゲームでは長押し終了
    if (this.scene.minigame.active && this.scene.minigame.type === 'tension') {
        this.scene.isPlayerPulling = false;
    }
    
    // タイミングゲームの場合はここでヒット判定
    if (this.scene.minigame.active && this.scene.minigame.type === 'timing') {
      const { markerPosition, safeZone } = this.scene.minigame.timing;
      if (markerPosition > safeZone.start && markerPosition < safeZone.start + safeZone.width) {
        this.scene.minigame.overallProgress += 15; // 成功
        this.ui.showMessage("NICE!", 500, false);

        // 加速処理
        const currentSpeed = Math.abs(this.scene.minigame.timing.markerSpeed);
        const newSpeed = currentSpeed + 0.15; // 加速を緩和
        this.scene.minigame.timing.markerSpeed = newSpeed * Math.sign(this.scene.minigame.timing.markerSpeed);

      } else {
        this.scene.minigame.timing.misses++;
        document.getElementById('timing-miss-count').textContent = `ミス: ${this.scene.minigame.timing.misses} / 3`;

        if (this.scene.minigame.timing.misses >= 3) {
            this.ui.showMessage("3回ミス！逃げられた...", 1500);
            this.end(false);
        } else {
            this.scene.minigame.overallProgress -= 10; 
            this.ui.showMessage("MISS...", 500, false);
        }
      }
    }
  }
} 