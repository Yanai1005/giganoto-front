class RankManager {
  constructor() {
    this.stageTimes = new Map(); // ステージ別クリアタイム
    this.stageRanks = new Map(); // ステージ別ランク
    this.totalTime = 0; // 総合クリアタイム
    this.finalRank = ""; // 総合ランク

    // 実際のステージ（つなぎステージを除く）
    this.actualStages = [0, 2, 4, 6]; // 1、3、5、7番目のステージ（0ベース）
  }

  // ステージクリアタイムを記録
  recordStageTime(stageIndex, time) {
    // つなぎステージの場合は記録しない
    if (!this.isActualStage(stageIndex)) {
      return;
    }
    this.stageTimes.set(stageIndex, time);
    this.calculateTotalTime();
  }

  // ステージランクを計算
  calculateStageRank(stageIndex, time) {
    // つなぎステージの場合はランク計算しない
    if (!this.isActualStage(stageIndex)) {
      return "";
    }

    let rank = "";

    // ステージ別のランク基準（難易度に応じて調整）
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

  // 実際のステージかどうかを判定
  isActualStage(stageIndex) {
    return this.actualStages.includes(stageIndex);
  }

  // ステージ番号を実際のステージ番号に変換（1、3、5、7）
  getActualStageNumber(stageIndex) {
    const actualIndex = this.actualStages.indexOf(stageIndex);
    return actualIndex >= 0 ? actualIndex + 1 : 0;
  }

  // ステージ別ランク基準を取得
  getRankCriteria(stageIndex) {
    // つなぎステージの場合は基準を返さない
    if (!this.isActualStage(stageIndex)) {
      return null;
    }

    // ステージの難易度に応じてランク基準を調整
    const baseCriteria = {
      S: 15,
      A: 25,
      B: 40,
      C: 60,
    };

    // ステージが進むにつれて基準を緩和
    const actualStageNumber = this.getActualStageNumber(stageIndex);
    const difficultyMultiplier = 1 + (actualStageNumber - 1) * 0.1;

    return {
      S: Math.round(baseCriteria.S * difficultyMultiplier),
      A: Math.round(baseCriteria.A * difficultyMultiplier),
      B: Math.round(baseCriteria.B * difficultyMultiplier),
      C: Math.round(baseCriteria.C * difficultyMultiplier),
    };
  }

  // 総合クリアタイムを計算
  calculateTotalTime() {
    this.totalTime = Array.from(this.stageTimes.values()).reduce(
      (sum, time) => sum + time,
      0
    );
  }

  // 総合ランクを計算
  calculateFinalRank() {
    const totalStages = this.stageTimes.size;
    if (totalStages === 0) return "";

    // 総合ランク基準（全ステージの平均時間ベース）
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

  // ステージランクを取得
  getStageRank(stageIndex) {
    return this.stageRanks.get(stageIndex) || "";
  }

  // ステージタイムを取得
  getStageTime(stageIndex) {
    return this.stageTimes.get(stageIndex) || 0;
  }

  // 総合ランクを取得
  getFinalRank() {
    return this.finalRank;
  }

  // 総合タイムを取得
  getTotalTime() {
    return this.totalTime;
  }

  // 全ステージのランクを取得（実際のステージのみ）
  getAllStageRanks() {
    return Array.from(this.stageRanks.entries()).map(([stage, rank]) => ({
      stage: this.getActualStageNumber(stage),
      rank: rank,
      time: this.stageTimes.get(stage),
    }));
  }

  // ランクの色を取得
  getRankColor(rank) {
    switch (rank) {
      case "S":
        return "#ffd700"; // 金色
      case "A":
        return "#ff6b6b"; // 赤色
      case "B":
        return "#4ecdc4"; // 青色
      case "C":
        return "#45b7d1"; // 水色
      case "D":
        return "#96ceb4"; // 緑色
      default:
        return "#ffffff"; // 白色
    }
  }

  // ランクの説明を取得
  getRankDescription(rank) {
    switch (rank) {
      case "S":
        return "完璧！";
      case "A":
        return "優秀！";
      case "B":
        return "良好";
      case "C":
        return "普通";
      case "D":
        return "要努力";
      default:
        return "";
    }
  }

  // データをリセット
  reset() {
    this.stageTimes.clear();
    this.stageRanks.clear();
    this.totalTime = 0;
    this.finalRank = "";
  }

  // データを保存（ローカルストレージ）
  save() {
    const data = {
      stageTimes: Array.from(this.stageTimes.entries()),
      stageRanks: Array.from(this.stageRanks.entries()),
      totalTime: this.totalTime,
      finalRank: this.finalRank,
    };
    localStorage.setItem("escapeGameRankData", JSON.stringify(data));
  }

  // データを読み込み（ローカルストレージ）
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
