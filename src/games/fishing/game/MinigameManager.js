import { UpgradeManager } from '../utils/UpgradeManager.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import { FISH_TYPES } from '../data/fishData.js';

export class MinigameManager {
  constructor(scene) {
    this.scene = scene;
    this.ui = scene.ui;
    this.gameState = scene.gameState;
    this.minigame = scene.minigame;
    this.currentFish = null;
    this.continuousRumbleInterval = null; // 常時振動用のインターバル
  }

  start(fish) {
    this.currentFish = fish;
    this.minigame.active = true;
    this.minigame.overallProgress = 0.2; // 0から0.2に変更（20%からスタート）
    this.minigameStartTime = performance.now(); // 開始時間を記録
    
    // 魚がヒットした時のメッセージを表示
    if (fish && fish.type && fish.type.name) {
      const rarity = fish.type.rarity || 1;
      let message = '';
      
      switch (rarity) {
        case 1:
          message = '魚がかかったぞ！Joy-Conを振ってリールを巻け！';
          break;
        case 2:
          message = '魚がかかったぞ！なかなかの引きを感じる！';
          break;
        case 3:
          message = '魚がかかったぞ！強い引きだ！';
          break;
        case 4:
          message = '強い引きだ！ これは大物の予感！！';
          break;
        case 5:
          message = '巨大な魚がヒット！すごい引きだ！逃がすな！';
          break;
        default:
          message = '魚がかかったぞ！Joy-Conを振ってリールを巻け！';
      }
      
      this.ui.showMessage(message, 2500);
    } else {
      this.ui.showMessage('魚がヒット！Joy-Conを振ってリールを巻け！', 2000);
    }
    
    // For debugging, force one type
    this.minigame.type = 'tension'; // デバッグ用に強制的にテンションゲーム
    // this.minigame.type = Math.random() < 0.5 ? 'tension' : 'timing';

    if (this.minigame.type === 'tension') {
      this.startTensionGame();
    } else {
      this.startTimingGame();
    }
    
    this.ui.showMinigameUI(this.minigame.type);
  }
  
  startTensionGame() {
    this.minigame.tension.value = 50;
    this.minigame.tension.pullStrength = 12.0; // 8.0から12.0に増加
    this.minigame.tension.safeZone.start = 35 + Math.random() * 20;
    this.minigame.tension.safeZone.end = this.minigame.tension.safeZone.start + 25;
    this.minigame.tension.fishAction = 'normal';
    
    // --- Start continuous fish struggle rumble ---
    this.startContinuousRumble(); 
  }

  startTimingGame() {
    this.minigame.timing.markerPosition = 0;
    this.minigame.timing.misses = 0;
  }
  
  onPlayerReelAction() {
    if (this.minigame.active && this.minigame.type === 'tension') {
      // リールレベルに応じて引き寄せ力を強化
      const reelLevel = UpgradeManager.getLevel('reel');
      const reelBonus = 1 + (reelLevel - 1) * 0.15; // レベル1で1.0倍、レベル10で2.35倍
      
      const baseInput = this.minigame.tension.pullStrength * 0.67;
      this.minigame.tension.value += baseInput * reelBonus;
      this.minigame.tension.value = Math.min(this.minigame.tension.value, 100);

      // リールを巻く振動フィードバック（一時的に強い振動）
      this.temporaryStrongRumble();
    }
  }

  update(time) {
    if (!this.minigame.active) return;

    if (this.minigame.type === 'tension') {
      this.updateTensionGame(time);
    } else {
      this.updateTimingGame();
    }
    
    this.ui.updateMinigameUI(this.minigame);
  }

  updateTensionGame(time) {
    const tension = this.minigame.tension;
    
    // --- プレイヤーのアクション ---
    // isPlayerPulling はJoy-Conの傾きで制御される
    /* if (this.scene.isPlayerPulling) {
        tension.value += tension.pullStrength;
    } */

    // --- 魚の抵抗 ---
    let fishResistance = 0.4; // デフォルト値を0.15から0.4に大幅増加
    if (this.currentFish && this.currentFish.type) {
      const fishData = this.currentFish.type;
      if (fishData.rarity) {
        fishResistance = (fishData.rarity / 5) * 0.6 + 0.3; // 抵抗を大幅に増加
      }
    }
    tension.value -= fishResistance;
    
    // 魚の特殊アクション
    tension.actionTimer -= time;
    if (tension.actionTimer <= 0) {
        // ... (fish action logic remains the same)
    }

    tension.value = Math.max(0, Math.min(100, tension.value));

    // --- プログレスの更新 ---
    if (tension.value >= tension.safeZone.start && tension.value <= tension.safeZone.end) {
      this.minigame.overallProgress += 0.004; // 0.008から0.004に減少（半分に）
    } else {
      this.minigame.overallProgress -= 0.001; // 0.003から0.001に減少（緩やかに）
    }
    this.minigame.overallProgress = Math.max(0, this.minigame.overallProgress);

    // 成功判定
    if (this.minigame.overallProgress >= 1) {
      this.end(true);
    }
    // 失敗判定を追加（少し猶予を持たせる）
    else if (this.minigame.overallProgress <= 0 && time > this.minigameStartTime + 2000) {
      this.end(false);
    }
  }

  updateTimingGame() {
    const { timing } = this.minigame;
    timing.markerPosition += timing.markerSpeed;
    if (timing.markerPosition > 100 || timing.markerPosition < 0) {
        timing.markerSpeed *= -1; // 壁で跳ね返る
        timing.markerPosition = Math.max(0, Math.min(100, timing.markerPosition));
    }
    document.getElementById('timing-marker').style.left = `${timing.markerPosition}%`;
    document.getElementById('timing-progress-bar').style.width = `${this.minigame.overallProgress}%`;
  }
  
  end(success) {
    if (!this.minigame.active) return;
    
    this.stopContinuousRumble(); // 常時振動を停止
    
    this.minigame.active = false;
    this.ui.hideMinigameUI();
    
    const caughtFish = this.currentFish;
    this.currentFish = null; // 参照をクリア

    if (success && caughtFish && caughtFish.type) {
      // 釣り成功
      this.scene.fishDex.recordCatch(caughtFish.type.name, caughtFish.size); // 釣果を記録
      this.scene.gameState.score = ScoreManager.addScore(caughtFish.type.points || 0);
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
  
  startContinuousRumble() {
    if (!this.currentFish || !this.currentFish.type) {
      return;
    }
    
    const fishData = this.currentFish.type;
    if (!fishData || !fishData.rarity) {
      return;
    }

    // レアリティ(1-5)を振動の強さに変換
    const baseRarity = fishData.rarity;
    const low_freq = 80 + (baseRarity - 1) * 10;   // 80Hz - 120Hz
    const high_freq = 160 + (baseRarity - 1) * 20; // 160Hz - 240Hz
    const low_amp = 0.3 + (baseRarity - 1) * 0.1; // 0.3 - 0.7 (テスト用に強く)
    const high_amp = 0.5 + (baseRarity - 1) * 0.1; // 0.5 - 0.9 (テスト用に強く)

    // 常時振動を開始
    const rumblePattern = () => {
      if (this.minigame.active) {
        this.scene.jcHID.rumble(low_freq, high_freq, low_amp, high_amp);
      }
    };
    
    // 最初の振動を即座に開始
    rumblePattern();
    
    // 定期的に振動を更新（150ms間隔）
    this.continuousRumbleInterval = setInterval(rumblePattern, 150);
  }
  
  stopContinuousRumble() {
    if (this.continuousRumbleInterval) {
      clearInterval(this.continuousRumbleInterval);
      this.continuousRumbleInterval = null;
    }
    // 振動を完全に停止
    this.scene.jcHID.rumble(160, 320, 0, 0);
  }
  
  temporaryStrongRumble() {
    // 一時的に強い振動を発生させる
    this.scene.jcHID.rumble(120, 240, 0, 0.6);
    
    // 100ms後に常時振動に戻る
    setTimeout(() => {
      if (this.minigame.active) {
        // 常時振動を再開
        const fishData = this.currentFish?.type;
        if (fishData?.rarity) {
          const baseRarity = fishData.rarity;
          const low_freq = 80 + (baseRarity - 1) * 10;
          const high_freq = 160 + (baseRarity - 1) * 20;
          const low_amp = 0.3 + (baseRarity - 1) * 0.1;
          const high_amp = 0.5 + (baseRarity - 1) * 0.1;
          this.scene.jcHID.rumble(low_freq, high_freq, low_amp, high_amp);
        }
      }
    }, 100);
  }
  
  startFishStruggleRumble() {
    // 後方互換性のため残しておく（現在は使用されない）
    if (!this.currentFish || !this.currentFish.type) return;
    
    const fishData = this.currentFish.type;
    if (!fishData || !fishData.rarity) return;

    // レアリティ(1-5)を振動の強さに変換
    const baseRarity = fishData.rarity;
    const low_freq = 80 + (baseRarity - 1) * 10;   // 80Hz - 120Hz
    const high_freq = 160 + (baseRarity - 1) * 20; // 160Hz - 240Hz
    const low_amp = 0.1 + (baseRarity - 1) * 0.05; // 0.1 - 0.3
    const high_amp = 0.2 + (baseRarity - 1) * 0.1; // 0.2 - 0.6

    this.scene.jcHID.rumble(low_freq, high_freq, low_amp, high_amp);
  }
  
  stopRumble() {
    // 後方互換性のため残しておく
    this.scene.jcHID.rumble(160, 320, 0, 0);
  }
} 