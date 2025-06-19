import { useState } from 'react';
import { Settings as SettingsIcon, Sun } from 'lucide-react';
import HomeMenu from '../components/HomeMenu';

const Settings = () => {
    const [selectedCategory, setSelectedCategory] = useState('internet');
    const [airplaneMode, setAirplaneMode] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('dark');

    const settingsOptions = [
        {
            id: 'theme',
            title: 'テーマ設定',
            icon: Sun,
            description: 'ダークモード・ライトモードの切り替え'
        }
    ];

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    const ThemeSettings = () => (
        <div className="settings-detail-section">
            <div className="settings-main-content">
                <div className="setting-header">
                    <h2>テーマ設定</h2>
                    <div className="toggle-switch-container">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={currentTheme === 'light'}
                                onChange={(e) => setCurrentTheme(e.target.checked ? 'light' : 'dark')}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div className="setting-description-block">
                    <p>ダークモードとライトモードを切り替えます。</p>
                    <p>現在のテーマ: {currentTheme === 'dark' ? 'ダークモード' : 'ライトモード'}</p>
                </div>
            </div>
        </div>
    );

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
