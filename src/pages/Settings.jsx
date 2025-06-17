import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Wifi,
    Monitor,
    Sun,
    Globe,
    Home
} from 'lucide-react';
import SettingsOverlay from '../components/SettingsOverlay';
import HomeMenu from '../components/HomeMenu';

const Settings = () => {
    const [selectedOption, setSelectedOption] = useState(0);
    const [theme, setTheme] = useState(() => {
        // 現在のテーマを取得
        const currentClass = document.body.className;
        return currentClass.includes('theme-light') ? 'light' : 'dark';
    });
    const [showInternetSettings, setShowInternetSettings] = useState(false);
    const [showThemeSettings, setShowThemeSettings] = useState(false);

    // 設定オプション（簡略化）
    const settingsOptions = [
        {
            id: 'internet',
            title: 'インターネット',
            icon: Wifi,
            description: 'ネットワーク接続の設定',
            selected: true
        },
        {
            id: 'theme',
            title: 'テーマ設定',
            icon: Sun,
            description: 'ダークモード・ライトモードの切り替え'
        }
    ];

    // キーボードナビゲーション
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showInternetSettings || showThemeSettings) return;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedOption(prev => Math.max(0, prev - 1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedOption(prev => Math.min(settingsOptions.length - 1, prev + 1));
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    handleOptionSelect(settingsOptions[selectedOption]);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedOption, showInternetSettings, showThemeSettings]);

    const handleOptionSelect = (option) => {
        console.log(`設定項目選択: ${option.title}`);

        if (option.id === 'internet') {
            setShowInternetSettings(true);
        } else if (option.id === 'theme') {
            setShowThemeSettings(true);
        }
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        document.body.className = `theme-${newTheme}`;
        setShowThemeSettings(false);
    };

    return (
        <div className="settings-page">

            <div className="settings-content">
                {/* サイドバー */}
                <div className="settings-sidebar">
                    {settingsOptions.map((option, index) => {
                        const IconComponent = option.icon;
                        const isSelected = selectedOption === index || option.selected;

                        return (
                            <div
                                key={option.id}
                                className={`settings-option ${isSelected ? 'settings-option--selected' : ''}`}
                                onClick={() => {
                                    setSelectedOption(index);
                                    handleOptionSelect(option);
                                }}
                            >
                                <IconComponent
                                    size={20}
                                    className="settings-option-icon"
                                />
                                <span className="settings-option-title">
                                    {option.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* メインコンテンツ */}
                <div className="settings-main">
                    {showInternetSettings ? (
                        <InternetSettings onBack={() => setShowInternetSettings(false)} />
                    ) : showThemeSettings ? (
                        <div className="theme-settings-overlay">
                            <SettingsOverlay
                                currentTheme={theme}
                                onThemeChange={handleThemeChange}
                                onClose={() => setShowThemeSettings(false)}
                            />
                        </div>
                    ) : (
                        <div className="settings-welcome">
                            <div className="settings-welcome-content">
                                <h2>設定項目を選択してください</h2>
                                <p>左側のメニューから設定したい項目を選択してください。</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* フッター */}
            <HomeMenu />
        </div>
    );
};

// インターネット設定コンポーネント
const InternetSettings = ({ onBack }) => {
    const [connectionStatus, setConnectionStatus] = useState('接続されていません');
    const [macAddress] = useState('C8-48-05-4A-53-67');

    return (
        <div className="internet-settings">
            <div className="internet-settings-header">
                <button onClick={onBack} className="back-button">
                    <ArrowLeft size={20} />
                </button>
                <h2>インターネット設定</h2>
            </div>
        </div>);
};

export default Settings;
