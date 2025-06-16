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
    // #game-containerにposition: relativeと高さを必ず設定
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.position = 'relative';
      gameContainer.style.height = '600px';
      gameContainer.style.minHeight = '600px';
    }
    
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
    
    // スコア表示（PhaserのUIは非表示に）
    this.scoreText = this.add.text(16, 16, 'スコア: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      strokeThickness: 3,
      stroke: '#000' 
    });
    this.scoreText.setVisible(false);

    // おしゃれなHTMLスコアUI
    let scoreDiv = document.getElementById('score-ui');
    if (!scoreDiv) {
      scoreDiv = document.createElement('div');
      scoreDiv.id = 'score-ui';
      scoreDiv.style.position = 'absolute';
      scoreDiv.style.top = '24px';
      scoreDiv.style.left = '32px';
      scoreDiv.style.zIndex = '10001';
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
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) gameContainer.appendChild(scoreDiv);
    }
    scoreDiv.textContent = 'スコア：0';
    this.scoreDiv = scoreDiv;

    // おしゃれなHTMLボタンUI
    let btnArea = document.getElementById('btn-area');
    if (!btnArea) {
      btnArea = document.createElement('div');
      btnArea.id = 'btn-area';
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) gameContainer.appendChild(btnArea);
    }
    // CSSを強化
    btnArea.style.position = 'absolute';
    btnArea.style.left = '0';
    btnArea.style.right = '0';
    btnArea.style.bottom = '24px';
    btnArea.style.width = '100%';
    btnArea.style.display = 'flex';
    btnArea.style.justifyContent = 'center';
    btnArea.style.gap = '32px';
    btnArea.style.zIndex = '10001';
    // ボタン生成
    const makeBtn = (id, text, bg) => {
      let btn = document.getElementById(id);
      if (!btn) {
        btn = document.createElement('button');
        btn.id = id;
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
        btnArea.appendChild(btn);
      }
      return btn;
    };
    const castBtn = makeBtn('cast-btn', 'キャスト', 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)');
    const reelBtn = makeBtn('reel-btn', 'リール', 'linear-gradient(135deg, #396afc 0%, #2948ff 100%)');
    // イベント
    castBtn.onclick = () => this.castLine();
    reelBtn.onclick = () => this.reelLine();

    // アニメーションループ
    this.events.on('update', this.update, this);

    // PhaserのcanvasをThree.jsより前面に
    this.time.delayedCall(100, () => {
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(c => {
        if (c !== this.threeRenderer.domElement) {
          c.style.position = 'absolute';
          c.style.top = '0';
          c.style.left = '0';
          c.style.zIndex = '2'; // 2D UIは上層
        }
      });
    });
  }
  
  initThreeJS() {
    // Three.jsの初期化
    this.threeScene = new THREE.Scene();
    this.threeCamera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    this.threeCamera.position.set(0, 20, 0); // 真上から見下ろす
    this.threeCamera.lookAt(0, 0, 0);
    this.threeCamera.up.set(0, 0, -1); // Y軸が上方向
    
    // レンダラーの設定
    this.threeRenderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true 
    });
    this.threeRenderer.setSize(800, 600);
    this.threeRenderer.setClearColor(0x000000, 0);
    this.threeRenderer.autoClear = false; // 自動クリアを無効化
    
    // レンダラーをDOMに追加
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.appendChild(this.threeRenderer.domElement);
      this.threeRenderer.domElement.style.position = 'absolute';
      this.threeRenderer.domElement.style.top = '0';
      this.threeRenderer.domElement.style.left = '0';
      this.threeRenderer.domElement.style.zIndex = '1'; // 3Dは下層
      this.threeRenderer.domElement.style.pointerEvents = 'none';
    }
    
    // ライティング
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.threeScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.threeScene.add(directionalLight);
  }
  
  createWaterSurface() {
    // 円形の池を描画
    const pondRadius = 10;
    const pondGeometry = new THREE.CircleGeometry(pondRadius, 64);
    let pondMaterial;
    try {
      const textureLoader = new THREE.TextureLoader();
      pondMaterial = new THREE.MeshStandardMaterial({
        color: 0x3399cc,
        metalness: 0.2,
        roughness: 0.5,
        transparent: true,
        opacity: 0.5
      });
      textureLoader.load('src/games/fishing/assets/water.jpg', 
        (texture) => {
          pondMaterial.map = texture;
          pondMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          console.warn("Failed to load water texture");
        }
      );
    } catch {
      pondMaterial = new THREE.MeshStandardMaterial({
        color: 0x3399cc,
        wireframe: true
      });
    }
    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.rotation.x = -Math.PI / 2;
    pond.position.y = -1;
    this.threeScene.add(pond);
    this.pondRadius = pondRadius;
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
      
      // ランダムな位置に配置（池の中に限定）
      let angle = Math.random() * Math.PI * 2;
      let r = Math.random() * (this.pondRadius - 1);
      fish.position.x = Math.cos(angle) * r;
      fish.position.y = -Math.random() * 3 - 2; // 水中
      fish.position.z = Math.sin(angle) * r;
      
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
        timeOffset: Math.random() * 1000,
        state: 'swim', // 'swim', 'approach', 'bite', 'caught', 'escape'
        biteTimer: 0 // 食いつきタイマー
      });
    }
  }
  
  createUI() {
    // ゲームUI（2D）の作成
    const bottomBar = this.add.rectangle(0, this.cameras.main.height - 100, 
                          this.cameras.main.width, 100, 
                          0x000000, 0.7)
      .setOrigin(0);
    // 非表示にする
    bottomBar.setVisible(false);
      
    // キャストボタン
    const castButton = this.add.text(100, this.cameras.main.height - 50, 'キャスト', {
      fontSize: '24px',
      backgroundColor: '#4CAF50',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    castButton.setInteractive();
    castButton.on('pointerdown', () => this.castLine());
    // 非表示にする
    castButton.setVisible(false);
    
    // リールボタン
    const reelButton = this.add.text(300, this.cameras.main.height - 50, 'リール', {
      fontSize: '24px',
      backgroundColor: '#2196F3',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    reelButton.setInteractive();
    reelButton.on('pointerdown', () => this.reelLine());
    // 非表示にする
    reelButton.setVisible(false);
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
    // 釣り糸の始点（池の上端、中心から見てzマイナス方向）
    const rodTip = new THREE.Vector3(0, 0, -(this.pondRadius + 1));
    const linePoints = [
      rodTip,
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
    
    // 投げる方向をランダム化（池の中に限定）
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (this.pondRadius - 1);
    const targetX = Math.cos(angle) * radius;
    const targetZ = Math.sin(angle) * radius;
    
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
        this.startFishingChance();
      }
    });
  }
  
  updateFishingLine() {
    // 釣り糸の位置を更新
    if (!this.fishingLine || !this.float) return;
    const rodTip = new THREE.Vector3(0, 0, -(this.pondRadius + 1));
    const linePoints = [
      rodTip,
      new THREE.Vector3(
        this.float.position.x,
        this.float.position.y,
        this.float.position.z
      )
    ];
    this.fishingLine.geometry.setFromPoints(linePoints);
    this.fishingLine.geometry.attributes.position.needsUpdate = true;
  }
  
  startFishingChance() {
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
      if (this.gameState.catchingFish && this.catchingFishObj) {
        // 魚が釣れた！
        const caughtFish = this.catchingFishObj;
        this.gameState.catchingFish = false;
        caughtFish.state = 'caught';
        // スコア加算
        this.gameState.score += caughtFish.type.points;
        this.updateScoreUI();
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
              caughtFish.state = 'swim';
            }
          }, 3000);
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
    // メッセージ用divがなければ自動生成
    let msgDiv = document.getElementById('game-message');
    if (!msgDiv) {
      msgDiv = document.createElement('div');
      msgDiv.id = 'game-message';
      msgDiv.style.position = 'absolute';
      msgDiv.style.top = '50%';
      msgDiv.style.left = '50%';
      msgDiv.style.transform = 'translate(-50%, -50%) scale(1)';
      msgDiv.style.zIndex = '10000';
      msgDiv.style.pointerEvents = 'none';
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) {
        gameContainer.appendChild(msgDiv);
      } else {
        document.body.appendChild(msgDiv);
      }
    }
    // おしゃれなスタイル
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
    msgDiv.style.transition = 'opacity 1.2s, transform 0.5s';
    msgDiv.style.opacity = '1';
    msgDiv.style.transform = 'translate(-50%, -50%) scale(1.1)';
    msgDiv.style.display = 'block';

    msgDiv.textContent = text;
    // 拡大→通常表示アニメーション
    msgDiv.style.opacity = '0';
    msgDiv.style.transform = 'translate(-50%, -50%) scale(1.2)';
    setTimeout(() => {
      msgDiv.style.opacity = '1';
      msgDiv.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);

    // フェードアウトアニメーション
    setTimeout(() => {
      msgDiv.style.opacity = '0';
      msgDiv.style.transform = 'translate(-50%, -50%) scale(0.95)';
      setTimeout(() => {
        msgDiv.style.display = 'none';
      }, 1200);
    }, 1600);
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
        // 波のアニメーション
        this.waterVertices[i + 1] = Math.sin(time / 1000 + this.waterVertices[i] + this.waterVertices[i + 2]) * 0.2;
      }
      this.waterGeometry.attributes.position.needsUpdate = true;
    }
    
    // 魚の動き
    if (this.fishes && this.fishes.length > 0) {
      this.fishes.forEach(fish => {
        if (fish && fish.mesh && fish.mesh.visible) {
          // --- AI追加 ---
          // 浮きが存在し、キャスト中のみAIを有効化
          if (this.float && this.float.visible && this.gameState.casting) {
            const floatPos = this.float.position;
            const fishPos = fish.mesh.position;
            const dist = floatPos.distanceTo(fishPos);
            if (fish.state === 'swim' && dist < 8) {
              // 近くに来たらエサに向かって移動
              fish.state = 'approach';
            }
            if (fish.state === 'approach') {
              // エサに近づく
              const dir = new THREE.Vector3().subVectors(floatPos, fishPos).normalize();
              fish.mesh.position.x += dir.x * fish.type.speed * 1.5;
              fish.mesh.position.z += dir.z * fish.type.speed * 1.5;
              // 距離が近いと食いつき
              if (dist < 1.2) {
                fish.state = 'bite';
                fish.biteTimer = time;
                this.gameState.catchingFish = true;
                this.catchingFishObj = fish;
                this.showMessage('魚が食いついた！リールを巻こう！');
                // 浮きを揺らす
                this.tweens.add({
                  targets: { y: this.float.position.y },
                  y: this.float.position.y + 0.2,
                  duration: 200,
                  yoyo: true,
                  repeat: 2,
                  onUpdate: (tween, target) => {
                    this.float.position.y = target.y;
                    this.updateFishingLine();
                  }
                });
              }
            }
            if (fish.state === 'bite') {
              // 食いつき中は動かない
              // 一定時間経過で逃げる
              if (time - fish.biteTimer > 2000) {
                fish.state = 'escape';
                this.gameState.catchingFish = false;
                this.showMessage('魚が逃げてしまった！');
                // 逃げる動き
                fish.direction = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
              }
            }
            if (fish.state === 'escape') {
              // 逃げる
              fish.mesh.position.x += fish.direction.x * fish.type.speed * 2;
              fish.mesh.position.z += fish.direction.z * fish.type.speed * 2;
              // 画面外に出たらリセット
              if (Math.abs(fish.mesh.position.x) > 20 || Math.abs(fish.mesh.position.z) > 20) {
                fish.mesh.position.x = Math.random() * 40 - 20;
                fish.mesh.position.z = Math.random() * 40 - 20;
                fish.state = 'swim';
              }
            }
          } else {
            // 通常の泳ぎ
            fish.mesh.position.x += fish.direction.x * fish.type.speed;
            fish.mesh.position.z += fish.direction.z * fish.type.speed;
            // 池の外に出ないように制限
            const distFromCenter = Math.sqrt(fish.mesh.position.x ** 2 + fish.mesh.position.z ** 2);
            if (distFromCenter > this.pondRadius - 0.5) {
              // 池の中心方向に戻す
              const dirToCenter = new THREE.Vector3(-fish.mesh.position.x, 0, -fish.mesh.position.z).normalize();
              fish.direction = dirToCenter;
              fish.mesh.position.x = Math.cos(Math.atan2(fish.mesh.position.z, fish.mesh.position.x)) * (this.pondRadius - 0.5);
              fish.mesh.position.z = Math.sin(Math.atan2(fish.mesh.position.z, fish.mesh.position.x)) * (this.pondRadius - 0.5);
            }
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
    // 浮きも池の外に出ないように制限
    if (this.float && this.float.visible) {
      const dist = Math.sqrt(this.float.position.x ** 2 + this.float.position.z ** 2);
      if (dist > this.pondRadius - 0.5) {
        const angle = Math.atan2(this.float.position.z, this.float.position.x);
        this.float.position.x = Math.cos(angle) * (this.pondRadius - 0.5);
        this.float.position.z = Math.sin(angle) * (this.pondRadius - 0.5);
        this.updateFishingLine();
      }
    }
      // Three.jsのレンダリング
    try {
      this.threeRenderer.render(this.threeScene, this.threeCamera);
    } catch (e) {
      console.error("Error rendering Three.js scene:", e);
    }
  }
  // スコア更新時にHTMLスコアUIも更新
  updateScoreUI() {
    if (this.scoreDiv) {
      this.scoreDiv.textContent = 'スコア：' + this.gameState.score;
    }
  }
}

export default GameScene;
