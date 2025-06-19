import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class WorldManager {
    constructor(scene) {
        this.scene = scene;
        this.threeScene = scene.threeScene;
    }

    createWaterSurface() {
        const pondRadius = 20;

        const pondHeight = 0.5;
        const pondGeometry = new THREE.CylinderGeometry(pondRadius, pondRadius, pondHeight, 64);
        this.scene.pondTopVerticesCount = 64 + 1;

        const pondMaterial = new THREE.MeshStandardMaterial({
            color: 0x2889e0,
            metalness: 0.1,
            roughness: 0.2,
            transparent: true,
            opacity: 0.8
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
        pond.position.y = -1 - (pondHeight / 2);
        this.threeScene.add(pond);
        this.scene.pondRadius = pondRadius;
        this.scene.pond = pond;
        this.scene.waterVertices = pond.geometry.attributes.position.array;
        this.scene.waterGeometry = pond.geometry;
    }
    
    createEnvironment() {
        this.rocks = [];
        const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a5a5a,
            roughness: 0.8
        });

        for (let i = 0; i < 40; i++) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            const rockRadius = Math.random() * 0.5 + 0.2;
            rock.scale.set(rockRadius, rockRadius, rockRadius);
            
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * (this.scene.pondRadius * 0.9);
            
            rock.position.set(
                Math.cos(angle) * r,
                -2.0 - Math.random() * 1.5,
                Math.sin(angle) * r
            );
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            this.threeScene.add(rock);
        }
    }

    loadBackground() {
        new RGBELoader()
          .setPath('src/games/fishing/assets/')
          .load('sky.hdr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.threeScene.background = texture;
            this.threeScene.environment = texture;
          },
          undefined,
          () => console.error("Failed to load background texture")
          );
    }

    updateWater(time) {
        if (this.scene.waterVertices && this.scene.waterGeometry) {
          const topVerticesCount = this.scene.pondTopVerticesCount;
          const pondHeight = 0.5;
          for (let i = 0; i < topVerticesCount * 3; i += 3) {
            const x = this.scene.waterVertices[i];
            const z = this.scene.waterVertices[i + 2];
            this.scene.waterVertices[i + 1] = (pondHeight / 2) + Math.sin(time / 400 + x * 0.3 + z * 0.3) * 0.1;
          }
          this.scene.waterGeometry.attributes.position.needsUpdate = true;
        }
      }
} 