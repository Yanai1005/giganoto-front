import { useState, useEffect, useRef, useCallback } from 'react';
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

    // ゲームグリッドの参照
    const gameGridRef = useRef(null);
    const gameTileRefs = useRef([]);

    // Joy-Conカーソル機能を有効化
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
        useRightJoyConForClick: true
    });

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

    // Joy-Conカーソルでのゲーム選択とスクロール
    useEffect(() => {
        if (!isJoyConActive || !gameGridRef.current) return;

        const gameGrid = gameGridRef.current;
        const gameTiles = gameTileRefs.current;

        if (gameTiles.length === 0) return;

        // カーソル位置に基づいて最も近いゲームタイルを選択
        const findNearestGameTile = (cursorX, cursorY) => {
            let nearestIndex = 0;
            let minDistance = Infinity;

            gameTiles.forEach((tile, index) => {
                if (!tile) return;

                const rect = tile.getBoundingClientRect();
                const tileCenterX = rect.left + rect.width / 2;
                const tileCenterY = rect.top + rect.height / 2;

                const distance = Math.sqrt(
                    Math.pow(cursorX - tileCenterX, 2) + Math.pow(cursorY - tileCenterY, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            });

            return nearestIndex;
        };

        // カーソル位置から最も近いゲームタイルを選択
        const nearestGameIndex = findNearestGameTile(mousePosition.x, mousePosition.y);
        if (nearestGameIndex !== selectedGame) {
            setSelectedGame(nearestGameIndex);
        }

        // スクロール処理
        const scrollToGame = (gameIndex) => {
            const targetTile = gameTiles[gameIndex];
            if (!targetTile || !gameGrid) return;

            const gameGridRect = gameGrid.getBoundingClientRect();
            const targetTileRect = targetTile.getBoundingClientRect();

            // ターゲットタイルが画面内にない場合、スクロール
            if (targetTileRect.left < gameGridRect.left) {
                // 左にスクロール
                const scrollAmount = targetTileRect.left - gameGridRect.left - 50;
                gameGrid.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            } else if (targetTileRect.right > gameGridRect.right) {
                // 右にスクロール
                const scrollAmount = targetTileRect.right - gameGridRect.right + 50;
                gameGrid.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            }
        };

        // 選択されたゲームにスクロール
        scrollToGame(nearestGameIndex);

    }, [mousePosition, isJoyConActive, selectedGame]);

    // キーボードナビゲーション（Joy-Conが非アクティブな時のみ）
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showSettings || isJoyConActive) return;

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
    }, [selectedGame, showSettings, isJoyConActive]);

    // ゲーム選択時のスクロール処理
    const scrollToSelectedGame = useCallback((gameIndex) => {
        const targetTile = gameTileRefs.current[gameIndex];
        if (!targetTile || !gameGridRef.current) return;

        targetTile.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }, []);

    // 選択されたゲームが変更された時にスクロール
    useEffect(() => {
        if (!isJoyConActive) {
            scrollToSelectedGame(selectedGame);
        }
    }, [selectedGame, isJoyConActive, scrollToSelectedGame]);

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

    return (
        <div className="switch-home">
            <TopBar />

            <main
                ref={gameGridRef}
                className={`game-grid ${isLoaded ? 'game-grid--loaded' : ''}`}
            >
                {gamesData.games.map((game, index) => (
                    <GameTile
                        key={game.id}
                        ref={(el) => {
                            gameTileRefs.current[index] = el;
                        }}
                        game={game}
                        selected={selectedGame === index}
                        onClick={(game) => handleGameSelect(game, index)}
                        loading={loading && selectedGame === index}
                    />
                ))}
            </main>

            {/* キーボードヒント（Joy-Conが非アクティブな時のみ表示） */}
            {!isJoyConActive && (
                <div className="keyboard-hint">
                    <div className="keyboard-hint__keys">
                        <span className="keyboard-hint__key">←</span>
                        <span className="keyboard-hint__key">→</span>
                        <span>ゲーム選択</span>
                        <span className="keyboard-hint__key">Enter</span>
                        <span>決定</span>
                    </div>
                </div>
            )}

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
