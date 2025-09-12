import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import GameTile from '../components/GameTile';
import TopBar from '../components/TopBar';
import SystemMenu from '../components/SystemMenu';
import GameRegistry from '../gameManager/GameRegistry';
import gamesData from '../data/games.json';
import { useJoyConCursor } from '../hooks/useJoyConCursor';

const Home = () => {
    const navigate = useNavigate();
    const { theme, changeTheme } = useTheme();
    const [selectedGame, setSelectedGame] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [activeSystemIcon, setActiveSystemIcon] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // ゲームシステムの初期化
    useEffect(() => {
        GameRegistry.initializeFromJson(gamesData);
    }, []);

    // ロードアニメーション
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // キーボードナビゲーション
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showSettings) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    setSelectedGame(prev => Math.max(0, prev - 1));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    setSelectedGame(prev => Math.min(gamesData.games.length - 1, prev + 1));
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    handleGameSelect(gamesData.games[selectedGame]);
                    break;
                case 'Escape':
                    if (showSettings) {
                        setShowSettings(false);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedGame, showSettings]);

    const handleGameSelect = (game, index) => {
        if (typeof index === 'number') {
            setSelectedGame(index);
        }

        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            navigate(game.path, {
                state: {
                    gameType: game.gameType,
                    gameTitle: game.title
                }
            });
        }, 1000);
    };
    const handleCloseSettings = () => {
        setShowSettings(false);
    };

    const notifications = {};

    // Joy-Conカーソル機能を有効化（右Joy-ConのAボタンでクリック）
    const {
        mousePosition,
        isClicking,
        isActive: isJoyConActive,
        cursorVisible
    } = useJoyConCursor({
        enabled: true,
        sensitivity: 0.8,
        deadzone: 0.2,
        showCursor: true,
        smoothing: 0.85,
        invertY: true,
        useRightJoyConForClick: true  // 右Joy-ConのAボタンでクリック
    });

    return (
        <div className="switch-home">
            <TopBar />

            <main className={`game-grid ${isLoaded ? 'game-grid--loaded' : ''}`}>
                {gamesData.games.map((game, index) => (
                    <GameTile
                        key={game.id}
                        game={game}
                        selected={selectedGame === index}
                        onClick={(game) => handleGameSelect(game, index)}
                        loading={loading && selectedGame === index}
                    />
                ))}
            </main>

            {/* Joy-Con接続状態表示（接続済みの場合） */}
            {isJoyConActive && (
                <div className="joycon-status">
                    <div className="joycon-status__indicator">
                        <span className="joycon-status__icon">🎮</span>
                        <span className="joycon-status__text">Joy-Con接続中</span>
                    </div>
                    <div className="joycon-status__hint">
                        <span>左スティック: カーソル移動</span>
                        <span>右Joy-Con A: クリック</span>
                        <span>右Joy-Con B: 右クリック</span>
                    </div>
                </div>
            )}

            {/* キーボードヒント */}
            <div className="keyboard-hint">
                <div className="keyboard-hint__keys">
                    <span className="keyboard-hint__key">←</span>
                    <span className="keyboard-hint__key">→</span>
                    <span>ゲーム選択</span>
                    <span className="keyboard-hint__key">Enter</span>
                    <span>決定</span>
                </div>
            </div>

            <SystemMenu
                systemIcons={gamesData.systemIcons}
                activeIcon={activeSystemIcon}
                notifications={notifications}
            />

            {showSettings && (
                <>
                    <div
                        className="settings-backdrop"
                        onClick={handleCloseSettings}
                    />
                </>
            )}
        </div>
    );
};

export default Home;
