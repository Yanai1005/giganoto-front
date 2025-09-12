import { useState } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Monitor, Gamepad2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useJoyConCursor } from '../hooks/useJoyConCursor';
import JoyConConnection from '../components/JoyConConnection';
import HomeMenu from '../components/HomeMenu';

const Settings = () => {
    const { theme, changeTheme, toggleTheme, getThemeInfo } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('theme');

    // Joy-Conカーソル機能を有効化
    const {
        mousePosition,
        isClicking,
        isActive: isJoyConActive,
        cursorVisible
    } = useJoyConCursor({
        enabled: true,
        sensitivity: 0.8,
        deadzone: 0.05,
        showCursor: true,
        smoothing: 0.85,
        invertY: true
    });

    const settingsOptions = [
        {
            id: 'theme',
            title: 'テーマ設定',
            icon: theme === 'light' ? Sun : Moon,
            description: 'ダークモード・ライトモードの切り替え'
        },
        {
            id: 'joycon',
            title: 'Joy-Con設定',
            icon: Gamepad2,
            description: 'Joy-Conコントローラーの接続と設定'
        }
    ];

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    const ThemeSettings = () => {
        return (
            <div className="settings-detail-section">
                <div className="settings-main-content">
                    <div className="setting-header">
                        <h2>テーマ設定</h2>
                        <div className="theme-controls">
                            <div className="theme-toggle-group">
                                <button
                                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => changeTheme('light')}
                                    aria-label="ライトモードに切り替え"
                                >
                                    <Sun size={20} />
                                    <span>ライト</span>
                                </button>
                                <button
                                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => changeTheme('dark')}
                                    aria-label="ダークモードに切り替え"
                                >
                                    <Moon size={20} />
                                    <span>ダーク</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const JoyConSettings = () => {
        return (
            <div className="settings-detail-section">
                <div className="settings-main-content">
                    <div className="setting-header">
                        <h2>Joy-Con設定</h2>
                        <p className="setting-description">
                            Nintendo Switch Joy-Conコントローラーを接続して、カーソル操作を楽しめます。
                        </p>
                    </div>

                    <div className="joycon-settings-content">
                        <JoyConConnection />

                        {isJoyConActive && (
                            <div className="joycon-status-info">
                                <h3>接続状態</h3>
                                <div className="joycon-status-info__item">
                                    <span className="joycon-status-info__label">カーソル表示:</span>
                                    <span className={`joycon-status-info__value ${cursorVisible ? 'active' : 'inactive'
                                        }`}>
                                        {cursorVisible ? '表示中' : '非表示'}
                                    </span>
                                </div>
                                <div className="joycon-status-info__item">
                                    <span className="joycon-status-info__label">カーソル位置:</span>
                                    <span className="joycon-status-info__value">
                                        X: {Math.round(mousePosition.x)}, Y: {Math.round(mousePosition.y)}
                                    </span>
                                </div>
                                <div className="joycon-status-info__item">
                                    <span className="joycon-status-info__label">クリック状態:</span>
                                    <span className={`joycon-status-info__value ${isClicking ? 'active' : 'inactive'
                                        }`}>
                                        {isClicking ? 'クリック中' : '待機中'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="joycon-instructions">
                            <h3>操作方法</h3>
                            <div className="joycon-instructions__list">
                                <div className="joycon-instructions__item">
                                    <span className="joycon-instructions__button">左スティック</span>
                                    <span className="joycon-instructions__action">カーソル移動</span>
                                </div>
                                <div className="joycon-instructions__item">
                                    <span className="joycon-instructions__button">Aボタン</span>
                                    <span className="joycon-instructions__action">左クリック</span>
                                </div>
                                <div className="joycon-instructions__item">
                                    <span className="joycon-instructions__button">Bボタン</span>
                                    <span className="joycon-instructions__action">右クリック</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="switch-settings">
            <div className="settings-header">
                <SettingsIcon size={20} />
                <h1>設定</h1>
            </div>

            <div className="settings-content">
                <div className="settings-sidebar">
                    <div className="support-section">
                        <h3>サポート</h3>
                    </div>

                    {settingsOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                            <div
                                key={option.id}
                                className={`sidebar-item ${selectedCategory === option.id ? 'selected' : ''}`}
                                onClick={() => handleCategoryClick(option.id)}
                            >
                                <IconComponent size={20} />
                                <span>{option.title}</span>
                                <span className="submenu-arrow">›</span>
                            </div>
                        );
                    })}
                </div>

                <div className="settings-main">
                    {selectedCategory === 'theme' ? (
                        <ThemeSettings />
                    ) : selectedCategory === 'joycon' ? (
                        <JoyConSettings />
                    ) : (
                        <div className="placeholder-content">
                            <h2>設定項目を選択してください</h2>
                            <p>左側のメニューから設定したい項目を選択してください。</p>
                        </div>
                    )}
                </div>
            </div>
            <HomeMenu />
        </div>
    );
};

export default Settings;
