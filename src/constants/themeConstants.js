export const THEME_COLORS = {
    light: {
        background: '#F0F0F0',
        text: '#000000',
        metaThemeColor: '#F0F0F0',
        metaTileColor: '#E70009',
    },
    dark: {
        background: '#2D2D2D',
        text: '#FFFFFF',
        metaThemeColor: '#2D2D2D',
        metaTileColor: '#1CBFDE',
    }
};

export const THEME_CONFIG = {
    availableThemes: ['light', 'dark'],
    defaultTheme: 'dark',
    storageKey: 'nintendo-switch-theme',
};

export const CSS_VARIABLES = {
    systemUiBg: '--system-ui-bg',
    systemUiText: '--system-ui-text',
};

export const META_SELECTORS = {
    themeColor: 'meta[name="theme-color"]',
    msAppTileColor: 'meta[name="msapplication-TileColor"]',
};
