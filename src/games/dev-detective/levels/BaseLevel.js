export default class BaseLevel {
  constructor(uiManager, levelManager) {
    this.uiManager = uiManager;
    this.levelManager = levelManager;
    this.isActive = false;
  }

  start() {
    this.isActive = true;
    this.setupLevel();
  }

  setupLevel() {
    // 各レベルで実装する
    throw new Error('setupLevel() must be implemented by subclass');
  }

  checkAnswer(userAnswer, correctAnswer) {
    if (userAnswer === correctAnswer) {
      this.onSuccess();
      return true;
    } else {
      this.onError();
      return false;
    }
  }

  onSuccess() {
    // 成功時の処理を各レベルで実装可能
    this.levelManager.onLevelComplete(this.getSuccessMessage());
  }

  onError() {
    // エラー時の処理を各レベルで実装可能
    this.levelManager.onLevelError(this.getErrorMessage());
  }

  getSuccessMessage() {
    return 'レベルクリア！';
  }

  getErrorMessage() {
    return '答えが違います。';
  }

  createHintContent(title, description, hints) {
    return `
      <h3>${title}</h3>
      <p>${description}</p>
      <div style="margin-top: 15px; padding: 10px; background: rgba(255, 255, 0, 0.2); border-radius: 5px;">
        💡 ヒント: ${hints}
      </div>
    `;
  }

  createInputGroup(labelText, placeholder, inputId, onSubmit) {
    const group = this.uiManager.createInputGroup(
      labelText,
      placeholder,
      inputId,
      '確認',
      onSubmit
    );
    return group;
  }

  cleanup() {
    this.isActive = false;
    // 必要に応じて各レベルで追加のクリーンアップを実装
  }
} 