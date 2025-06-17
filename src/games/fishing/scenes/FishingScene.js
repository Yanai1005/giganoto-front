import Phaser from 'phaser';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { FishDex } from '../utils/FishDex.js';

// ゲームに登場する魚のマスターデータ
const FISH_TYPES = [
  { name: 'ブルーギル', minSize: 10, maxSize: 25, color: 0x66ccff, points: 10, speed: 0.02, description: '北アメリカ原産の淡水魚。繁殖力が非常に強い。' },
  { name: 'コイ', minSize: 30, maxSize: 80, color: 0xff9900, points: 30, speed: 0.012, description: '古くから親しまれている魚。口のひげが特徴的。' },
  { name: 'ブラックバス', minSize: 20, maxSize: 60, color: 0x333333, points: 20, speed: 0.018, description: '大きな口で小魚を捕食する、人気のゲームフィッシュ。' },
  { name: 'フナ', minSize: 15, maxSize: 35, color: 0xaaaa55, points: 12, speed: 0.015, description: 'コイに似ているが、口にひげがなく、体高が高い。' },
  { name: 'ナマズ', minSize: 40, maxSize: 100, color: 0x222222, points: 50, speed: 0.01, description: '長いひげと、ぬるぬるとした体が特徴の夜行性の魚。' },
  { name: 'ニジマス', minSize: 20, maxSize: 50, color: 0xffa07a, points: 25, speed: 0.022, description: '体に散らばる黒点と、虹色の模様が美しい渓流の女王。' },
  { name: 'アユ', minSize: 15, maxSize: 30, color: 0x90ee90, points: 18, speed: 0.025, description: '独特の香りが特徴で「香魚」とも呼ばれる。縄張り意識が強い。' },
  { name: 'ウナギ', minSize: 40, maxSize: 90, color: 0x4B0082, points: 40, speed: 0.016, description: 'にょろにょろと泳ぐ、細長い体の魚。夜行性で、滋養が高い。' },
  { name: 'オオサンショウウオ', minSize: 50, maxSize: 120, color: 0x556b2f, points: 100, speed: 0.008, description: '生きた化石と呼ばれる世界最大級の両生類。特別天然記念物。' },
  { name: 'ドクターフィッシュ', minSize: 5, maxSize: 10, color: 0x808080, points: 5, speed: 0.03, description: '人の古い角質を食べる習性を持つ小さな魚。実はコイの仲間。' }
];

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // Three.js用の変数
    this.threeScene = null;
    this.threeCamera = null;
    this.threeRenderer = null;
    
    // ゲーム状態
    this.gameState = {
      casting: false,
      reeling: false,
      catchingFish: false,
      score: 0
    };
    
    // ミニゲームの状態
    this.minigame = {
      active: false,
      tension: 50, // 0-100
      successProgress: 0, // 0-100
      safeZone: { start: 40, end: 70 },
      tensionSpeed: 0.3, // テンションの自然下降速度
      pullStrength: 1.5, // プレイヤーの引きの強さ
      
      // 新しいミニゲーム用のプロパティ
      fishAction: 'normal', // 'normal', 'struggle', 'rush', 'dive'
      actionTimer: 0,
      nextActionPreview: false,
    };
    this.isPlayerPulling = false;
    
    // 魚のデータ
    this.fishes = [];

    // カメラ視点の定義
    this.cameraPerspectives = [
      { // 斜め視点
        position: { x: 0, y: 15, z: 25 },
        lookAt: { x: 0, y: 0, z: 0 },
        up: null // デフォルトのY軸が上
      },
      { // 真上からの視点
        position: { x: 0, y: 30, z: 0.1 },
        lookAt: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 0, z: -1 } // 転倒防止
      }
    ];
    this.currentPerspectiveIndex = 0;
    this.pondTopVerticesCount = 0; // 波アニメーション用に上面の頂点数を保存
  }

  preload() {
    this.load.image('rod', 'src/games/fishing/assets/rod.png');
    this.load.image('water', 'src/games/fishing/assets/water.jpg');
  }

  create() {
    console.log('GameScene create開始');
    
    // Phaserのカメラ背景を透明にし、Three.jsの描画が見えるようにする
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    
    // 釣果記録を初期化
    FishDex.initialize(FISH_TYPES);

    // Three.jsの初期化（canvasの生成と追加もここで行う）
    this.initThreeJS();
    
    // 3Dオブジェクトの作成
    this.createWaterSurface();
    this.generateFishes();
    this.createEnvironment();
    this.setupFishingRodControls();
    
    // HTMLベースのUIを作成
    this.createHTMLUI();

    // ウィンドウリサイズイベントに対応
    window.addEventListener('resize', this.onResize.bind(this));
    // Scene破棄時にイベントリスナーを削除
    this.events.on('shutdown', () => {
      window.removeEventListener('resize', this.onResize.bind(this));
      this.cleanupHTML();
      if (this.threeRenderer) {
          this.threeRenderer.domElement.remove();
      }
    });
  }

  initThreeJS() {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        console.error("game-container not found!");
        return;
    }
    const width = gameContainer.clientWidth;
    const height = gameContainer.clientHeight;
    
    // 既存のThree.js canvasがあれば削除
    const oldCanvas = gameContainer?.querySelector('canvas.three-canvas');
    if (oldCanvas) {
      gameContainer.removeChild(oldCanvas);
    }

    this.threeScene = new THREE.Scene();

    this.threeCamera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    
    this.createFishingRod(); // カメラに釣竿を追加

    // 定義した初期視点を設定
    this.setCameraPerspective(this.currentPerspectiveIndex);

    this.threeRenderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true 
    });
    this.threeRenderer.setSize(width, height);
    this.threeRenderer.setClearColor(0x000000, 0); // 背景を透明に
    this.threeRenderer.domElement.classList.add('three-canvas');

    if (gameContainer) {
      // prependでPhaserのcanvasの背後に追加
      gameContainer.prepend(this.threeRenderer.domElement);
      this.threeRenderer.domElement.style.position = 'absolute';
      this.threeRenderer.domElement.style.top = '0';
      this.threeRenderer.domElement.style.left = '0';
      this.threeRenderer.domElement.style.pointerEvents = 'none';
    }
    
    // ライティング
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.threeScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.threeScene.add(directionalLight);

    // 背景を設定
    new RGBELoader()
      .setPath('src/games/fishing/assets/') // アセットへのパス
      .load('sky.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.threeScene.background = texture;
        this.threeScene.environment = texture;
      },
      undefined,
      () => console.error("Failed to load background texture")
      );
  }

  createHTMLUI() {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.position = 'relative';
    }

   let scoreDiv = document.getElementById('score-ui');
   if (!scoreDiv) {
     scoreDiv = document.createElement('div');
     scoreDiv.id = 'score-ui';
     scoreDiv.classList.add('game-scene-ui');
     gameContainer?.appendChild(scoreDiv);
   }
   scoreDiv.style.position = 'absolute';
   scoreDiv.style.top = '24px';
   scoreDiv.style.left = '32px';
   scoreDiv.style.zIndex = '100';
   scoreDiv.style.background = 'linear-gradient(135deg, #232526 0%, #414345 100%)';
   scoreDiv.style.color = '#fff';
   scoreDiv.style.fontSize = '2.2rem';
   scoreDiv.style.fontWeight = 'bold';
   scoreDiv.style.padding = '12px 32px';
   scoreDiv.style.borderRadius = '16px';
   scoreDiv.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
   scoreDiv.style.letterSpacing = '0.05em';
   scoreDiv.style.textShadow = '0 2px 8px #000a';
   scoreDiv.style.userSelect = 'none';
   this.scoreDiv = scoreDiv;
   this.updateScoreUI();

   let btnArea = document.getElementById('btn-area');
   if (!btnArea) {
     btnArea = document.createElement('div');
     btnArea.id = 'btn-area';
     btnArea.classList.add('game-scene-ui');
     gameContainer?.appendChild(btnArea);
   }
   btnArea.style.position = 'absolute';
   btnArea.style.left = '50%';
   btnArea.style.transform = 'translateX(-50%)';
   btnArea.style.width = 'auto'; // 幅を自動調整
   btnArea.style.bottom = '24px';
   btnArea.style.display = 'flex';
   btnArea.style.justifyContent = 'center';
   btnArea.style.gap = '32px';
   btnArea.style.zIndex = '100';

   const makeBtn = (id, text, bg) => {
       let btn = document.getElementById(id);
       if (!btn) {
           btn = document.createElement('button');
           btn.id = id;
       }
       btn.textContent = text;
       btn.style.background = bg;
       btn.style.color = '#fff';
       btn.style.fontSize = '1.3rem';
       btn.style.fontWeight = 'bold';
       btn.style.padding = '12px 36px';
       btn.style.border = 'none';
       btn.style.borderRadius = '12px';
       btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
       btn.style.cursor = 'pointer';
       btn.style.transition = 'background 0.2s, box-shadow 0.2s, transform 0.1s';
       btn.style.whiteSpace = 'nowrap'; // テキストの折り返しを禁止
       btn.onmouseover = () => {
         btn.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
         btn.style.transform = 'scale(1.07)';
         btn.style.boxShadow = '0 8px 24px rgba(0,0,0,0.28)';
       };
       btn.onmouseout = () => {
         btn.style.background = bg;
         btn.style.transform = 'scale(1)';
         btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
       };
       return btn;
   };
   const castBtn = makeBtn('cast-btn', 'キャスト', 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)');
   const reelBtn = makeBtn('reel-btn', 'リール', 'linear-gradient(135deg, #396afc 0%, #2948ff 100%)');
   const viewBtn = makeBtn('view-btn', '視点切替', 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)');
   btnArea.replaceChildren(castBtn, reelBtn, viewBtn);

   const dexBtn = makeBtn('dex-btn', '図鑑', 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)');
   const titleBtn = makeBtn('title-btn', 'タイトルへ', 'linear-gradient(135deg, #6c757d 0%, #343a40 100%)');
   
   const topUiArea = document.getElementById('top-ui-area') || document.createElement('div');
   topUiArea.id = 'top-ui-area';
   topUiArea.classList.add('game-scene-ui');
   if (!document.getElementById('top-ui-area')) {
     topUiArea.style.position = 'absolute';
     topUiArea.style.top = '24px';
     topUiArea.style.right = '32px';
     topUiArea.style.zIndex = '100';
     topUiArea.style.display = 'flex';
     topUiArea.style.gap = '16px';
     gameContainer?.appendChild(topUiArea);
   }
   topUiArea.replaceChildren(dexBtn, titleBtn);
   
   // 既存のボタンエリアの位置調整
   btnArea.style.left = '50%';
   btnArea.style.transform = 'translateX(-50%)';
   btnArea.style.width = 'auto'; // 幅を自動調整

   reelBtn.style.userSelect = 'none'; // テキスト選択を防ぐ
   reelBtn.onmousedown = () => { if (this.minigame.active) this.isPlayerPulling = true; };
   reelBtn.onmouseup = () => { if (this.minigame.active) this.isPlayerPulling = false; };
   reelBtn.onmouseleave = () => { if (this.minigame.active) this.isPlayerPulling = false; }; // カーソルがボタンから外れた場合
   // ミニゲーム中以外は通常のreelLineを呼ぶ
   reelBtn.onclick = () => { if (!this.minigame.active) this.reelLine(); };

   castBtn.onclick = () => this.castLine();
   viewBtn.onclick = () => this.switchCameraPerspective();
   dexBtn.onclick = () => this.showDex(true);
   titleBtn.onclick = () => this.scene.start('TitleScene');
   
   this.createMinigameUI(gameContainer);
 }
  
  createMinigameUI(container) {
    let minigameDiv = document.getElementById('minigame-ui');
    if (!minigameDiv) {
      minigameDiv = document.createElement('div');
      minigameDiv.id = 'minigame-ui';
      minigameDiv.classList.add('game-scene-ui');
      container?.appendChild(minigameDiv);
    }
    minigameDiv.style.position = 'absolute';
    minigameDiv.style.bottom = '120px';
    minigameDiv.style.left = '50%';
    minigameDiv.style.transform = 'translateX(-50%)';
    minigameDiv.style.width = '300px';
    minigameDiv.style.zIndex = '200';
    minigameDiv.style.display = 'none'; // 最初は非表示
    minigameDiv.style.background = 'rgba(0,0,0,0.5)';
    minigameDiv.style.borderRadius = '8px';
    minigameDiv.style.padding = '10px';
    minigameDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';

    // テンションゲージのコンテナ
    const tensionGauge = document.createElement('div');
    tensionGauge.style.width = '100%';
    tensionGauge.style.height = '20px';
    tensionGauge.style.background = '#333';
    tensionGauge.style.borderRadius = '5px';
    tensionGauge.style.position = 'relative';
    tensionGauge.style.overflow = 'hidden';
    minigameDiv.appendChild(tensionGauge);

    // テンションゲージのセーフゾーン
    const safeZone = document.createElement('div');
    safeZone.id = 'tension-safe-zone';
    safeZone.style.position = 'absolute';
    safeZone.style.left = `${this.minigame.safeZone.start}%`;
    safeZone.style.width = `${this.minigame.safeZone.end - this.minigame.safeZone.start}%`;
    safeZone.style.height = '100%';
    safeZone.style.background = 'rgba(20, 200, 20, 0.4)';
    tensionGauge.appendChild(safeZone);

    // テンションバー本体
    const tensionBar = document.createElement('div');
    tensionBar.id = 'tension-bar';
    tensionBar.style.width = '0%';
    tensionBar.style.height = '100%';
    tensionBar.style.background = 'linear-gradient(90deg, #fceabb 0%, #f8b500 100%)';
    tensionBar.style.borderRadius = '5px';
    tensionBar.style.transition = 'width 0.1s linear';
    tensionGauge.appendChild(tensionBar);
    
    // 成功プログレスバー
    const successProgress = document.createElement('div');
    successProgress.style.width = '100%';
    successProgress.style.height = '8px';
    successProgress.style.background = '#333';
    successProgress.style.borderRadius = '4px';
    successProgress.style.marginTop = '8px';
    minigameDiv.appendChild(successProgress);

    const successProgressBar = document.createElement('div');
    successProgressBar.id = 'success-progress-bar';
    successProgressBar.style.width = '0%';
    successProgressBar.style.height = '100%';
    successProgressBar.style.background = 'linear-gradient(90deg, #89f7fe 0%, #66a6ff 100%)';
    successProgressBar.style.borderRadius = '4px';
    successProgressBar.style.transition = 'width 0.2s linear';
    successProgress.appendChild(successProgressBar);

    // 予告アクションアイコン
    const actionIcon = document.createElement('img');
    actionIcon.id = 'minigame-action-icon';
    actionIcon.style.position = 'absolute';
    actionIcon.style.top = '-50px';
    actionIcon.style.left = '50%';
    actionIcon.style.transform = 'translateX(-50%)';
    actionIcon.style.width = '40px';
    actionIcon.style.height = '40px';
    actionIcon.style.opacity = '0';
    actionIcon.style.transition = 'opacity 0.2s';
    minigameDiv.appendChild(actionIcon);

    this.minigameUI = minigameDiv;
  }
  
  createEnvironment() {
    const rockCount = 40;
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        roughness: 0.8,
        metalness: 0.1
    });

    for (let i = 0; i < rockCount; i++) {
        const rockRadius = Math.random() * 0.5 + 0.2;
        // 0 detail for a low-poly look
        const rockGeometry = new THREE.IcosahedronGeometry(rockRadius, 0);
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);

        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * (this.pondRadius * 0.9);
        
        // 池の底に配置
        rock.position.set(
            Math.cos(angle) * r,
            -2.0 - Math.random() * 1.5, // Y座標を深くして、確実に水面下に沈める
            Math.sin(angle) * r
        );
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        this.threeScene.add(rock);
    }
  }
  
  createWaterSurface() {
    const pondRadius = 20;

    // 2Dの円(CircleGeometry)から、厚みのある円柱(CylinderGeometry)に変更
    const pondHeight = 0.5; // 池の厚み
    const pondGeometry = new THREE.CylinderGeometry(pondRadius, pondRadius, pondHeight, 64);
    this.pondTopVerticesCount = 64 + 1; // 頂点数はセグメント数+1

    const pondMaterial = new THREE.MeshStandardMaterial({
        color: 0x2889e0, // より水らしい色に
        metalness: 0.1,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8 // 透明度を調整
    });
    
    new THREE.TextureLoader().load('src/games/fishing/assets/water.jpg', 
        (texture) => {
          pondMaterial.map = texture;
          pondMaterial.needsUpdate = true;
        },
        undefined,
        () => console.warn("Failed to load water texture")
    );

    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    // 円柱ジオメトリはY軸に沿って作成されるため、回転は不要
    // 池の上面がy=-1の位置に来るように、厚みの半分だけ下げる
    pond.position.y = -1 - (pondHeight / 2);
    this.threeScene.add(pond);
    this.pondRadius = pondRadius;
    this.pond = pond;
    this.waterVertices = pond.geometry.attributes.position.array;
    this.waterGeometry = pond.geometry;
  }
  
  generateFishes() {
    for (let i = 0; i < 30; i++) { // 10から増量
      const fishType = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
      const size = Math.floor(Math.random() * (fishType.maxSize - fishType.minSize + 1)) + fishType.minSize;
      const minRadius = 0.4;
      const maxRadius = 1.2;
      const fishRadius = minRadius + (maxRadius - minRadius) * ((size - fishType.minSize) / (fishType.maxSize - fishType.minSize));

      const fishGroup = new THREE.Group();

      // Body (elongated sphere)
      const bodyMaterial = new THREE.MeshStandardMaterial({
          color: fishType.color,
          metalness: 0.3,
          roughness: 0.4
      });
      const bodyGeometry = new THREE.SphereGeometry(fishRadius, 16, 16);
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.scale.z = 1.8; // Make it longer along the Z-axis (the direction of movement)
      body.scale.x = 0.8;
      fishGroup.add(body);

      // Tail fin
      const tailGeometry = new THREE.ConeGeometry(fishRadius * 0.9, fishRadius, 4);
      const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
      tail.position.z = -fishRadius * 1.5; // Attach to the back
      tail.rotation.x = Math.PI / 2; // Rotate to be vertical-ish
      tail.scale.y = 0.1; // Flatten it
      fishGroup.add(tail);

      // Eyes
      const eyeGeometry = new THREE.SphereGeometry(fishRadius * 0.15, 8, 8);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-fishRadius * 0.3, fishRadius * 0.2, fishRadius * 0.8);
      fishGroup.add(leftEye);

      const rightEye = leftEye.clone();
      rightEye.position.x = fishRadius * 0.3;
      fishGroup.add(rightEye);

      let angle = Math.random() * Math.PI * 2;
      let r = Math.random() * (this.pondRadius - 1);
      fishGroup.position.x = Math.cos(angle) * r;
      fishGroup.position.y = -1.2 - Math.random() * 0.3;
      fishGroup.position.z = Math.sin(angle) * r;
      this.threeScene.add(fishGroup);
      this.fishes.push({
        mesh: fishGroup,
        type: fishType,
        size: size,
        direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        timeOffset: Math.random() * 1000,
        state: 'swim', // 'swim', 'approach', 'biting', 'hooked', 'escape'
        biteTimer: 0,
        speed: fishType.speed,
        interestCooldownUntil: 0, // 魚が次に興味を持つまでのクールダウン
        radius: fishRadius // 衝突判定用の半径
      });
    }
  }
  
  setupFishingRodControls() {
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });

    const rodTipPosition = new THREE.Vector3();
    this.rodTip.getWorldPosition(rodTipPosition);
    
    // 釣り糸の始点と終点を竿の先端に設定
    const linePoints = [rodTipPosition, rodTipPosition.clone()];
    lineGeometry.setFromPoints(linePoints);
    this.fishingLine = new THREE.Line(lineGeometry, lineMaterial);
    this.threeScene.add(this.fishingLine);
    
    const floatGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const floatMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.float = new THREE.Mesh(floatGeometry, floatMaterial);
    this.float.position.copy(rodTipPosition); // 浮きも最初は竿の先端に
    this.float.visible = false;
    this.threeScene.add(this.float);
  }
  
  castLine() {
    if (this.gameState.casting || this.gameState.reeling) return;
    this.gameState.casting = true;
    this.showMessage("キャスト！");
    
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (this.pondRadius - 1);
    const targetX = Math.cos(angle) * radius;
    const targetZ = Math.sin(angle) * radius;
    const targetY = -1; // 水面の高さ
    
    if (!this.float) {
      this.gameState.casting = false;
      return;
    }
    
    // 浮きを竿の先端からスタートさせる
    const rodTipPosition = new THREE.Vector3();
    this.rodTip.getWorldPosition(rodTipPosition);
    this.float.position.copy(rodTipPosition);
    this.float.visible = true;
    
    this.tweens.add({
      targets: this.float.position, // 浮きのpositionを直接アニメーションさせる
      x: targetX,
      y: targetY,
      z: targetZ,
      ease: 'Quad.out',
      duration: 800,
      onUpdate: () => {
        this.updateFishingLine(); // 飛んでいる間も釣り糸を更新
      },
      onComplete: () => {
        this.gameState.casting = false;
      }
    });
  }
  
  updateFishingLine() {
    if (!this.fishingLine || !this.float) return;

    const rodTipPosition = new THREE.Vector3();
    this.rodTip.getWorldPosition(rodTipPosition); // 毎フレーム竿の先端のグローバル座標を取得

    const linePoints = [
      rodTipPosition,
      this.float.position // 浮きの現在の位置
    ];
    this.fishingLine.geometry.setFromPoints(linePoints);
    this.fishingLine.geometry.attributes.position.needsUpdate = true;
  }
  
  reelLine() {
    // ミニゲーム中は実行しない
    if (this.minigame.active || this.gameState.reeling) return;

    if (this.float) {
      this.gameState.reeling = true;

      const rodTipPosition = new THREE.Vector3();
      this.rodTip.getWorldPosition(rodTipPosition);

      this.tweens.add({
        targets: this.float.position, // 浮きのpositionを直接アニメーション
        x: rodTipPosition.x,
        y: rodTipPosition.y,
        z: rodTipPosition.z,
        ease: 'Quad.in',
        duration: 1000,
        onUpdate: () => {
            this.updateFishingLine();
        },
        onComplete: () => {
          if (this.float) this.float.visible = false;
          this.gameState.reeling = false;
          this.gameState.catchingFish = false;
        }
      });
    } else {
      this.gameState.reeling = false;
      this.gameState.catchingFish = false;
    }
  }
  
  showMessage(text) {
    let msgDiv = document.getElementById('game-message');
    if (!msgDiv) {
      msgDiv = document.createElement('div');
      msgDiv.id = 'game-message';
      msgDiv.classList.add('game-scene-ui');
      document.getElementById('game-container')?.appendChild(msgDiv);

      // 初期スタイル設定（一度だけ行えば良いもの）
      msgDiv.style.position = 'absolute';
      msgDiv.style.top = '50%';
      msgDiv.style.left = '50%';
      msgDiv.style.zIndex = '10000';
      msgDiv.style.pointerEvents = 'none';
      msgDiv.style.background = 'linear-gradient(135deg, #232526 0%, #414345 100%)';
      msgDiv.style.color = '#fff';
      msgDiv.style.fontSize = '2rem';
      msgDiv.style.fontWeight = 'bold';
      msgDiv.style.padding = '18px 40px';
      msgDiv.style.borderRadius = '18px';
      msgDiv.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)';
      msgDiv.style.letterSpacing = '0.05em';
      msgDiv.style.textAlign = 'center';
      msgDiv.style.textShadow = '0 2px 8px #000a';
      // アニメーション用のタイマーを保存するプロパティ
      msgDiv.hideTimeout = null;
    }

    // 既存のアニメーションをキャンセル
    if (msgDiv.hideTimeout) {
        clearTimeout(msgDiv.hideTimeout);
    }
    
    // より自然なアニメーションに変更
    msgDiv.style.transition = 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    msgDiv.style.display = 'block';
    msgDiv.textContent = text;

    // 表示アニメーション（少し遅延させて、スタイル変更を確実に検知させる）
    // 1. まずは非表示・縮小状態に
    msgDiv.style.opacity = '0';
    msgDiv.style.transform = 'translate(-50%, -50%) scale(0.8)';
    
    // 2. 次のフレームで表示・通常サイズへ（これでアニメーションが開始される）
    requestAnimationFrame(() => {
        msgDiv.style.opacity = '1';
        msgDiv.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // 非表示アニメーション
    msgDiv.hideTimeout = setTimeout(() => {
      msgDiv.style.opacity = '0';
      msgDiv.style.transform = 'translate(-50%, -50%) scale(0.8)';
      // アニメーション完了後に要素を非表示にする
      msgDiv.hideTimeout = setTimeout(() => {
        msgDiv.style.display = 'none';
      }, 400); // transitionの期間と合わせる
    }, 2000); // 2秒間表示
  }

  switchCameraPerspective() {
    // インデックスを次に進める（視点の数でループさせる）
    this.currentPerspectiveIndex = (this.currentPerspectiveIndex + 1) % this.cameraPerspectives.length;
    this.setCameraPerspective(this.currentPerspectiveIndex);
  }

  setCameraPerspective(index) {
    if (!this.threeCamera) return;

    const perspective = this.cameraPerspectives[index];

    // カメラ位置をセット
    this.threeCamera.position.set(perspective.position.x, perspective.position.y, perspective.position.z);

    // upベクトルとlookAtをリセット・設定
    if (perspective.up) {
        this.threeCamera.up.set(perspective.up.x, perspective.up.y, perspective.up.z);
    } else {
        this.threeCamera.up.set(0, 1, 0); // デフォルトに戻す
    }

    if (perspective.lookAt) {
        this.threeCamera.lookAt(new THREE.Vector3(perspective.lookAt.x, perspective.lookAt.y, perspective.lookAt.z));
    }
    
    // 釣竿の表示・非表示を切り替え
    if (this.fishingRod) {
        this.fishingRod.visible = (index === 0); // 0: 斜め視点, 1: 真上視点
    }
  }

  onResize() {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer || !this.threeCamera || !this.threeRenderer) return;

    const width = gameContainer.clientWidth;
    const height = gameContainer.clientHeight;

    // カメラのアスペクト比を更新
    this.threeCamera.aspect = width / height;
    this.threeCamera.updateProjectionMatrix();

    // レンダラーのサイズを更新
    this.threeRenderer.setSize(width, height);
  }

  update(time) {
    if (!this.threeRenderer || !this.threeScene || !this.threeCamera) {
      return;
    }
    
    if (this.waterVertices && this.waterGeometry) {
      // 円柱の上面の頂点（前半部分）だけを揺らして波を表現
      const topVerticesCount = this.pondTopVerticesCount;
      const pondHeight = 0.5;
      for (let i = 0; i < topVerticesCount * 3; i += 3) {
        const x = this.waterVertices[i];
        const z = this.waterVertices[i + 2];
        // 元のY座標（円柱の上面）を基準に波を計算
        this.waterVertices[i + 1] = (pondHeight / 2) + Math.sin(time / 400 + x * 0.3 + z * 0.3) * 0.1;
      }
      this.waterGeometry.attributes.position.needsUpdate = true;
    }
    
    if (this.minigame.active) {
      // --- ミニゲーム中のロジック ---
      let tensionChange = 0;
      
      // 1. プレイヤーの操作によるテンション変化
      if (this.isPlayerPulling) {
        tensionChange += this.minigame.pullStrength;
      } else {
        tensionChange -= this.minigame.tensionSpeed;
      }

      // 2. 魚の行動パターンによるテンション変化
      switch (this.minigame.fishAction) {
        case 'struggle': // 激しく暴れる
          tensionChange += (Math.random() - 0.5) * 5.0;
          break;
        case 'rush': // 突進 (急上昇)
          tensionChange += 1.8; 
          break;
        case 'dive': // 潜る (急降下)
          tensionChange -= 1.5;
          break;
        case 'normal':
        default: // 通常
          tensionChange += (Math.random() - 0.5) * 2.5;
          break;
      }
      this.minigame.tension += tensionChange;
      this.minigame.tension = Math.max(0, Math.min(100, this.minigame.tension));

      // 3. アクションの更新と予告
      const actionIcon = document.getElementById('minigame-action-icon');
      if (time > this.minigame.actionTimer - 1000 && !this.minigame.nextActionPreview) {
        // 1秒前に予告表示
        this.minigame.nextActionPreview = true;
        const nextAction = ['struggle', 'rush', 'dive'][Math.floor(Math.random() * 3)];
        if (actionIcon) {
          actionIcon.src = `/assets/icons/icon_${nextAction}.svg`;
          actionIcon.style.opacity = '1';
        }
        this.minigame.actionTimer_nextAction = nextAction;
      }
      
      if (time > this.minigame.actionTimer) {
        // アクション切り替え
        this.minigame.fishAction = this.minigame.actionTimer_nextAction || 'normal';
        this.minigame.actionTimer = time + 2000 + Math.random() * 2000;
        this.minigame.nextActionPreview = false;
        if (actionIcon) {
          actionIcon.style.opacity = '0';
        }
      }

      // 4. 成功/失敗の判定とプログレス更新
      const { tension, safeZone } = this.minigame;
      if (tension > safeZone.start && tension < safeZone.end) {
        this.minigame.successProgress += 0.4;
      } else {
        this.minigame.successProgress -= 0.2;
      }
      this.minigame.successProgress = Math.max(0, this.minigame.successProgress);

      // 5. UIの更新
      const tensionBar = document.getElementById('tension-bar');
      if (tensionBar) tensionBar.style.width = `${this.minigame.tension}%`;
      const successBar = document.getElementById('success-progress-bar');
      if (successBar) successBar.style.width = `${this.minigame.successProgress}%`;
      
      // 6. ゲーム終了判定
      if (this.minigame.successProgress >= 100) {
        this.endMinigame(true); // 成功
      } else if (this.minigame.tension <= 0 || this.minigame.tension >= 100) {
        // 失敗条件を緩和 (プログレスが0になった時のみ)
        if(this.minigame.successProgress <= 0) {
            this.endMinigame(false);
        }
      }
    } else {
      // --- 通常時の魚AIロジック ---
      this.fishes.forEach(fish => {
        if (!fish?.mesh?.visible || fish.state === 'caught' || fish.state === 'hooked') {
          return; // スキップ
        }

        const isFloatInWater = this.float?.visible && !this.gameState.casting && !this.gameState.reeling;
        let currentSpeed = fish.speed;

        // --- 1. AIの状態に基づいて、基本的な進行方向と速度を決定 ---
        switch (fish.state) {
          case 'swim': {
            const distFromCenter = fish.mesh.position.length();
            if (distFromCenter > this.pondRadius - 0.5) {
              fish.direction.set(-fish.mesh.position.x, 0, -fish.mesh.position.z).normalize();
            }
            if (isFloatInWater && time > fish.interestCooldownUntil) {
              const distToFloat = fish.mesh.position.distanceTo(this.float.position);
              if (distToFloat < 5 && Math.random() < 0.1) {
                fish.state = 'approach';
              }
              fish.interestCooldownUntil = time + 3000;
            }
            break;
          }
          case 'approach': {
            if (!isFloatInWater) { fish.state = 'swim'; break; }
            const distToFloat = fish.mesh.position.distanceTo(this.float.position);
            if (distToFloat < 1.2) {
              fish.state = 'biting';
              fish.biteTimer = time + 500 + Math.random() * 1000;
            } else {
              fish.direction.copy(new THREE.Vector3().subVectors(this.float.position, fish.mesh.position).normalize());
              currentSpeed *= 1.5;
            }
            break;
          }
          case 'biting':
            currentSpeed = 0; // その場で待機
            if (!isFloatInWater) { fish.state = 'swim'; break; }
            if (time > fish.biteTimer) {
              this.startMinigame(fish);
            }
            break;

          case 'escape':
            currentSpeed *= 3; // 高速で逃走
            if (fish.mesh.position.length() > this.pondRadius + 2) {
              fish.state = 'swim';
            }
            break;
        }
        
        // --- 2. 魚同士の衝突回避 ---
        if (fish.state === 'swim' || fish.state === 'approach') {
          const repulsion = new THREE.Vector3();
          let collisionCount = 0;
          this.fishes.forEach(otherFish => {
              if (fish === otherFish || !otherFish.mesh.visible || !otherFish.radius) return;

              const distance = fish.mesh.position.distanceTo(otherFish.mesh.position);
              // 半径の合計に少しバッファを持たせる
              const minDistance = fish.radius + otherFish.radius + 0.5;

              if (distance < minDistance) {
                  const awayVector = new THREE.Vector3().subVectors(fish.mesh.position, otherFish.mesh.position).normalize();
                  repulsion.add(awayVector);
                  collisionCount++;
              }
          });

          if (collisionCount > 0) {
              repulsion.divideScalar(collisionCount); // 平均の反発ベクトル
              // lerpで現在の進行方向と反発方向を滑らかに合成
              fish.direction.lerp(repulsion, 0.1).normalize();
          }
        }
        
        // --- 3. 最終的な速度で移動 ---
        if (currentSpeed > 0) {
          fish.mesh.position.add(fish.direction.clone().multiplyScalar(currentSpeed));
        }

        // --- 4. 全状態共通の更新処理 (上下動と向き) ---
        fish.mesh.position.y = -2 - Math.sin(time / 1000 + fish.timeOffset) * 0.5;
        if (fish.direction.lengthSq() > 0) {
          fish.mesh.lookAt(fish.mesh.position.clone().add(fish.direction));
        }
      });
    }

    if (this.float?.visible) {
      const dist = Math.sqrt(this.float.position.x ** 2 + this.float.position.z ** 2);
      if (dist > this.pondRadius - 0.5) {
        const angle = Math.atan2(this.float.position.z, this.float.position.x);
        this.float.position.x = Math.cos(angle) * (this.pondRadius - 0.5);
        this.float.position.z = Math.sin(angle) * (this.pondRadius - 0.5);
        this.updateFishingLine();
      }
    }
    
    this.threeRenderer.render(this.threeScene, this.threeCamera);
  }

  updateScoreUI() {
    if (this.scoreDiv) {
      this.scoreDiv.textContent = 'スコア：' + this.gameState.score;
    }
  }

  startMinigame(fish) {
    if (this.minigame.active) return;
    
    this.catchingFishObj = fish;
    fish.state = 'hooked'; // ミニゲーム中は'hooked'状態に
    this.minigame.active = true;
    this.gameState.catchingFish = true;
    this.minigame.tension = 50;
    this.minigame.successProgress = 10;
    this.minigame.fishAction = 'normal';
    this.minigame.actionTimer = this.time.now + 2000 + Math.random() * 2000;
    this.minigame.nextActionPreview = false;

    if(this.minigameUI) this.minigameUI.style.display = 'block';

    // ボタンのテキストを変更
    const reelBtn = document.getElementById('reel-btn');
    if (reelBtn) reelBtn.textContent = 'PULL!';
    const castBtn = document.getElementById('cast-btn');
    if (castBtn) castBtn.style.display = 'none'; // キャストボタンを隠す
    
    this.showMessage("魚が食いついた！ゲージを操作して釣り上げろ！");
  }

  endMinigame(success) {
    if (!this.minigame.active) return;
    
    this.minigame.active = false;
    this.isPlayerPulling = false;
    if(this.minigameUI) this.minigameUI.style.display = 'none';
    
    // ボタンの状態を元に戻す
    const reelBtn = document.getElementById('reel-btn');
    if (reelBtn) reelBtn.textContent = 'リール';
    const castBtn = document.getElementById('cast-btn');
    if (castBtn) castBtn.style.display = 'inline-block';

    const caughtFish = this.catchingFishObj;
    this.catchingFishObj = null; // 参照をクリア

    if (success) {
      // 釣り成功
      FishDex.recordCatch(caughtFish.type.name, caughtFish.size); // 釣果を記録
      this.gameState.score += caughtFish.type.points;
      this.updateScoreUI();
      this.showMessage(`${caughtFish.size}cmの${caughtFish.type.name}を釣った！ +${caughtFish.type.points}ポイント`);
      if (caughtFish.mesh) {
        caughtFish.mesh.visible = false;
      }
      // 釣った後のリール巻き上げ処理
      this.reelLine();
      // 魚の再配置
      setTimeout(() => {
        if (caughtFish.mesh) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * (this.pondRadius - 1);
          caughtFish.mesh.position.set(Math.cos(angle) * r, -1.2 - Math.random() * 0.3, Math.sin(angle) * r);
          caughtFish.mesh.visible = true;
          caughtFish.state = 'swim';
        }
      }, 3000);
    } else {
      // 釣り失敗
      this.showMessage("魚に逃げられてしまった...");
      caughtFish.state = 'escape'; // 逃げる状態に
      caughtFish.direction = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      // 失敗した場合もリールは巻き取る
      this.reelLine();
    }
    
    this.gameState.catchingFish = false;
  }

  createFishingRod() {
    const rodMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // SaddleBrown
        roughness: 0.7,
        metalness: 0.1,
    });
    // 長くて細い円柱で竿を作成
    const rodGeometry = new THREE.CylinderGeometry(0.05, 0.15, 15, 8);
    rodGeometry.translate(0, 7.5, 0); // ピボット（回転軸）を竿の根元に移動
    this.fishingRod = new THREE.Mesh(rodGeometry, rodMaterial);

    // カメラに対する竿の位置と角度を調整
    this.fishingRod.position.set(3, -4, -10);
    this.fishingRod.rotation.set(0, -0.3, 0.8);

    // 竿の先端を示す空のオブジェクトを作成
    this.rodTip = new THREE.Object3D();
    this.rodTip.position.y = 15; // 円柱の先端に配置
    this.fishingRod.add(this.rodTip);

    // 竿をカメラの子にして、常に一緒に動くようにする
    this.threeCamera.add(this.fishingRod);
  }

  showDex(visible) {
    let dexContainer = document.getElementById('dex-container');
    if (!dexContainer) {
        dexContainer = document.createElement('div');
        dexContainer.id = 'dex-container';
        dexContainer.classList.add('game-scene-ui');
        document.getElementById('game-container')?.appendChild(dexContainer);
        dexContainer.style.position = 'absolute';
        dexContainer.style.top = '0';
        dexContainer.style.left = '0';
        dexContainer.style.width = '100%';
        dexContainer.style.height = '100%';
        dexContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        dexContainer.style.zIndex = '1000';
        dexContainer.style.display = 'flex';
        dexContainer.style.justifyContent = 'center';
        dexContainer.style.alignItems = 'center';
        dexContainer.style.color = 'white';
        dexContainer.style.backdropFilter = 'blur(5px)';

        const dexContent = document.createElement('div');
        dexContent.style.width = '90%';
        dexContent.style.height = '90%';
        dexContent.style.maxWidth = '1000px';
        dexContent.style.maxHeight = '700px';
        dexContent.style.background = 'rgba(30, 30, 30, 0.9)';
        dexContent.style.borderRadius = '20px';
        dexContent.style.padding = '20px';
        dexContent.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        dexContent.style.overflowY = 'auto';
        dexContainer.appendChild(dexContent);

        const title = document.createElement('h2');
        title.textContent = '魚図鑑';
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        title.style.fontSize = '2rem';
        dexContent.appendChild(title);
        
        const fishGrid = document.createElement('div');
        fishGrid.id = 'dex-fish-grid';
        fishGrid.style.display = 'grid';
        fishGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
        fishGrid.style.gap = '20px';
        dexContent.appendChild(fishGrid);

        const closeButton = document.createElement('button');
        closeButton.textContent = '閉じる';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '30px';
        closeButton.style.right = '40px';
        closeButton.style.fontSize = '1rem';
        closeButton.style.padding = '10px 20px';
        closeButton.style.cursor = 'pointer';
        dexContainer.appendChild(closeButton);
        closeButton.onclick = () => this.showDex(false);
    }
    
    // 表示/非表示の切り替え
    dexContainer.style.display = visible ? 'flex' : 'none';

    if (visible) {
      // 表示時に内容を更新
      const fishGrid = document.getElementById('dex-fish-grid');
      if (!fishGrid) return;
      fishGrid.innerHTML = ''; // 既存の内容をクリア

      const dexData = FishDex.getDexData();
      
      FISH_TYPES.forEach(fishType => {
        const data = dexData[fishType.name];
        const card = document.createElement('div');
        card.style.background = 'rgba(50, 50, 50, 0.8)';
        card.style.borderRadius = '10px';
        card.style.padding = '15px';
        card.style.textAlign = 'center';
        
        if (data && data.caught) {
          card.innerHTML = `
            <h3 style="margin: 0 0 10px; color: #ffc107;">${fishType.name}</h3>
            <p style="margin: 5px 0;">最大サイズ: <span style="font-weight: bold;">${data.maxSize} cm</span></p>
            <p style="margin: 5px 0;">獲得ポイント: <span style="font-weight: bold;">${fishType.points} P</span></p>
            <p style="margin: 15px 0 0; font-size: 0.9rem; color: #ccc;">${fishType.description}</p>
          `;
        } else {
          card.style.opacity = '0.6';
          card.innerHTML = `
            <h3 style="margin: 0 0 10px; color: #aaa;">???</h3>
            <p style="margin: 5px 0;">最大サイズ: ---</p>
            <p style="margin: 5px 0;">獲得ポイント: ---</p>
            <p style="margin: 15px 0 0; font-size: 0.9rem; color: #888;">まだ釣っていない魚</p>
          `;
        }
        fishGrid.appendChild(card);
      });
    }
  }

  cleanupHTML() {
    document.querySelectorAll('.game-scene-ui').forEach(el => el.remove());
  }
}

export default GameScene;
