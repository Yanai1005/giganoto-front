import { useState, useEffect } from 'react';
import GameTile from './GameTile';
import TopBar from './TopBar';
import SystemMenu from './SystemMenu';
import SettingsOverlay from './SettingsOverlay';

import gamesData from '../../data/games.json';

const SwitchHome = () => {
    const [selectedGame, setSelectedGame] = useState(0);
    const [theme, setTheme] = useState('dark');
    const [showSettings, setShowSettings] = useState(false);
    const [activeSystemIcon, setActiveSystemIcon] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.body.className = `theme-${theme}`;
    }, [theme]);

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
            console.log(`ゲーム選択: ${game.title}`);
        }, 1000);
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

    const notifications = {
    };

    return (
        <div className="switch-home">
            <TopBar
                userProfile={gamesData.userProfile}
                onUserClick={handleUserClick}
            />

            <main className="game-grid">
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

            <SystemMenu
                systemIcons={gamesData.systemIcons}
                activeIcon={activeSystemIcon}
                onIconClick={handleSystemIconClick}
                notifications={notifications}
            />

            {showSettings && (
                <SettingsOverlay
                    currentTheme={theme}
                    onThemeChange={handleThemeChange}
                    onClose={handleCloseSettings}
                />
            )}
            {showSettings && (
                <div
                    className="settings-backdrop"
                    onClick={handleCloseSettings}
                />
            )}
        </div>
    );
};

export default SwitchHome;
