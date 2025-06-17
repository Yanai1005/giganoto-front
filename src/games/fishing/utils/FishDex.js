const DEX_STORAGE_KEY = 'fishingGame_fishDex';

/**
 * Initializes the FishDex data in localStorage if it doesn't exist.
 * @param {Array} allFishTypes - An array of all fish type objects from the game.
 */
function initialize(allFishTypes) {
    const existingData = getDexData();
    let updated = false;

    allFishTypes.forEach(fishType => {
        // 新しい魚がゲームに追加された場合、既存のセーブデータにも追加する
        if (!existingData[fishType.name]) {
            existingData[fishType.name] = {
                caught: false,
                maxSize: 0,
            };
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem(DEX_STORAGE_KEY, JSON.stringify(existingData));
    }
}

/**
 * Records a new catch, updating the caught status and max size.
 * @param {string} fishName - The name of the caught fish.
 * @param {number} fishSize - The size of the caught fish.
 */
function recordCatch(fishName, fishSize) {
    const data = getDexData();
    if (!data[fishName]) return;

    data[fishName].caught = true;
    if (fishSize > data[fishName].maxSize) {
        data[fishName].maxSize = fishSize;
    }

    localStorage.setItem(DEX_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Retrieves the entire FishDex data object from localStorage.
 * @returns {object} The FishDex data.
 */
function getDexData() {
    const rawData = localStorage.getItem(DEX_STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : {};
}

/**
 * Retrieves data for a specific fish.
 * @param {string} fishName - The name of the fish.
 * @returns {object|null} The data for the specific fish or null if not found.
 */
function getFishData(fishName) {
    const data = getDexData();
    return data[fishName] || null;
}

export const FishDex = {
    initialize,
    recordCatch,
    getDexData,
    getFishData
}; 