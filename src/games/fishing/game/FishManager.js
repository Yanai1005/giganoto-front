import * as THREE from 'three';
import { UpgradeManager, UPGRADE_CONFIG } from '../utils/UpgradeManager.js';
import { FISH_TYPES } from '../data/fishData.js';

export class FishManager {
  constructor(scene) {
    this.scene = scene;
    this.threeScene = scene.threeScene;
    this.fishes = [];
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
      let r = Math.random() * (this.scene.pondRadius - 1);
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
    this.scene.fishes = this.fishes; // Keep scene's fish array in sync
  }

  update(time) {
    // --- 通常時の魚AIロジック ---
    this.fishes.forEach(fish => {
      if (!fish?.mesh?.visible || fish.state === 'caught' || fish.state === 'hooked') {
        return; // スキップ
      }

      const isFloatInWater = this.scene.float?.visible && !this.scene.gameState.casting && !this.scene.gameState.reeling;
      let currentSpeed = fish.speed;

      // --- 1. AIの状態に基づいて、基本的な進行方向と速度を決定 ---
      switch (fish.state) {
        case 'swim': {
          // まずは池の境界からはみ出ないようにする
          const distFromCenter = fish.mesh.position.length();
          if (distFromCenter > this.scene.pondRadius - 0.5) {
            fish.direction.set(-fish.mesh.position.x, 0, -fish.mesh.position.z).normalize();
          }

          // ウキが水中にあり、魚がクールダウン中でなければ、興味を持つか判定
          if (isFloatInWater && time > fish.interestCooldownUntil) {
            const distToFloat = fish.mesh.position.distanceTo(this.scene.float.position);
            
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
          const distToFloat = fish.mesh.position.distanceTo(this.scene.float.position);
          if (distToFloat < 1.2) {
            fish.state = 'bite';
            fish.biteTimer = time + 500 + Math.random() * 1000;
          } else {
            fish.direction.copy(new THREE.Vector3().subVectors(this.scene.float.position, fish.mesh.position).normalize());
            currentSpeed *= 1.5;
          }
          break;
        }
        case 'bite':
          currentSpeed = 0; // その場で待機
          if (!isFloatInWater) { fish.state = 'swim'; break; }
          if (time > fish.biteTimer) {
            fish.state = 'hooked'; // 先に状態を更新
            this.scene.startRandomMinigame(fish); // Call back to the scene
          }
          break;

        case 'escape':
          currentSpeed *= 3; // 高速で逃走
          if (fish.mesh.position.length() > this.scene.pondRadius + 2) {
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
      if (distFromCenter > this.scene.pondRadius - 0.5) {
          const angle = Math.atan2(fish.mesh.position.z, fish.mesh.position.x);
          fish.mesh.position.x = Math.cos(angle) * (this.scene.pondRadius - 0.5);
          fish.mesh.position.z = Math.sin(angle) * (this.scene.pondRadius - 0.5);
      }
    });
  }
} 