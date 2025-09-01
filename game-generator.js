import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function generateGame(gameName, gameTitle) {
    const gameType = gameName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const gameDir = path.join(__dirname, 'src', 'games', gameType);

    console.log(`🎮 "${gameTitle}" を生成中...`);

    // ディレクトリ作成
    fs.mkdirSync(path.join(gameDir, 'scenes'), { recursive: true });

    // game.js
    fs.writeFileSync(path.join(gameDir, 'game.js'),
        `import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

export const initializeGame = (container) => {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: container,
        backgroundColor: '#1a1a2e',
        physics: {
            default: 'arcade',
            arcade: { gravity: { y: 0 } }
        },
        scene: [GameScene]
    };
    return new Phaser.Game(config);
};`);

    // GameScene.js  
    fs.writeFileSync(path.join(gameDir, 'scenes', 'GameScene.js'),
        `import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.add.text(400, 300, '${gameTitle}', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }
}

export default GameScene;`);

    // GameRegistry.js更新
    const registryPath = path.join(__dirname, 'src', 'gameManager', 'GameRegistry.js');
    let content = fs.readFileSync(registryPath, 'utf8');

    if (!content.includes(`'${gameType}':`)) {
        const newImport = `            '${gameType}': () => import('../games/${gameType}/game.js'),`;
        content = content.replace(
            /(getStaticGameImports\(\) {[\s\S]*?return {[\s\S]*?)(        };)/,
            `$1${newImport}\n$2`
        );
        fs.writeFileSync(registryPath, content);
        console.log('✅ GameRegistry.js更新');
    }

    // games.json更新
    const jsonPath = path.join(__dirname, 'src', 'data', 'games.json');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (!data.games.find(g => g.gameType === gameType)) {
        const newId = Math.max(...data.games.map(g => g.id)) + 1;
        data.games.push({
            id: newId,
            title: gameTitle,
            description: `${gameTitle}のゲーム`,
            image: `/assets/${gameType}.png`,
            path: "/game",
            gameType: gameType
        });
        data.gameTypes[gameType] = {
            name: gameTitle,
            description: `${gameTitle}のゲーム`,
            controls: "基本操作",
            modulePath: `../games/${gameType}/game.js`
        };
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
        console.log('✅ games.json更新');
    }

    console.log(`✅ 完了！ゲームタイプ: ${gameType}`);
}

// 実行
const [, , gameName, gameTitle] = process.argv;
if (!gameName || !gameTitle) {
    console.log('使用法: node game-generator.js <ゲーム名> <タイトル>');
    console.log('例: node game-generator.js space "スペースゲーム"');
} else {
    generateGame(gameName, gameTitle);
}
