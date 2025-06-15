import PropTypes from 'prop-types';

const SettingsOverlay = ({ currentTheme, onThemeChange, onClose }) => {
    const handleThemeToggle = () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        onThemeChange(newTheme);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div
            className="settings-overlay"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="dialog"
            aria-label="設定メニュー"
        >
            <div className="settings-overlay__title">設定</div>

            <div className="settings-overlay__item">
                <div className="settings-overlay__label">テーマ</div>
                <button
                    className={`theme-toggle theme-toggle--${currentTheme}`}
                    onClick={handleThemeToggle}
                    aria-label={`現在: ${currentTheme === 'dark' ? 'ダーク' : 'ライト'}テーマ`}
                >
                    {currentTheme === 'dark' ? 'ライト' : 'ダーク'}
                </button>
            </div>
        </div>
    );
};

SettingsOverlay.propTypes = {
    currentTheme: PropTypes.oneOf(['light', 'dark']).isRequired,
    onThemeChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

export default SettingsOverlay;
