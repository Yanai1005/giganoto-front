export default class BaseLevel {
  constructor(uiManager, levelManager) {
    this.uiManager = uiManager;
    this.levelManager = levelManager;
    this.isActive = false;
    this.isProcessing = false; // 連打防止フラグ
  }

  start() {
    this.isActive = true;
    this.isProcessing = false; // レベル開始時にリセット
    this.setupLevel();
  }

  setupLevel() {
    // 各レベルで実装する
    throw new Error('setupLevel() must be implemented by subclass');
  }

  checkAnswer(userAnswer, correctAnswer) {
    // 既に処理中の場合は無視
    if (this.isProcessing) {
      console.log('⏳ 処理中です。しばらくお待ちください...');
      return false;
    }

    // 処理開始
    this.isProcessing = true;

    if (userAnswer === correctAnswer) {
      this.onSuccess();
      return true;
    } else {
      this.onError();
      // エラーの場合は処理フラグをリセット（再挑戦可能）
      this.isProcessing = false;
      return false;
    }
  }

  onSuccess() {
    // 成功時の処理を各レベルで実装可能
    this.levelManager.onLevelComplete(this.getSuccessMessage());
    // 成功時は次のレベルに進むため、フラグはリセットしない
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
    this.isProcessing = false; // クリーンアップ時にリセット
    // 必要に応じて各レベルで追加のクリーンアップを実装
  }
} 