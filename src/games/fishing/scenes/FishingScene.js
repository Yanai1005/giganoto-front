import Phaser from 'phaser';
import * as THREE from 'three';
import { FishDex } from '../utils/FishDex.js';
import { UpgradeManager, UPGRADE_CONFIG } from '../utils/UpgradeManager.js';
import { FISH_TYPES } from '../data/fishData.js';
import { UIManager } from '../ui/UIManager.js';
import { FishManager } from '../game/FishManager.js';
import { MinigameManager } from '../game/MinigameManager.js';
import { PlayerActionManager } from '../game/PlayerActionManager.js';
import { WorldManager } from '../game/WorldManager.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // Three.js
    this.threeScene = null;
    this.threeCamera = null;
    this.threeRenderer = null;
    
    // Game State
    this.gameState = {
      casting: false,
      reeling: false,
      catchingFish: false,
      score: 0
    };
    
    // Minigame State
    this.minigame = {
      active: false,
      type: null,
      tension: {
        value: 50,
        safeZone: { start: 40, end: 70 },
        speed: 0.3,
        pullStrength: 1.5,
        fishAction: 'normal',
        actionTimer: 0,
        nextActionPreview: false
      },
      timing: {
        progress: 0,
        markerPosition: 0,
        markerSpeed: 1.5,
        safeZone: { start: 60, width: 28 },
        misses: 0
      },
      overallProgress: 0,
    };
    this.isPlayerPulling = false;
    
    // Fish Data
    this.fishes = [];

    // Camera Perspectives
    this.cameraPerspectives = [
      { position: { x: 0, y: 15, z: 25 }, lookAt: { x: 0, y: 0, z: 0 }, up: null },
      { position: { x: 0, y: 30, z: 0.1 }, lookAt: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: -1 } }
    ];
    this.currentPerspectiveIndex = 0;
  }

  preload() {
    this.load.image('rod', 'src/games/fishing/assets/rod.png');
    this.load.image('water', 'src/games/fishing/assets/water.jpg');
  }

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    
    FishDex.initialize(FISH_TYPES);
    this.fishDex = FishDex;
    UpgradeManager.initialize();

    this.initThreeJS();

    // Initialize Managers
    this.ui = new UIManager(this);
    this.fishManager = new FishManager(this);
    this.minigameManager = new MinigameManager(this);
    this.playerActionManager = new PlayerActionManager(this);
    this.worldManager = new WorldManager(this);

    // Setup World and Player
    this.worldManager.createWaterSurface();
    this.worldManager.createEnvironment();
    this.worldManager.loadBackground();
    this.playerActionManager.setupFishingRod();
    this.playerActionManager.setupLineAndFloat();
    
    this.fishManager.generateFishes();
    
    this.ui.create();

    // Event Listeners
    window.addEventListener('resize', this.onResize.bind(this));
    this.events.on('shutdown', this.shutdown.bind(this));
  }

  initThreeJS() {
    const gameContainer = document.getElementById('game-container');
    const { clientWidth: width, clientHeight: height } = gameContainer;
    
    const oldCanvas = gameContainer?.querySelector('canvas.three-canvas');
    if (oldCanvas) gameContainer.removeChild(oldCanvas);

    this.threeScene = new THREE.Scene();
    this.threeCamera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    this.setCameraPerspective(this.currentPerspectiveIndex);

    this.threeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.threeRenderer.setSize(width, height);
    this.threeRenderer.setClearColor(0x000000, 0);
    this.threeRenderer.domElement.classList.add('three-canvas');

    if (gameContainer) {
      gameContainer.prepend(this.threeRenderer.domElement);
      Object.assign(this.threeRenderer.domElement.style, {
          position: 'absolute', top: '0', left: '0', pointerEvents: 'none'
      });
    }
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.threeScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.threeScene.add(directionalLight);
  }
  
  onUpgradeAttempt(type) {
    const cost = UpgradeManager.attemptUpgrade(type, this.gameState.score);
    if (cost > 0) {
      this.gameState.score -= cost;
      this.ui.updateScoreUI();
      this.ui.updateUpgradePanel();
      this.ui.showMessage(`${UPGRADE_CONFIG[type].name}を強化した！`, 1500, false);
      
      if (type === 'rod') {
          this.fishManager.generateFishes();
      }
    } else {
      this.ui.showMessage('ポイントが足りません！', 1500, false);
    }
  }

  castLine() {
    this.playerActionManager.castLine();
  }
  
  reelLine() {
    this.playerActionManager.reelLine();
  }

  switchCameraPerspective() {
    this.currentPerspectiveIndex = (this.currentPerspectiveIndex + 1) % this.cameraPerspectives.length;
    this.setCameraPerspective(this.currentPerspectiveIndex);
  }

  setCameraPerspective(index) {
    if (!this.threeCamera) return;
    const perspective = this.cameraPerspectives[index];

    this.threeCamera.position.set(perspective.position.x, perspective.position.y, perspective.position.z);
    this.threeCamera.up.set(perspective.up?.x ?? 0, perspective.up?.y ?? 1, perspective.up?.z ?? 0);
    this.threeCamera.lookAt(new THREE.Vector3(perspective.lookAt.x, perspective.lookAt.y, perspective.lookAt.z));
    
    if (this.fishingRod) {
        this.fishingRod.visible = (index === 0);
    }
  }

  onResize() {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer || !this.threeCamera || !this.threeRenderer) return;

    const { clientWidth: width, clientHeight: height } = gameContainer;
    this.threeCamera.aspect = width / height;
    this.threeCamera.updateProjectionMatrix();
    this.threeRenderer.setSize(width, height);
  }

  update(time) {
    if (!this.threeRenderer) return;
    
    this.worldManager.updateWater(time);
    this.minigameManager.update(time);

    if (!this.minigame.active) {
      this.fishManager.update(time);
    }
    
    this.playerActionManager.updateFishingLine();

    // Keep float within pond bounds
    if (this.float?.visible) {
      const dist = Math.sqrt(this.float.position.x ** 2 + this.float.position.z ** 2);
      if (dist > this.pondRadius - 0.5) {
        const angle = Math.atan2(this.float.position.z, this.float.position.x);
        this.float.position.x = Math.cos(angle) * (this.pondRadius - 0.5);
        this.float.position.z = Math.sin(angle) * (this.pondRadius - 0.5);
      }
    }
    
    this.threeRenderer.render(this.threeScene, this.threeCamera);
  }

  startRandomMinigame(fish) {
    this.minigameManager.start(fish);
  }

  onReelBtnMouseDown() {
    this.playerActionManager.onReelBtnMouseDown();
  }

  onReelBtnMouseUp() {
    this.minigameManager.onReelBtnMouseUp();
  }

  shutdown() {
    window.removeEventListener('resize', this.onResize.bind(this));
    this.ui.cleanup();
    if (this.threeRenderer) {
        this.threeRenderer.domElement.remove();
    }
  }
}

export default GameScene; 