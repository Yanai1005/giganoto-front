// src/games/escape/scenes/Stage1.js

import BaseScene from "./BaseScene.js";

export default class Stage1 extends BaseScene {
  constructor() {
    super("Stage1");
  }

  preload() {
    this.load.image("wall", "/assets/platform.png");
    this.load.image("player", "/assets/player.png");
    this.load.image("door", "/assets/door.png");
  }

  create() {
    this.createControls();
    this.setupFocusManagement();

    const mazeConfig = {
      rows: 7,
      cols: 10,
      cellSize: 80,
    };

    const walls = this.physics.add.staticGroup();
    const mazeGrid = this.generateMaze(mazeConfig.rows, mazeConfig.cols);
    this.drawMaze(walls, mazeGrid, mazeConfig);

    const player1StartPos = {
      x: mazeConfig.cellSize / 2,
      y: mazeConfig.cellSize / 2,
    };
    // プレイヤー2の開始位置をプレイヤー1の近くに変更
    const player2StartPos = {
      x: mazeConfig.cellSize / 2 + 30, // 少しずらして配置
      y: mazeConfig.cellSize / 2 + 30,
    };
    this.createPlayers(player1StartPos, player2StartPos);

    // 脱出ドアは迷路のゴール地点(右下)に配置
    const exitX =
      (mazeConfig.cols - 1) * mazeConfig.cellSize + mazeConfig.cellSize / 2;
    const exitY =
      (mazeConfig.rows - 1) * mazeConfig.cellSize + mazeConfig.cellSize / 2;

    const exitDoor1 = this.physics.add.staticSprite(exitX, exitY, "door");
    const exitDoor2 = this.physics.add.staticSprite(exitX, exitY, "door");

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

  // (generateMaze と drawMaze メソッドは変更なし)
  generateMaze(rows, cols) {
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

    while (stack.length > 0) {
      current = stack.pop();
      const { row, col } = current;

      const neighbors = [];
      if (row > 0 && !grid[row - 1][col].visited)
        neighbors.push({ row: row - 1, col, wall: "top", opposite: "bottom" });
      if (col < cols - 1 && !grid[row][col + 1].visited)
        neighbors.push({ row, col: col + 1, wall: "right", opposite: "left" });
      if (row < rows - 1 && !grid[row + 1].visited)
        neighbors.push({ row: row + 1, col, wall: "bottom", opposite: "top" });
      if (col > 0 && !grid[row][col - 1].visited)
        neighbors.push({ row, col: col - 1, wall: "left", opposite: "right" });

      if (neighbors.length > 0) {
        stack.push(current);
        const nextNeighbor =
          neighbors[Math.floor(Math.random() * neighbors.length)];
        const { row: nextRow, col: nextCol } = nextNeighbor;
        grid[row][col].walls[nextNeighbor.wall] = false;
        grid[nextRow][nextCol].walls[nextNeighbor.opposite] = false;
        grid[nextRow][nextCol].visited = true;
        stack.push({ row: nextRow, col: nextCol });
      }
    }
    return grid;
  }

  drawMaze(walls, grid, config) {
    const { rows, cols, cellSize } = config;

    walls
      .create((cols * cellSize) / 2, 0, "wall")
      .setScale((cols * cellSize) / 10 + 0.2, 0.2)
      .refreshBody();
    walls
      .create(0, (rows * cellSize) / 2, "wall")
      .setScale(0.2, (rows * cellSize) / 10)
      .refreshBody();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellSize;
        const y = r * cellSize;
        if (grid[r][c].walls.right) {
          walls
            .create(x + cellSize, y + cellSize / 2, "wall")
            .setScale(0.2, cellSize / 10)
            .refreshBody();
        }
        if (grid[r][c].walls.bottom) {
          walls
            .create(x + cellSize / 2, y + cellSize, "wall")
            .setScale(cellSize / 10, 0.2)
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
