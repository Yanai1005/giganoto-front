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

    // --- ���H�̃p�����[�^��` ---
    const mazeConfig = {
      rows: 7, // ���H�̍s��
      cols: 10, // ���H�̗�
      cellSize: 80, // �e�Z���̃s�N�Z���T�C�Y
    };

    // --- ���H���� ---
    const walls = this.physics.add.staticGroup();
    const mazeGrid = this.generateMaze(mazeConfig.rows, mazeConfig.cols);
    this.drawMaze(walls, mazeGrid, mazeConfig);

    // --- �v���C���[�ƃh�A�̔z�u ---
    // �v���C���[�̊�{�ݒ�(createPlayers)�͂��̂܂܂ɁA�J�n���W�𓮓I�ɐݒ�
    const player1StartPos = {
      x: mazeConfig.cellSize / 2,
      y: mazeConfig.cellSize / 2,
    };
    const player2StartPos = {
      x: (mazeConfig.cols - 1) * mazeConfig.cellSize + mazeConfig.cellSize / 2,
      y: (mazeConfig.rows - 1) * mazeConfig.cellSize + mazeConfig.cellSize / 2,
    };
    this.createPlayers(player1StartPos, player2StartPos);

    // �E�o�h�A�͖��H�̃S�[���n�_(�E��)�ɔz�u
    const exitX = player2StartPos.x;
    const exitY = player2StartPos.y;
    const exitDoor1 = this.physics.add.staticSprite(exitX, exitY, "door");
    const exitDoor2 = this.physics.add.staticSprite(exitX, exitY, "door");

    // --- �����蔻��̐ݒ� ---
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
   * �[���D��T���iRecursive Backtracking�j�A���S���Y�����g�p���Ė��H�f�[�^�𐶐����܂��B
   * @param {number} rows - ���H�̍s��
   * @param {number} cols - ���H�̗�
   * @returns {Array<Array<object>>} - �������ꂽ���H�̃O���b�h�f�[�^
   */
  generateMaze(rows, cols) {
    // 1. �O���b�h���������B�e�Z���͕ǂɈ͂܂�Ă����ԁB
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

    // 2. �K��ς݂̃Z�����Ȃ��Ȃ�܂ŏ������J��Ԃ�
    while (stack.length > 0) {
      current = stack.pop();
      const { row, col } = current;

      // 3. ���K��̗אڃZ����T��
      const neighbors = [];
      // ��
      if (row > 0 && !grid[row - 1][col].visited)
        neighbors.push({ row: row - 1, col, wall: "top", opposite: "bottom" });
      // �E
      if (col < cols - 1 && !grid[row][col + 1].visited)
        neighbors.push({ row, col: col + 1, wall: "right", opposite: "left" });
      // ��
      if (row < rows - 1 && !grid[row + 1].visited)
        neighbors.push({ row: row + 1, col, wall: "bottom", opposite: "top" });
      // ��
      if (col > 0 && !grid[row][col - 1].visited)
        neighbors.push({ row, col: col - 1, wall: "left", opposite: "right" });

      if (neighbors.length > 0) {
        stack.push(current); // ���݂̃Z�����X�^�b�N�ɖ߂�

        // 4. �����_���Ɉ�̗אڃZ����I��
        const nextNeighbor =
          neighbors[Math.floor(Math.random() * neighbors.length)];
        const { row: nextRow, col: nextCol } = nextNeighbor;

        // 5. ���݂̃Z���ƑI�񂾃Z���̊Ԃ̕ǂ���
        grid[row][col].walls[nextNeighbor.wall] = false;
        grid[nextRow][nextCol].walls[nextNeighbor.opposite] = false;

        // 6. �I�񂾃Z����K��ς݂Ƃ��A�X�^�b�N�ɒǉ�
        grid[nextRow][nextCol].visited = true;
        stack.push({ row: nextRow, col: nextCol });
      }
    }
    return grid;
  }

  /**
   * �������ꂽ���H�f�[�^�Ɋ�Â��āAPhaser�̕ǃI�u�W�F�N�g��`�悵�܂��B
   * @param {Phaser.Physics.Arcade.StaticGroup} walls - �ǂ�ǉ�����ÓI�O���[�v
   * @param {Array<Array<object>>} grid - generateMaze����Ԃ��ꂽ�O���b�h�f�[�^
   * @param {object} config - ���H�̐ݒ�irows, cols, cellSize�j
   */
  drawMaze(walls, grid, config) {
    const { rows, cols, cellSize } = config;

    // �O���b�h�f�[�^�Ɋ�Â��ĕǂ�`��
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const x = c * cellSize;
        const y = r * cellSize;

        // ��̕ǁir=0�̍s�̂݁j
        if (r === 0 && cell.walls.top) {
          walls
            .create(x + cellSize / 2, y, "wall")
            .setScale(cellSize / 10, 0.2)
            .refreshBody();
        }
        // ���̕� (c=0�̗�̂�)
        if (c === 0 && cell.walls.left) {
          walls
            .create(x, y + cellSize / 2, "wall")
            .setScale(0.2, cellSize / 10)
            .refreshBody();
        }
        // ���̕�
        if (cell.walls.bottom) {
          walls
            .create(x + cellSize / 2, y + cellSize, "wall")
            .setScale(cellSize / 10, 0.2)
            .refreshBody();
        }
        // �E�̕�
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
