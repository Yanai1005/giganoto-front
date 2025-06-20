const SCORE_STORAGE_KEY = 'fishingGame_score';

/**
 * スコアをlocalStorageに保存します
 * @param {number} score - 保存するスコア
 */
function saveScore(score) {
    localStorage.setItem(SCORE_STORAGE_KEY, score.toString());
}

/**
 * localStorageからスコアを復元します
 * @returns {number} 保存されているスコア（存在しない場合は0）
 */
function loadScore() {
    const savedScore = localStorage.getItem(SCORE_STORAGE_KEY);
    return savedScore ? parseInt(savedScore, 10) : 0;
}

/**
 * スコアを加算して保存します
 * @param {number} points - 加算するポイント
 * @returns {number} 新しいスコア
 */
function addScore(points) {
    const currentScore = loadScore();
    const newScore = currentScore + points;
    saveScore(newScore);
    return newScore;
}

/**
 * スコアから減算して保存します
 * @param {number} points - 減算するポイント
 * @returns {number} 新しいスコア
 */
function subtractScore(points) {
    const currentScore = loadScore();
    const newScore = Math.max(0, currentScore - points); // 0未満にならないようにする
    saveScore(newScore);
    return newScore;
}

/**
 * スコアをリセットします
 */
function resetScore() {
    localStorage.removeItem(SCORE_STORAGE_KEY);
}

export const ScoreManager = {
    saveScore,
    loadScore,
    addScore,
    subtractScore,
    resetScore
}; 