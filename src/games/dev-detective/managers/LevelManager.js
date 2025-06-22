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
      <div class="game-complete-container" style="
        text-align: center; 
        padding: 20px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        position: relative;
        overflow: hidden;
        animation: gameCompleteSlideIn 0.8s ease-out;
        max-height: 60vh;
        overflow-y: auto;
      ">
        <!-- 背景装飾 -->
        <div style="
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 25px 25px;
          animation: backgroundFloat 20s linear infinite;
          pointer-events: none;
        "></div>
        
        <!-- メインコンテンツ -->
        <div style="position: relative; z-index: 2;">
          <!-- 成功アイコン -->
          <div style="
            font-size: 2.5rem;
            margin-bottom: 10px;
            animation: successBounce 2s ease-in-out infinite;
          ">🏆</div>
          
          <!-- タイトル -->
          <h2 style="
            color: #ffffff;
            font-size: 2rem;
            margin-bottom: 8px;
            text-shadow: 0 3px 12px rgba(0,0,0,0.3);
            animation: titleGlow 3s ease-in-out infinite alternate;
            font-weight: 700;
            letter-spacing: 0.5px;
          ">HACK'Z HACKATHON</h2>
          
          <h3 style="
            color: #f0f8ff;
            font-size: 1.5rem;
            margin-bottom: 15px;
            text-shadow: 0 2px 8px rgba(0,0,0,0.2);
            font-weight: 600;
          ">GIGANOTO 2025 🎉</h3>
          
          <!-- メッセージ -->
          <p style="
            font-size: 1rem;
            margin-bottom: 15px;
            color: #ffffff;
            text-shadow: 0 2px 6px rgba(0,0,0,0.2);
            line-height: 1.4;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          ">
            <strong>🎊 完全制覇おめでとうございます！ 🎊</strong><br>
            あなたは真の<span style="color: #FFD700; font-weight: bold;">Developer Detective マスター</span>になりました！
          </p>
          
          <!-- スキル一覧 -->
          <div style="
            margin-top: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 10px;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
          ">
            <h3 style="
              color: #FFD700;
              font-size: 1.2rem;
              margin-bottom: 12px;
              text-shadow: 0 2px 6px rgba(0,0,0,0.3);
              font-weight: 600;
            ">🏅 習得したマスタースキル</h3>
            
            <div style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 8px;
              margin-top: 10px;
            ">
              <div class="skill-item" style="
                padding: 8px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 6px;
                border-left: 2px solid #4CAF50;
                animation: skillFadeIn 0.6s ease-out 0.1s both;
                font-size: 0.85rem;
              ">
                <span style="color: #4CAF50; font-size: 0.9rem;">🖥️</span>
                <strong style="color: #ffffff; margin-left: 5px;">コンソール操作</strong>
              </div>
              
              <div class="skill-item" style="
                padding: 8px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 6px;
                border-left: 2px solid #2196F3;
                animation: skillFadeIn 0.6s ease-out 0.2s both;
                font-size: 0.85rem;
              ">
                <span style="color: #2196F3; font-size: 0.9rem;">💾</span>
                <strong style="color: #ffffff; margin-left: 5px;">ストレージ調査</strong>
              </div>
              
              <div class="skill-item" style="
                padding: 8px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 6px;
                border-left: 2px solid #FF9800;
                animation: skillFadeIn 0.6s ease-out 0.3s both;
                font-size: 0.85rem;
              ">
                <span style="color: #FF9800; font-size: 0.9rem;">🔍</span>
                <strong style="color: #ffffff; margin-left: 5px;">DOM要素検査</strong>
              </div>
              
              <div class="skill-item" style="
                padding: 8px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 6px;
                border-left: 2px solid #E91E63;
                animation: skillFadeIn 0.6s ease-out 0.4s both;
                font-size: 0.85rem;
              ">
                <span style="color: #E91E63; font-size: 0.9rem;">🌐</span>
                <strong style="color: #ffffff; margin-left: 5px;">ネットワーク分析</strong>
              </div>
              
              <div class="skill-item" style="
                padding: 8px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 6px;
                border-left: 2px solid #9C27B0;
                animation: skillFadeIn 0.6s ease-out 0.5s both;
                grid-column: 1 / -1;
                font-size: 0.85rem;
              ">
                <span style="color: #9C27B0; font-size: 0.9rem;">⚡</span>
                <strong style="color: #ffffff; margin-left: 5px;">総合デバッグ技術</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        @keyframes gameCompleteSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes successBounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-6px);
          }
          60% {
            transform: translateY(-3px);
          }
        }
        
        @keyframes titleGlow {
          from {
            text-shadow: 0 3px 12px rgba(0,0,0,0.3);
          }
          to {
            text-shadow: 0 3px 15px rgba(255,215,0,0.3), 0 0 20px rgba(255,255,255,0.15);
          }
        }
        
        @keyframes backgroundFloat {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes skillFadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .skill-item:hover {
          transform: translateY(-1px);
          transition: transform 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
      </style>
    `;

    this.uiManager.updateHintArea(gameCompleteContent);
    this.uiManager.updateInputArea(''); // 入力エリアを空にする
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