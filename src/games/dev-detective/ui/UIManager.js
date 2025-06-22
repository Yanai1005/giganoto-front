import MessageDisplay from './MessageDisplay.js';

export default class UIManager {
  constructor(container) {
    this.container = container;
    this.messageDisplay = new MessageDisplay();
    this.currentLevel = 1;
    this.maxLevels = 5;
    
    // コンテナの位置設定を確実にする
    if (this.container) {
      this.container.style.position = 'relative';
    }
  }

  createMainUI() {
    this.createTitle();
    this.createLevelDisplay();
    this.createBackToTitleButton();
    this.createHintArea();
    this.createInputArea();
    this.addUIAnimations();
  }
  
  addUIAnimations() {
    const style = document.createElement('style');
    style.id = 'dev-detective-game-styles';
    style.textContent = `
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      #hint-area, #input-area, #level-display {
        position: relative;
        z-index: 10;
        animation: slideInUp 0.6s ease-out;
      }
      
      #hint-area h3 {
        color: #a8edea;
        margin-bottom: 15px;
        font-size: 1.4rem;
        text-shadow: 0 0 10px rgba(168, 237, 234, 0.3);
      }
      
      #hint-area p {
        line-height: 1.6;
        margin-bottom: 10px;
      }
      
      #hint-area ul {
        margin-left: 20px;
        line-height: 1.8;
      }
      
      .hint-highlight {
        background: rgba(255, 255, 0, 0.2);
        padding: 15px;
        border-radius: 10px;
        border-left: 4px solid #fed6e3;
        margin: 15px 0;
      }
    `;
    
    if (!document.getElementById(style.id)) {
      document.head.appendChild(style);
    }
  }

  createTitle() {
    const titleContainer = document.createElement('div');
    titleContainer.style.textAlign = 'center';
    titleContainer.style.marginBottom = '30px';
    titleContainer.style.position = 'relative';
    
    const title = document.createElement('h1');
    title.innerHTML = '🕵️‍♂️ <span style="color: #a8edea;">Developer</span> <span style="color: #fed6e3;">Detective</span>';
    title.style.fontSize = 'clamp(2rem, 5vw, 3rem)';
    title.style.fontWeight = '800';
    title.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(106, 90, 205, 0.2)';
    title.style.marginBottom = '10px';
    title.style.letterSpacing = '0.02em';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = '謎解き進行中...';
    subtitle.style.fontSize = '1.1rem';
    subtitle.style.opacity = '0.7';
    subtitle.style.fontStyle = 'italic';
    
    titleContainer.appendChild(title);
    titleContainer.appendChild(subtitle);
    this.container.appendChild(titleContainer);
  }

  createLevelDisplay() {
    const levelDisplay = document.createElement('div');
    levelDisplay.id = 'level-display';
    levelDisplay.style.position = 'absolute';
    levelDisplay.style.top = '80px';
    levelDisplay.style.right = '20px';
    levelDisplay.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)';
    levelDisplay.style.backdropFilter = 'blur(10px)';
    levelDisplay.style.padding = '12px 20px';
    levelDisplay.style.borderRadius = '25px';
    levelDisplay.style.fontSize = '1.1rem';
    levelDisplay.style.fontWeight = 'bold';
    levelDisplay.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    levelDisplay.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    levelDisplay.style.zIndex = '1000';
    this.updateLevelDisplay();
    this.container.appendChild(levelDisplay);
  }

  createBackToTitleButton() {
    const backButton = document.createElement('button');
    backButton.id = 'back-to-title-button';
    backButton.innerHTML = '🏠 タイトルに戻る';
    backButton.style.position = 'absolute';
    backButton.style.top = '80px';
    backButton.style.left = '20px';
    backButton.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)';
    backButton.style.backdropFilter = 'blur(10px)';
    backButton.style.padding = '12px 20px';
    backButton.style.borderRadius = '25px';
    backButton.style.fontSize = '1rem';
    backButton.style.fontWeight = 'bold';
    backButton.style.color = 'white';
    backButton.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    backButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    backButton.style.cursor = 'pointer';
    backButton.style.transition = 'all 0.3s ease';
    backButton.style.zIndex = '1000';
    backButton.style.opacity = '0';
    backButton.style.animation = 'slideInLeft 0.6s 0.3s ease-out forwards';

    // ホバーエフェクト
    backButton.onmouseover = () => {
      backButton.style.transform = 'translateY(-2px) scale(1.05)';
      backButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
      backButton.style.background = 'linear-gradient(135deg, rgba(123, 140, 232, 0.9) 0%, rgba(138, 90, 168, 0.9) 100%)';
    };

    backButton.onmouseout = () => {
      backButton.style.transform = 'translateY(0) scale(1)';
      backButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
      backButton.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)';
    };

    // クリックイベントは後でDevDetectiveSceneで設定
    this.container.appendChild(backButton);
  }

  createHintArea() {
    const hintArea = document.createElement('div');
    hintArea.id = 'hint-area';
    hintArea.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)';
    hintArea.style.backdropFilter = 'blur(15px)';
    hintArea.style.padding = '25px';
    hintArea.style.borderRadius = '20px';
    hintArea.style.marginBottom = '25px';
    hintArea.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    hintArea.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
    hintArea.style.position = 'relative';
    hintArea.style.overflow = 'hidden';
    this.container.appendChild(hintArea);
  }

  createInputArea() {
    const inputArea = document.createElement('div');
    inputArea.id = 'input-area';
    inputArea.style.marginTop = '20px';
    this.container.appendChild(inputArea);
  }

  updateLevelDisplay(level = this.currentLevel) {
    this.currentLevel = level;
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay) {
      levelDisplay.textContent = `レベル ${level} / ${this.maxLevels}`;
    }
  }

  updateHintArea(content) {
    const hintArea = document.getElementById('hint-area');
    if (hintArea) {
      hintArea.innerHTML = content;
    }
  }

  updateInputArea(content) {
    const inputArea = document.getElementById('input-area');
    if (inputArea) {
      inputArea.innerHTML = content;
    }
  }

  createButton(text, onClick, style = {}) {
    const button = document.createElement('button');
    button.textContent = text;
    
    // デフォルトスタイル
    const defaultStyle = {
      padding: '12px 25px',
      fontSize: '1.1rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '25px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    };
    
    // スタイルを適用
    Object.assign(button.style, defaultStyle, style);
    
    // ホバーエフェクト
    button.onmouseover = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
      button.style.background = 'linear-gradient(135deg, #7b8ce8 0%, #8a5aa8 100%)';
    };
    
    button.onmouseout = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
      button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    };
    
    if (onClick) {
      button.onclick = onClick;
    }
    
    return button;
  }

  createInput(placeholder, id, style = {}) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    if (id) input.id = id;
    
    // デフォルトスタイル
    const defaultStyle = {
      padding: '12px 18px',
      fontSize: '1.1rem',
      background: 'rgba(255, 255, 255, 0.95)',
      color: '#333',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '25px',
      outline: 'none',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      minWidth: '200px'
    };
    
    Object.assign(input.style, defaultStyle, style);
    
    // フォーカスエフェクト
    input.onfocus = () => {
      input.style.border = '2px solid #667eea';
      input.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
      input.style.transform = 'translateY(-1px)';
    };
    
    input.onblur = () => {
      input.style.border = '2px solid rgba(255, 255, 255, 0.3)';
      input.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      input.style.transform = 'translateY(0)';
    };
    
    return input;
  }

  createInputGroup(labelText, inputPlaceholder, inputId, buttonText, onSubmit) {
    const group = document.createElement('div');
    group.style.display = 'flex';
    group.style.gap = '10px';
    group.style.alignItems = 'center';

    const label = document.createElement('label');
    label.textContent = labelText;
    label.style.fontWeight = 'bold';

    const input = this.createInput(inputPlaceholder, inputId);
    
    // 連打防止付きのボタンを作成
    const button = this.createButton(buttonText, () => {
      // ボタンが既に無効化されている場合は処理しない
      if (button.disabled) {
        return;
      }
      
      // 一時的にボタンを無効化
      button.disabled = true;
      button.style.opacity = '0.6';
      button.style.cursor = 'not-allowed';
      
      // 元のハンドラーを実行
      if (onSubmit) {
        onSubmit();
      }
      
      // 1秒後にボタンを再有効化
      setTimeout(() => {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      }, 1000);
    });

    // Enterキーでも送信可能にする
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !button.disabled) {
        button.click();
      }
    });

    group.appendChild(label);
    group.appendChild(input);
    group.appendChild(button);

    return group;
  }

  showSuccess(message) {
    this.messageDisplay.showMessage(message, '#4CAF50');
  }

  showError(message) {
    this.messageDisplay.showMessage(message, '#f44336');
  }

  cleanup() {
    this.messageDisplay.cleanup();
    
    const gameStyles = document.getElementById('dev-detective-game-styles');
    if (gameStyles) {
      gameStyles.remove();
    }
    
    // タイトルに戻るボタンを削除
    const backButton = document.getElementById('back-to-title-button');
    if (backButton) {
      backButton.remove();
    }
    
    // レベル表示も削除
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay) {
      levelDisplay.remove();
    }
  }
} 