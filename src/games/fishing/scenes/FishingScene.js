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
      type: null, // 'tension' or 'timing'
      
      // テンションゲーム用
      tension: {
        value: 50,
        safeZone: { start: 40, end: 70 },
        speed: 0.3,
        pullStrength: 1.5,
        fishAction: 'normal',
        actionTimer: 0,
        nextActionPreview: false
      },

      // タイミングゲーム用
      timing: {
        progress: 0,
        markerPosition: 0,
        markerSpeed: 1.5,
        safeZone: { start: 60, width: 20 }
      },
      
      // 共通
      overallProgress: 0,
    };
    this.isPlayerPulling = false; // テンションゲームの長押し判定用
    
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
         if (!btn.disabled) {
           const hoverBg = btn.id === 'reel-btn' ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
           btn.style.background = hoverBg;
           btn.style.transform = 'scale(1.07)';
           btn.style.boxShadow = '0 8px 24px rgba(0,0,0,0.28)';
         }
       };
       btn.onmouseout = () => {
         if (!btn.disabled) {
           btn.style.background = bg;
           btn.style.transform = 'scale(1)';
           btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
         }
       };
       return btn;
   };
   const castBtn = makeBtn('cast-btn', 'キャスト', 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)');
   castBtn.onclick = () => this.castLine();

   const reelBtn = makeBtn('reel-btn', 'リールを巻く', 'linear-gradient(135deg, #2980b9 0%, #2c3e50 100%)');
   reelBtn.onmousedown = this.onReelBtnMouseDown.bind(this);
   reelBtn.onmouseup = this.onReelBtnMouseUp.bind(this);
   reelBtn.onmouseleave = () => { this.isPlayerPulling = false; }; // カーソルがボタンから外れた場合も考慮

   const switchCamBtn = makeBtn('switch-cam-btn', '視点切替', 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)');
   switchCamBtn.onclick = () => this.switchCameraPerspective();
   
   btnArea.appendChild(castBtn);
   btnArea.appendChild(reelBtn);
   btnArea.appendChild(switchCamBtn);
   
   let topUiArea = document.getElementById('top-ui-area');
   if(!topUiArea) {
       topUiArea = document.createElement('div');
       topUiArea.id = 'top-ui-area';
       topUiArea.classList.add('game-scene-ui');
       gameContainer?.appendChild(topUiArea);
   }
   topUiArea.style.position = 'absolute';
   topUiArea.style.top = '24px';
   topUiArea.style.right = '32px';
   topUiArea.style.zIndex = '100';
   topUiArea.style.display = 'flex';
   topUiArea.style.gap = '16px';

   const dexBtn = makeBtn('dex-btn', '図鑑', 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)');
   const titleBtn = makeBtn('title-btn', 'タイトルへ', 'linear-gradient(135deg, #868f96 0%, #596164 100%)');
   
   topUiArea.appendChild(dexBtn);
   topUiArea.appendChild(titleBtn);
   
   dexBtn.onclick = () => this.showDex(true);
   titleBtn.onclick = () => this.scene.start('TitleScene');
   
   this.createAllMinigameUIs(gameContainer);
 }
  
  createAllMinigameUIs(container) {
    // --- テンションゲームUI ---
    const tensionContainer = document.createElement('div');
    tensionContainer.id = 'minigame-ui-tension';
    tensionContainer.classList.add('minigame-container', 'game-scene-ui');
    tensionContainer.style.display = 'none'; // 最初は非表示
    container?.appendChild(tensionContainer);
    tensionContainer.innerHTML = `
      <img id="minigame-action-icon" style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 40px; height: 40px; opacity: 0; transition: opacity 0.2s;">
      <div style="width: 100%; height: 20px; background: #333; border-radius: 5px; position: relative; overflow: hidden;">
        <div id="tension-safe-zone" style="position: absolute; left: ${this.minigame.tension.safeZone.start}%; width: ${this.minigame.tension.safeZone.end - this.minigame.tension.safeZone.start}%; height: 100%; background: rgba(20, 200, 20, 0.4);"></div>
        <div id="tension-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #fceabb 0%, #f8b500 100%); border-radius: 5px; transition: width 0.1s linear;"></div>
      </div>
      <div class="progress-bar-bg"><div id="tension-progress-bar" class="progress-bar-fill"></div></div>
    `;
    
    // --- タイミングゲームUI ---
    const timingContainer = document.createElement('div');
    timingContainer.id = 'minigame-ui-timing';
    timingContainer.classList.add('minigame-container', 'game-scene-ui');
    timingContainer.style.display = 'none'; // 最初は非表示
    container?.appendChild(timingContainer);
    timingContainer.innerHTML = `
        <div style="text-align: center; color: white; font-size: 0.9rem; margin-bottom: 8px;">タイミングを合わせてリールを引け！</div>
        <div id="timing-track" style="width: 100%; height: 25px; background: #333; border-radius: 5px; position: relative; overflow: hidden;">
            <div id="timing-safe-zone" style="position: absolute; height: 100%; background: rgba(20, 200, 20, 0.5);"></div>
            <div id="timing-marker" style="position: absolute; width: 4px; height: 100%; background: #ffc107;"></div>
        </div>
        <div class="progress-bar-bg"><div id="timing-progress-bar" class="progress-bar-fill"></div></div>
    `;
 
    // 共通スタイルをCSSで定義 (可読性のため)
    const style = document.createElement('style');
    style.textContent = `
      .minigame-container {
        position: absolute; bottom: 120px; left: 50%;
        transform: translateX(-50%); width: 300px; z-index: 200;
        background: rgba(0,0,0,0.5); border-radius: 8px;
        padding: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      .progress-bar-bg {
        width: 100%; height: 8px; background: #333;
        border-radius: 4px; margin-top: 8px;
      }
      .progress-bar-fill {
        width: 0%; height: 100%;
        background: linear-gradient(90deg, #89f7fe 0%, #66a6ff 100%);
        border-radius: 4px; transition: width 0.2s linear;
      }
    `;
    document.head.appendChild(style);
  }
  
  createEnvironment() {
    this.rocks = [];
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0); // サイズ1、詳細度0
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        roughness: 0.8
    });

    for (let i = 0; i < 40; i++) {
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        const rockRadius = Math.random() * 0.5 + 0.2;
        rock.scale.set(rockRadius, rockRadius, rockRadius);
        
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

    if (this.gameState.catchingFish) {
      // タイミングゲーム以外では長押しを検出
      if (this.minigame.type !== 'timing') {
        this.isPlayerPulling = true;
      }
    } else {
      this.reelLine();
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
        state: 'swim', // 'swim', 'approach', 'bite', 'hooked', 'escape'
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
    this.line = new THREE.Line(lineGeometry, lineMaterial);
    this.threeScene.add(this.line);
    
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
    if (!this.line || !this.float) return;

    const rodTipPosition = new THREE.Vector3();
    this.rodTip.getWorldPosition(rodTipPosition); // 毎フレーム竿の先端のグローバル座標を取得

    const linePoints = [
      rodTipPosition,
      this.float.position // 浮きの現在の位置
    ];
    this.line.geometry.setFromPoints(linePoints);
    this.line.geometry.attributes.position.needsUpdate = true;
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
  
  showMessage(text, duration = 2000, isMajor = true) {
    let msgDiv = document.getElementById('message-ui');
    if (!msgDiv) {
      msgDiv = document.createElement('div');
      msgDiv.id = 'message-ui';
      msgDiv.classList.add('game-scene-ui');
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) {
          gameContainer.appendChild(msgDiv);
      }
      msgDiv.style.position = 'absolute';
      msgDiv.style.top = '50%';
      msgDiv.style.left = '50%';
      msgDiv.style.transform = 'translate(-50%, -50%)';
      msgDiv.style.zIndex = '300';
      msgDiv.style.background = 'rgba(0,0,0,0.7)';
      msgDiv.style.color = 'white';
      msgDiv.style.padding = '20px 40px';
      msgDiv.style.borderRadius = '12px';
      msgDiv.style.textAlign = 'center';
      msgDiv.style.transition = 'opacity 0.4s ease-in-out';
      msgDiv.style.opacity = '0';
      msgDiv.style.pointerEvents = 'none';
      msgDiv.style.boxShadow = '0 5px 25px rgba(0,0,0,0.3)';
      msgDiv.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
    }

    msgDiv.textContent = text;
    
    if (isMajor) {
      msgDiv.style.fontSize = '2rem';
      msgDiv.style.fontWeight = 'bold';
    } else {
      msgDiv.style.fontSize = '1.4rem';
      msgDiv.style.fontWeight = 'normal';
    }

    if (msgDiv.hideTimeout) clearTimeout(msgDiv.hideTimeout);
    if (msgDiv.showTimeout) clearTimeout(msgDiv.showTimeout);

    msgDiv.style.display = 'block';
    msgDiv.showTimeout = setTimeout(() => {
        msgDiv.style.opacity = '1';
    }, 50);

    msgDiv.hideTimeout = setTimeout(() => {
      msgDiv.style.opacity = '0';
      msgDiv.hideTimeout = setTimeout(() => {
        msgDiv.style.display = 'none';
      }, 400); 
    }, duration);
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
    
    this.updateWater(time);
    
    if (this.minigame.active) {
      // --- ミニゲーム共通のプログレス更新 ---
      this.minigame.overallProgress = Math.max(0, this.minigame.overallProgress);
      
      // --- ミニゲームの種類に応じたロジック ---
      switch (this.minigame.type) {
          case 'tension':
              this.updateTensionMinigame(time);
              break;
          case 'timing':
              this.updateTimingMinigame();
              break;
      }

      // --- 終了判定 ---
      if (this.minigame.overallProgress >= 100) {
          this.endMinigame(true);
      } else if (this.minigame.overallProgress <= 0) {
          this.endMinigame(false);
      }
    } else {
      this.updateFishAI(time);
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

  updateWater(time) {
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
  }

  updateFishAI(time) {
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
          // まずは池の境界からはみ出ないようにする
          const distFromCenter = fish.mesh.position.length();
          if (distFromCenter > this.pondRadius - 0.5) {
            fish.direction.set(-fish.mesh.position.x, 0, -fish.mesh.position.z).normalize();
          }

          // ウキが水中にあり、魚がクールダウン中でなければ、興味を持つか判定
          if (isFloatInWater && time > fish.interestCooldownUntil) {
            const distToFloat = fish.mesh.position.distanceTo(this.float.position);
            
            const interestRadius = 6; // 興味を持つ範囲
            if (distToFloat < interestRadius) {
              // 範囲内にいれば、40%の確率でアプローチを開始
              if (Math.random() < 0.4) {
                fish.state = 'approach';
                // アプローチする魚は、次の行動まで長めのクールダウン
                fish.interestCooldownUntil = time + 5000 + Math.random() * 3000;
              } else {
                // アプローチしなかった魚も、少しの間は様子を見る
                fish.interestCooldownUntil = time + 1000 + Math.random() * 1000;
              }
            }
          }
          break;
        }
        case 'approach': {
          if (!isFloatInWater) { fish.state = 'swim'; break; }
          const distToFloat = fish.mesh.position.distanceTo(this.float.position);
          if (distToFloat < 1.2) {
            fish.state = 'bite';
            fish.biteTimer = time + 500 + Math.random() * 1000;
          } else {
            fish.direction.copy(new THREE.Vector3().subVectors(this.float.position, fish.mesh.position).normalize());
            currentSpeed *= 1.5;
          }
          break;
        }
        case 'bite':
          currentSpeed = 0; // その場で待機
          if (!isFloatInWater) { fish.state = 'swim'; break; }
          if (time > fish.biteTimer) {
            this.startRandomMinigame(fish);
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

      // --- 5. 最終的な位置の境界チェック ---
      const distFromCenter = Math.sqrt(fish.mesh.position.x ** 2 + fish.mesh.position.z ** 2);
      if (distFromCenter > this.pondRadius - 0.5) {
          const angle = Math.atan2(fish.mesh.position.z, fish.mesh.position.x);
          fish.mesh.position.x = Math.cos(angle) * (this.pondRadius - 0.5);
          fish.mesh.position.z = Math.sin(angle) * (this.pondRadius - 0.5);
      }
    });
  }

  updateScoreUI() {
    if (this.scoreDiv) {
      this.scoreDiv.textContent = `SCORE: ${this.gameState.score}`;
    }
  }

  startRandomMinigame(fish) {
    if (this.minigame.active) return;
    
    this.catchingFishObj = fish;
    fish.state = 'hooked';
    this.minigame.active = true;
    this.gameState.catchingFish = true;
    this.minigame.overallProgress = 10;

    // ランダムにミニゲームを選択
    this.minigame.type = Math.random() < 0.5 ? 'tension' : 'timing';

    // ボタンのテキストを変更
    const reelBtn = document.getElementById('reel-btn');
    if (reelBtn) reelBtn.textContent = this.minigame.type === 'tension' ? 'PULL!' : 'HIT!';
    const castBtn = document.getElementById('cast-btn');
    if (castBtn) castBtn.style.display = 'none';

    if (this.minigame.type === 'tension') {
        // テンションゲームの初期化
        this.minigame.tension.value = 50;
        this.minigame.tension.fishAction = 'normal';
        this.minigame.tension.actionTimer = this.time.now + 2000 + Math.random() * 2000;
        this.minigame.tension.nextActionPreview = false;
        document.getElementById('minigame-ui-tension').style.display = 'block';
    } else {
        // タイミングゲームの初期化
        this.minigame.timing.markerPosition = 0;
        this.minigame.timing.markerSpeed = (1.2 + Math.random() * 0.8) * (Math.random() < 0.5 ? 1 : -1); // 速度と方向をランダムに
        const safeZone = this.minigame.timing.safeZone;
        safeZone.start = Math.random() * (100 - safeZone.width);
        const safeZoneEl = document.getElementById('timing-safe-zone');
        safeZoneEl.style.left = `${safeZone.start}%`;
        safeZoneEl.style.width = `${safeZone.width}%`;
        document.getElementById('timing-marker').style.left = `0%`; // マーカーを初期位置に
        document.getElementById('minigame-ui-timing').style.display = 'block';
    }
    
    this.showMessage("HIT! 魚とのファイト開始！");
  }

  endMinigame(success) {
    if (!this.minigame.active) return;
    
    this.minigame.active = false;
    this.isPlayerPulling = false;

    const caughtFish = this.catchingFishObj;
    this.catchingFishObj = null; // 参照をクリア

    if (success) {
      // 釣り成功
      FishDex.recordCatch(caughtFish.type.name, caughtFish.size); // 釣果を記録
      this.gameState.score += caughtFish.type.points;
      this.updateScoreUI();
      this.showMessage(`やった！${caughtFish.size}cmの${caughtFish.type.name}を釣り上げた！`, 3000);
    } else {
      // 釣り失敗
      this.showMessage('逃げられてしまった...', 3000);
      caughtFish.state = 'swim';
    }
    
    this.gameState.catchingFish = false;

    // 釣り糸とウキを非表示にして、キャスト前の状態に戻す
    if (this.float) this.float.visible = false;
    if (this.line) this.line.visible = false;

    // UIを元に戻す
    const reelBtn = document.getElementById('reel-btn');
    if (reelBtn) reelBtn.textContent = 'リールを巻く';
    const castBtn = document.getElementById('cast-btn');
    if (castBtn) castBtn.style.display = 'inline-block';
    
    document.getElementById('minigame-ui-tension').style.display = 'none';
    document.getElementById('minigame-ui-timing').style.display = 'none';
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
    this.fishingRod.visible = true;
  }

  updateTensionMinigame(time) {
    let tensionChange = 0;
    if (this.isPlayerPulling) tensionChange += this.minigame.tension.pullStrength;
    else tensionChange -= this.minigame.tension.speed;

    switch (this.minigame.tension.fishAction) {
      case 'struggle': tensionChange += (Math.random() - 0.5) * 5.0; break;
      case 'rush': tensionChange += 1.8; break;
      case 'dive': tensionChange -= 1.5; break;
      default: tensionChange += (Math.random() - 0.5) * 2.5; break;
    }
    this.minigame.tension.value += tensionChange;
    this.minigame.tension.value = Math.max(0, Math.min(100, this.minigame.tension.value));

    const actionIcon = document.getElementById('minigame-action-icon');
    if (time > this.minigame.tension.actionTimer - 1000 && !this.minigame.tension.nextActionPreview) {
      this.minigame.tension.nextActionPreview = true;
      const nextAction = ['struggle', 'rush', 'dive'][Math.floor(Math.random() * 3)];
      if (actionIcon) {
        actionIcon.src = `/assets/icons/icon_${nextAction}.svg`;
        actionIcon.style.opacity = '1';
      }
      this.minigame.tension.actionTimer_nextAction = nextAction;
    }
    
    if (time > this.minigame.tension.actionTimer) {
      this.minigame.tension.fishAction = this.minigame.tension.actionTimer_nextAction || 'normal';
      this.minigame.tension.actionTimer = time + 2000 + Math.random() * 2000;
      this.minigame.tension.nextActionPreview = false;
      if (actionIcon) actionIcon.style.opacity = '0';
    }

    const { value, safeZone } = this.minigame.tension;
    if (value > safeZone.start && value < safeZone.end) this.minigame.overallProgress += 0.4;
    else this.minigame.overallProgress -= 0.2;

    document.getElementById('tension-bar').style.width = `${this.minigame.tension.value}%`;
    document.getElementById('tension-progress-bar').style.width = `${this.minigame.overallProgress}%`;

    if(this.minigame.tension.value <=0 || this.minigame.tension.value >= 100) this.minigame.overallProgress -= 0.8;
  }

  updateTimingMinigame() {
    const { timing } = this.minigame;
    timing.markerPosition += timing.markerSpeed;
    if (timing.markerPosition > 100 || timing.markerPosition < 0) {
        timing.markerSpeed *= -1; // 壁で跳ね返る
        timing.markerPosition = Math.max(0, Math.min(100, timing.markerPosition));
    }
    document.getElementById('timing-marker').style.left = `${timing.markerPosition}%`;
    document.getElementById('timing-progress-bar').style.width = `${this.minigame.overallProgress}%`;
  }

  showDex(visible) {
    let dexContainer = document.getElementById('fish-dex-container');
    if (!dexContainer) {
        dexContainer = document.createElement('div');
        dexContainer.id = 'fish-dex-container';
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

  onReelBtnMouseDown() {
    if (this.gameState.catchingFish) {
      // テンションゲームでは長押しを検出
      if (this.minigame.type === 'tension') {
        this.isPlayerPulling = true;
      }
    } else {
      this.reelLine();
    }
  }

  onReelBtnMouseUp() {
    // テンションゲームでは長押し終了
    if (this.minigame.active && this.minigame.type === 'tension') {
      this.isPlayerPulling = false;
    }
    
    // タイミングゲームの場合はここでヒット判定
    if (this.minigame.active && this.minigame.type === 'timing') {
      const { markerPosition, safeZone } = this.minigame.timing;
      if (markerPosition > safeZone.start && markerPosition < safeZone.start + safeZone.width) {
        this.minigame.overallProgress += 15; // 成功
        this.showMessage("NICE!", 500, false);
      } else {
        this.minigame.overallProgress -= 10; // 失敗
        this.showMessage("MISS...", 500, false);
      }
    }
  }
}

export default GameScene;
