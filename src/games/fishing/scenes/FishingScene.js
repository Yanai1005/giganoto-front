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
    
    // 魚のデータ
    this.fishes = [];
  }

  preload() {
    // テクスチャや3Dモデルの読み込み
    this.load.image('rod', 'src/games/fishing/assets/rod.png');
    this.load.image('water', 'src/games/fishing/assets/water.jpg');
    
    // 効果音の読み込み - 一時的にコメントアウト（アセットがない場合）
    // this.load.audio('splash', 'src/games/fishing/assets/splash.mp3');
    // this.load.audio('reel', 'src/games/fishing/assets/reel.mp3');
  }

  create() {
    // Phaser UIの作成（2D要素）
    this.createUI();
    
    // Three.jsの初期化
    this.initThreeJS();
    
    // 3D水面の作成
    this.createWaterSurface();
    
    // 魚の生成
    this.generateFishes();
    
    // 釣り竿の制御
    this.setupFishingRodControls();
    
    // スコア表示
    this.scoreText = this.add.text(16, 16, 'スコア: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      strokeThickness: 3,
      stroke: '#000' 
    });
    
    // アニメーションループ
    this.events.on('update', this.update, this);
  }
  
  initThreeJS() {
    // Three.jsシーン作成
    this.threeScene = new THREE.Scene();
    
    // カメラ設定
    this.threeCamera = new THREE.PerspectiveCamera(
      75, 
      this.scale.width / this.scale.height, 
      0.1, 
      1000
    );
    this.threeCamera.position.set(0, 5, 10);
    this.threeCamera.lookAt(0, 0, 0);
    
    // レンダラー作成とDOM追加
    const canvas = document.createElement('canvas');
    this.threeRenderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      alpha: true 
    });
    this.threeRenderer.setSize(
      this.scale.width, 
      this.scale.height
    );
    
    // PhaserのDOMコンテナに追加
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none'; // Phaserの入力を邪魔しない
      gameContainer.appendChild(canvas);
      
      console.log("Three.js canvas added to DOM");
    } else {
      console.error("Game container not found!");
    }
    
    // 環境光と指向性ライト
    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.threeScene.add(ambientLight);
    this.threeScene.add(directionalLight);
  }
  
  createWaterSurface() {
    // 水面のジオメトリとマテリアル
    const waterGeometry = new THREE.PlaneGeometry(50, 50, 32, 32);
    
    // テクスチャがなくても動作するようにする
    let waterMaterial;
    try {
      // テクスチャローダー
      const textureLoader = new THREE.TextureLoader();
      // デモのためのフォールバックカラーを準備
      waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x0077be,
        metalness: 0.1,
        roughness: 0.4,
        transparent: true,
        opacity: 0.8
      });
        // テクスチャのロード試行（失敗しても続行）
      textureLoader.load('src/games/fishing/assets/water.jpg', 
        // 成功時
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(5, 5);
          waterMaterial.map = texture;
          waterMaterial.needsUpdate = true;
          console.log("Water texture loaded successfully");
        },
        // 進捗時
        undefined,
        // エラー時
        (err) => {
          console.warn("Failed to load water texture:", err);
        }
      );
    } catch (e) {
      console.error("Error loading water texture:", e);
      // フォールバック
      waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x0077be,
        wireframe: true
      });
    }
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2; // 水平に
    water.position.y = -1;
    this.threeScene.add(water);
    console.log("Added water to scene");
    
    // 波アニメーションのための頂点を保存
    this.waterVertices = waterGeometry.attributes.position.array;
    this.waterGeometry = waterGeometry;
  }
  
  generateFishes() {
    // 魚の種類（サイズ、速度、レア度）
    const fishTypes = [
      { size: 0.5, speed: 0.02, color: 0xff9900, points: 10 },
      { size: 0.8, speed: 0.015, color: 0x66ccff, points: 20 },
      { size: 1.2, speed: 0.01, color: 0xff3300, points: 50 }
    ];
    
    // 10匹の魚を生成
    for (let i = 0; i < 10; i++) {
      const fishType = fishTypes[Math.floor(Math.random() * fishTypes.length)];
      
      // 魚の3Dモデル（簡易的に球で表現）
      const fishGeometry = new THREE.SphereGeometry(fishType.size, 16, 16);
      const fishMaterial = new THREE.MeshStandardMaterial({ color: fishType.color });
      const fish = new THREE.Mesh(fishGeometry, fishMaterial);
      
      // ランダムな位置に配置
      fish.position.x = Math.random() * 40 - 20;
      fish.position.y = -Math.random() * 3 - 2; // 水中
      fish.position.z = Math.random() * 40 - 20;
      
      this.threeScene.add(fish);
      
      // 魚の情報を保存
      this.fishes.push({
        mesh: fish,
        type: fishType,
        direction: new THREE.Vector3(
          Math.random() - 0.5,
          0,
          Math.random() - 0.5
        ).normalize(),
        timeOffset: Math.random() * 1000
      });
    }
  }
  
  createUI() {
    // ゲームUI（2D）の作成
    this.add.rectangle(0, this.cameras.main.height - 100, 
                      this.cameras.main.width, 100, 
                      0x000000, 0.7)
      .setOrigin(0);
      
    // キャストボタン
    const castButton = this.add.text(100, this.cameras.main.height - 50, 'キャスト', {
      fontSize: '24px',
      backgroundColor: '#4CAF50',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    castButton.setInteractive();
    castButton.on('pointerdown', () => this.castLine());
    
    // リールボタン
    const reelButton = this.add.text(300, this.cameras.main.height - 50, 'リール', {
      fontSize: '24px',
      backgroundColor: '#2196F3',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    reelButton.setInteractive();
    reelButton.on('pointerdown', () => this.reelLine());
  }
  
  setupFishingRodControls() {
    // 釣り竿のスプライト
    this.fishingRod = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height - 150,
      'rod'
    ).setOrigin(0.5, 1).setScale(0.5);
    
    // 釣り糸（3Dオブジェクト）
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    // 初期位置（更新時に変わる）
    const linePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -2, 0)
    ];
    
    lineGeometry.setFromPoints(linePoints);
    this.fishingLine = new THREE.Line(lineGeometry, lineMaterial);
    this.threeScene.add(this.fishingLine);
    
    // 浮き（3Dオブジェクト）
    const floatGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const floatMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.float = new THREE.Mesh(floatGeometry, floatMaterial);
    this.float.position.set(0, -1, 0); // デフォルト位置
    this.float.visible = false; // 最初は非表示
    this.threeScene.add(this.float);
  }
  
  castLine() {
    console.log("Cast button clicked!");
    if (this.gameState.casting || this.gameState.reeling) {
      console.log("Already casting or reeling");
      return;
    }
    
    this.gameState.casting = true;
    this.showMessage("キャスト！");
    
    // 投げる方向をランダム化
    const targetX = (Math.random() - 0.5) * 15;
    const targetZ = (Math.random() - 0.5) * 15;
    
    // 浮きの確認
    if (!this.float) {
      console.error("Float not initialized!");
      this.gameState.casting = false;
      return;
    }
    
    // 浮きを表示
    this.float.visible = true;
    
    // アニメーション
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
        console.log("Cast complete at position:", targetX, targetZ);
        
        // 釣りチャンス開始
        this.startFishingChance(targetX, targetZ);
      }
    });
  }
  
  updateFishingLine() {
    // 釣り糸の位置を更新
    if (!this.fishingLine || !this.float) return;
    
    const linePoints = [
      new THREE.Vector3(0, 0, 0), // 釣り竿の先端（シーン原点との相対位置）
      new THREE.Vector3(
        this.float.position.x,
        this.float.position.y,
        this.float.position.z
      )
    ];
    
    this.fishingLine.geometry.setFromPoints(linePoints);
    this.fishingLine.geometry.attributes.position.needsUpdate = true;
  }
  
  startFishingChance(x, z) {
    // 魚が近くにいるかチェック
    setTimeout(() => {
      // 魚がかかる判定（ランダム）
      if (Math.random() < 0.3) { // 30%の確率で魚がかかる
        this.gameState.catchingFish = true;
        this.showMessage("魚がかかった！リールを巻こう！");
        
        // 浮きのアニメーション（魚がかかったサイン）
        this.tweens.add({
          targets: { y: -1 },
          y: -0.8,
          ease: 'Sine.inOut',
          duration: 300,
          yoyo: true,
          repeat: 3,
          onUpdate: (tween, target) => {
            if (this.float) {
              this.float.position.y = target.y;
              this.updateFishingLine();
            }
          },
          onComplete: () => {
            // タイミング良くリールしないと魚が逃げる
            this.fishingTimeout = setTimeout(() => {
              if (this.gameState.catchingFish) {
                this.gameState.catchingFish = false;
                this.showMessage("魚が逃げてしまった!");
              }
            }, 2000);
          }
        });
      }
    }, 1000 + Math.random() * 3000); // 1-4秒のランダムな待ち時間
  }
  
  reelLine() {
    console.log("Reel button clicked!");
    // 釣り糸を巻き取る
    if (!this.gameState.casting) {
      if (this.gameState.catchingFish) {
        // 魚が釣れた！
        clearTimeout(this.fishingTimeout);
        
        // どの魚が釣れたか決定
        const fishIndex = Math.floor(Math.random() * this.fishes.length);
        const caughtFish = this.fishes[fishIndex];
        
        if (caughtFish) {
          // スコア加算
          this.gameState.score += caughtFish.type.points;
          this.scoreText.setText(`スコア: ${this.gameState.score}`);
          
          // 成功メッセージ
          this.showMessage(`魚を釣り上げた！ +${caughtFish.type.points}ポイント`);
          
          // 魚を一時的に非表示（後でリスポーンさせる）
          if (caughtFish.mesh) {
            caughtFish.mesh.visible = false;
            setTimeout(() => {
              // 魚をリスポーン
              if (caughtFish.mesh) {
                caughtFish.mesh.position.x = Math.random() * 40 - 20;
                caughtFish.mesh.position.z = Math.random() * 40 - 20;
                caughtFish.mesh.visible = true;
              }
            }, 5000);
          }
        }
      }
      
      // 浮きを引き上げる
      this.gameState.reeling = true;
      
      if (this.float) {
        this.tweens.add({
          targets: { 
            x: this.float.position.x, 
            y: this.float.position.y, 
            z: this.float.position.z 
          },
          x: 0,
          y: 0,
          z: 0,
          ease: 'Quad.in',
          duration: 1000,
          onUpdate: (tween, target) => {
            if (this.float) {
              this.float.position.x = target.x;
              this.float.position.y = target.y;
              this.float.position.z = target.z;
              this.updateFishingLine();
            }
          },
          onComplete: () => {
            if (this.float) {
              this.float.visible = false;
            }
            this.gameState.reeling = false;
            this.gameState.catchingFish = false;
          }
        });
      } else {
        // 浮きがない場合
        this.gameState.reeling = false;
        this.gameState.catchingFish = false;
      }
    }
  }
  
  showMessage(text) {
    // メッセージ表示
    const message = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      text,
      {
        fontSize: '28px',
        backgroundColor: '#000',
        padding: { x: 20, y: 10 },
        fill: '#fff'
      }
    ).setOrigin(0.5);
    
    // アニメーション付きで消す
    this.tweens.add({
      targets: message,
      alpha: 0,
      y: '-=50',
      ease: 'Power2',
      duration: 2000,
      onComplete: () => message.destroy()
    });
  }
  update(time) {
    // Three.jsが初期化されているか確認
    if (!this.threeRenderer || !this.threeScene || !this.threeCamera) {
      console.warn("Three.js not fully initialized yet");
      return;
    }
    
    // デバッグ情報（初回のみ表示）
    if (!this._debugShown) {
      console.log("Three.js Debug Info:", {
        scene: this.threeScene ? "Initialized" : "Missing",
        camera: this.threeCamera ? "Initialized" : "Missing",
        renderer: this.threeRenderer ? "Initialized" : "Missing",
        water: this.waterGeometry ? "Created" : "Missing",
        fishes: this.fishes ? this.fishes.length : "None"
      });
      this._debugShown = true;
    }
    
    // 水面のアニメーション
    if (this.waterVertices && this.waterGeometry) {
      for (let i = 0; i < this.waterVertices.length; i += 3) {
        const x = this.waterVertices[i];
        const z = this.waterVertices[i + 2];
        
        // 波のアニメーション
        this.waterVertices[i + 1] = Math.sin(time / 1000 + x + z) * 0.2;
      }
      this.waterGeometry.attributes.position.needsUpdate = true;
    }
    
    // 魚の動き
    if (this.fishes && this.fishes.length > 0) {
      this.fishes.forEach(fish => {
        if (fish && fish.mesh && fish.mesh.visible) {
          // 魚を動かす
          fish.mesh.position.x += fish.direction.x * fish.type.speed;
          fish.mesh.position.z += fish.direction.z * fish.type.speed;
          
          // 水槽の範囲から出ないように
          if (Math.abs(fish.mesh.position.x) > 20) {
            fish.direction.x *= -1;
            fish.mesh.position.x = Math.sign(fish.mesh.position.x) * 20;
          }
          
          if (Math.abs(fish.mesh.position.z) > 20) {
            fish.direction.z *= -1;
            fish.mesh.position.z = Math.sign(fish.mesh.position.z) * 20;
          }
          
          // 魚が上下に揺れる
          fish.mesh.position.y = -2 - Math.sin(time / 1000 + fish.timeOffset) * 0.5;
          
          // 魚の向き
          fish.mesh.lookAt(
            fish.mesh.position.x + fish.direction.x,
            fish.mesh.position.y,
            fish.mesh.position.z + fish.direction.z
          );
        }
      });
    }
      // Three.jsのレンダリング
    try {
      this.threeRenderer.render(this.threeScene, this.threeCamera);
    } catch (e) {
      console.error("Error rendering Three.js scene:", e);
    }
  }
}

export default GameScene;
