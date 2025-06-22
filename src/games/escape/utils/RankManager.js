class RankManager {
  constructor() {
    this.stageTimes = new Map(); // �X�e�[�W�ʃN���A�^�C��
    this.stageRanks = new Map(); // �X�e�[�W�ʃ����N
    this.totalTime = 0; // �����N���A�^�C��
    this.finalRank = ""; // ���������N

    // ���ۂ̃X�e�[�W�i�Ȃ��X�e�[�W�������j
    this.actualStages = [0, 2, 4, 6]; // 1�A3�A5�A7�Ԗڂ̃X�e�[�W�i0�x�[�X�j
  }

  // �X�e�[�W�N���A�^�C�����L�^
  recordStageTime(stageIndex, time) {
    // �Ȃ��X�e�[�W�̏ꍇ�͋L�^���Ȃ�
    if (!this.isActualStage(stageIndex)) {
      return;
    }
    this.stageTimes.set(stageIndex, time);
    this.calculateTotalTime();
  }

  // �X�e�[�W�����N���v�Z
  calculateStageRank(stageIndex, time) {
    // �Ȃ��X�e�[�W�̏ꍇ�̓����N�v�Z���Ȃ�
    if (!this.isActualStage(stageIndex)) {
      return "";
    }

    let rank = "";

    // �X�e�[�W�ʂ̃����N��i��Փx�ɉ����Ē����j
    const rankCriteria = this.getRankCriteria(stageIndex);

    if (time <= rankCriteria.S) {
      rank = "S";
    } else if (time <= rankCriteria.A) {
      rank = "A";
    } else if (time <= rankCriteria.B) {
      rank = "B";
    } else if (time <= rankCriteria.C) {
      rank = "C";
    } else {
      rank = "D";
    }

    this.stageRanks.set(stageIndex, rank);
    return rank;
  }

  // ���ۂ̃X�e�[�W���ǂ����𔻒�
  isActualStage(stageIndex) {
    return this.actualStages.includes(stageIndex);
  }

  // �X�e�[�W�ԍ������ۂ̃X�e�[�W�ԍ��ɕϊ��i1�A3�A5�A7�j
  getActualStageNumber(stageIndex) {
    const actualIndex = this.actualStages.indexOf(stageIndex);
    return actualIndex >= 0 ? actualIndex + 1 : 0;
  }

  // �X�e�[�W�ʃ����N����擾
  getRankCriteria(stageIndex) {
    // �Ȃ��X�e�[�W�̏ꍇ�͊��Ԃ��Ȃ�
    if (!this.isActualStage(stageIndex)) {
      return null;
    }

    // �X�e�[�W�̓�Փx�ɉ����ă����N��𒲐�
    const baseCriteria = {
      S: 15,
      A: 25,
      B: 40,
      C: 60,
    };

    // �X�e�[�W���i�ނɂ�Ċ���ɘa
    const actualStageNumber = this.getActualStageNumber(stageIndex);
    const difficultyMultiplier = 1 + (actualStageNumber - 1) * 0.1;

    return {
      S: Math.round(baseCriteria.S * difficultyMultiplier),
      A: Math.round(baseCriteria.A * difficultyMultiplier),
      B: Math.round(baseCriteria.B * difficultyMultiplier),
      C: Math.round(baseCriteria.C * difficultyMultiplier),
    };
  }

  // �����N���A�^�C�����v�Z
  calculateTotalTime() {
    this.totalTime = Array.from(this.stageTimes.values()).reduce(
      (sum, time) => sum + time,
      0
    );
  }

  // ���������N���v�Z
  calculateFinalRank() {
    const totalStages = this.stageTimes.size;
    if (totalStages === 0) return "";

    // ���������N��i�S�X�e�[�W�̕��ώ��ԃx�[�X�j
    const averageTime = this.totalTime / totalStages;

    if (averageTime <= 20) {
      this.finalRank = "S";
    } else if (averageTime <= 30) {
      this.finalRank = "A";
    } else if (averageTime <= 45) {
      this.finalRank = "B";
    } else if (averageTime <= 65) {
      this.finalRank = "C";
    } else {
      this.finalRank = "D";
    }

    return this.finalRank;
  }

  // �X�e�[�W�����N���擾
  getStageRank(stageIndex) {
    return this.stageRanks.get(stageIndex) || "";
  }

  // �X�e�[�W�^�C�����擾
  getStageTime(stageIndex) {
    return this.stageTimes.get(stageIndex) || 0;
  }

  // ���������N���擾
  getFinalRank() {
    return this.finalRank;
  }

  // �����^�C�����擾
  getTotalTime() {
    return this.totalTime;
  }

  // �S�X�e�[�W�̃����N���擾�i���ۂ̃X�e�[�W�̂݁j
  getAllStageRanks() {
    return Array.from(this.stageRanks.entries()).map(([stage, rank]) => ({
      stage: this.getActualStageNumber(stage),
      rank: rank,
      time: this.stageTimes.get(stage),
    }));
  }

  // �����N�̐F���擾
  getRankColor(rank) {
    switch (rank) {
      case "S":
        return "#ffd700"; // ���F
      case "A":
        return "#ff6b6b"; // �ԐF
      case "B":
        return "#4ecdc4"; // �F
      case "C":
        return "#45b7d1"; // ���F
      case "D":
        return "#96ceb4"; // �ΐF
      default:
        return "#ffffff"; // ���F
    }
  }

  // �����N�̐������擾
  getRankDescription(rank) {
    switch (rank) {
      case "S":
        return "�����I";
      case "A":
        return "�D�G�I";
      case "B":
        return "�ǍD";
      case "C":
        return "����";
      case "D":
        return "�v�w��";
      default:
        return "";
    }
  }

  // �f�[�^�����Z�b�g
  reset() {
    this.stageTimes.clear();
    this.stageRanks.clear();
    this.totalTime = 0;
    this.finalRank = "";
  }

  // �f�[�^��ۑ��i���[�J���X�g���[�W�j
  save() {
    const data = {
      stageTimes: Array.from(this.stageTimes.entries()),
      stageRanks: Array.from(this.stageRanks.entries()),
      totalTime: this.totalTime,
      finalRank: this.finalRank,
    };
    localStorage.setItem("escapeGameRankData", JSON.stringify(data));
  }

  // �f�[�^��ǂݍ��݁i���[�J���X�g���[�W�j
  load() {
    const data = localStorage.getItem("escapeGameRankData");
    if (data) {
      const parsed = JSON.parse(data);
      this.stageTimes = new Map(parsed.stageTimes);
      this.stageRanks = new Map(parsed.stageRanks);
      this.totalTime = parsed.totalTime;
      this.finalRank = parsed.finalRank;
    }
  }
}

export default RankManager;
