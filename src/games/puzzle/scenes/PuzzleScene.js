import Phaser from 'phaser';

class PuzzleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PuzzleScene' });
        this.gridSize = 8;
        this.tileSize = 60;
        this.colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        this.grid = [];
        this.selectedTile = null;
        this.score = 0;
        this.debugMode = true;
    }

    debugLog(message, data = null) {
        if (this.debugMode) {
            console.log(`[Gem Matcher] ${message}`, data || '');
        }
    }

    preload() {
        this.debugLog('Preloading puzzle assets...');

        // 色付きタイルテクスチャを生成
        this.colors.forEach((color, index) => {
            this.add.graphics()
                .fillStyle(parseInt(color.slice(1), 16))
                .fillRect(0, 0, this.tileSize - 2, this.tileSize - 2)
                .generateTexture(`tile${index}`, this.tileSize - 2, this.tileSize - 2);
        });

        // 選択インジケーターテクスチャを生成
        this.add.graphics()
            .lineStyle(4, 0xffffff)
            .strokeRect(0, 0, this.tileSize - 2, this.tileSize - 2)
            .generateTexture('selected', this.tileSize - 2, this.tileSize - 2);

        this.debugLog('Puzzle assets preloaded successfully');
    }

    create() {
        this.debugLog('Creating puzzle scene...');

        this.createUI();
        this.createGrid();
        this.setupInput();

        this.debugLog('Puzzle scene creation complete');
    }

    createUI() {
        // タイトル
        this.add.text(400, 30, 'Gem Matcher', {
            fontSize: '32px',
            fill: '#fff',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // スコア表示
        this.scoreText = this.add.text(50, 80, `スコア: ${this.score}`, {
            fontSize: '20px',
            fill: '#fff'
        });

        // デバッグ情報表示
        if (this.debugMode) {
            this.debugText = this.add.text(50, 110, 'Debug: Ready', {
                fontSize: '14px',
                fill: '#ffff00'
            });
        }

        // 操作説明
        this.add.text(400, 550, 'クリックでタイル選択 | 3つ以上同じ色を揃えよう！', {
            fontSize: '16px',
            fill: '#bdc3c7',
            align: 'center'
        }).setOrigin(0.5);
    }

    createGrid() {
        const startX = (800 - (this.gridSize * this.tileSize)) / 2;
        const startY = 120;

        this.grid = [];
        this.tileSprites = [];

        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            this.tileSprites[row] = [];

            for (let col = 0; col < this.gridSize; col++) {
                const colorIndex = Phaser.Math.Between(0, this.colors.length - 1);
                this.grid[row][col] = colorIndex;

                const x = startX + col * this.tileSize;
                const y = startY + row * this.tileSize;

                const tile = this.add.image(x, y, `tile${colorIndex}`)
                    .setOrigin(0)
                    .setInteractive()
                    .setData('row', row)
                    .setData('col', col);

                this.tileSprites[row][col] = tile;
            }
        }

        this.debugLog(`Grid created: ${this.gridSize}x${this.gridSize} tiles`);
    }

    setupInput() {
        this.input.on('pointerdown', this.handleTileClick, this);
    }

    handleTileClick(pointer) {
        const tile = this.getTileAtPosition(pointer.x, pointer.y);
        if (tile) {
            const row = tile.getData('row');
            const col = tile.getData('col');
            this.debugLog(`Tile clicked at (${row}, ${col})`);
            this.selectTile(row, col);
        }
    }

    getTileAtPosition(x, y) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const sprite = this.tileSprites[row][col];
                if (sprite && sprite.getBounds().contains(x, y)) {
                    return sprite;
                }
            }
        }
        return null;
    }

    selectTile(row, col) {
        if (this.selectedTile) {
            const { row: selectedRow, col: selectedCol } = this.selectedTile;

            if (row === selectedRow && col === selectedCol) {
                this.debugLog('Same tile clicked - clearing selection');
                this.clearSelection();
                return;
            }

            if (this.isAdjacent(selectedRow, selectedCol, row, col)) {
                this.debugLog(`Swapping tiles: (${selectedRow},${selectedCol}) <-> (${row},${col})`);
                this.swapTiles(selectedRow, selectedCol, row, col);
                this.clearSelection();
            } else {
                this.debugLog('Non-adjacent tile clicked - selecting new tile');
                this.clearSelection();
                this.setSelection(row, col);
            }
        } else {
            this.debugLog(`Selecting tile at (${row}, ${col})`);
            this.setSelection(row, col);
        }
    }

    setSelection(row, col) {
        this.selectedTile = { row, col };

        if (this.selectionIndicator) {
            this.selectionIndicator.destroy();
        }

        const sprite = this.tileSprites[row][col];
        this.selectionIndicator = this.add.image(sprite.x, sprite.y, 'selected').setOrigin(0);
        this.debugLog(`Tile selected: (${row}, ${col})`);
    }

    clearSelection() {
        this.selectedTile = null;
        if (this.selectionIndicator) {
            this.selectionIndicator.destroy();
            this.selectionIndicator = null;
        }
        this.debugLog('Selection cleared');
    }

    isAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    swapTiles(row1, col1, row2, col2) {
        // グリッドでスワップ
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;

        // スプライト更新
        this.updateTileSprite(row1, col1);
        this.updateTileSprite(row2, col2);

        // マッチチェック
        const matches = this.findMatches();
        this.debugLog(`Found ${matches.length} matches after swap`);

        if (matches.length > 0) {
            this.processMatches(matches);
        } else {
            this.debugLog('No matches found - reverting swap');
            // 元に戻す
            this.grid[row1][col1] = this.grid[row2][col2];
            this.grid[row2][col2] = temp;
            this.updateTileSprite(row1, col1);
            this.updateTileSprite(row2, col2);
        }
    }

    findMatches() {
        const matches = [];
        const checked = [];

        // チェック済み配列を初期化
        for (let row = 0; row < this.gridSize; row++) {
            checked[row] = new Array(this.gridSize).fill(false);
        }

        // 水平マッチを検索
        this.findHorizontalMatches(matches, checked);

        // 垂直マッチを検索
        this.findVerticalMatches(matches, checked);

        return matches;
    }

    findHorizontalMatches(matches, checked) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 2; col++) {
                const color = this.grid[row][col];
                let count = 1;
                let currentCol = col;

                while (currentCol + 1 < this.gridSize && this.grid[row][currentCol + 1] === color) {
                    count++;
                    currentCol++;
                }

                if (count >= 3) {
                    for (let i = col; i <= currentCol; i++) {
                        if (!checked[row][i]) {
                            matches.push({ row, col: i });
                            checked[row][i] = true;
                        }
                    }
                }
            }
        }
    }

    findVerticalMatches(matches, checked) {
        for (let col = 0; col < this.gridSize; col++) {
            for (let row = 0; row < this.gridSize - 2; row++) {
                const color = this.grid[row][col];
                let count = 1;
                let currentRow = row;

                while (currentRow + 1 < this.gridSize && this.grid[currentRow + 1][col] === color) {
                    count++;
                    currentRow++;
                }

                if (count >= 3) {
                    for (let i = row; i <= currentRow; i++) {
                        if (!checked[i][col]) {
                            matches.push({ row: i, col });
                            checked[i][col] = true;
                        }
                    }
                }
            }
        }
    }

    processMatches(matches) {
        // スコア加算
        const scoreIncrease = matches.length * 10;
        this.score += scoreIncrease;
        this.scoreText.setText(`スコア: ${this.score}`);
        this.debugLog(`Score increased by ${scoreIncrease}. New total: ${this.score}`);

        // マッチしたタイルを新しい色に変更
        matches.forEach(({ row, col }) => {
            const oldColor = this.grid[row][col];
            const newColor = Phaser.Math.Between(0, this.colors.length - 1);
            this.grid[row][col] = newColor;
            this.updateTileSprite(row, col);

            this.debugLog(`Tile (${row},${col}) changed from color ${oldColor} to ${newColor}`);

            // エフェクト
            const sprite = this.tileSprites[row][col];
            this.tweens.add({
                targets: sprite,
                scale: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Power2'
            });
        });
    }

    updateTileSprite(row, col) {
        const sprite = this.tileSprites[row][col];
        const colorIndex = this.grid[row][col];
        sprite.setTexture(`tile${colorIndex}`);
    }

    update() {
        // デバッグ情報更新
        if (this.debugMode && this.debugText) {
            const selectedInfo = this.selectedTile ?
                `Selected: (${this.selectedTile.row},${this.selectedTile.col})` :
                'No selection';
            this.debugText.setText(`Debug: ${selectedInfo} | Score: ${this.score}`);
        }
    }
}

export default PuzzleScene;
