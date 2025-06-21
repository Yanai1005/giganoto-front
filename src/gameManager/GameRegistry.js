class GameRegistry {
    static games = new Map();
    static currentGameInstance = null;
    static debugMode = true;
    static gameTypeConfig = null;

    static debugLog(message, data = null) {
        if (this.debugMode) {
            console.log(`[ゲームレジストリ] ${message}`, data || '');
        }
    }

    static errorLog(message, error = null) {
        console.error(`[ゲームレジストリ エラー] ${message}`, error || '');
    }

    static register(id, gameConfig) {
        this.games.set(id, {
            id,
            title: gameConfig.title,
            description: gameConfig.description,
            category: gameConfig.category,
            loader: gameConfig.loader
        });
        this.debugLog(`ゲーム登録: ${id}`, gameConfig.title);
    }

    static getGame(id) {
        const game = this.games.get(id);
        return game;
    }

    static getAllGames() {
        const games = Array.from(this.games.values());
        return games;
    }

    static async loadGame(gameId, container) {
        try {
            this.cleanupCurrentGame();

            const gameConfig = this.getGame(gameId);
            if (!gameConfig) {
                this.errorLog(`ゲームが見つかりません: ${gameId}`);
                this.debugLog('利用可能なゲーム:', Array.from(this.games.keys()));
                throw new Error(`ゲーム ${gameId} が見つかりません`);
            }
            const gameModule = await gameConfig.loader();
            // コンテナをクリア
            if (container) {
                container.innerHTML = '';
            } else {
                this.errorLog('ゲーム読み込み用のコンテナが提供されていません');
            }
            const gameInstance = gameModule.initializeGame(container);
            this.currentGameInstance = gameInstance;

            return gameInstance;
        } catch (error) {
            this.errorLog(`ゲーム読み込みに失敗 ${gameId}:`, error);
            throw error;
        }
    }

    static cleanupCurrentGame() {
        if (this.currentGameInstance) {
            if (typeof this.currentGameInstance.destroy === 'function') {
                this.currentGameInstance.destroy(true);
            } else {
                this.debugLog('ゲームインスタンスにdestroyメソッドがありません');
            }
        }
        this.currentGameInstance = null;
    }

    static initializeFromJson(gamesData) {
        if (this.games.size > 0) {
            return;
        }

        if (!gamesData || !gamesData.games) {
            return;
        }

        // ゲームタイプ設定を保存
        this.gameTypeConfig = gamesData.gameTypes || {};
        // gamesDataの各ゲームを登録
        gamesData.games.forEach((gameData) => {
            if (gameData.gameType) {
                try {
                    this.register(gameData.gameType, {
                        title: gameData.title,
                        description: gameData.description || '',
                        category: gameData.category || 'other',
                        loader: () => this.getDynamicLoader(gameData.gameType)
                    });
                } catch (error) {
                    this.errorLog(`ゲーム登録に失敗: ${gameData.gameType}`, error);
                }
            } else {
                this.errorLog(`ゲームにgameTypeがありません:`, gameData);
            }
        });
    }

    static getDynamicLoader(gameType) {
        // JSONの gameTypes 設定を確認
        const gameTypeInfo = this.gameTypeConfig && this.gameTypeConfig[gameType];
        if (gameTypeInfo && gameTypeInfo.modulePath) {
            this.debugLog(`JSON設定からモジュールパスを使用: ${gameTypeInfo.modulePath}`);
            return import(/* @vite-ignore */ gameTypeInfo.modulePath);
        }
        this.errorLog(`ゲームタイプの設定が見つかりません: ${gameType}`);
        throw new Error(`ゲームタイプ "${gameType}" がJSON設定に見つかりません。games.jsonのgameTypesに追加してください`);
    }

    static isInitialized() {
        const initialized = this.games.size > 0;
        return initialized;
    }

    static addGame(gameData) {
        if (gameData.gameType) {
            this.register(gameData.gameType, {
                title: gameData.title,
                description: gameData.description || '',
                category: gameData.category || 'other',
                loader: () => this.getDynamicLoader(gameData.gameType)
            });
        } else {
            this.errorLog('ゲームデータにgameTypeがありません:', gameData);
        }
    }

    static addGameType(gameType, config) {
        if (!this.gameTypeConfig) {
            this.gameTypeConfig = {};
        }

        this.gameTypeConfig[gameType] = {
            name: config.name || gameType,
            description: config.description || '',
            controls: config.controls || '',
            modulePath: config.modulePath || `../games/${gameType}/game.js`
        };
    }

    static getDebugInfo() {
        return {
            gamesCount: this.games.size,
            registeredGames: Array.from(this.games.keys()),
            currentGame: this.currentGameInstance ? 'アクティブ' : 'なし',
            initialized: this.isInitialized(),
            gameTypes: Object.keys(this.gameTypeConfig || {})
        };
    }

    static setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    static getGameTypeConfig(gameType) {
        return this.gameTypeConfig && this.gameTypeConfig[gameType];
    }

    static getAllGameTypes() {
        return this.gameTypeConfig || {};
    }
}

export default GameRegistry;
