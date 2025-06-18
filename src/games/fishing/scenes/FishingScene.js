import Phaser from 'phaser';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { FishDex } from '../utils/FishDex.js';
import { UpgradeManager, UPGRADE_CONFIG } from '../utils/UpgradeManager.js';
import { FISH_TYPES } from '../data/fishData.js';
import { UIManager } from '../ui/UIManager.js';

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
        safeZone: { start: 60, width: 28 },
        misses: 0
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
    
    // 釣果記録とアップグレードデータを初期化
    FishDex.initialize(FISH_TYPES);
    UpgradeManager.initialize();

    // UIマネージャーを初期化
    this.ui = new UIManager(this);

    // Three.jsの初期化（canvasの生成と追加もここで行う）
    this.initThreeJS();
    
    // 3Dオブジェクトの作成
    this.createWaterSurface();
    this.generateFishes();
    this.createEnvironment();
    this.setupFishingRodControls();
    
    // HTMLベースのUIを作成
    this.ui.create();

    // ウィンドウリサイズイベントに対応
    window.addEventListener('resize', this.onResize.bind(this));
    // Scene破棄時にイベントリスナーを削除
    this.events.on('shutdown', () => {
      window.removeEventListener('resize', this.onResize.bind(this));
      this.ui.cleanup();
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
  
  onUpgradeAttempt(type) {
    const cost = UpgradeManager.attemptUpgrade(type, this.gameState.score);
    if (cost > 0) {
      this.gameState.score -= cost;
      this.ui.updateScoreUI();
      this.ui.updateUpgradePanel(); // 表示を更新
      this.ui.showMessage(`${UPGRADE_CONFIG[type].name}を強化した！`, 1500, false);
      
      // 釣り竿を強化したら、魚を再生成してレベルを即時反映
      if (type === 'rod') {
          this.generateFishes();
      }
    } else {
      this.ui.showMessage('ポイントが足りません！', 1500, false);
    }
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
    // 既存の魚を一旦すべてクリア
    this.fishes.forEach(fish => this.threeScene.remove(fish.mesh));
    this.fishes = [];

    const rodLevel = UpgradeManager.getLevel('rod');
    const maxRodLevel = UPGRADE_CONFIG.rod.maxLevel;
    // 竿レベルに応じて、大きい魚が出やすくなるように調整 (0.0 - 1.0)
    const levelFactor = rodLevel > 1 ? (rodLevel - 1) / (maxRodLevel - 1) : 0;
    // 指数が1に近いほど一様分布に、0に近いほど最大値に偏る (今回は1から0.2の範囲)
    const sizeBiasExponent = 1 - (levelFactor * 0.8);

    for (let i = 0; i < 30; i++) {
      const fishType = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
      
      const randomFactor = Math.pow(Math.random(), sizeBiasExponent);
      const sizeRange = fishType.maxSize - fishType.minSize;
      const size = Math.floor(fishType.minSize + sizeRange * randomFactor);

      const minRadius = 0.4;
      const maxRadius = 1.2;
      const fishRadius = minRadius + (maxRadius - minRadius) * ((size - fishType.minSize) / (fishType.maxSize - fishType.minSize));

      const fishGroup = new THREE.Group();

      const bodyMaterial = new THREE.MeshStandardMaterial({
          color: fishType.color,
          metalness: 0.3,
          roughness: 0.4,
      });

      // 1. 胴体 (Body) - 少し平たく、流線型に
      const bodyGeometry = new THREE.SphereGeometry(fishRadius, 20, 20);
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.scale.set(0.7, 0.9, 1.8); // X(幅), Y(高さ), Z(長さ)
      fishGroup.add(body);

      const extrudeSettings = {
        steps: 1,
        depth: fishRadius * 0.08, // ヒレの厚み
        bevelEnabled: false,
      };

      // 2. 尾びれ (Tail Fin)
      const tailShape = new THREE.Shape();
      const tailSize = fishRadius * 1.6;
      tailShape.moveTo(0, 0);
      tailShape.lineTo(tailSize * 0.8, tailSize * 0.5);
      tailShape.lineTo(tailSize * 0.6, 0);
      tailShape.lineTo(tailSize * 0.8, -tailSize * 0.5);
      tailShape.lineTo(0, 0);
      
      const tailGeometry = new THREE.ExtrudeGeometry(tailShape, extrudeSettings);
      const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
      tail.position.z = -fishRadius * 1.5;
      tail.rotation.z = Math.PI / 2;
      fishGroup.add(tail);

      // 3. 背びれ (Dorsal Fin)
      const dorsalShape = new THREE.Shape();
      const dorsalHeight = fishRadius * 0.8;
      const dorsalLength = fishRadius;
      dorsalShape.moveTo(0, -dorsalHeight / 2);
      dorsalShape.quadraticCurveTo(dorsalLength * 0.8, 0, 0, dorsalHeight / 2);
      dorsalShape.lineTo(0, -dorsalHeight / 2);

      const dorsalGeometry = new THREE.ExtrudeGeometry(dorsalShape, extrudeSettings);
      const dorsalFin = new THREE.Mesh(dorsalGeometry, bodyMaterial);
      dorsalFin.rotation.y = Math.PI / 2;
      dorsalFin.position.set(0, fishRadius * 0.6, -fishRadius * 0.2);
      fishGroup.add(dorsalFin);

      // 4. 胸びれ (Pectoral Fins)
      const pectoralShape = new THREE.Shape();
      const pectoralSize = fishRadius * 0.6;
      pectoralShape.moveTo(0, 0);
      pectoralShape.lineTo(pectoralSize, pectoralSize * 0.3);
      pectoralShape.lineTo(pectoralSize, -pectoralSize * 0.3);
      pectoralShape.lineTo(0, 0);
      const pectoralGeometry = new THREE.ExtrudeGeometry(pectoralShape, { steps: 1, depth: fishRadius * 0.04, bevelEnabled: false });
      
      const leftPectoralFin = new THREE.Mesh(pectoralGeometry, bodyMaterial);
      leftPectoralFin.position.set(-fishRadius * 0.6, 0, fishRadius * 0.4);
      leftPectoralFin.rotation.y = Math.PI / 6;
      fishGroup.add(leftPectoralFin);

      const rightPectoralFin = leftPectoralFin.clone();
      rightPectoralFin.position.x *= -1;
      rightPectoralFin.rotation.y *= -1;
      fishGroup.add(rightPectoralFin);

      // 5. 目 (Eyes)
      const eyeGeometry = new THREE.SphereGeometry(fishRadius * 0.12, 8, 8);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-fishRadius * 0.4, fishRadius * 0.25, fishRadius * 0.8);
      fishGroup.add(leftEye);

      const rightEye = leftEye.clone();
      rightEye.position.x *= -1;
      fishGroup.add(rightEye);
      
      let angle = Math.random() * Math.PI * 2;
      let r = Math.random() * (this.pondRadius - 1);
      fishGroup.position.set(Math.cos(angle) * r, -1.2 - Math.random() * 0.3, Math.sin(angle) * r);
      this.threeScene.add(fishGroup);

      this.fishes.push({
        mesh: fishGroup,
        type: fishType,
        size: size,
        direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        timeOffset: Math.random() * 1000,
        state: 'swim',
        biteTimer: 0,
        speed: fishType.speed,
        interestCooldownUntil: 0,
        radius: fishRadius,
        timingDifficulty: fishType.timingDifficulty
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
    if (this.gameState.casting || this.gameState.reeling || this.gameState.catchingFish) return;

    // キャスト時に釣り糸とウキを再表示
    if (this.line) this.line.visible = true;
    if (this.float) this.float.visible = true;

    this.gameState.casting = true;
    this.ui.showMessage("キャスト！");
    
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

  startRandomMinigame(fish) {
    if (this.minigame.active) return;
    
    this.catchingFishObj = fish;
    fish.state = 'hooked';
    this.minigame.active = true;
    this.gameState.catchingFish = true;
    this.minigame.overallProgress = 30; // 初期プログレスを増加

    // ランダムにミニゲームを選択
    this.minigame.type = Math.random() < 0.5 ? 'tension' : 'timing';

    // ボタンのテキストを変更
    const reelBtn = document.getElementById('reel-btn');
    if (reelBtn) reelBtn.textContent = this.minigame.type === 'tension' ? 'PULL!' : 'HIT!';
    const castBtn = document.getElementById('cast-btn');
    if (castBtn) castBtn.style.display = 'none';

    if (this.minigame.type === 'tension') {
        // テンションゲームの初期化
        const reelLevel = UpgradeManager.getLevel('reel');
        const basePullStrength = 1.5;
        this.minigame.tension.pullStrength = basePullStrength + (reelLevel - 1) * 0.1;

        this.minigame.tension.value = 50;
        this.minigame.tension.fishAction = 'normal';
        this.minigame.tension.actionTimer = this.time.now + 2000 + Math.random() * 2000;
        this.minigame.tension.nextActionPreview = false;
        document.getElementById('minigame-ui-tension').style.display = 'block';
    } else {
        // タイミングゲームの初期化
        this.minigame.timing.misses = 0; // ミスカウントをリセット
        document.getElementById('timing-miss-count').textContent = `ミス: 0 / 3`;

        const fishDifficulty = this.catchingFishObj.type.timingDifficulty || 1.0;
        const baseSpeed = 1.2; // 基本速度
        this.minigame.timing.markerPosition = 0;
        this.minigame.timing.markerSpeed = (baseSpeed * fishDifficulty) * (Math.random() < 0.5 ? 1 : -1);

        const safeZone = this.minigame.timing.safeZone;
        safeZone.start = Math.random() * (100 - safeZone.width);
        const safeZoneEl = document.getElementById('timing-safe-zone');
        safeZoneEl.style.left = `${safeZone.start}%`;
        safeZoneEl.style.width = `${safeZone.width}%`;
        document.getElementById('timing-marker').style.left = `0%`; // マーカーを初期位置に
        document.getElementById('minigame-ui-timing').style.display = 'block';
    }
    
    this.ui.showMessage("HIT! 魚とのファイト開始！");
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
      this.ui.updateScoreUI();
      this.ui.showMessage(`やった！${caughtFish.size}cmの${caughtFish.type.name}を釣り上げた！`, 3000);
    } else {
      // 釣り失敗
      this.ui.showMessage('逃げられてしまった...', 3000);
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
        this.ui.showMessage("NICE!", 500, false);

        // 加速処理
        const currentSpeed = Math.abs(this.minigame.timing.markerSpeed);
        const newSpeed = currentSpeed + 0.15; // 加速を緩和
        this.minigame.timing.markerSpeed = newSpeed * Math.sign(this.minigame.timing.markerSpeed);

      } else {
        this.minigame.timing.misses++;
        document.getElementById('timing-miss-count').textContent = `ミス: ${this.minigame.timing.misses} / 3`;

        if (this.minigame.timing.misses >= 3) {
            this.ui.showMessage("3回ミス！逃げられた...", 1500);
            this.endMinigame(false);
        } else {
            this.minigame.overallProgress -= 10; 
            this.ui.showMessage("MISS...", 500, false);
        }
      }
    }
  }
}

export default GameScene; 