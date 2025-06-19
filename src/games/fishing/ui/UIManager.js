import { UPGRADE_CONFIG, UpgradeManager } from '../utils/UpgradeManager.js';
import { FishDex } from '../utils/FishDex.js';
import { FISH_TYPES } from '../data/fishData.js';

export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.gameContainer = document.getElementById('game-container');
    if (this.gameContainer) {
        this.gameContainer.style.position = 'relative';
    }
  }

  create() {
    // Top Bar Container
    const topBar = document.createElement('div');
    topBar.id = 'top-bar-container';
    topBar.classList.add('game-scene-ui');
    topBar.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 24px 32px;
        box-sizing: border-box;
        z-index: 100;
        pointer-events: none;
    `;
    this.gameContainer?.appendChild(topBar);

    // Children for Top Bar
    const scoreUI = this.createScoreUI();
    const topRightButtons = this.createTopRightButtons();
    topBar.appendChild(scoreUI);
    topBar.appendChild(topRightButtons);

    // Other UI elements
    this.createControlButtons();
    this.createAllMinigameUIs();
    this.createUpgradeUI();
  }

  createScoreUI() {
    let scoreDiv = document.getElementById('score-ui');
    if (!scoreDiv) {
      scoreDiv = document.createElement('div');
      scoreDiv.id = 'score-ui';
    }
    scoreDiv.style.cssText = `
        background: linear-gradient(135deg, #232526 0%, #414345 100%);
        color: #fff;
        font-size: 2.2rem;
        font-weight: bold;
        padding: 12px 32px;
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        letter-spacing: 0.05em;
        text-shadow: 0 2px 8px #000a;
        user-select: none;
        pointer-events: auto;
    `;
    this.scoreDiv = scoreDiv;
    this.updateScoreUI();
    return scoreDiv;
  }
  
  _makeBtn(id, text, bg) {
    let btn = document.getElementById(id);
    if (!btn) {
        btn = document.createElement('button');
        btn.id = id;
    }
    btn.textContent = text;
    btn.style.background = bg;
    btn.style.color = '#fff';
    btn.style.fontSize = '1.3rem';
    btn.style.fontWeight = 'bold';
    btn.style.padding = '12px 36px';
    btn.style.border = 'none';
    btn.style.borderRadius = '12px';
    btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'background 0.2s, box-shadow 0.2s, transform 0.1s';
    btn.style.whiteSpace = 'nowrap'; // テキストの折り返しを禁止
    btn.onmouseover = () => {
      if (!btn.disabled) {
        btn.style.transform = 'scale(1.07)';
        btn.style.boxShadow = '0 8px 24px rgba(0,0,0,0.28)';
        if (id === 'reel-btn') btn.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
        else if(id === 'cast-btn') btn.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
      }
    };
    btn.onmouseout = () => {
      if (!btn.disabled) {
        btn.style.background = bg;
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
      }
    };
    return btn;
  };
  
  createControlButtons(){
    let btnArea = document.getElementById('btn-area');
    if (!btnArea) {
      btnArea = document.createElement('div');
      btnArea.id = 'btn-area';
      btnArea.classList.add('game-scene-ui');
      this.gameContainer?.appendChild(btnArea);
    }
    btnArea.style.position = 'absolute';
    btnArea.style.left = '50%';
    btnArea.style.transform = 'translateX(-50%)';
    btnArea.style.width = 'auto'; // 幅を自動調整
    btnArea.style.bottom = '24px';
    btnArea.style.display = 'flex';
    btnArea.style.justifyContent = 'center';
    btnArea.style.gap = '32px';
    btnArea.style.zIndex = '100';

    const castBtn = this._makeBtn('cast-btn', 'キャスト', 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)');
    castBtn.onclick = () => this.scene.castLine();
 
    const reelBtn = this._makeBtn('reel-btn', 'リールを巻く', 'linear-gradient(135deg, #2980b9 0%, #2c3e50 100%)');
    reelBtn.onmousedown = this.scene.onReelBtnMouseDown.bind(this.scene);
    reelBtn.onmouseup = this.scene.onReelBtnMouseUp.bind(this.scene);
    reelBtn.onmouseleave = () => { this.scene.isPlayerPulling = false; };
 
    const switchCamBtn = this._makeBtn('switch-cam-btn', '視点切替', 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)');
    switchCamBtn.onclick = () => this.scene.switchCameraPerspective();
    
    btnArea.appendChild(castBtn);
    btnArea.appendChild(reelBtn);
    btnArea.appendChild(switchCamBtn);
  }

  createTopRightButtons() {
    let topUiArea = document.getElementById('top-ui-area');
    if(!topUiArea) {
        topUiArea = document.createElement('div');
        topUiArea.id = 'top-ui-area';
    }
    topUiArea.style.cssText = `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        pointer-events: auto;
    `;
 
    const upgradeBtn = this._makeBtn('upgrade-btn', '強化', 'linear-gradient(135deg, #ff5f6d 0%, #ffc371 100%)');
    const dexBtn = this._makeBtn('dex-btn', '図鑑', 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)');
    const titleBtn = this._makeBtn('title-btn', 'タイトルへ', 'linear-gradient(135deg, #868f96 0%, #596164 100%)');
    
    upgradeBtn.onclick = () => {
        this.updateUpgradePanel();
        const panel = document.getElementById('upgrade-panel');
        if(panel) panel.style.display = 'block';
    }
    dexBtn.onclick = () => this.showDex(true);
    titleBtn.onclick = () => this.scene.scene.start('TitleScene');

    topUiArea.appendChild(upgradeBtn);

    if ('hid' in navigator) {
        const joyConBtn = this._makeBtn('joycon-btn', 'Joy-Con接続', 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)');
        joyConBtn.onclick = () => this.scene.connectJoyCon();
        topUiArea.appendChild(joyConBtn);
    }

    topUiArea.appendChild(dexBtn);
    topUiArea.appendChild(titleBtn);
    return topUiArea;
  }

  createAllMinigameUIs() {
    // --- テンションゲームUI ---
    const tensionContainer = document.createElement('div');
    tensionContainer.id = 'minigame-ui-tension';
    tensionContainer.classList.add('minigame-container', 'game-scene-ui');
    tensionContainer.style.display = 'none'; // 最初は非表示
    this.gameContainer?.appendChild(tensionContainer);
    tensionContainer.innerHTML = `
      <img id="minigame-action-icon" style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 40px; height: 40px; opacity: 0; transition: opacity 0.2s;">
      <div style="width: 100%; height: 20px; background: #333; border-radius: 5px; position: relative; overflow: hidden;">
        <div id="tension-safe-zone" style="position: absolute; left: ${this.scene.minigame.tension.safeZone.start}%; width: ${this.scene.minigame.tension.safeZone.end - this.scene.minigame.tension.safeZone.start}%; height: 100%; background: rgba(20, 200, 20, 0.4);"></div>
        <div id="tension-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #fceabb 0%, #f8b500 100%); border-radius: 5px; transition: width 0.1s linear;"></div>
      </div>
      <div class="progress-bar-bg"><div id="tension-progress-bar" class="progress-bar-fill"></div></div>
    `;
    
    // --- タイミングゲームUI ---
    const timingContainer = document.createElement('div');
    timingContainer.id = 'minigame-ui-timing';
    timingContainer.classList.add('minigame-container', 'game-scene-ui');
    timingContainer.style.display = 'none'; // 最初は非表示
    this.gameContainer?.appendChild(timingContainer);
    timingContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="text-align: left; color: white; font-size: 0.9rem; white-space: nowrap;">タイミングで止めろ！</div>
            <div id="timing-miss-count" style="text-align: right; color: #ffc107; font-size: 0.9rem; font-weight: bold; white-space: nowrap;"></div>
        </div>
        <div id="timing-track" style="width: 100%; height: 25px; background: #333; border-radius: 5px; position: relative; overflow: hidden;">
            <div id="timing-safe-zone" style="position: absolute; height: 100%; background: rgba(20, 200, 20, 0.5);"></div>
            <div id="timing-marker" style="position: absolute; width: 4px; height: 100%; background: #ffc107;"></div>
        </div>
        <div class="progress-bar-bg"><div id="timing-progress-bar" class="progress-bar-fill"></div></div>
    `;
 
    // 共通スタイルをCSSで定義 (可読性のため)
    const style = document.createElement('style');
    style.textContent = `
      .minigame-container {
        position: absolute; bottom: 120px; left: 50%;
        transform: translateX(-50%); width: 300px; z-index: 200;
        background: rgba(0,0,0,0.5); border-radius: 8px;
        padding: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      .progress-bar-bg {
        width: 100%; height: 8px; background: #333;
        border-radius: 4px; margin-top: 8px;
      }
      .progress-bar-fill {
        width: 0%; height: 100%;
        background: linear-gradient(90deg, #89f7fe 0%, #66a6ff 100%);
        border-radius: 4px; transition: width 0.2s linear;
      }
    `;
    document.head.appendChild(style);
  }

  createUpgradeUI() {
    const panel = document.createElement('div');
    panel.id = 'upgrade-panel';
    panel.classList.add('game-scene-ui');
    panel.style.cssText = `
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 400px; background: rgba(30,30,30,0.9); border-radius: 16px;
        z-index: 500; display: none; padding: 20px; color: white;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5); backdrop-filter: blur(5px);
        border: 1px solid rgba(255,255,255,0.1);
    `;
    this.gameContainer?.appendChild(panel);

    panel.innerHTML = `
        <div style="display:flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 10px; margin-bottom: 15px;">
            <h2 style="font-size: 1.8rem; margin: 0; text-shadow: 0 2px 5px rgba(0,0,0,0.5);">装備強化</h2>
            <button id="upgrade-close-btn" style="background: #555; border: none; color: white; border-radius: 50%; width: 30px; height: 30px; font-size: 1rem; cursor: pointer;">×</button>
        </div>
        <div id="upgrade-items-container"></div>
        <div style="text-align: right; margin-top: 20px; font-size: 1.2rem;">
            所持ポイント: <span id="upgrade-current-points" style="font-weight: bold; color: #ffc107;"></span>
        </div>
    `;

    document.getElementById('upgrade-close-btn').onclick = () => {
      panel.style.display = 'none';
    };

    this.updateUpgradePanel();
  }

  updateUpgradePanel() {
      const container = document.getElementById('upgrade-items-container');
      if (!container) return;

      container.innerHTML = '';

      ['rod', 'reel'].forEach(type => {
          const config = UPGRADE_CONFIG[type];
          const level = UpgradeManager.getLevel(type);
          const cost = UpgradeManager.getUpgradeCost(type);
          const canAfford = UpgradeManager.canUpgrade(type, this.scene.gameState.score);

          const itemDiv = document.createElement('div');
          itemDiv.style.cssText = `
              display: flex; justify-content: space-between; align-items: center;
              padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 10px;
          `;

          itemDiv.innerHTML = `
              <div style="flex: 1; margin-right: 15px;">
                  <h3 style="margin: 0 0 5px 0;">${config.name} <span style="font-size: 0.9rem; color: #ccc;">Lv. ${level}</span></h3>
                  <p style="margin: 0; font-size: 0.8rem; color: #aaa;">${config.description}</p>
              </div>
              <div>
                  <button class="upgrade-buy-btn" data-type="${type}" ${cost === null || !canAfford ? 'disabled' : ''}>
                      ${cost !== null ? `${cost}P` : 'MAX'}
                  </button>
              </div>
          `;
          container.appendChild(itemDiv);
      });
      
      document.querySelectorAll('.upgrade-buy-btn').forEach(btn => {
          btn.style.cssText = `
              background: linear-gradient(135deg, #fceabb 0%, #f8b500 100%);
              border: none; color: #333; font-weight: bold; padding: 8px 16px;
              border-radius: 6px; cursor: pointer; transition: transform 0.1s;
          `;
          if (btn.disabled) {
              btn.style.background = '#555';
              btn.style.cursor = 'not-allowed';
              btn.style.color = '#999';
          }
          btn.onclick = (e) => {
            const type = e.target.dataset.type;
            this.scene.onUpgradeAttempt(type);
          };
      });

      const pointsSpan = document.getElementById('upgrade-current-points');
      if (pointsSpan) pointsSpan.textContent = this.scene.gameState.score;
  }
  
  updateScoreUI() {
    if (this.scoreDiv) {
      this.scoreDiv.textContent = `SCORE: ${this.scene.gameState.score}`;
    }
  }

  showMessage(text, duration = 2000, isMajor = true) {
    let msgDiv = document.getElementById('message-ui');
    if (!msgDiv) {
      msgDiv = document.createElement('div');
      msgDiv.id = 'message-ui';
      msgDiv.classList.add('game-scene-ui');
      if (this.gameContainer) {
          this.gameContainer.appendChild(msgDiv);
      }
      msgDiv.style.position = 'absolute';
      msgDiv.style.top = '50%';
      msgDiv.style.left = '50%';
      msgDiv.style.transform = 'translate(-50%, -50%)';
      msgDiv.style.zIndex = '300';
      msgDiv.style.background = 'rgba(0,0,0,0.7)';
      msgDiv.style.color = 'white';
      msgDiv.style.padding = '20px 40px';
      msgDiv.style.borderRadius = '12px';
      msgDiv.style.textAlign = 'center';
      msgDiv.style.transition = 'opacity 0.4s ease-in-out';
      msgDiv.style.opacity = '0';
      msgDiv.style.pointerEvents = 'none';
      msgDiv.style.boxShadow = '0 5px 25px rgba(0,0,0,0.3)';
      msgDiv.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
    }

    msgDiv.textContent = text;
    
    if (isMajor) {
      msgDiv.style.fontSize = '2rem';
      msgDiv.style.fontWeight = 'bold';
    } else {
      msgDiv.style.fontSize = '1.4rem';
      msgDiv.style.fontWeight = 'normal';
    }

    if (msgDiv.hideTimeout) clearTimeout(msgDiv.hideTimeout);
    if (msgDiv.showTimeout) clearTimeout(msgDiv.showTimeout);

    msgDiv.style.display = 'block';
    msgDiv.showTimeout = setTimeout(() => {
        msgDiv.style.opacity = '1';
    }, 50);

    msgDiv.hideTimeout = setTimeout(() => {
      msgDiv.style.opacity = '0';
      msgDiv.hideTimeout = setTimeout(() => {
        msgDiv.style.display = 'none';
      }, 400); 
    }, duration);
  }

  showDex(visible) {
    let dexContainer = document.getElementById('fish-dex-container');
    if (!dexContainer) {
        dexContainer = document.createElement('div');
        dexContainer.id = 'fish-dex-container';
        dexContainer.classList.add('game-scene-ui');
        this.gameContainer?.appendChild(dexContainer);
        dexContainer.style.position = 'absolute';
        dexContainer.style.top = '0';
        dexContainer.style.left = '0';
        dexContainer.style.width = '100%';
        dexContainer.style.height = '100%';
        dexContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        dexContainer.style.zIndex = '1000';
        dexContainer.style.display = 'flex';
        dexContainer.style.justifyContent = 'center';
        dexContainer.style.alignItems = 'center';
        dexContainer.style.color = 'white';
        dexContainer.style.backdropFilter = 'blur(5px)';

        const dexContent = document.createElement('div');
        dexContent.style.width = '90%';
        dexContent.style.height = '90%';
        dexContent.style.maxWidth = '1000px';
        dexContent.style.maxHeight = '700px';
        dexContent.style.background = 'rgba(30, 30, 30, 0.9)';
        dexContent.style.borderRadius = '20px';
        dexContent.style.padding = '20px';
        dexContent.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        dexContent.style.overflowY = 'auto';
        dexContainer.appendChild(dexContent);

        const title = document.createElement('h2');
        title.textContent = '魚図鑑';
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        title.style.fontSize = '2rem';
        dexContent.appendChild(title);
        
        const fishGrid = document.createElement('div');
        fishGrid.id = 'dex-fish-grid';
        fishGrid.style.display = 'grid';
        fishGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
        fishGrid.style.gap = '20px';
        dexContent.appendChild(fishGrid);

        const closeButton = document.createElement('button');
        closeButton.textContent = '閉じる';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '30px';
        closeButton.style.right = '40px';
        closeButton.style.fontSize = '1rem';
        closeButton.style.padding = '10px 20px';
        closeButton.style.cursor = 'pointer';
        dexContainer.appendChild(closeButton);
        closeButton.onclick = () => this.showDex(false);
    }
    
    dexContainer.style.display = visible ? 'flex' : 'none';

    if (visible) {
      const fishGrid = document.getElementById('dex-fish-grid');
      if (!fishGrid) return;
      fishGrid.innerHTML = '';

      const dexData = FishDex.getDexData();
      
      FISH_TYPES.forEach(fishType => {
        const data = dexData[fishType.name];
        const card = document.createElement('div');
        card.style.background = 'rgba(50, 50, 50, 0.8)';
        card.style.borderRadius = '10px';
        card.style.padding = '15px';
        card.style.textAlign = 'center';
        
        if (data && data.caught) {
          card.innerHTML = `
            <h3 style="margin: 0 0 10px; color: #ffc107;">${fishType.name}</h3>
            <p style="margin: 5px 0;">最大サイズ: <span style="font-weight: bold;">${data.maxSize} cm</span></p>
            <p style="margin: 5px 0;">獲得ポイント: <span style="font-weight: bold;">${fishType.points} P</span></p>
            <p style="margin: 15px 0 0; font-size: 0.9rem; color: #ccc;">${fishType.description}</p>
          `;
        } else {
          card.style.opacity = '0.6';
          card.innerHTML = `
            <h3 style="margin: 0 0 10px; color: #aaa;">???</h3>
            <p style="margin: 5px 0;">最大サイズ: ---</p>
            <p style="margin: 5px 0;">獲得ポイント: ---</p>
            <p style="margin: 15px 0 0; font-size: 0.9rem; color: #888;">まだ釣っていない魚</p>
          `;
        }
        fishGrid.appendChild(card);
      });
    }
  }

  cleanup() {
    // ゲームシーンで作成したUI要素を全て削除
    document.querySelectorAll('.game-scene-ui').forEach(el => el.remove());
    
    // ゲームシーンで追加したスタイルを削除
    const style = document.querySelector('style');
    if (style && style.textContent.includes('.minigame-container')) {
        style.remove();
    }
  }
} 