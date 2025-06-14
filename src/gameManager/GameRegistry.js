class GameRegistry {
    static games = new Map();
    static currentGameInstance = null;
    static debugMode = true;
    static gameTypeConfig = null;

    static debugLog(message, data = null) {
        if (this.debugMode) {
            console.log(`[GameRegistry] ${message}`, data || '');
        }
    }

    static errorLog(message, error = null) {
        console.error(`[GameRegistry ERROR] ${message}`, error || '');
    }

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

    static getGame(id) {
        const game = this.games.get(id);
        this.debugLog(`Getting game: ${id}`, game ? 'Found' : 'Not found');
        return game;
    }

    static getAllGames() {
        const games = Array.from(this.games.values());
        this.debugLog(`Total registered games: ${games.length}`);
        return games;
    }

    static async loadGame(gameId, container) {
        this.debugLog(`Starting to load game: ${gameId}`);

        try {
            this.cleanupCurrentGame();

            const gameConfig = this.getGame(gameId);
            if (!gameConfig) {
                this.errorLog(`Game not found: ${gameId}`);
                this.debugLog('Available games:', Array.from(this.games.keys()));
                throw new Error(`Game ${gameId} not found`);
            }

            this.debugLog(`Game config found for ${gameId}:`, gameConfig);

            this.debugLog(`Loading game module for: ${gameId}`);
            const gameModule = await gameConfig.loader();
            this.debugLog(`Game module loaded:`, gameModule);

            if (container) {
                container.innerHTML = '';
                this.debugLog(`Container cleared for game: ${gameId}`);
            } else {
                this.errorLog('No container provided for game loading');
            }

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

        this.gameTypeConfig = gamesData.gameTypes || {};
        this.debugLog('Game type configuration loaded:', this.gameTypeConfig);

        this.debugLog(`Found ${gamesData.games.length} games in JSON data`);

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
    static getDynamicLoader(gameType) {
        this.debugLog(`Getting dynamic loader for: ${gameType}`);

        const gameTypeInfo = this.gameTypeConfig && this.gameTypeConfig[gameType];
        if (gameTypeInfo && gameTypeInfo.modulePath) {
            this.debugLog(`Using module path from JSON config: ${gameTypeInfo.modulePath}`);
            return import(/* @vite-ignore */ gameTypeInfo.modulePath);
        }

        this.errorLog(`No configuration found for game type: ${gameType}`);
        this.debugLog('Available game types from JSON:', Object.keys(this.gameTypeConfig || {}));
        throw new Error(`Game type "${gameType}" not found in JSON configuration. Please add it to gameTypes in games.json`);
    }

    static isInitialized() {
        const initialized = this.games.size > 0;
        this.debugLog(`Initialization status: ${initialized ? 'Initialized' : 'Not initialized'}`);
        return initialized;
    }

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

    static addGameType(gameType, config) {
        this.debugLog(`Adding new game type: ${gameType}`, config);

        if (!this.gameTypeConfig) {
            this.gameTypeConfig = {};
        }

        this.gameTypeConfig[gameType] = {
            name: config.name || gameType,
            description: config.description || '',
            controls: config.controls || '',
            modulePath: config.modulePath || `../games/${gameType}/game.js`
        };

        this.debugLog(`Game type ${gameType} added successfully`);
    }

    static getDebugInfo() {
        return {
            gamesCount: this.games.size,
            registeredGames: Array.from(this.games.keys()),
            currentGame: this.currentGameInstance ? 'Active' : 'None',
            initialized: this.isInitialized(),
            gameTypes: Object.keys(this.gameTypeConfig || {})
        };
    }

    static setDebugMode(enabled) {
        this.debugMode = enabled;
        this.debugLog(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    static getGameTypeConfig(gameType) {
        return this.gameTypeConfig && this.gameTypeConfig[gameType];
    }

    static getAllGameTypes() {
        return this.gameTypeConfig || {};
    }
}

export default GameRegistry;
