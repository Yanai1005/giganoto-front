import * as THREE from 'three';

export class PlayerActionManager {
  constructor(scene) {
    this.scene = scene;
    this.threeScene = scene.threeScene;
    this.threeCamera = scene.threeCamera;
  }

  setupFishingRod() {
    const rodMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // SaddleBrown
        roughness: 0.7,
        metalness: 0.1,
    });
    // 長くて細い円柱で竿を作成
    const rodGeometry = new THREE.CylinderGeometry(0.05, 0.15, 15, 8);
    rodGeometry.translate(0, 7.5, 0); // ピボット（回転軸）を竿の根元に移動
    this.scene.fishingRod = new THREE.Mesh(rodGeometry, rodMaterial);

    // カメラに対する竿の位置と角度を調整
    this.scene.fishingRod.position.set(3, -4, -10);
    this.scene.fishingRod.rotation.set(0, -0.3, 0.8);

    // 竿の先端を示す空のオブジェクトを作成
    this.scene.rodTip = new THREE.Object3D();
    this.scene.rodTip.position.y = 15; // 円柱の先端に配置
    this.scene.fishingRod.add(this.scene.rodTip);

    // 竿をカメラの子にして、常に一緒に動くようにする
    this.threeCamera.add(this.scene.fishingRod);
    this.scene.fishingRod.visible = true;
  }

  setupLineAndFloat() {
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });

    const rodTipPosition = new THREE.Vector3();
    this.scene.rodTip.getWorldPosition(rodTipPosition);
    
    // 釣り糸の始点と終点を竿の先端に設定
    const linePoints = [rodTipPosition, rodTipPosition.clone()];
    lineGeometry.setFromPoints(linePoints);
    this.scene.line = new THREE.Line(lineGeometry, lineMaterial);
    this.threeScene.add(this.scene.line);
    
    const floatGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const floatMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.scene.float = new THREE.Mesh(floatGeometry, floatMaterial);
    this.scene.float.position.copy(rodTipPosition); // 浮きも最初は竿の先端に
    this.scene.float.visible = false;
    this.threeScene.add(this.scene.float);
  }

  castLine() {
    if (this.scene.gameState.casting || this.scene.gameState.reeling || this.scene.gameState.catchingFish) return;

    // キャスト時に釣り糸とウキを再表示
    if (this.scene.line) this.scene.line.visible = true;
    if (this.scene.float) this.scene.float.visible = true;

    this.scene.gameState.casting = true;
    this.scene.ui.showMessage("キャスト！");
    
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (this.scene.pondRadius - 1);
    const targetX = Math.cos(angle) * radius;
    const targetZ = Math.sin(angle) * radius;
    const targetY = -1; // 水面の高さ
    
    if (!this.scene.float) {
      this.scene.gameState.casting = false;
      return;
    }
    
    // 浮きを竿の先端からスタートさせる
    const rodTipPosition = new THREE.Vector3();
    this.scene.rodTip.getWorldPosition(rodTipPosition);
    this.scene.float.position.copy(rodTipPosition);
    this.scene.float.visible = true;
    
    this.scene.tweens.add({
      targets: this.scene.float.position, // 浮きのpositionを直接アニメーションさせる
      x: targetX,
      y: targetY,
      z: targetZ,
      ease: 'Quad.out',
      duration: 800,
      onUpdate: () => {
        this.updateFishingLine(); // 飛んでいる間も釣り糸を更新
      },
      onComplete: () => {
        this.scene.gameState.casting = false;
      }
    });
  }

  reelLine() {
    // ミニゲーム中は実行しない
    if (this.scene.minigame.active || this.scene.gameState.reeling) return;

    if (this.scene.float) {
      this.scene.gameState.reeling = true;

      const rodTipPosition = new THREE.Vector3();
      this.scene.rodTip.getWorldPosition(rodTipPosition);

      this.scene.tweens.add({
        targets: this.scene.float.position, // 浮きのpositionを直接アニメーション
        x: rodTipPosition.x,
        y: rodTipPosition.y,
        z: rodTipPosition.z,
        ease: 'Quad.in',
        duration: 1000,
        onUpdate: () => {
            this.updateFishingLine();
        },
        onComplete: () => {
          if (this.scene.float) this.scene.float.visible = false;
          this.scene.gameState.reeling = false;
          this.scene.gameState.catchingFish = false;
        }
      });
    } else {
      this.scene.gameState.reeling = false;
      this.scene.gameState.catchingFish = false;
    }
  }

  updateFishingLine() {
    if (!this.scene.line || !this.scene.float) return;

    const rodTipPosition = new THREE.Vector3();
    this.scene.rodTip.getWorldPosition(rodTipPosition); // 毎フレーム竿の先端のグローバル座標を取得

    const linePoints = [
      rodTipPosition,
      this.scene.float.position // 浮きの現在の位置
    ];
    this.scene.line.geometry.setFromPoints(linePoints);
    this.scene.line.geometry.attributes.position.needsUpdate = true;
  }
  
  onReelBtnMouseDown() {
    if (this.scene.gameState.catchingFish) {
      if (this.scene.minigame.type === 'tension') {
        this.scene.isPlayerPulling = true;
      }
    } else {
      this.reelLine();
    }
  }
} 