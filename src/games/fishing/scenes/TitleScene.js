import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  preload() {}

  create() {
    // 背景グラデーション風（青系）
    this.cameras.main.setBackgroundColor('#3a8dde');

    // タイトル
    this.add.text(400, 180, '釣りマスター3D', {
      fontSize: '64px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#fff',
      stroke: '#1a85ff',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 6, color: '#1a85ff', blur: 12, fill: true }
    }).setOrigin(0.5);

    // サブタイトル
    this.add.text(400, 260, 'リアルな3D釣り体験を楽しもう！', {
      fontSize: '28px',
      color: '#e0f7fa',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // スタートボタン
    const startBtn = this.add.text(400, 400, 'スタート', {
      fontSize: '36px',
      backgroundColor: '#43e97b',
      color: '#fff',
      padding: { x: 40, y: 18 },
      borderRadius: 18
    }).setOrigin(0.5).setInteractive();

    startBtn.on('pointerover', () => {
      startBtn.setStyle({ backgroundColor: '#38f9d7', scale: 1.08 });
    });
    startBtn.on('pointerout', () => {
      startBtn.setStyle({ backgroundColor: '#43e97b', scale: 1 });
    });
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // 制作者名
    this.add.text(400, 570, '© 2024 釣りマスター開発チーム', {
      fontSize: '16px',
      color: '#b3e5fc'
    }).setOrigin(0.5);
  }
} 