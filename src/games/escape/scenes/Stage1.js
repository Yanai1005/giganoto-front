import BaseScene from "./BaseScene.js";

export default class Stage1 extends BaseScene {
  constructor() {
    super("Stage1");
  }

  preload() {
    this.load.image("wall", "assets/platform.png");
    this.load.image("player", "assets/player.png");
    this.load.image("door", "assets/door.png");
  }

  create() {
    this.createControls();
    this.setupFocusManagement();

    // --- 迷路のパラメータ定義 ---
    const mazeConfig = {
      rows: 7, // 迷路の行数
      cols: 10, // 迷路の列数
      cellSize: 80, // 各セルのピクセルサイズ
    };

    // --- 迷路生成 ---
    const walls = this.physics.add.staticGroup();
    const mazeGrid = this.generateMaze(mazeConfig.rows, mazeConfig.cols);
    this.drawMaze(walls, mazeGrid, mazeConfig);

    // --- プレイヤーとドアの配置 ---
    // プレイヤーの基本設定(createPlayers)はそのままに、開始座標を動的に設定
    const player1StartPos = {
      x: mazeConfig.cellSize / 2,
      y: mazeConfig.cellSize / 2,
    };
    const player2StartPos = {
      x: (mazeConfig.cols - 1) * mazeConfig.cellSize + mazeConfig.cellSize / 2,
      y: (mazeConfig.rows - 1) * mazeConfig.cellSize + mazeConfig.cellSize / 2,
    };
    this.createPlayers(player1StartPos, player2StartPos);

    // 脱出ドアは迷路のゴール地点(右下)に配置
    const exitX = player2StartPos.x;
    const exitY = player2StartPos.y;
    const exitDoor1 = this.physics.add.staticSprite(exitX, exitY, "door");
    const exitDoor2 = this.physics.add.staticSprite(exitX, exitY, "door");

    // --- 当たり判定の設定 ---
    this.physics.add.collider(this.player1, walls);
    this.physics.add.collider(this.player2, walls);
    this.physics.add.collider(this.player1, this.player2);

    this.physics.add.overlap(
      this.player1,
      exitDoor1,
      () => {
        this.player1AtExit = true;
      },
      null,
      this
    );
    this.physics.add.overlap(
      this.player2,
      exitDoor2,
      () => {
        this.player2AtExit = true;
      },
      null,
      this
    );

    this.add
      .text(400, 30, "Stage 1: Find the exit!", {
        fontSize: "24px",
        fill: "#fff",
      })
      .setOrigin(0.5);
  }

  /**
   * 深さ優先探索（Recursive Backtracking）アルゴリズムを使用して迷路データを生成します。
   * @param {number} rows - 迷路の行数
   * @param {number} cols - 迷路の列数
   * @returns {Array<Array<object>>} - 生成された迷路のグリッドデータ
   */
  generateMaze(rows, cols) {
    // 1. グリッドを初期化。各セルは壁に囲まれている状態。
    const grid = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({
            visited: false,
            walls: { top: true, right: true, bottom: true, left: true },
          }))
      );

    const stack = [];
    let current = { row: 0, col: 0 };
    grid[current.row][current.col].visited = true;
    stack.push(current);

    // 2. 訪問済みのセルがなくなるまで処理を繰り返す
    while (stack.length > 0) {
      current = stack.pop();
      const { row, col } = current;

      // 3. 未訪問の隣接セルを探す
      const neighbors = [];
      // 上
      if (row > 0 && !grid[row - 1][col].visited)
        neighbors.push({ row: row - 1, col, wall: "top", opposite: "bottom" });
      // 右
      if (col < cols - 1 && !grid[row][col + 1].visited)
        neighbors.push({ row, col: col + 1, wall: "right", opposite: "left" });
      // 下
      if (row < rows - 1 && !grid[row + 1].visited)
        neighbors.push({ row: row + 1, col, wall: "bottom", opposite: "top" });
      // 左
      if (col > 0 && !grid[row][col - 1].visited)
        neighbors.push({ row, col: col - 1, wall: "left", opposite: "right" });

      if (neighbors.length > 0) {
        stack.push(current); // 現在のセルをスタックに戻す

        // 4. ランダムに一つの隣接セルを選ぶ
        const nextNeighbor =
          neighbors[Math.floor(Math.random() * neighbors.length)];
        const { row: nextRow, col: nextCol } = nextNeighbor;

        // 5. 現在のセルと選んだセルの間の壁を壊す
        grid[row][col].walls[nextNeighbor.wall] = false;
        grid[nextRow][nextCol].walls[nextNeighbor.opposite] = false;

        // 6. 選んだセルを訪問済みとし、スタックに追加
        grid[nextRow][nextCol].visited = true;
        stack.push({ row: nextRow, col: nextCol });
      }
    }
    return grid;
  }

  /**
   * 生成された迷路データに基づいて、Phaserの壁オブジェクトを描画します。
   * @param {Phaser.Physics.Arcade.StaticGroup} walls - 壁を追加する静的グループ
   * @param {Array<Array<object>>} grid - generateMazeから返されたグリッドデータ
   * @param {object} config - 迷路の設定（rows, cols, cellSize）
   */
  drawMaze(walls, grid, config) {
    const { rows, cols, cellSize } = config;

    // グリッドデータに基づいて壁を描画
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const x = c * cellSize;
        const y = r * cellSize;

        // 上の壁（r=0の行のみ）
        if (r === 0 && cell.walls.top) {
          walls
            .create(x + cellSize / 2, y, "wall")
            .setScale(cellSize / 10, 0.2)
            .refreshBody();
        }
        // 左の壁 (c=0の列のみ)
        if (c === 0 && cell.walls.left) {
          walls
            .create(x, y + cellSize / 2, "wall")
            .setScale(0.2, cellSize / 10)
            .refreshBody();
        }
        // 下の壁
        if (cell.walls.bottom) {
          walls
            .create(x + cellSize / 2, y + cellSize, "wall")
            .setScale(cellSize / 10, 0.2)
            .refreshBody();
        }
        // 右の壁
        if (cell.walls.right) {
          walls
            .create(x + cellSize, y + cellSize / 2, "wall")
            .setScale(0.2, cellSize / 10)
            .refreshBody();
        }
      }
    }
  }

  update() {
    super.update();

    if (this.player1AtExit && this.player2AtExit) {
      this.scene.start("Stage2");
    }
  }
}
