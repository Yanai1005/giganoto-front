import Level1 from '../levels/Level1.js';
import Level2 from '../levels/Level2.js';
import Level3 from '../levels/Level3.js';
import Level4 from '../levels/Level4.js';
import Level5 from '../levels/Level5.js';

export default class LevelManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.currentLevel = 1;
    this.maxLevels = 5;
    this.levels = this.initializeLevels();
    this.currentLevelInstance = null;
    this.isTransitioning = false; // レベル遷移中フラグ
  }

  initializeLevels() {
    return {
      1: new Level1(this.uiManager, this),
      2: new Level2(this.uiManager, this),
      3: new Level3(this.uiManager, this),
      4: new Level4(this.uiManager, this),
      5: new Level5(this.uiManager, this)
    };
  }

  startGame() {
    this.startLevel(1);
  }

  startLevel(levelNumber) {
    if (levelNumber > this.maxLevels) {
      this.gameComplete();
      return;
    }

    this.currentLevel = levelNumber;
    this.isTransitioning = false; // 新しいレベル開始時にリセット
    this.uiManager.updateLevelDisplay(levelNumber);
    
    // 前のレベルインスタンスをクリアンアップ
    if (this.currentLevelInstance && typeof this.currentLevelInstance.cleanup === 'function') {
      this.currentLevelInstance.cleanup();
    }

    // 新しいレベルを開始
    this.currentLevelInstance = this.levels[levelNumber];
    if (this.currentLevelInstance) {
      this.currentLevelInstance.start();
    }
  }

  onLevelComplete(message) {
    // 既にレベル遷移中の場合は無視
    if (this.isTransitioning) {
      console.log('⏳ レベル遷移中です...');
      return;
    }

    // レベル遷移開始
    this.isTransitioning = true;
    
    this.uiManager.showSuccess(message);
    
    setTimeout(() => {
      const nextLevel = this.currentLevel + 1;
      if (nextLevel <= this.maxLevels) {
        this.startLevel(nextLevel);
      } else {
        this.gameComplete();
      }
    }, 2000);
  }

  onLevelError(message) {
    // エラー時は遷移フラグをリセットしない（再挑戦可能）
    this.uiManager.showError(message);
  }

  gameComplete() {
    this.isTransitioning = true; // ゲーム完了状態を維持
    this.showGameCompleteScreen();
    this.outputFinalConsoleMessages();
  }

  showGameCompleteScreen() {
    const gameCompleteContent = `
      <div style="text-align: center; padding: 40px;">
        <h2 style="color: #4CAF50; font-size: 3rem; margin-bottom: 20px;">🎉 ゲームクリア！ 🎉</h2>
        <p style="font-size: 1.5rem; margin-bottom: 20px;">
          おめでとうございます！あなたは本物のDeveloper Detectiveです！
        </p>
        <p style="font-size: 1.2rem; opacity: 0.8;">
          開発者ツールをマスターし、すべての謎を解きました。<br>
          この技術を実際の開発にも活用してください！
        </p>
        <div style="margin-top: 30px; padding: 20px; background: rgba(76, 175, 80, 0.2); border-radius: 10px;">
          <h3>🏅 習得したスキル:</h3>
          <ul style="list-style: none; padding: 0;">
            <li>✓ コンソール操作</li>
            <li>✓ ローカルストレージ調査</li>
            <li>✓ DOM要素検査</li>
            <li>✓ ネットワーク分析</li>
            <li>✓ 総合的なデバッグ技術</li>
          </ul>
        </div>
      </div>
    `;

    const restartButton = `
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="location.reload()" 
                style="padding: 15px 30px; font-size: 1.2rem; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
          🔄 もう一度プレイ
        </button>
      </div>
    `;

    this.uiManager.updateHintArea(gameCompleteContent);
    this.uiManager.updateInputArea(restartButton);
  }

  outputFinalConsoleMessages() {
    console.log('🎉 Developer Detective - ゲームクリア！');
    console.log('あなたは真のデベロッパーです！');
    console.log('🏆 すべての謎を解きました！');
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  cleanup() {
    if (this.currentLevelInstance && typeof this.currentLevelInstance.cleanup === 'function') {
      this.currentLevelInstance.cleanup();
    }
    this.isTransitioning = false; // クリーンアップ時にリセット
  }
} 