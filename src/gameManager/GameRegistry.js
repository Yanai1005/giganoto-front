class GameRegistry {
    static games = new Map();
    static currentGameInstance = null;
    static debugMode = true;

    // デバッグログ
    static debugLog(message, data = null) {
        if (this.debugMode) {
            console.log(`[GameRegistry] ${message}`, data || '');
        }
    }

    // エラーログ
    static errorLog(message, error = null) {
        console.error(`[GameRegistry ERROR] ${message}`, error || '');
    }

    // ゲームを登録
    static register(id, gameConfig) {
        this.games.set(id, {
            id,
            title: gameConfig.title,
            description: gameConfig.description,
            category: gameConfig.category,
            loader: gameConfig.loader
        });
        this.debugLog(`Game registered: ${id}`, gameConfig.title);
    }

    // ゲーム情報を取得
    static getGame(id) {
        const game = this.games.get(id);
        this.debugLog(`Getting game: ${id}`, game ? 'Found' : 'Not found');
        return game;
    }

    // 全ゲームを取得
    static getAllGames() {
        const games = Array.from(this.games.values());
        this.debugLog(`Total registered games: ${games.length}`);
        return games;
    }

    // ゲームをロード
    static async loadGame(gameId, container) {
        this.debugLog(`Starting to load game: ${gameId}`);

        try {
            // 前のゲームをクリーンアップ
            this.cleanupCurrentGame();

            const gameConfig = this.getGame(gameId);
            if (!gameConfig) {
                this.errorLog(`Game not found: ${gameId}`);
                this.debugLog('Available games:', Array.from(this.games.keys()));
                throw new Error(`Game ${gameId} not found`);
            }

            this.debugLog(`Game config found for ${gameId}:`, gameConfig);

            // ゲームモジュールをロード
            this.debugLog(`Loading game module for: ${gameId}`);
            const gameModule = await gameConfig.loader();
            this.debugLog(`Game module loaded:`, gameModule);

            // コンテナをクリア
            if (container) {
                container.innerHTML = '';
                this.debugLog(`Container cleared for game: ${gameId}`);
            } else {
                this.errorLog('No container provided for game loading');
            }

            // ゲームインスタンスを作成
            this.debugLog(`Creating game instance for: ${gameId}`);
            const gameInstance = gameModule.initializeGame(container);
            this.currentGameInstance = gameInstance;
            this.debugLog(`Game instance created successfully:`, gameInstance);

            return gameInstance;
        } catch (error) {
            this.errorLog(`Failed to load game ${gameId}:`, error);
            throw error;
        }
    }

    // 現在のゲームをクリーンアップ
    static cleanupCurrentGame() {
        if (this.currentGameInstance) {
            this.debugLog('Cleaning up current game instance');
            if (typeof this.currentGameInstance.destroy === 'function') {
                this.currentGameInstance.destroy(true);
                this.debugLog('Game instance destroyed');
            } else {
                this.debugLog('Game instance has no destroy method');
            }
        }
        this.currentGameInstance = null;
    }

    // JSONデータからゲームを自動登録
    static initializeFromJson(gamesData) {
        this.debugLog('Initializing games from JSON data');

        if (this.games.size > 0) {
            this.debugLog('Games already initialized, skipping');
            return;
        }

        if (!gamesData || !gamesData.games) {
            this.errorLog('Invalid games data provided:', gamesData);
            return;
        }

        this.debugLog(`Found ${gamesData.games.length} games in JSON data`);

        // gamesDataの各ゲームを登録
        gamesData.games.forEach((gameData, index) => {
            this.debugLog(`Processing game ${index + 1}:`, gameData);

            if (gameData.gameType) {
                try {
                    this.register(gameData.gameType, {
                        title: gameData.title,
                        description: gameData.description || '',
                        category: gameData.category || 'other',
                        loader: () => this.getDynamicLoader(gameData.gameType)
                    });
                    this.debugLog(`Successfully registered: ${gameData.gameType}`);
                } catch (error) {
                    this.errorLog(`Failed to register game: ${gameData.gameType}`, error);
                }
            } else {
                this.errorLog(`Game missing gameType:`, gameData);
            }
        });

        const registeredGames = this.getAllGames();
        this.debugLog('Games registration complete. Registered games:', registeredGames.map(g => g.id));
    }

    // ゲームタイプに基づいて動的にローダーを生成
    // ゲームタイプに基づいて動的にローダーを生成
    static getDynamicLoader(gameType) {
        this.debugLog(`Getting dynamic loader for: ${gameType}`);

        const gameMap = {
            'puzzle': () => import('../games/puzzle/game.js'),
            'shooter': () => import('../games/shooter/game.js') // ★この行を追加
        };

        const loader = gameMap[gameType];
        if (!loader) {
            this.errorLog(`No loader found for game type: ${gameType}`);
            this.debugLog('Available game types:', Object.keys(gameMap));
            throw new Error(`No loader found for game type: ${gameType}`);
        }

        this.debugLog(`Loader found for: ${gameType}`);
        return loader(); // loader() は Promise を返すので、呼び出し元は await する必要があります
    }

    // 初期化状態をチェック
    static isInitialized() {
        const initialized = this.games.size > 0;
        this.debugLog(`Initialization status: ${initialized ? 'Initialized' : 'Not initialized'}`);
        return initialized;
    }

    // 手動でゲームを追加（開発用）
    static addGame(gameData) {
        this.debugLog('Manually adding game:', gameData);

        if (gameData.gameType) {
            this.register(gameData.gameType, {
                title: gameData.title,
                description: gameData.description || '',
                category: gameData.category || 'other',
                loader: () => this.getDynamicLoader(gameData.gameType)
            });
            this.debugLog(`Game added successfully: ${gameData.gameType}`);
        } else {
            this.errorLog('Game data missing gameType:', gameData);
        }
    }

    // デバッグ情報を表示
    static getDebugInfo() {
        return {
            gamesCount: this.games.size,
            registeredGames: Array.from(this.games.keys()),
            currentGame: this.currentGameInstance ? 'Active' : 'None',
            initialized: this.isInitialized()
        };
    }

    // デバッグモードの切り替え
    static setDebugMode(enabled) {
        this.debugMode = enabled;
        this.debugLog(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
}

export default GameRegistry;
