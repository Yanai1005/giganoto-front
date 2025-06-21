import Phaser from 'phaser';
import { JoyConHIDManager } from '../game/JoyConHIDManager.js';

class JoyConDebugScene extends Phaser.Scene {
  constructor() {
    super({ key: 'JoyConDebugScene' });
    this.joycon = null;
    this.debugText = null;
  }

  create() {
    this.cameras.main.setBackgroundColor('#2d2d2d');

    // スタイル付きテキストを作成するヘルパー関数
    const createText = (x, y, text, size = '16px') => {
        return this.add.text(x, y, text, {
            fontFamily: 'Arial',
            fontSize: size,
            color: '#ffffff',
            align: 'left'
        });
    };

    // --- UI要素 ---
    createText(400, 50, 'Joy-Con デバッグツール', '24px').setOrigin(0.5);

    // 接続ボタン
    const connectButton = this.add.text(100, 100, 'Joy-Conを接続', {
        fontFamily: 'Arial', fontSize: '20px', backgroundColor: '#555', padding: { x: 10, y: 5 }
    }).setInteractive();

    connectButton.on('pointerdown', async () => {
        this.joycon = new JoyConHIDManager(this);
        const result = await this.joycon.connect();
        if (result === 'connected') {
            connectButton.setText('接続済み');
            this.joycon.device.addEventListener('inputreport', (e) => this.updateDebugInfo(e));
        } else if (result === 'already-connected') {
            connectButton.setText('既に接続済み');
        } else {
            connectButton.setText('接続失敗');
        }
    });
    
    // 戻るボタン
    const backButton = this.add.text(100, 500, 'タイトルに戻る', {
        fontFamily: 'Arial', fontSize: '20px', backgroundColor: '#555', padding: { x: 10, y: 5 }
    }).setInteractive();
    
    backButton.on('pointerdown', () => {
        if(this.joycon) this.joycon.destroy();
        this.scene.start('TitleScene');
    });

    // --- データ表示エリア ---
    createText(100, 150, '加速度 (G):', '18px');
    this.accelText = createText(120, 180, 'X: 0.00\nY: 0.00\nZ: 0.00');

    createText(300, 150, 'ジャイロ (dps):', '18px');
    this.gyroText = createText(320, 180, 'X: 0.00\nY: 0.00\nZ: 0.00');

    // --- 振動テストエリア ---
    createText(100, 300, '振動テスト:', '18px');
    const shortRumble = this.add.text(120, 330, '弱: 短く', { fontFamily: 'Arial', fontSize: '16px', backgroundColor: '#007bff', padding: {x: 8, y: 4}}).setInteractive();
    const longRumble = this.add.text(220, 330, '強: 長く', { fontFamily: 'Arial', fontSize: '16px', backgroundColor: '#28a745', padding: {x: 8, y: 4}}).setInteractive();

    shortRumble.on('pointerdown', () => {
        if (!this.joycon?.device) return;
        this.joycon.rumble(160, 320, 0.2, 0.4); // 低周波, 高周波, 低振幅, 高振幅
        setTimeout(() => this.joycon.rumble(0,0,0,0), 150); // 150ms後に停止
    });
    longRumble.on('pointerdown', () => {
        if (!this.joycon?.device) return;
        this.joycon.rumble(320, 640, 0.6, 0.8); // 低周波, 高周波, 低振幅, 高振幅
        setTimeout(() => this.joycon.rumble(0,0,0,0), 500); // 500ms後に停止
    });
  }

  updateDebugInfo(e) {
    if (e.reportId !== 0x30) return;
    const d = new DataView(e.data.buffer);
    
    // 加速度 (3軸 * 3サンプル = 9値) - 最新のものを取得
    const ax = d.getInt16(13, true) / 4096.0;
    const ay = d.getInt16(15, true) / 4096.0;
    const az = d.getInt16(17, true) / 4096.0;
    this.accelText.setText(`X: ${ax.toFixed(2)}\nY: ${ay.toFixed(2)}\nZ: ${az.toFixed(2)}`);

    // ジャイロ (3軸 * 3サンプル = 9値) - 最新のものを取得
    const gx = d.getInt16(19, true) * (2000.0 / 32767.0); // dps
    const gy = d.getInt16(21, true) * (2000.0 / 32767.0);
    const gz = d.getInt16(23, true) * (2000.0 / 32767.0);
    this.gyroText.setText(`X: ${gx.toFixed(2)}\nY: ${gy.toFixed(2)}\nZ: ${gz.toFixed(2)}`);
  }
}

export default JoyConDebugScene; 