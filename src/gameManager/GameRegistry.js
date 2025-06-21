// src/gameManager/GameRegistry.js - 既存プロジェクト対応版
class GameRegistry {
    static games = new Map();
    static currentGameInstance = null;
    static debugMode = import.meta.env.DEV;
    static gameTypeConfig = null;

    static debugLog(message, data = null) {
        if (this.debugMode) {
            console.log(`[ゲームレジストリ] ${message}`, data || '');
        }
    }

    static errorLog(message, error = null) {
        console.error(`[ゲームレジストリ エラー] ${message}`, error || '');
    }

    static getStaticGameImports() {
        return {
            'escape': () => import('../games/escape/game.js'),
            'runner': () => import('../games/runner/game.js'),
            'story': () => import('../games/story/game.js'),
            'fishing': () => import('../games/fishing/game.js'),
            'vibration-hunt': () => import('../games/vibration-hunt/game.js'),
            // 新しいゲームを追加する場合はここに追加
        };
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

            this.debugLog(`ゲーム読み込み開始: ${gameId}`);

            // コンテナから既存のローディング要素のみを削除（Phaserのcanvasは保持）
            if (container) {
                // ローディング要素を選択的に削除
                const loadingElement = container.querySelector('.game-loading');
                if (loadingElement) {
                    loadingElement.remove();
                }

                // 以前のゲームのDOM要素を削除（fishing game特有）
                const existingTitleContainer = container.querySelector('.fishing-title-container');
                if (existingTitleContainer) {
                    existingTitleContainer.remove();
                }
            } else {
                this.errorLog('ゲーム読み込み用のコンテナが提供されていません');
                throw new Error('ゲームコンテナが提供されていません');
            }

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('ゲーム読み込みタイムアウト（30秒）')), 30000);
            });

            this.debugLog(`モジュール読み込み中: ${gameId}`);
            const gameModuleLoader = gameConfig.loader();

            // ローダー関数を実行して実際のモジュールを取得
            const gameModule = await Promise.race([
                gameModuleLoader(),
                timeoutPromise
            ]);

            this.debugLog(`モジュール読み込み完了: ${gameId}`, gameModule);

            if (!gameModule) {
                throw new Error(`モジュールが空です: ${gameId}`);
            }

            // 様々なエクスポート形式に対応
            let initializeGameFunction = null;

            // 1. named export: export const initializeGame
            if (typeof gameModule.initializeGame === 'function') {
                initializeGameFunction = gameModule.initializeGame;
                this.debugLog(`named exportでinitializeGameを発見: ${gameId}`);
            }
            // 2. default export: export default { initializeGame }
            else if (gameModule.default && typeof gameModule.default.initializeGame === 'function') {
                initializeGameFunction = gameModule.default.initializeGame;
                this.debugLog(`default export内でinitializeGameを発見: ${gameId}`);
            }
            // 3. default export: export default initializeGame
            else if (typeof gameModule.default === 'function') {
                initializeGameFunction = gameModule.default;
                this.debugLog(`default exportがfunctionです: ${gameId}`);
            }
            // 4. モジュール全体がfunctionの場合
            else if (typeof gameModule === 'function') {
                initializeGameFunction = gameModule;
                this.debugLog(`モジュール全体がfunctionです: ${gameId}`);
            }

            if (!initializeGameFunction) {
                this.errorLog(`initializeGame関数が見つかりません: ${gameId}`);
                this.errorLog(`モジュール内容:`, Object.keys(gameModule));
                if (gameModule.default) {
                    this.errorLog(`default export内容:`, Object.keys(gameModule.default));
                }
                throw new Error(`ゲームモジュールにinitializeGame関数がありません: ${gameId}`);
            }

            this.debugLog(`ゲーム初期化中: ${gameId}`);

            // ゲームを初期化
            const gameInstance = initializeGameFunction(container);

            if (!gameInstance) {
                throw new Error(`ゲームインスタンスの作成に失敗: ${gameId}`);
            }

            this.currentGameInstance = gameInstance;
            this.debugLog(`ゲーム読み込み成功: ${gameId}`);

            return gameInstance;
        } catch (error) {
            this.errorLog(`ゲーム読み込みに失敗 ${gameId}:`, {
                message: error.message,
                stack: error.stack,
                name: error.name
            });

            // エラー表示をコンテナに追加
            if (container) {
                container.innerHTML = `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        color: white;
                        background: #1a1a2e;
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    ">
                        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                        <h3 style="color: #ff6b6b; margin-bottom: 10px;">ゲームの読み込みに失敗しました</h3>
                        <p style="margin-bottom: 10px;">ゲーム: <strong>${gameId}</strong></p>
                        <p style="color: #ffa726; margin-bottom: 20px;">エラー: ${error.message}</p>
                        <button onclick="window.location.href='/'" style="
                            background: #4caf50;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                        ">ホームに戻る</button>
                    </div>
                `;
            }

            throw error;
        }
    }

    static cleanupCurrentGame() {
        if (this.currentGameInstance) {
            if (typeof this.currentGameInstance.destroy === 'function') {
                this.debugLog('ゲームインスタンスを破棄中');
                this.currentGameInstance.destroy(true);
            } else {
                this.debugLog('ゲームインスタンスにdestroyメソッドがありません');
            }
        }
        this.currentGameInstance = null;
    }

    static initializeFromJson(gamesData) {
        if (this.games.size > 0) {
            this.debugLog('ゲームレジストリは既に初期化済み');
            return;
        }

        if (!gamesData || !gamesData.games) {
            this.errorLog('ゲームデータが無効です');
            return;
        }

        // ゲームタイプ設定を保存
        this.gameTypeConfig = gamesData.gameTypes || {};
        this.debugLog('ゲームタイプ設定:', this.gameTypeConfig);

        // gamesDataの各ゲームを登録
        gamesData.games.forEach((gameData) => {
            if (gameData.gameType) {
                try {
                    this.register(gameData.gameType, {
                        title: gameData.title,
                        description: gameData.description || '',
                        category: gameData.category || 'other',
                        loader: () => this.getStaticGameLoader(gameData.gameType)
                    });
                } catch (error) {
                    this.errorLog(`ゲーム登録に失敗: ${gameData.gameType}`, error);
                }
            } else {
                this.errorLog(`ゲームにgameTypeがありません:`, gameData);
            }
        });
        const registeredGames = this.getAllGames();
        this.debugLog(`ゲーム登録完了: ${registeredGames.length}個のゲーム`);

    }

    // 静的インポートを使用するローダー（Vite対応）
    static getStaticGameLoader(gameType) {
        const staticImports = this.getStaticGameImports();

        if (staticImports[gameType]) {
            this.debugLog(`静的インポートを使用: ${gameType}`);
            return staticImports[gameType];
        }

        // 存在しないゲームの場合は警告を出す
        this.errorLog(`ゲーム "${gameType}" は静的インポートマップに存在しません`);
        this.errorLog('利用可能なゲーム:', Object.keys(staticImports));

        // フォールバック: JSON設定を確認
        const gameTypeInfo = this.gameTypeConfig && this.gameTypeConfig[gameType];
        if (gameTypeInfo && gameTypeInfo.modulePath) {
            this.debugLog(`JSON設定からモジュールパスを使用: ${gameTypeInfo.modulePath}`);
            this.debugLog(`警告: ${gameType} は静的インポートマップに追加することを推奨します`);
            return () => import(/* @vite-ignore */ gameTypeInfo.modulePath);
        }

        // 最終フォールバック: 従来の動的インポート（開発環境のみ）
        if (import.meta.env.DEV) {
            this.debugLog(`動的インポートを試行（開発環境）: ${gameType}`);
            this.debugLog(`警告: 本番環境では動作しない可能性があります`);
            return () => import(/* @vite-ignore */ `../games/${gameType}/game.js`);
        }

        // 本番環境では厳格にエラーを出す
        this.errorLog(`ゲームタイプ "${gameType}" が見つかりません`);
        this.errorLog('静的インポートマップに以下を追加してください:');
        this.errorLog(`'${gameType}': () => import('../games/${gameType}/game.js'),`);
        throw new Error(`ゲームタイプ "${gameType}" が見つかりません。静的インポートマップに追加してください`);
    }

    static isInitialized() {
        const initialized = this.games.size > 0;
        this.debugLog(`初期化状態: ${initialized}`);
        return initialized;
    }

    static addGame(gameData) {
        if (gameData.gameType) {
            this.register(gameData.gameType, {
                title: gameData.title,
                description: gameData.description || '',
                category: gameData.category || 'other',
                loader: () => this.getStaticGameLoader(gameData.gameType)
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

        this.debugLog(`ゲームタイプを追加: ${gameType}`, config);
    }

    static getDebugInfo() {
        return {
            gamesCount: this.games.size,
            registeredGames: Array.from(this.games.keys()),
            currentGame: this.currentGameInstance ? 'アクティブ' : 'なし',
            initialized: this.isInitialized(),
            gameTypes: Object.keys(this.gameTypeConfig || {}),
            staticImports: Object.keys(this.getStaticGameImports()),
            debugMode: this.debugMode
        };
    }

    static setDebugMode(enabled) {
        this.debugMode = enabled;
        this.debugLog(`デバッグモード: ${enabled ? '有効' : '無効'}`);
    }

    static getGameTypeConfig(gameType) {
        return this.gameTypeConfig && this.gameTypeConfig[gameType];
    }

    static getAllGameTypes() {
        return this.gameTypeConfig || {};
    }

    // 新しいゲームを静的インポートマップに追加するヘルパー
    static addStaticGameImport(gameType, importFunction) {
        // この関数は開発時にのみ使用し、実際のマップ更新は手動で行う
        this.debugLog(`静的インポート追加の提案: ${gameType}`);
        console.warn(`新しいゲーム "${gameType}" を追加するには、getStaticGameImports()メソッドに以下を追加してください:`);
        console.warn(`'${gameType}': () => import('../games/${gameType}/game.js'),`);
    }
}

export default GameRegistry;
