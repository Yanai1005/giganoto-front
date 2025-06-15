import Phaser from 'phaser';

class ScenarioGame extends Phaser.Scene {
    constructor() {
        super('ScenarioGame');
        this.dialogIndex = 0;
        this.currentSoul = 'logic';
    }

    preload() {
        // フォントや背景など後から追加
    }

    create() {
        // ダイアログデータ（仮）
        this.dialog = [
            { text: "……目が覚めたか？", soul: "logic" },
            { text: "ここは……どこだ？", soul: "impulse" },
            { text: "まずは状況を整理しよう。", soul: "logic" },
            { text: "いや、そんな暇はねぇ！走れ！", soul: "impulse" },
        ];

        // ダイアログ表示テキスト
        this.dialogText = this.add.text(100, 400, '', {
            font: '20px sans-serif',
            wordWrap: { width: 600 }
        });

        // 人格表示
        this.soulText = this.add.text(100, 360, '', {
            font: '16px sans-serif',
            color: '#999'
        });

        this.input.keyboard.on('keydown-SPACE', this.nextLine, this);

        this.input.keyboard.on('keydown-Q', () => {
            this.currentSoul = this.currentSoul === 'logic' ? 'impulse' : 'logic';
            this.updateSoulIndicator();
        });

        this.nextLine();
        this.updateSoulIndicator();
    }

    nextLine() {
        if (this.dialogIndex < this.dialog.length) {
            const line = this.dialog[this.dialogIndex];
            this.dialogText.setText(`${line.text}`);
            this.soulText.setText(`【${line.soul === 'logic' ? '理性' : '衝動'}の声】`);
            this.dialogIndex++;
        } else {
            this.dialogText.setText('--- エピソード終了 ---');
            this.soulText.setText('');
        }
    }

    updateSoulIndicator() {
        // 現在操作している人格を画面の端に表示
        const label = this.currentSoul === 'logic' ? '理性モード' : '衝動モード';
        if (!this.modeText) {
            this.modeText = this.add.text(600, 20, label, {
                font: '14px sans-serif',
                color: '#00f'
            });
        } else {
            this.modeText.setText(label);
        }
    }
}

export default ScenarioGame;
