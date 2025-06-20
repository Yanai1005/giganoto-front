import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import GameRegistry from '../gameManager/GameRegistry';
import HomeMenu from '../components/HomeMenu';

const Game = () => {
    const gameRef = useRef(null);
    const phaserGameRef = useRef(null);
    const location = useLocation();
    const [gameControls, setGameControls] = useState('');

    const gameType = location.state?.gameType;
    const gameTitle = location.state?.gameTitle;

    useEffect(() => {
        const loadGame = async () => {
            // ゲームレジストリを初期化
            if (!GameRegistry.isInitialized()) {
                const gamesData = await import('../data/games.json');
                GameRegistry.initializeFromJson(gamesData.default);
            }

            // ゲームタイプの操作方法を取得
            const gameTypeConfig = GameRegistry.getGameTypeConfig(gameType);
            const controls = gameTypeConfig?.controls || 'ゲームの操作方法をお楽しみください';
            setGameControls(controls);

            // ゲームを読み込み
            if (gameRef.current && !phaserGameRef.current) {
                try {
                    console.log(`Loading game: ${gameType}`);
                    console.log('Available games:', GameRegistry.getAllGames());

                    phaserGameRef.current = await GameRegistry.loadGame(gameType, gameRef.current);
                } catch (error) {
                    console.error('Failed to load game:', error);

                    // エラー表示
                    if (gameRef.current) {
                        gameRef.current.innerHTML = `
                            <div class="game-error">
                                <div class="game-error__icon">⚠️</div>
                                <h3 class="game-error__title">ゲームのロードに失敗しました</h3>
                                <p class="game-error__message">ゲーム: ${gameType}</p>
                                <p class="game-error__details">エラー: ${error.message}</p>
                            </div>
                        `;
                    }
                }
            }
        };

        loadGame();

        // クリーンアップ
        return () => {
            GameRegistry.cleanupCurrentGame();
            phaserGameRef.current = null;
        };
    }, [gameType]);

    return (
        <div className="switch-game">
            <div className="game-layout">
                <div className="game-sidebar">
                    <div className="game-info">
                        <h1 className="game-info__title">{gameTitle}</h1>
                        <div className="game-controls">
                            <h3 className="game-controls__title">操作方法</h3>
                            <p className="game-controls__text">
                                {gameControls}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="game-main">
                    <div
                        ref={gameRef}
                        id="game-container"
                        className="game-container"
                    >
                        <div className="game-loading">
                            <div className="game-loading__spinner"></div>
                            <div className="game-loading__text">ゲームをロード中...</div>
                        </div>
                    </div>
                </div>
            </div>

            <HomeMenu />
        </div>
    );
};

export default Game;
