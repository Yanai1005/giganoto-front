export default class MessageDisplay {
  constructor() {
    this.currentMessage = null;
    this.styleSheet = null;
    this.initializeStyles();
  }

  initializeStyles() {
    // アニメーション用のスタイルシートを作成
    this.styleSheet = document.createElement('style');
    this.styleSheet.id = 'dev-detective-message-styles';
    this.styleSheet.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -60%); }
        20% { opacity: 1; transform: translate(-50%, -50%); }
        80% { opacity: 1; transform: translate(-50%, -50%); }
        100% { opacity: 0; transform: translate(-50%, -40%); }
      }
      
      .dev-detective-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        font-size: 1.2rem;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: fadeInOut 3s ease-in-out;
        max-width: 80%;
        text-align: center;
        font-weight: bold;
      }
    `;
    
    if (!document.getElementById(this.styleSheet.id)) {
      document.head.appendChild(this.styleSheet);
    }
  }

  showMessage(message, color = '#4CAF50', duration = 3000) {
    // 既存のメッセージを削除
    this.clearMessage();

    this.currentMessage = document.createElement('div');
    this.currentMessage.className = 'dev-detective-message';
    this.currentMessage.textContent = message;
    this.currentMessage.style.background = color;

    document.body.appendChild(this.currentMessage);
    
    setTimeout(() => {
      this.clearMessage();
    }, duration);
  }

  showSuccess(message, duration = 3000) {
    this.showMessage(message, '#4CAF50', duration);
  }

  showError(message, duration = 3000) {
    this.showMessage(message, '#f44336', duration);
  }

  showInfo(message, duration = 3000) {
    this.showMessage(message, '#2196F3', duration);
  }

  showWarning(message, duration = 3000) {
    this.showMessage(message, '#FF9800', duration);
  }

  clearMessage() {
    if (this.currentMessage) {
      this.currentMessage.remove();
      this.currentMessage = null;
    }
  }

  cleanup() {
    this.clearMessage();
    if (this.styleSheet) {
      this.styleSheet.remove();
      this.styleSheet = null;
    }
  }
} 