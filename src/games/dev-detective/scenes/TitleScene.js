export default class TitleScene {
  constructor(container, onStart) {
    this.container = container;
    this.onStart = onStart;
    this.animationElements = [];
  }

  create() {
    this.setupContainer();
    this.createBackground();
    
    // メインコンテンツをラップするコンテナを作成
    const mainContent = document.createElement('div');
    mainContent.style.width = '100%';
    mainContent.style.maxWidth = '1200px';
    mainContent.style.padding = '2rem';
    mainContent.style.boxSizing = 'border-box';
    mainContent.style.display = 'flex';
    mainContent.style.flexDirection = 'column';
    mainContent.style.alignItems = 'center';
    mainContent.style.justifyContent = 'center';
    mainContent.style.minHeight = '100vh';
    mainContent.style.position = 'relative';
    mainContent.style.zIndex = '10';
    
    this.container.appendChild(mainContent);
    
    // 元のcontainerの代わりにmainContentを使用
    const originalContainer = this.container;
    this.container = mainContent;
    
    this.createTitle();
    this.createSubtitle();
    this.createStartButton();
    this.createFeatures();
    this.createFooter();
    
    // containerを元に戻す
    this.container = originalContainer;
    
    this.addAnimations();
  }

  setupContainer() {
    this.container.innerHTML = '';
    this.container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    this.container.style.color = '#ffffff';
    this.container.style.fontFamily = "'JetBrains Mono', 'Courier New', monospace";
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';
    this.container.style.padding = '0';
    this.container.style.minHeight = '100vh';
    this.container.style.width = '100%';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.justifyContent = 'center';
    this.container.style.alignItems = 'center';
  }

  createBackground() {
    // アニメーション背景要素を作成
    const backgroundCode = document.createElement('div');
    backgroundCode.style.position = 'absolute';
    backgroundCode.style.top = '0';
    backgroundCode.style.left = '0';
    backgroundCode.style.width = '100%';
    backgroundCode.style.height = '100%';
    backgroundCode.style.opacity = '0.1';
    backgroundCode.style.fontSize = '14px';
    backgroundCode.style.lineHeight = '1.2';
    backgroundCode.style.whiteSpace = 'pre-wrap';
    backgroundCode.style.overflow = 'hidden';
    backgroundCode.style.animation = 'scrollCode 20s linear infinite';
    
    const codeText = `
console.log('Initializing Developer Detective...');
const secrets = ['localStorage', 'sessionStorage', 'networkHeaders'];
function investigateDOM(element) {
  return element.getAttribute('data-secret');
}
class Detective {
  constructor() {
    this.tools = ['console', 'devtools', 'inspector'];
  }
  solve(mystery) {
    return this.tools.reduce((clues, tool) => {
      return clues.concat(this.use(tool, mystery));
    }, []);
  }
}
// The mystery awaits... Are you ready to debug reality?
`;
    
    backgroundCode.textContent = codeText.repeat(10);
    this.container.appendChild(backgroundCode);
  }

  createTitle() {
    const titleContainer = document.createElement('div');
    titleContainer.style.textAlign = 'center';
    titleContainer.style.paddingTop = '8vh';
    titleContainer.style.position = 'relative';
    titleContainer.style.zIndex = '10';
    titleContainer.style.width = '100%';
    titleContainer.style.display = 'flex';
    titleContainer.style.flexDirection = 'column';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.justifyContent = 'center';

    // メインタイトル
    const title = document.createElement('h1');
    title.innerHTML = '🕵️‍♂️ <span class="highlight">Developer</span><br><span class="detective">Detective</span>';
    title.style.fontSize = 'clamp(2.5rem, 6vw, 4.5rem)';
    title.style.fontWeight = '900';
    title.style.margin = '0';
    title.style.letterSpacing = '0.05em';
    title.style.textShadow = '0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(106, 90, 205, 0.4)';
    title.style.animation = 'titleGlow 3s ease-in-out infinite alternate';
    title.style.lineHeight = '1.1';
    title.style.textAlign = 'center';

    titleContainer.appendChild(title);
    this.container.appendChild(titleContainer);
    this.animationElements.push(title);
  }

  createSubtitle() {
    const subtitle = document.createElement('div');
    subtitle.style.textAlign = 'center';
    subtitle.style.marginTop = '1.5rem';
    subtitle.style.position = 'relative';
    subtitle.style.zIndex = '10';
    subtitle.style.width = '100%';
    subtitle.style.display = 'flex';
    subtitle.style.flexDirection = 'column';
    subtitle.style.alignItems = 'center';
    subtitle.style.justifyContent = 'center';
    subtitle.style.maxWidth = '800px';
    subtitle.style.margin = '1.5rem auto 0 auto';
    subtitle.style.padding = '0 2rem';

    const mainSubtitle = document.createElement('p');
    mainSubtitle.textContent = '開発者ツールを駆使して謎を解け！';
    mainSubtitle.style.fontSize = 'clamp(1.1rem, 2.5vw, 1.6rem)';
    mainSubtitle.style.margin = '0 0 1rem 0';
    mainSubtitle.style.opacity = '0';
    mainSubtitle.style.animation = 'fadeInUp 1s 0.5s ease-out forwards';
    mainSubtitle.style.textAlign = 'center';
    mainSubtitle.style.lineHeight = '1.4';

    const description = document.createElement('p');
    description.textContent = 'Console・DOM・Network・Storage を使った本格謎解きゲーム';
    description.style.fontSize = 'clamp(0.9rem, 1.8vw, 1.1rem)';
    description.style.opacity = '0';
    description.style.animation = 'fadeInUp 1s 0.8s ease-out forwards';
    description.style.margin = '0';
    description.style.textAlign = 'center';
    description.style.lineHeight = '1.5';

    subtitle.appendChild(mainSubtitle);
    subtitle.appendChild(description);
    this.container.appendChild(subtitle);
  }

  createStartButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.textAlign = 'center';
    buttonContainer.style.marginTop = '2.5rem';
    buttonContainer.style.position = 'relative';
    buttonContainer.style.zIndex = '10';
    buttonContainer.style.width = '100%';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.alignItems = 'center';

    const startButton = document.createElement('button');
    startButton.innerHTML = '🚀 ゲーム開始';
    startButton.style.fontSize = 'clamp(1.1rem, 2.5vw, 1.4rem)';
    startButton.style.padding = '1rem 2.5rem';
    startButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    startButton.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    startButton.style.borderRadius = '50px';
    startButton.style.color = 'white';
    startButton.style.fontWeight = 'bold';
    startButton.style.cursor = 'pointer';
    startButton.style.transition = 'all 0.3s ease';
    startButton.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
    startButton.style.position = 'relative';
    startButton.style.overflow = 'hidden';
    startButton.style.opacity = '0';
    startButton.style.animation = 'fadeInUp 1s 1.2s ease-out forwards';
    startButton.style.whiteSpace = 'nowrap';
    startButton.style.minWidth = 'auto';

    // ホバーエフェクト
    startButton.onmouseover = () => {
      startButton.style.transform = 'translateY(-3px) scale(1.05)';
      startButton.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.4)';
      startButton.style.background = 'linear-gradient(135deg, #7b8ce8 0%, #8a5aa8 100%)';
    };

    startButton.onmouseout = () => {
      startButton.style.transform = 'translateY(0) scale(1)';
      startButton.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
      startButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    };

    startButton.onclick = () => {
      this.startGame();
    };

    buttonContainer.appendChild(startButton);
    this.container.appendChild(buttonContainer);
  }

  createFeatures() {
    const featuresContainer = document.createElement('div');
    featuresContainer.style.display = 'flex';
    featuresContainer.style.justifyContent = 'center';
    featuresContainer.style.alignItems = 'stretch';
    featuresContainer.style.gap = '1.5rem';
    featuresContainer.style.marginTop = '3rem';
    featuresContainer.style.flexWrap = 'wrap';
    featuresContainer.style.position = 'relative';
    featuresContainer.style.zIndex = '10';
    featuresContainer.style.padding = '0 2rem';
    featuresContainer.style.maxWidth = '900px';
    featuresContainer.style.margin = '3rem auto 0 auto';

    const features = [
      { icon: '🎮', title: '5つのレベル', desc: '段階的な難易度' },
      { icon: '🔍', title: 'デベロッパーツール', desc: 'Console・DOM・Network' },
      { icon: '🏆', title: 'スキル習得', desc: 'デバッグ技術をマスター' }
    ];

    features.forEach((feature, index) => {
      const featureCard = document.createElement('div');
      featureCard.style.background = 'rgba(255, 255, 255, 0.1)';
      featureCard.style.backdropFilter = 'blur(10px)';
      featureCard.style.borderRadius = '15px';
      featureCard.style.padding = '1.5rem';
      featureCard.style.textAlign = 'center';
      featureCard.style.flex = '1';
      featureCard.style.minWidth = '180px';
      featureCard.style.maxWidth = '250px';
      featureCard.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      featureCard.style.opacity = '0';
      featureCard.style.animation = `fadeInUp 1s ${1.5 + index * 0.2}s ease-out forwards`;
      featureCard.style.transition = 'transform 0.3s ease';
      featureCard.style.display = 'flex';
      featureCard.style.flexDirection = 'column';
      featureCard.style.justifyContent = 'center';

      featureCard.onmouseover = () => {
        featureCard.style.transform = 'translateY(-5px)';
      };

      featureCard.onmouseout = () => {
        featureCard.style.transform = 'translateY(0)';
      };

      const icon = document.createElement('div');
      icon.textContent = feature.icon;
      icon.style.fontSize = '2rem';
      icon.style.marginBottom = '0.8rem';

      const title = document.createElement('h3');
      title.textContent = feature.title;
      title.style.margin = '0 0 0.5rem 0';
      title.style.fontSize = '1rem';
      title.style.fontWeight = 'bold';
      title.style.whiteSpace = 'nowrap';

      const desc = document.createElement('p');
      desc.textContent = feature.desc;
      desc.style.margin = '0';
      desc.style.fontSize = '0.85rem';
      desc.style.opacity = '0.8';
      desc.style.lineHeight = '1.3';

      featureCard.appendChild(icon);
      featureCard.appendChild(title);
      featureCard.appendChild(desc);
      featuresContainer.appendChild(featureCard);
    });

    this.container.appendChild(featuresContainer);
  }

  createFooter() {
    const footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.opacity = '0.6';
    footer.style.fontSize = '0.9rem';
    footer.style.zIndex = '10';
    footer.style.marginTop = '2rem';
    footer.style.marginBottom = '2rem';
    footer.style.padding = '0 2rem';
    footer.style.maxWidth = '600px';
    footer.style.lineHeight = '1.4';

    this.container.appendChild(footer);
  }

  addAnimations() {
    const style = document.createElement('style');
    style.id = 'dev-detective-title-styles';
    style.textContent = `
      @keyframes titleGlow {
        0% { text-shadow: 0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(106, 90, 205, 0.4); }
        100% { text-shadow: 0 0 40px rgba(255, 255, 255, 0.5), 0 0 80px rgba(106, 90, 205, 0.6); }
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes scrollCode {
        from { transform: translateY(0); }
        to { transform: translateY(-50%); }
      }
      
      .highlight {
        color: #a8edea;
        text-shadow: 0 0 20px rgba(168, 237, 234, 0.5);
      }
      
      .detective {
        color: #fed6e3;
        text-shadow: 0 0 20px rgba(254, 214, 227, 0.5);
      }
      
      @media (max-width: 768px) {
        .features-container {
          flex-direction: column !important;
          align-items: center !important;
        }
        .features-container > div {
          max-width: 300px !important;
          margin-bottom: 1rem !important;
        }
      }
      
      @media (max-width: 480px) {
        h1 {
          font-size: 2rem !important;
        }
        .features-container {
          padding: 0 1rem !important;
        }
      }
    `;

    if (!document.getElementById(style.id)) {
      document.head.appendChild(style);
    }
  }

  startGame() {
    // フェードアウトアニメーション
    this.container.style.transition = 'opacity 0.5s ease';
    this.container.style.opacity = '0';
    
    setTimeout(() => {
      if (this.onStart) {
        this.onStart();
      }
    }, 500);
  }

  destroy() {
    const styleElement = document.getElementById('dev-detective-title-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    if (this.container) {
      this.container.innerHTML = '';
      this.container.style.background = '';
      this.container.style.color = '';
      this.container.style.fontFamily = '';
      this.container.style.overflow = '';
      this.container.style.padding = '';
      this.container.style.opacity = '';
      this.container.style.transition = '';
    }
  }
} 