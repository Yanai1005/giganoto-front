import BaseLevel from './BaseLevel.js';

export default class Level5 extends BaseLevel {
  constructor(uiManager, levelManager) {
    super(uiManager, levelManager);
    this.correctAnswer = '42DEBUG007';
    this.finalSecretElement = null;
  }

  setupLevel() {
    const hintContent = `
      <h3>🏆 最終レベル: 総合挑戦</h3>
      <p>すべてのスキルを使って最後の謎を解いてください！</p>
      <p>以下のヒントを組み合わせて<strong>最終パスワード</strong>を作成してください：</p>
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Session Storageの "temp_clue" の値</li>
        <li>Local Storageの "hidden_code_fragment" の値</li>
        <li>下の隠しエリアのstyle.colorプロパティに隠された数字</li>
      </ul>
      <div style="margin-top: 15px; padding: 10px; background: rgba(255, 255, 0, 0.2); border-radius: 5px;">
        💡 ヒント: 3つの値を順番に繋げてください（例: ABC123DEF）
      </div>
      <div id="final-secret" style="color: #007; opacity: 0.01;">
        <!-- 検査してstyle.colorを確認してください。007が隠れています -->
      </div>
    `;

    this.uiManager.updateHintArea(hintContent);

    const inputGroup = this.createInputGroup(
      '最終パスワード:',
      '3つの手がかりを組み合わせて',
      'level5-input',
      () => this.handleSubmit()
    );

    this.uiManager.updateInputArea('');
    const inputArea = document.getElementById('input-area');
    inputArea.appendChild(inputGroup);

    // 最終秘密要素への参照を保存
    this.finalSecretElement = document.getElementById('final-secret');
  }

  handleSubmit() {
    const input = document.getElementById('level5-input');
    if (input) {
      this.checkAnswer(input.value, this.correctAnswer);
    }
  }

  getSuccessMessage() {
    return '🎉 全レベルクリア！あなたは真のDeveloper Detectiveです！';
  }

  getErrorMessage() {
    return '違います。SessionStorage、LocalStorage、そしてCSS styleの3つの手がかりを組み合わせてください。';
  }

  cleanup() {
    super.cleanup();
    if (this.finalSecretElement) {
      this.finalSecretElement = null;
    }
  }
} 