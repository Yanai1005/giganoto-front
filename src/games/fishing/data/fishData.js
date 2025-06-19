// ゲームに登場する魚のマスターデータ
export const FISH_TYPES = [
  { name: 'ブルーギル', minSize: 10, maxSize: 25, color: 0x66ccff, points: 10, speed: 0.02, timingDifficulty: 1.0, description: '北アメリカ原産の淡水魚。繁殖力が非常に強い。' },
  { name: 'コイ', minSize: 30, maxSize: 80, color: 0xff9900, points: 30, speed: 0.012, timingDifficulty: 1.3, description: '古くから親しまれている魚。口のひげが特徴的。' },
  { name: 'ブラックバス', minSize: 20, maxSize: 60, color: 0x333333, points: 20, speed: 0.018, timingDifficulty: 1.4, description: '大きな口で小魚を捕食する、人気のゲームフィッシュ。' },
  { name: 'フナ', minSize: 15, maxSize: 35, color: 0xaaaa55, points: 12, speed: 0.015, timingDifficulty: 1.2, description: 'コイに似ているが、口にひげがなく、体高が高い。' },
  { name: 'ナマズ', minSize: 40, maxSize: 100, color: 0x222222, points: 50, speed: 0.01, timingDifficulty: 1.8, description: '長いひげと、ぬるぬるとした体が特徴の夜行性の魚。' },
  { name: 'ニジマス', minSize: 20, maxSize: 50, color: 0xffa07a, points: 25, speed: 0.022, timingDifficulty: 1.5, description: '体に散らばる黒点と、虹色の模様が美しい渓流の女王。' },
  { name: 'アユ', minSize: 15, maxSize: 30, color: 0x90ee90, points: 18, speed: 0.025, timingDifficulty: 1.6, description: '独特の香りが特徴で「香魚」とも呼ばれる。縄張り意識が強い。' },
  { name: 'ウナギ', minSize: 40, maxSize: 90, color: 0x4B0082, points: 40, speed: 0.016, timingDifficulty: 1.7, description: 'にょろにょろと泳ぐ、細長い体の魚。夜行性で、滋養が高い。' },
  { name: 'オオサンショウウオ', minSize: 50, maxSize: 120, color: 0x556b2f, points: 100, speed: 0.008, timingDifficulty: 2.0, description: '生きた化石と呼ばれる世界最大級の両生類。特別天然記念物。' },
  { name: 'ドクターフィッシュ', minSize: 5, maxSize: 10, color: 0x808080, points: 5, speed: 0.03, timingDifficulty: 0.8, description: '人の古い角質を食べる習性を持つ小さな魚。実はコイの仲間。' }
]; 