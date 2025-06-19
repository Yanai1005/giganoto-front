import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    THEME_COLORS,
    THEME_CONFIG,
    CSS_VARIABLES,
    META_SELECTORS
} from '../constants/themeConstants';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    return context;
};

export const ThemeProvider = ({ children }) => {
    const getInitialTheme = () => {
        try {
            const savedTheme = localStorage.getItem(THEME_CONFIG.storageKey);
            return savedTheme && THEME_CONFIG.availableThemes.includes(savedTheme)
                ? savedTheme
                : THEME_CONFIG.defaultTheme;
        } catch (error) {
            console.warn('テーマの読み込みに失敗しました:', error);
            return THEME_CONFIG.defaultTheme;
        }
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.body.className = `theme-${theme}`;

        try {
            localStorage.setItem(THEME_CONFIG.storageKey, theme);
        } catch (error) {
            console.warn('テーマの保存に失敗しました:', error);
        }
        updateSystemColors(theme);
    }, [theme]);

    const updateSystemColors = (currentTheme) => {
        const metaThemeColor = document.querySelector(META_SELECTORS.themeColor);
        const metaMSAppTileColor = document.querySelector(META_SELECTORS.msAppTileColor);
        const themeColors = THEME_COLORS[currentTheme];

        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColors.metaThemeColor);
        }
        if (metaMSAppTileColor) {
            metaMSAppTileColor.setAttribute('content', themeColors.metaTileColor);
        }

        document.documentElement.style.setProperty(CSS_VARIABLES.systemUiBg, themeColors.background);
        document.documentElement.style.setProperty(CSS_VARIABLES.systemUiText, themeColors.text);
    };
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const changeTheme = (newTheme) => {
        if (THEME_CONFIG.availableThemes.includes(newTheme)) {
            setTheme(newTheme);
        } else {
            console.warn(`無効なテーマです: ${newTheme}。利用可能なテーマ: ${THEME_CONFIG.availableThemes.join(', ')}`);
        }
    };

    const getSystemTheme = () => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    };

    const useSystemTheme = () => {
        const systemTheme = getSystemTheme();
        changeTheme(systemTheme);
    };
    const getThemeInfo = () => {
        const systemTheme = getSystemTheme();
        return {
            current: theme,
            system: systemTheme,
            isSystemTheme: theme === systemTheme,
            available: THEME_CONFIG.availableThemes
        };
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleSystemThemeChange = (e) => {
                const newTheme = e.matches ? 'ダーク' : 'ライト';
                console.log(`システムテーマが変更されました: ${newTheme}モード`);
            };

            mediaQuery.addEventListener('change', handleSystemThemeChange);

            return () => {
                mediaQuery.removeEventListener('change', handleSystemThemeChange);
            };
        }
    }, []);

    const value = {
        theme,
        toggleTheme,
        changeTheme,
        useSystemTheme,
        getThemeInfo,
        isDark: theme === 'dark',
        isLight: theme === 'light'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default ThemeContext;
