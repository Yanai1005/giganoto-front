import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GameRegistry from '../gameManager/GameRegistry';

const Game = () => {
    const gameRef = useRef(null);
    const phaserGameRef = useRef(null);
    const location = useLocation();

    const gameType = location.state?.gameType || 'platformer';
    const gameTitle = location.state?.gameTitle || 'Game';

    useEffect(() => {
        const loadGame = async () => {
            // ゲームレジストリを初期化（まだ初期化されていない場合）
            if (!GameRegistry.isInitialized()) {
                // gamesDataをインポートして初期化
                const gamesData = await import('../data/games.json');
                GameRegistry.initializeFromJson(gamesData.default);
            }

            if (gameRef.current && !phaserGameRef.current) {
                try {
                    console.log(`Loading game: ${gameType}`);
                    console.log('Available games:', GameRegistry.getAllGames());

                    phaserGameRef.current = await GameRegistry.loadGame(gameType, gameRef.current);
                } catch (error) {
                    console.error('Failed to load game:', error);

                    // エラー表示をユーザーに
                    if (gameRef.current) {
                        gameRef.current.innerHTML = `
                            <div style="
                                padding: 40px; 
                                text-align: center; 
                                color: #e74c3c;
                                background: #2c3e50;
                                border-radius: 8px;
                                font-family: Arial, sans-serif;
                            ">
                                <h3>ゲームのロードに失敗しました</h3>
                                <p>ゲーム: ${gameType}</p>
                                <p>エラー: ${error.message}</p>
                            </div>
                        `;
                    }
                }
            }
        };

        loadGame();

        // クリーンアップ関数
        return () => {
            GameRegistry.cleanupCurrentGame();
            phaserGameRef.current = null;
        };
    }, [gameType]);

    return (
        <div style={{
            padding: '20px',
            backgroundColor: '#2c3e50',
            minHeight: '100vh',
            color: 'white'
        }}>
            <div style={{ marginBottom: '20px' }}>
                <Link to="/">
                    <button style={{
                        padding: '10px 20px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}>
                        ← ホームに戻る
                    </button>
                </Link>
                <h2 style={{ margin: '10px 0', fontSize: '24px' }}>{gameTitle}</h2>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div
                    ref={gameRef}
                    style={{
                        border: '2px solid #34495e',
                        borderRadius: '8px',
                        backgroundColor: '#34495e',
                        minHeight: '400px',
                        minWidth: '600px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div style={{ color: '#bdc3c7' }}>ゲームをロード中...</div>
                </div>

                <div style={{
                    backgroundColor: '#34495e',
                    padding: '15px',
                    borderRadius: '8px',
                    maxWidth: '600px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#ecf0f1' }}>操作方法</h3>
                    {gameType === 'platformer' ? (
                        <p style={{ margin: 0, color: '#bdc3c7' }}>
                            矢印キーまたはWASDキーで移動・ジャンプ
                        </p>
                    ) : gameType === 'puzzle' ? (
                        <p style={{ margin: 0, color: '#bdc3c7' }}>
                            クリックでタイル選択、隣接タイルとスワップして3つ以上揃えよう
                        </p>
                    ) : (
                        <p style={{ margin: 0, color: '#bdc3c7' }}>
                            ゲームの操作方法をお楽しみください
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Game;
