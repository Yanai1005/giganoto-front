import { useState } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import HomeMenu from '../components/HomeMenu';

const Settings = () => {
    const { theme, changeTheme, toggleTheme, getThemeInfo } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('theme');

    const settingsOptions = [
        {
            id: 'theme',
            title: 'テーマ設定',
            icon: theme === 'light' ? Sun : Moon,
            description: 'ダークモード・ライトモードの切り替え'
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
