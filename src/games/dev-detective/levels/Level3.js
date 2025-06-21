import BaseLevel from './BaseLevel.js';

export default class Level3 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = 'CONSOLE_IS_YOUR_FRIEND';
    this.secretElement = null;
  }

  setupLevel() {
    const hintContent = this.createHintContent(
      '🔍 レベル3: DOM探偵',
      'この謎解きエリア自体を検査してください（右クリック→検証）。このdiv要素の<strong>data属性</strong>に隠されたメッセージを見つけてください。',
      'data-hidden-message という属性を探してください'
    );

    // 秘密の要素を追加
    const secretElementHtml = `
      <div id="secret-element" data-secret-value="CONSOLE_IS_YOUR_FRIEND" style="opacity: 0.01; font-size: 1px;">
        <!-- 隠されたメッセージ: DOM検査で見つけてください -->
      </div>
    `;

    this.uiManager.updateHintArea(hintContent + secretElementHtml);

    const inputGroup = this.createInputGroup(
      '隠されたメッセージ:',
      'data属性の値を入力',
      'level3-input',
      () => this.handleSubmit()
    );

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);

    // 秘密要素への参照を保存
    this.secretElement = document.getElementById('secret-element');
  }

  handleSubmit() {
    const input = document.getElementById('level3-input');
    if (input) {
      this.checkAnswer(input.value, this.correctAnswer);
    }
  }

  getSuccessMessage() {
    return '見事！DOM検査のマスターですね！';
  }

  getErrorMessage() {
    return '違います。この要素を右クリック→検証でDOMを調べてください。';
  }

  cleanup() {
    super.cleanup();
    if (this.secretElement) {
      this.secretElement.remove();
      this.secretElement = null;
    }
  }
} 