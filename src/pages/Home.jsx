import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameTile from '../components/GameTile';
import TopBar from '../components/TopBar';
import SystemMenu from '../components/SystemMenu';
import SettingsOverlay from '../components/SettingsOverlay';
import GameRegistry from '../gameManager/GameRegistry';
import gamesData from '../data/games.json';

const Home = () => {
    const navigate = useNavigate();
    const [selectedGame, setSelectedGame] = useState(0);
    const [theme, setTheme] = useState('dark');
    const [showSettings, setShowSettings] = useState(false);
    const [activeSystemIcon, setActiveSystemIcon] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // ゲームシステムの初期化
    useEffect(() => {
        GameRegistry.initializeFromJson(gamesData);
    }, []);

    useEffect(() => {
        document.body.className = `theme-${theme}`;
    }, [theme]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

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

    const handleSystemIconClick = (icon) => {
        setActiveSystemIcon(icon.id);

        switch (icon.id) {
            case 'settings':
                setShowSettings(!showSettings);
                break;
            default:
                console.log(`${icon.title}を起動`);
                break;
        }
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        setShowSettings(false);
    };

    const handleUserClick = () => {
        console.log('ユーザープロフィール表示');
    };

    const handleCloseSettings = () => {
        setShowSettings(false);
    };

    const notifications = {};

    return (
        <div className="switch-home">
            <TopBar
                userProfile={gamesData.userProfile}
                onUserClick={handleUserClick}
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
                onIconClick={handleSystemIconClick}
                notifications={notifications}
            />

            {showSettings && (
                <>
                    <SettingsOverlay
                        currentTheme={theme}
                        onThemeChange={handleThemeChange}
                        onClose={handleCloseSettings}
                    />
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
