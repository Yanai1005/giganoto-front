import React, { useState } from 'react';
import { ArrowLeft, Wifi, Sun } from 'lucide-react';

const Settings = () => {
    const [selectedCategory, setSelectedCategory] = useState('internet');
    const [airplaneMode, setAirplaneMode] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('dark');

    const settingsOptions = [
        {
            id: 'internet',
            title: 'インターネット',
            icon: Wifi,
            description: 'ネットワーク接続の設定'
        },
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

    return (
        <div style={styles.container}>
            {/* ヘッダー */}
            <div style={styles.header}>
                <button style={styles.backButton}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={styles.title}>設定</h1>
            </div>

            {/* メインコンテンツ */}
            <div style={styles.content}>
                {/* 左側サイドバー */}
                <div style={styles.sidebar}>
                    <div style={styles.supportSection}>
                        <h3 style={styles.supportTitle}>サポート</h3>
                    </div>

                    {settingsOptions.map((option) => {
                        const IconComponent = option.icon;
                        const isSelected = selectedCategory === option.id;

                        return (
                            <div
                                key={option.id}
                                style={{
                                    ...styles.sidebarItem,
                                    ...(isSelected ? styles.sidebarItemSelected : {})
                                }}
                                onClick={() => handleCategoryClick(option.id)}
                            >
                                <IconComponent size={20} />
                                <span style={styles.sidebarItemText}>{option.title}</span>
                                <span style={styles.submenuArrow}>›</span>
                            </div>
                        );
                    })}
                </div>

                {/* 右側メインエリア */}
                <div style={styles.main}>
                    {selectedCategory === 'internet' && (
                        <div style={styles.settingContent}>
                            <div style={styles.settingHeader}>
                                <h2 style={styles.settingTitle}>機内モード</h2>
                                <div style={styles.toggleContainer}>
                                    <label style={styles.toggle}>
                                        <input
                                            type="checkbox"
                                            checked={airplaneMode}
                                            onChange={(e) => setAirplaneMode(e.target.checked)}
                                            style={styles.toggleInput}
                                        />
                                        <span style={{
                                            ...styles.toggleSlider,
                                            backgroundColor: airplaneMode ? '#1CBFDE' : 'rgba(255, 255, 255, 0.4)'
                                        }}>
                                            <span style={{
                                                ...styles.toggleButton,
                                                transform: airplaneMode ? 'translateX(24px)' : 'translateX(0)'
                                            }}></span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <div style={styles.description}>
                                <p style={styles.descriptionText}>Wi-FiやBluetoothなどの通信を切ります。</p>
                                <p style={styles.descriptionText}>機内モードにしたあと、一部の通信だけONにすることもできます。</p>
                                <p style={styles.noteText}>※ クイック設定（🏠長押し）でも変えられます。</p>
                            </div>
                        </div>
                    )}

                    {selectedCategory === 'theme' && (
                        <div style={styles.settingContent}>
                            <div style={styles.settingHeader}>
                                <h2 style={styles.settingTitle}>テーマ設定</h2>
                                <div style={styles.toggleContainer}>
                                    <label style={styles.toggle}>
                                        <input
                                            type="checkbox"
                                            checked={currentTheme === 'light'}
                                            onChange={(e) => setCurrentTheme(e.target.checked ? 'light' : 'dark')}
                                            style={styles.toggleInput}
                                        />
                                        <span style={{
                                            ...styles.toggleSlider,
                                            backgroundColor: currentTheme === 'light' ? '#1CBFDE' : 'rgba(255, 255, 255, 0.4)'
                                        }}>
                                            <span style={{
                                                ...styles.toggleButton,
                                                transform: currentTheme === 'light' ? 'translateX(24px)' : 'translateX(0)'
                                            }}></span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <div style={styles.description}>
                                <p style={styles.descriptionText}>ダークモードとライトモードを切り替えます。</p>
                                <p style={styles.descriptionText}>現在のテーマ: {currentTheme === 'dark' ? 'ダークモード' : 'ライトモード'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// インラインスタイル
const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#2D2D2D',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)'
    },
    backButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        padding: '0.5rem',
        marginRight: '1rem',
        cursor: 'pointer',
        borderRadius: '0.5rem'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 400,
        margin: 0
    },
    content: {
        display: 'flex',
        flex: 1
    },
    sidebar: {
        width: '350px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)'
    },
    supportSection: {
        padding: '1.5rem 2rem 1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    },
    supportTitle: {
        margin: 0,
        fontSize: '0.9rem',
        fontWeight: 400,
        color: '#AAAAAA'
    },
    sidebarItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '1rem 2rem',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        borderLeft: '3px solid transparent',
        transition: 'all 0.2s'
    },
    sidebarItemSelected: {
        background: 'rgba(28, 191, 222, 0.1)',
        borderLeftColor: '#1CBFDE'
    },
    sidebarItemText: {
        marginLeft: '1rem',
        flex: 1
    },
    submenuArrow: {
        color: '#AAAAAA',
        fontSize: '1.2rem',
        marginLeft: 'auto'
    },
    main: {
        flex: 1,
        position: 'relative'
    },
    settingContent: {
        padding: '3rem'
    },
    settingHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
    },
    settingTitle: {
        fontSize: '1.8rem',
        fontWeight: 400,
        margin: 0
    },
    toggleContainer: {
        position: 'relative'
    },
    toggle: {
        position: 'relative',
        display: 'inline-block',
        width: '54px',
        height: '30px'
    },
    toggleInput: {
        opacity: 0,
        width: 0,
        height: 0
    },
    toggleSlider: {
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transition: '0.4s',
        borderRadius: '30px',
        display: 'flex',
        alignItems: 'center'
    },
    toggleButton: {
        position: 'absolute',
        height: '22px',
        width: '22px',
        left: '4px',
        backgroundColor: 'white',
        transition: '0.4s',
        borderRadius: '50%'
    },
    description: {
        lineHeight: 1.6
    },
    descriptionText: {
        margin: '0 0 1rem 0',
        fontSize: '1rem',
        color: '#CCCCCC'
    },
    noteText: {
        color: '#999999',
        fontSize: '0.9rem',
        marginTop: '1.5rem',
        margin: '1.5rem 0 0 0'
    }
};

export default Settings;
