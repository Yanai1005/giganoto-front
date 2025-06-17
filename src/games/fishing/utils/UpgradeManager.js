export const UPGRADE_CONFIG = {
  rod: {
    name: '釣り竿',
    baseCost: 100,
    costMultiplier: 1.5,
    maxLevel: 10,
    description: 'レベルが高いほど、大きな魚が出現しやすくなる。',
  },
  reel: {
    name: 'リール',
    baseCost: 150,
    costMultiplier: 1.6,
    maxLevel: 10,
    description: 'レベルが高いほど、テンションミニゲームで引き寄せる力が強くなる。',
  },
};

export class UpgradeManager {
  static data = {
    rodLevel: 1,
    reelLevel: 1,
  };

  static saveKey = 'giganoto_fishingGameUpgrades';

  static initialize() {
    this.load();
  }

  static load() {
    try {
      const savedData = localStorage.getItem(this.saveKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // 保存されたデータが不正な値でないかチェック
        if (parsedData.rodLevel > 0) {
            this.data.rodLevel = parsedData.rodLevel;
        }
        if (parsedData.reelLevel > 0) {
            this.data.reelLevel = parsedData.reelLevel;
        }
      }
    } catch (e) {
      console.error("アップグレードデータの読み込みに失敗しました。", e);
      this.data = { rodLevel: 1, reelLevel: 1 };
    }
  }

  static save() {
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(this.data));
    } catch (e) {
      console.error("アップグレードデータの保存に失敗しました。", e);
    }
  }

  static getLevel(type) { // typeは'rod'または'reel'
    return this.data[`${type}Level`];
  }

  static getUpgradeCost(type) {
    const level = this.getLevel(type);
    const config = UPGRADE_CONFIG[type];
    if (level >= config.maxLevel) {
      return null; // 最大レベル
    }
    // レベルアップに必要なコストを計算
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, level - 1));
  }
  
  static canUpgrade(type, currentPoints) {
      const cost = this.getUpgradeCost(type);
      return cost !== null && currentPoints >= cost;
  }

  static attemptUpgrade(type, currentPoints) {
    if (this.canUpgrade(type, currentPoints)) {
      const cost = this.getUpgradeCost(type);
      this.data[`${type}Level`]++;
      this.save();
      return cost; // 消費したコストを返す
    }
    return 0; // 強化失敗
  }
} 