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

    static getStaticGameImports() {
        // 静的インポートマップ（Viteでのバンドル時に正しいパスが解決される）
        return {
            'escape': () => import('../games/escape/game.js'),
            'runner': () => import('../games/runner/game.js'),
            'story': () => import('../games/story/game.js'),
            'fishing': () => import('../games/fishing/game.js'),
            'vibration-hunt': () => import('../games/vibration-hunt/game.js'),
            'dev-detective': () => import('../games/dev-detective/game.js'),
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

            // コンテナを完全にクリア（Canvas要素の重複を防ぐため）
            if (container) {
                // まず既存のCanvas要素を全て削除
                this.removeAllCanvasElements();
                // コンテナ内容をクリア
                container.innerHTML = '';
                // 少し待機してからゲーム初期化（非同期処理の競合を防ぐ）
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                this.errorLog('ゲーム読み込み用のコンテナが提供されていません');
                throw new Error('ゲームコンテナが提供されていません');
            }

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('ゲーム読み込みタイムアウト（30秒）')), 30000);
            });

            this.debugLog(`モジュール読み込み中: ${gameId}`);

            // ローダーの詳細をログ出力
            const loader = gameConfig.loader();
            this.debugLog(`ローダー取得: ${gameId}`, typeof loader);

            const gameModule = await Promise.race([
                loader,
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

            // ゲーム初期化前にもう一度Canvas要素をチェック
            const preInitCanvases = document.querySelectorAll('canvas');
            if (preInitCanvases.length > 0) {
                this.debugLog(`警告: 初期化前に${preInitCanvases.length}個のCanvas要素が存在します。削除中...`);
                this.removeAllCanvasElements();
            }

            // ゲームを初期化
            const gameInstance = initializeGameFunction(container);

            if (!gameInstance) {
                throw new Error(`ゲームインスタンスの作成に失敗: ${gameId}`);
            }

            // 初期化後のCanvas要素数をチェック
            const postInitCanvases = document.querySelectorAll('canvas');
            this.debugLog(`ゲーム初期化後のCanvas要素数: ${postInitCanvases.length}`);

            if (postInitCanvases.length > 1) {
                this.errorLog(`警告: ${postInitCanvases.length}個のCanvas要素が生成されました。1個のみであるべきです。`);
                // 最初のCanvas以外を削除
                for (let i = 1; i < postInitCanvases.length; i++) {
                    this.debugLog(`余分なCanvas要素を削除: ${i + 1}個目`);
                    postInitCanvases[i].remove();
                }
            }

            this.currentGameInstance = gameInstance;
            this.debugLog(`ゲーム読み込み成功: ${gameId}`);

            return gameInstance;
        } catch (error) {
            this.errorLog(`ゲーム読み込みに失敗 ${gameId}:`, {
                message: error.message,
                stack: error.stack,
                name: error.name,
                gameConfig: gameConfig ? { title: gameConfig.title, id: gameConfig.id } : 'なし'
            });

            // モジュール読み込みエラーの場合の詳細情報
            if (error.message.includes('Failed to fetch dynamically imported module')) {
                this.errorLog('動的インポートエラーの詳細:', {
                    gameType: gameId,
                    availableStaticImports: Object.keys(this.getStaticGameImports()),
                    gameTypeConfig: this.gameTypeConfig && this.gameTypeConfig[gameId]
                });
            }

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
            try {
                if (typeof this.currentGameInstance.destroy === 'function') {
                    this.debugLog('ゲームインスタンスを破棄中');
                    this.currentGameInstance.destroy(true);
                } else {
                    this.debugLog('ゲームインスタンスにdestroyメソッドがありません');
                }
            } catch (error) {
                this.errorLog('ゲーム破棄中にエラーが発生:', error);
            }
        }

        // より積極的にCanvas要素を削除
        this.removeAllCanvasElements();
        this.currentGameInstance = null;
    }

    static removeAllCanvasElements() {
        try {
            // ページ上の全てのCanvas要素を削除
            const canvasElements = document.querySelectorAll('canvas');
            this.debugLog(`Canvas要素を${canvasElements.length}個発見`);

            canvasElements.forEach((canvas, index) => {
                this.debugLog(`Canvas要素を削除中 ${index + 1}/${canvasElements.length}`, {
                    id: canvas.id || 'unnamed',
                    className: canvas.className || 'no-class',
                    parentId: canvas.parentElement?.id || 'no-parent-id',
                    parentClass: canvas.parentElement?.className || 'no-parent-class'
                });
                canvas.remove();
            });

            // WebGLコンテキストもクリーンアップ
            this.cleanupWebGLContexts();

        } catch (error) {
            this.errorLog('Canvas削除中にエラーが発生:', error);
        }
    }

    static cleanupWebGLContexts() {
        try {
            // WebGLコンテキストの強制クリーンアップ
            if (window.PIXI && window.PIXI.utils) {
                window.PIXI.utils.destroyTextureCache();
            }

            // Phaserのグローバルクリーンアップ
            if (window.Phaser && window.Phaser.GameObjects) {
                // Phaserのテクスチャキャッシュをクリア
                const textureManager = window.Phaser.Textures?.TextureManager;
                if (textureManager && textureManager.prototype.destroy) {
                    this.debugLog('Phaserテクスチャキャッシュをクリア中');
                }
            }
        } catch (error) {
            this.errorLog('WebGLコンテキストクリーンアップ中にエラー:', error);
        }
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
                        loader: () => this.getDynamicLoader(gameData.gameType)
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

    // JSON設定に基づくローダー（静的インポート優先版）
    static getDynamicLoader(gameType) {
        // まず静的インポートマップを確認
        const staticImports = this.getStaticGameImports();
        if (staticImports[gameType]) {
            this.debugLog(`静的インポートを使用: ${gameType}`);
            return staticImports[gameType]();
        }

        // JSONの gameTypes 設定を確認
        const gameTypeInfo = this.gameTypeConfig && this.gameTypeConfig[gameType];
        if (gameTypeInfo && gameTypeInfo.modulePath) {
            // パスを正しく解決（GameRegistry.jsの位置を基準に）
            let resolvedPath = gameTypeInfo.modulePath;

            // '../games/'で始まる場合は、現在のファイル位置を考慮
            if (resolvedPath.startsWith('../games/')) {
                // GameRegistry.jsは src/gameManager/ にあるので、../games/ は src/games/ になる
                resolvedPath = resolvedPath.replace('../games/', 'src/games/');
            }

            this.debugLog(`JSON設定からモジュールパスを使用: ${resolvedPath}`);
            return import(/* @vite-ignore */ resolvedPath);
        }

        // フォールバック：直接的なパス指定
        const fallbackPath = `../games/${gameType}/game.js`;
        this.debugLog(`フォールバックパスを使用: ${fallbackPath}`);
        return import(/* @vite-ignore */ fallbackPath);
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

        this.debugLog(`ゲームタイプを追加: ${gameType}`, config);
    }

    static getDebugInfo() {
        return {
            gamesCount: this.games.size,
            registeredGames: Array.from(this.games.keys()),
            currentGame: this.currentGameInstance ? 'アクティブ' : 'なし',
            initialized: this.isInitialized(),
            gameTypes: Object.keys(this.gameTypeConfig || {}),
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
}

export default GameRegistry;
