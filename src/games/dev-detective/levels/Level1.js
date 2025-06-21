import BaseLevel from './BaseLevel.js';

export default class Level1 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = '1337';
  }

  setupLevel() {
    const hintContent = this.createHintContent(
      '🎯 レベル1: コンソールマスター',
      '開発者ツールを開いて（F12）、コンソールタブを確認してください。そこに隠された<strong>4桁の数字</strong>を見つけてください。',
      'このページが読み込まれた時、コンソールにメッセージが出力されています'
    );

    this.uiManager.updateHintArea(hintContent);

    const inputGroup = this.createInputGroup(
      'コード:',
      '4桁の数字を入力',
      'level1-input',
      () => this.handleSubmit()
    );

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);

    // コンソールに答えを出力
    this.outputConsoleClues();
  }

  outputConsoleClues() {
    console.log('🔍 Developer Detective - レベル1');
    console.log('隠されたコード: 1337');
    console.log('💡 これがレベル1の答えです！');
  }

  handleSubmit() {
    const input = document.getElementById('level1-input');
    if (input) {
      this.checkAnswer(input.value, this.correctAnswer);
    }
  }

  getSuccessMessage() {
    return '素晴らしい！コンソールを正しく確認できました！';
  }

  getErrorMessage() {
    return '違います。F12を押してコンソールタブを確認してください。';
  }
} 