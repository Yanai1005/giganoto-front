import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJoyConContext } from '../contexts/JoyConContext';
import GameTile from '../components/GameTile';
import TopBar from '../components/TopBar';
import SystemMenu from '../components/SystemMenu';
import JoyConConnectionModal from '../components/JoyConConnectionModal';
import JoyConDebug from '../components/JoyConDebug';
import ErrorBoundary from '../components/ErrorBoundary';
import JoyConCalibrationUI from '../components/JoyConCalibrationUI';
import GameRegistry from '../gameManager/GameRegistry';
import { useJoyConNavigation } from '../hooks/useJoyConNavigation';
import { useJoyConCursor } from '../hooks/useJoyConCursor';
import gamesData from '../data/games.json';

const Home = () => {
    const navigate = useNavigate();
    const { isSupported, isConnected, connectJoyCon, rumble } = useJoyConContext();

    const [selectedGame, setSelectedGame] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [activeSystemIcon, setActiveSystemIcon] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showJoyConModal, setShowJoyConModal] = useState(false);
    const [showCalibrationUI, setShowCalibrationUI] = useState(false);
    const [cursorMode, setCursorMode] = useState(false);
    const [isTogglingMode, setIsTogglingMode] = useState(false);

    const cursorControl = useJoyConCursor({
        enabled: isConnected && !showJoyConModal && !showSettings && !showCalibrationUI && cursorMode && !isTogglingMode,
        sensitivity: 0.8, // 1.2から0.8に下げてゆっくりとした操作に
        deadzone: 0.18, // 0.12から0.18に上げて安定性向上
        showCursor: cursorMode && !isTogglingMode,
        autoCalibrate: false,
        calibrationTime: 0
    });

    useEffect(() => {
        GameRegistry.initializeFromJson(gamesData);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (cursorMode && cursorControl && cursorControl.recalibrate) {
            const timer = setTimeout(() => {
                cursorControl.recalibrate();
                console.log('🎯 カーソルモード: 現在のスティック位置でキャリブレーション実行');
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [cursorMode, cursorControl]);

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

    const toggleCursorMode = () => {
        if (isTogglingMode) return;

        setIsTogglingMode(true);
        setCursorMode(prev => {
            const newMode = !prev;
            console.log(`モード切り替え: ${prev ? 'カーソル' : 'ナビ'} → ${newMode ? 'カーソル' : 'ナビ'}`);
            if (newMode) {
                console.log('カーソルモード開始: 強化キャリブレーション実行中...');
                setTimeout(() => {
                    if (cursorControl && cursorControl.recalibrate) {
                        cursorControl.recalibrate();
                        console.log('強化自動キャリブレーション実行完了');
                    }
                }, 200);
            } else {
                console.log('ナビゲーションモードに戻ります');
            }
            return newMode;
        });

        if (isConnected) {
            rumble(200, 0.3, 80);
        }

        setTimeout(() => {
            setIsTogglingMode(false);
        }, 500);
    };

    const openJoyConModal = () => {
        setShowJoyConModal(true);
    };

    useJoyConNavigation({
        onUp: !cursorMode && !isTogglingMode ? navigateUp : undefined,
        onDown: !cursorMode && !isTogglingMode ? navigateDown : undefined,
        onLeft: !cursorMode && !isTogglingMode ? navigateLeft : undefined,
        onRight: !cursorMode && !isTogglingMode ? navigateRight : undefined,
        onSelect: !cursorMode && !isTogglingMode ? selectGame : undefined,
        onBack: () => { },
        onHome: () => { },
        onMenu: goToSettings,
        onYButton: toggleCursorMode,
        enabled: !showJoyConModal && !showSettings && !showCalibrationUI
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showSettings || showJoyConModal || showCalibrationUI || isTogglingMode) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (!cursorMode) navigateLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (!cursorMode) navigateRight();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (!cursorMode) navigateUp();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (!cursorMode) navigateDown();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (!cursorMode) selectGame();
                    break;
                case 'y':
                case 'Y':
                    e.preventDefault();
                    toggleCursorMode();
                    break;
                case 'Escape':
                    if (showCalibrationUI) {
                        setShowCalibrationUI(false);
                    } else if (showSettings) {
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
    }, [selectedGame, showSettings, showJoyConModal, showCalibrationUI, cursorMode, isTogglingMode]);

    const handleCloseSettings = () => {
        setShowSettings(false);
    };

    const notifications = {};

    return (
        <ErrorBoundary showDetails={true}>
            <div className="switch-home">
                <ErrorBoundary>
                    <JoyConDebug />
                </ErrorBoundary>

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

                <div className="control-hints">
                    <div className="control-hints__section">
                        {isConnected ? (
                            <div className="control-hints__joycon">                                    <span className="control-hints__status">
                                🎮 Joy-Con接続済み {
                                    isTogglingMode ? '⏳ 切り替え中...' :
                                        cursorMode ? '🖱️ カーソルモード' : '🎯 ナビモード'
                                }
                            </span>
                                <div className="control-hints__keys">
                                    {!cursorMode && !isTogglingMode ? (
                                        <>
                                            <span>左スティック/十字キー: 移動</span>
                                            <span>Aボタン: 決定</span>
                                        </>
                                    ) : cursorMode && !isTogglingMode ? (
                                        <>
                                            <span>左スティック: カーソル移動</span>
                                            <span>Aボタン: クリック</span>
                                        </>
                                    ) : null}
                                    {!isTogglingMode && <span>Yボタン: モード切替</span>}
                                    <span>+ボタン: 設定</span>
                                    {cursorMode && !isTogglingMode && (
                                        <button
                                            onClick={() => setShowCalibrationUI(true)}
                                            style={{
                                                marginLeft: '10px',
                                                padding: '2px 8px',
                                                fontSize: '12px',
                                                background: cursorControl.isCalibrated ? '#28a745' : '#ffc107',
                                                color: cursorControl.isCalibrated ? 'white' : 'black',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {cursorControl.isCalibrated ? '⚙️ 再調整' : '🎯 要調整'}
                                        </button>
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
                                    <span>{cursorMode ? 'カーソル移動' : '移動'}</span>
                                    <span className="control-hints__key">Enter</span>
                                    <span>決定</span>
                                    <span className="control-hints__key">Y</span>
                                    <span>モード切替</span>
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

                {showCalibrationUI && (
                    <JoyConCalibrationUI
                        cursorControl={cursorControl}
                        onClose={() => setShowCalibrationUI(false)}
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
        </ErrorBoundary>
    );
};

export default Home;
