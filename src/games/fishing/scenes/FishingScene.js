import Phaser from 'phaser';
import * as THREE from 'three';

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
      struggleAmount: 2.5, // 魚の暴れによるテンション変化量
      pullStrength: 1.5, // プレイヤーの引きの強さ
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
    
    // Three.jsの初期化（canvasの生成と追加もここで行う）
    this.initThreeJS();
    
    // 3Dオブジェクトの作成
    this.createWaterSurface();
    this.generateFishes();
    this.setupFishingRodControls();
    
    // HTMLベースのUIを作成
    this.createHTMLUI();

    // ウィンドウリサイズイベントに対応
    window.addEventListener('resize', this.onResize.bind(this));
    // Scene破棄時にイベントリスナーを削除
    this.events.on('shutdown', () => {
      window.removeEventListener('resize', this.onResize.bind(this));
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

    // 最終手段：カメラの回転を直接指定し、強制的に真上からの視点にする
    this.threeCamera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    
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
     gameContainer?.appendChild(btnArea);
   }
   btnArea.style.position = 'absolute';
   btnArea.style.left = '0';
   btnArea.style.right = '0';
   btnArea.style.bottom = '24px';
   btnArea.style.width = '100%';
   btnArea.style.display = 'flex';
   btnArea.style.justifyContent = 'center';
   btnArea.style.gap = '32px';
   btnArea.style.zIndex = '100';

   const makeBtn = (id, text, bg) => {
       let btn = document.getElementById(id);
       if (!btn) {
           btn = document.createElement('button');
           btn.id = id;
           btn.textContent = text;
           btnArea.appendChild(btn);
       }
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

   reelBtn.style.userSelect = 'none'; // テキスト選択を防ぐ
   reelBtn.onmousedown = () => { if (this.minigame.active) this.isPlayerPulling = true; };
   reelBtn.onmouseup = () => { if (this.minigame.active) this.isPlayerPulling = false; };
   reelBtn.onmouseleave = () => { if (this.minigame.active) this.isPlayerPulling = false; }; // カーソルがボタンから外れた場合
   // ミニゲーム中以外は通常のreelLineを呼ぶ
   reelBtn.onclick = () => { if (!this.minigame.active) this.reelLine(); };

   castBtn.onclick = () => this.castLine();
   viewBtn.onclick = () => this.switchCameraPerspective();
   
   this.createMinigameUI(gameContainer);
 }
  
  createMinigameUI(container) {
    let minigameDiv = document.getElementById('minigame-ui');
    if (!minigameDiv) {
      minigameDiv = document.createElement('div');
      minigameDiv.id = 'minigame-ui';
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

    this.minigameUI = minigameDiv;
  }
  
  createWaterSurface() {
    const pondRadius = 10;

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
    const fishTypes = [
      { name: 'ブルーギル', minSize: 10, maxSize: 25, color: 0x66ccff, points: 10, speed: 0.02 },
      { name: 'コイ', minSize: 30, maxSize: 80, color: 0xff9900, points: 30, speed: 0.012 },
      { name: 'ブラックバス', minSize: 20, maxSize: 60, color: 0x333333, points: 20, speed: 0.018 },
      { name: 'フナ', minSize: 15, maxSize: 35, color: 0xaaaa55, points: 12, speed: 0.015 },
      { name: 'ナマズ', minSize: 40, maxSize: 100, color: 0x222222, points: 50, speed: 0.01 }
    ];
    for (let i = 0; i < 10; i++) {
      const fishType = fishTypes[Math.floor(Math.random() * fishTypes.length)];
      const size = Math.floor(Math.random() * (fishType.maxSize - fishType.minSize + 1)) + fishType.minSize;
      const minRadius = 0.4;
      const maxRadius = 1.2;
      const fishRadius = minRadius + (maxRadius - minRadius) * ((size - fishType.minSize) / (fishType.maxSize - fishType.minSize));
      const fishGeometry = new THREE.SphereGeometry(fishRadius, 16, 16);
      const fishMaterial = new THREE.MeshStandardMaterial({
        color: fishType.color,
        transparent: false,
        opacity: 1
      });
      const fish = new THREE.Mesh(fishGeometry, fishMaterial);
      let angle = Math.random() * Math.PI * 2;
      let r = Math.random() * (this.pondRadius - 1);
      fish.position.x = Math.cos(angle) * r;
      fish.position.y = -1.2 - Math.random() * 0.3;
      fish.position.z = Math.sin(angle) * r;
      this.threeScene.add(fish);
      this.fishes.push({
        mesh: fish,
        type: fishType,
        size: size,
        direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        timeOffset: Math.random() * 1000,
        state: 'swim',
        biteTimer: 0,
        speed: fishType.speed
      });
    }
  }
  
  setupFishingRodControls() {
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const rodTip = new THREE.Vector3(0, 0, -(this.pondRadius + 1));
    const linePoints = [rodTip, new THREE.Vector3(0, -2, 0)];
    lineGeometry.setFromPoints(linePoints);
    this.fishingLine = new THREE.Line(lineGeometry, lineMaterial);
    this.threeScene.add(this.fishingLine);
    
    const floatGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const floatMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.float = new THREE.Mesh(floatGeometry, floatMaterial);
    this.float.position.set(0, -1, 0);
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
    
    if (!this.float) {
      this.gameState.casting = false;
      return;
    }
    this.float.visible = true;
    
    this.tweens.add({
      targets: { x: 0, y: 0, z: 0 },
      x: targetX,
      z: targetZ,
      ease: 'Quad.out',
      duration: 1000,
      onUpdate: (tween, target) => {
        if (this.float) {
          this.float.position.x = target.x;
          this.float.position.z = target.z;
          this.updateFishingLine();
        }
      },
      onComplete: () => {
        this.gameState.casting = false;
      }
    });
  }
  
  updateFishingLine() {
    if (!this.fishingLine || !this.float) return;
    const rodTip = new THREE.Vector3(0, 0, -(this.pondRadius + 1));
    const linePoints = [
      rodTip,
      new THREE.Vector3(this.float.position.x, this.float.position.y, this.float.position.z)
    ];
    this.fishingLine.geometry.setFromPoints(linePoints);
    this.fishingLine.geometry.attributes.position.needsUpdate = true;
  }
  
  reelLine() {
    // ミニゲーム中は実行しない
    if (this.minigame.active || this.gameState.reeling) return;

    if (this.float) {
      this.gameState.reeling = true;
      this.tweens.add({
        targets: { x: this.float.position.x, y: this.float.position.y, z: this.float.position.z },
        x: 0,
        y: 0,
        z: 0,
        ease: 'Quad.in',
        duration: 1000,
        onUpdate: (tween, target) => {
          if (this.float) {
            this.float.position.set(target.x, target.y, target.z);
            this.updateFishingLine();
          }
        },
        onComplete: () => {
          if (this.float) this.float.visible = false;
          this.gameState.reeling = false;
          // catchingFishフラグもリセット
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
      // 1. テンションの変動
      // プレイヤーが引いているか
      if (this.isPlayerPulling) {
        this.minigame.tension += this.minigame.pullStrength;
      } else {
        this.minigame.tension -= this.minigame.tensionSpeed;
      }
      // 魚の暴れ
      this.minigame.tension += (Math.random() - 0.5) * this.minigame.struggleAmount;
      // テンションを0-100の範囲に収める
      this.minigame.tension = Math.max(0, Math.min(100, this.minigame.tension));

      // 2. 成功/失敗の判定とプログレス更新
      const { tension, safeZone } = this.minigame;
      if (tension > safeZone.start && tension < safeZone.end) {
        this.minigame.successProgress += 0.4; // 成功ゾーンにいればプログレス増加
      } else {
        this.minigame.successProgress -= 0.2; // ゾーン外では減少
      }
      this.minigame.successProgress = Math.max(0, this.minigame.successProgress);

      // 3. UIの更新
      const tensionBar = document.getElementById('tension-bar');
      if (tensionBar) tensionBar.style.width = `${this.minigame.tension}%`;
      const successBar = document.getElementById('success-progress-bar');
      if (successBar) successBar.style.width = `${this.minigame.successProgress}%`;
      
      // 4. ゲーム終了判定
      if (this.minigame.successProgress >= 100) {
        this.endMinigame(true); // 成功
      } else if (this.minigame.successProgress <= 0 || this.minigame.tension >= 100) {
        this.endMinigame(false); // 失敗
      }
      
    } else {
      // --- 通常時のロジック ---
      this.fishes.forEach(fish => {
        if (fish?.mesh?.visible && fish.state !== 'caught') {
          // catchingFishはミニゲームが始まるかどうかのトリガーにのみ使う
          if (this.float?.visible && !this.gameState.catchingFish) {
            const floatPos = this.float.position;
            const fishPos = fish.mesh.position;
            const dist = floatPos.distanceTo(fishPos);
            
            // 魚がウキに興味を持つ
            if (fish.state === 'swim' && dist < 4) {
              fish.state = 'approach';
            }
            
            // ウキに近づく
            if (fish.state === 'approach') {
              const dir = new THREE.Vector3().subVectors(floatPos, fishPos).normalize();
              fish.mesh.position.x += dir.x * fish.speed * 1.5;
              fish.mesh.position.z += dir.z * fish.speed * 1.5;
              
              // ウキに食いつく -> ミニゲーム開始
              if (dist < 1.0) {
                this.startMinigame(fish);
              }
            }
          } 
          
          if (fish.state === 'escape') {
              // 逃げる処理
              fish.mesh.position.x += fish.direction.x * fish.speed * 3; // 3倍速で逃げる
              fish.mesh.position.z += fish.direction.z * fish.speed * 3;
              const distFromCenter = Math.sqrt(fish.mesh.position.x ** 2 + fish.mesh.position.z ** 2);
              if (distFromCenter > this.pondRadius + 2) { // 池の外に出たら
                  fish.state = 'swim'; // 通常状態に戻る
              }
          } else if (fish.state === 'swim') {
            // 通常時の遊泳
            fish.mesh.position.x += fish.direction.x * fish.speed;
            fish.mesh.position.z += fish.direction.z * fish.speed;
            const distFromCenter = Math.sqrt(fish.mesh.position.x ** 2 + fish.mesh.position.z ** 2);
            if (distFromCenter > this.pondRadius - 0.5) {
              const dirToCenter = new THREE.Vector3(-fish.mesh.position.x, 0, -fish.mesh.position.z).normalize();
              fish.direction = dirToCenter;
            }
          }
          
          // 共通の動き
          fish.mesh.position.y = -2 - Math.sin(time / 1000 + fish.timeOffset) * 0.5;
          fish.mesh.lookAt(
            fish.mesh.position.x + fish.direction.x,
            fish.mesh.position.y,
            fish.mesh.position.z + fish.direction.z
          );
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
    this.minigame.active = true;
    this.gameState.catchingFish = true; // catchingFishを流用
    this.minigame.tension = 50;
    this.minigame.successProgress = 10; // 少し初期値を与えておく

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
}

export default GameScene;
