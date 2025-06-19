import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    return context;
};

export const ThemeProvider = ({ children }) => {
    const getInitialTheme = () => {
        try {
            const savedTheme = localStorage.getItem('nintendo-switch-theme');
            return savedTheme && ['light', 'dark'].includes(savedTheme) ? savedTheme : 'dark';
        } catch (error) {
            console.warn('Failed to load theme from localStorage:', error);
            return 'dark';
        }
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.body.className = `theme-${theme}`;

        try {
            localStorage.setItem('nintendo-switch-theme', theme);
        } catch (error) {
            console.warn('Failed to save theme to localStorage:', error);
        }
        updateSystemColors(theme);
    }, [theme]);

    const updateSystemColors = (currentTheme) => {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const metaMSAppTileColor = document.querySelector('meta[name="msapplication-TileColor"]');

        if (currentTheme === 'light') {
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', '#F0F0F0');
            }
            if (metaMSAppTileColor) {
                metaMSAppTileColor.setAttribute('content', '#E70009');
            }

            document.documentElement.style.setProperty('--system-ui-bg', '#F0F0F0');
            document.documentElement.style.setProperty('--system-ui-text', '#000000');
        } else {
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', '#2D2D2D');
            }
            if (metaMSAppTileColor) {
                metaMSAppTileColor.setAttribute('content', '#1CBFDE');
            }
            document.documentElement.style.setProperty('--system-ui-bg', '#2D2D2D');
            document.documentElement.style.setProperty('--system-ui-text', '#FFFFFF');
        }
    };
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const changeTheme = (newTheme) => {
        if (['light', 'dark'].includes(newTheme)) {
            setTheme(newTheme);
        } else {
            console.warn(`Invalid theme: ${newTheme}. Use 'light' or 'dark'.`);
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
            available: ['light', 'dark']
        };
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleSystemThemeChange = (e) => {
                console.log('System theme changed to:', e.matches ? 'dark' : 'light');
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
