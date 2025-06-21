import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useJoyConContext } from '../contexts/JoyConContext';
import GameTile from '../components/GameTile';
import TopBar from '../components/TopBar';
import SystemMenu from '../components/SystemMenu';
import JoyConConnectionModal from '../components/JoyConConnectionModal';
import GameRegistry from '../gameManager/GameRegistry';
import { useJoyConNavigation } from '../hooks/useJoyConNavigation';
import gamesData from '../data/games.json';
import JoyConDebug from '../components/JoyConDebug';

const Home = () => {
    const navigate = useNavigate();
    const { theme, changeTheme } = useTheme();
    const { isSupported, isConnected, connectJoyCon, rumble } = useJoyConContext();

    const [selectedGame, setSelectedGame] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [activeSystemIcon, setActiveSystemIcon] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showJoyConModal, setShowJoyConModal] = useState(false);

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
        if (isConnected) {
            rumble(400, 0.6, 150);
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

    const navigateLeft = () => {
        setSelectedGame(prev => Math.max(0, prev - 1));
    };

    const navigateRight = () => {
        setSelectedGame(prev => Math.min(gamesData.games.length - 1, prev + 1));
    };

    const navigateUp = () => {
        const currentRow = Math.floor(selectedGame / 6);
        const currentCol = selectedGame % 6;
        if (currentRow > 0) {
            setSelectedGame((currentRow - 1) * 6 + currentCol);
        }
    };

    const navigateDown = () => {
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
        handleGameSelect(gamesData.games[selectedGame]);
    };

    const goToSettings = () => {
        if (isConnected) {
            rumble(300, 0.4, 100);
        }
        navigate('/settings');
    };

    const openJoyConModal = () => {
        setShowJoyConModal(true);
    };

    // Joy-Con navigation setup
    useJoyConNavigation({
        onUp: navigateUp,
        onDown: navigateDown,
        onLeft: navigateLeft,
        onRight: navigateRight,
        onSelect: selectGame,
        onBack: () => { },
        onHome: () => { },
        onMenu: goToSettings,
        enabled: !showJoyConModal && !showSettings
    });

    // キーボードナビゲーション (fallback)
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
                case 'Escape':
                    if (showSettings) {
                        setShowSettings(false);
                    } else if (showJoyConModal) {
                        setShowJoyConModal(false);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedGame, showSettings, showJoyConModal]);

    const handleCloseSettings = () => {
        setShowSettings(false);
    };

    const notifications = {};

    return (
        <div className="switch-home">
            <JoyConDebug />
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
                        selected={selectedGame === index}
                        onClick={(game) => handleGameSelect(game, index)}
                        loading={loading && selectedGame === index}
                    />
                ))}
            </main>

            {/* Control hints */}
            <div className="control-hints">
                <div className="control-hints__section">
                    {isConnected ? (
                        <div className="control-hints__joycon">
                            <span className="control-hints__status">🎮 Joy-Con接続済み</span>
                            <div className="control-hints__keys">
                                <span>左スティック/十字キー: 移動</span>
                                <span>Aボタン: 決定</span>
                                <span>+ボタン: 設定</span>
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

            {showJoyConModal && (
                <JoyConConnectionModal
                    onClose={() => setShowJoyConModal(false)}
                    onConnect={connectJoyCon}
                />
            )}

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
