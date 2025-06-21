import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useJoyConContext } from '../contexts/JoyConContext';
import GameTile from '../components/GameTile';
import TopBar from '../components/TopBar';
import SystemMenu from '../components/SystemMenu';
import JoyConConnectionModal from '../components/JoyConConnectionModal';
import SimpleJoyConCursor from '../components/JoyConCursor';
import GameRegistry from '../gameManager/GameRegistry';
import { useJoyConNavigation } from '../hooks/useJoyConNavigation';
import gamesData from '../data/games.json';

const Home = () => {
    const navigate = useNavigate();
    const { isSupported, isConnected, connectJoyCon } = useJoyConContext();

    const [selectedGame, setSelectedGame] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [activeSystemIcon, setActiveSystemIcon] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showJoyConModal, setShowJoyConModal] = useState(false);
    const [mouseControlMode, setMouseControlMode] = useState(false); // マウス制御モード

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

    // Navigation handlers
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

    // Grid navigation functions (マウス制御モード時は無効)
    const navigateLeft = () => {
        if (mouseControlMode) return;
        setSelectedGame(prev => Math.max(0, prev - 1));
    };

    const navigateRight = () => {
        if (mouseControlMode) return;
        setSelectedGame(prev => Math.min(gamesData.games.length - 1, prev + 1));
    };

    const navigateUp = () => {
        if (mouseControlMode) return;
        const currentRow = Math.floor(selectedGame / 6);
        const currentCol = selectedGame % 6;
        if (currentRow > 0) {
            setSelectedGame((currentRow - 1) * 6 + currentCol);
        }
    };

    const navigateDown = () => {
        if (mouseControlMode) return;
        const currentRow = Math.floor(selectedGame / 6);
        const currentCol = selectedGame % 6;
        const maxRow = Math.floor((gamesData.games.length - 1) / 6);
        if (currentRow < maxRow) {
            const newIndex = (currentRow + 1) * 6 + currentCol;
            if (newIndex < gamesData.games.length) {
                setSelectedGame(newIndex);
            }
        }
    };

    const selectGame = () => {
        if (mouseControlMode) return;
        handleGameSelect(gamesData.games[selectedGame]);
    };

    const goToSettings = () => {
        navigate('/settings');
    };

    const openJoyConModal = () => {
        setShowJoyConModal(true);
    };

    // マウス制御モードの切り替え
    const toggleMouseControlMode = () => {
        setMouseControlMode(prev => !prev);
    };

    // Joy-Con navigation setup (マウス制御モード時は無効)
    useJoyConNavigation({
        onUp: navigateUp,
        onDown: navigateDown,
        onLeft: navigateLeft,
        onRight: navigateRight,
        onSelect: selectGame,
        onBack: () => { },
        onHome: () => { },
        onMenu: goToSettings,
        onYButton: toggleMouseControlMode, // Yボタンでマウス制御切り替え
        enabled: !showJoyConModal && !showSettings && !mouseControlMode
    });

    // キーボードナビゲーション
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showSettings || showJoyConModal) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    navigateLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    navigateRight();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    navigateUp();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    navigateDown();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    selectGame();
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    toggleMouseControlMode();
                    break;
                case 'Escape':
                    if (showSettings) {
                        setShowSettings(false);
                    } else if (showJoyConModal) {
                        setShowJoyConModal(false);
                    } else if (mouseControlMode) {
                        setMouseControlMode(false);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedGame, showSettings, showJoyConModal, mouseControlMode]);

    const handleCloseSettings = () => {
        setShowSettings(false);
    };

    const notifications = {};

    return (
        <div className="switch-home">
            <TopBar
                onUserClick={openJoyConModal}
                showJoyConStatus={true}
                isJoyConConnected={isConnected}
            />

            <main className={`game-grid ${isLoaded ? 'game-grid--loaded' : ''}`}>
                {gamesData.games.map((game, index) => (
                    <GameTile
                        key={game.id}
                        game={game}
                        selected={!mouseControlMode && selectedGame === index}
                        onClick={(game) => handleGameSelect(game, index)}
                        loading={loading && selectedGame === index}
                        className="mouse-clickable" // マウスクリック対応
                    />
                ))}
            </main>

            {/* Control hints */}
            <div className="control-hints">
                <div className="control-hints__section">
                    {isConnected ? (
                        <div className="control-hints__joycon">
                            <span className="control-hints__status">
                                🎮 Joy-Con接続済み {mouseControlMode ? '(マウス制御モード)' : '(グリッドモード)'}
                            </span>
                            <div className="control-hints__keys">
                                {mouseControlMode ? (
                                    <>
                                        <span>左スティック: マウス移動</span>
                                        <span>Aボタン: 左クリック</span>
                                        <span>Bボタン: 右クリック</span>
                                        <span>Xボタン: ダブルクリック</span>
                                        <span>Yボタン: グリッドモード</span>
                                    </>
                                ) : (
                                    <>
                                        <span>左スティック/十字キー: 移動</span>
                                        <span>Aボタン: 決定</span>
                                        <span>Yボタン: マウス制御モード</span>
                                        <span>+ボタン: 設定</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="control-hints__keyboard">
                            <div className="control-hints__keys">
                                <span className="control-hints__key">←</span>
                                <span className="control-hints__key">→</span>
                                <span className="control-hints__key">↑</span>
                                <span className="control-hints__key">↓</span>
                                <span>移動</span>
                                <span className="control-hints__key">Enter</span>
                                <span>決定</span>
                                <span className="control-hints__key">M</span>
                                <span>マウス制御モード</span>
                            </div>
                            {isSupported && (
                                <button
                                    className="joycon-connect-hint"
                                    onClick={openJoyConModal}
                                >
                                    🎮 Joy-Conを接続
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <SystemMenu
                systemIcons={gamesData.systemIcons}
                activeIcon={activeSystemIcon}
                notifications={notifications}
            />

            {/* Joy-Con マウス制御カーソル */}
            <SimpleJoyConCursor
                enabled={mouseControlMode && isConnected}
                sensitivity={0.3}
                showVisualCursor={true}
                showDebugInfo={true}
            />

            {/* マウス制御モード表示 */}
            {mouseControlMode && isConnected && (
                <div className="mouse-control-hint">
                    マウス制御モード - 左スティックでマウス移動、Aボタンでクリック
                </div>
            )}

            {/* Joy-Con接続モーダル */}
            {showJoyConModal && (
                <JoyConConnectionModal
                    onClose={() => setShowJoyConModal(false)}
                    onConnect={connectJoyCon}
                />
            )}

            {/* 設定バックドロップ */}
            {showSettings && (
                <div
                    className="settings-backdrop"
                    onClick={handleCloseSettings}
                />
            )}

            <style jsx>{`
                .mouse-control-hint {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-size: 13px;
                    z-index: 9999;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(46, 213, 115, 0.3);
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                }
            `}</style>
        </div>
    );
};

export default Home;
