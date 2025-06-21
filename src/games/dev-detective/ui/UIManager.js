import MessageDisplay from './MessageDisplay.js';

export default class UIManager {
  constructor(container) {
    this.container = container;
    this.messageDisplay = new MessageDisplay();
    this.currentLevel = 1;
    this.maxLevels = 5;
  }

  createMainUI() {
    this.createTitle();
    this.createLevelDisplay();
    this.createHintArea();
    this.createInputArea();
  }

  createTitle() {
    const titleContainer = document.createElement('div');
    titleContainer.style.textAlign = 'center';
    titleContainer.style.marginBottom = '30px';
    
    const title = document.createElement('h1');
    title.textContent = '🕵️‍♂️ Developer Detective';
    title.style.fontSize = '3rem';
    title.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
    title.style.marginBottom = '10px';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = '開発者ツールを駆使して謎を解け！';
    subtitle.style.fontSize = '1.2rem';
    subtitle.style.opacity = '0.8';
    
    titleContainer.appendChild(title);
    titleContainer.appendChild(subtitle);
    this.container.appendChild(titleContainer);
  }

  createLevelDisplay() {
    const levelDisplay = document.createElement('div');
    levelDisplay.id = 'level-display';
    levelDisplay.style.position = 'fixed';
    levelDisplay.style.top = '20px';
    levelDisplay.style.right = '20px';
    levelDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
    levelDisplay.style.padding = '10px 20px';
    levelDisplay.style.borderRadius = '10px';
    levelDisplay.style.fontSize = '1.2rem';
    this.updateLevelDisplay();
    this.container.appendChild(levelDisplay);
  }

  createHintArea() {
    const hintArea = document.createElement('div');
    hintArea.id = 'hint-area';
    hintArea.style.background = 'rgba(255, 255, 255, 0.1)';
    hintArea.style.padding = '20px';
    hintArea.style.borderRadius = '10px';
    hintArea.style.marginBottom = '20px';
    hintArea.style.border = '2px dashed rgba(255, 255, 255, 0.3)';
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
      padding: '10px 20px',
      fontSize: '1.1rem',
      background: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    };
    
    // スタイルを適用
    Object.assign(button.style, defaultStyle, style);
    
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
      padding: '10px',
      fontSize: '1.1rem',
      background: 'rgba(255,255,255,0.9)',
      color: 'black',
      border: 'none',
      borderRadius: '5px'
    };
    
    Object.assign(input.style, defaultStyle, style);
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
    const button = this.createButton(buttonText, onSubmit);

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
  }
} 