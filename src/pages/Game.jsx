import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { initializeGame } from '../games/game';

const Game = () => {
    const gameRef = useRef(null);
    const phaserGameRef = useRef(null);

    useEffect(() => {
        // Phaserゲームの初期化
        if (gameRef.current && !phaserGameRef.current) {
            phaserGameRef.current = initializeGame(gameRef.current);
        }
        // クリーンアップ関数
        return () => {
            if (phaserGameRef.current) {
                phaserGameRef.current.destroy(true);
                phaserGameRef.current = null;
            }
        };
    }, []);

    return (
        <div>
            <div>
                <Link to="/">
                    <button>← ホームに戻る</button>
                </Link>
            </div>

            <div>
                <div ref={gameRef} style={{ border: '1px solid #ccc', borderRadius: '8px' }}>
                </div>
                <div>
                    <h3>操作方法</h3>
                    <p>矢印キーまたはWASDキーで移動</p>
                </div>
            </div>
        </div>
    );
};

export default Game;
