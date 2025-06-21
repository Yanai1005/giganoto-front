import BaseLevel from './BaseLevel.js';

export default class Level2 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = 'UNLOCK_NEXT_LEVEL';
  }

  setupLevel() {
    const hintContent = this.createHintContent(
      '🗄️ レベル2: ストレージハンター',
      '開発者ツールのApplicationタブ（またはStorageタブ）を開いてください。Local Storageに隠された<strong>秘密のキー</strong>を見つけてください。',
      '"dev_detective_secret_key" という名前のキーを探してください'
    );

    this.uiManager.updateHintArea(hintContent);

    const inputGroup = this.createInputGroup(
      '秘密のキー:',
      'Local Storageの値を入力',
      'level2-input',
      () => this.handleSubmit()
    );

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);
  }

  handleSubmit() {
    const input = document.getElementById('level2-input');
    if (input) {
      this.checkAnswer(input.value, this.correctAnswer);
    }
  }

  getSuccessMessage() {
    return '完璧！Local Storageの調査ができました！';
  }

  getErrorMessage() {
    return '違います。ApplicationタブのLocal Storageを確認してください。';
  }
} 