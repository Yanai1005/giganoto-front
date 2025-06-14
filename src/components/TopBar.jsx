import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useBattery, useTime, useWifi } from '../hooks';

const TopBar = ({ userProfile, onUserClick }) => {
    const batteryIconRef = useRef(null);

    const { currentTime, formatTime } = useTime();
    const {
        level: batteryLevel,
        charging,
        getBatteryClass,
        getBatteryTooltip,
        getBatteryStatusText,
        loading: batteryLoading,
        error: batteryError
    } = useBattery();
    const {
        strength: wifiStrength,
        getWifiClass,
        getConnectionDescription,
        isOnline
    } = useWifi();

    useEffect(() => {
        if (batteryIconRef.current && !batteryLoading) {
            const batteryWidth = `${Math.max(batteryLevel, 5)}%`;
            batteryIconRef.current.style.setProperty('--battery-width', batteryWidth);
        }
    }, [batteryLevel, batteryLoading]);

    const batteryClass = getBatteryClass();
    const wifiClass = getWifiClass();

    return (
        <div className="top-bar">
            <div className="top-bar__user-section">
                <button
                    className="user-avatar"
                    onClick={onUserClick}
                    aria-label={`ユーザープロフィール: ${userProfile?.username || 'Player'}`}
                >
                    {userProfile?.avatar || '👤'}
                </button>
                <div className="top-bar__home-indicator">HOME</div>
            </div>

            <div className="top-bar__status-section">
                <div className="top-bar__time">
                    {formatTime()}
                </div>

                <div
                    className={`wifi-icon ${wifiClass}`}
                    title={getConnectionDescription()}
                    aria-label={getConnectionDescription()}
                >
                    {isOnline ? '📶' : '📵'}
                </div>

                <div className="battery-container">
                    {batteryLoading ? (
                        <div className="battery-loading">
                            <div className="loading-spinner" />
                        </div>
                    ) : (
                        <>
                            <div className="battery-info">
                                <div className="battery-percentage">
                                    {batteryError ? '--' : `${batteryLevel}%`}
                                </div>
                                {getBatteryStatusText() && (
                                    <div className="battery-status">
                                        {getBatteryStatusText()}
                                    </div>
                                )}
                            </div>
                            <div
                                ref={batteryIconRef}
                                className={`battery-icon ${batteryClass}`}
                                title={getBatteryTooltip()}
                                aria-label={getBatteryTooltip()}
                            >
                                {charging && (
                                    <div className="battery-icon__charging-indicator">⚡</div>
                                )}
                                {batteryError && (
                                    <div className="battery-icon__error-indicator">❌</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

TopBar.propTypes = {
    userProfile: PropTypes.shape({
        username: PropTypes.string,
        avatar: PropTypes.string
    }),
    onUserClick: PropTypes.func
};

TopBar.defaultProps = {
    userProfile: {
        username: 'Player',
        avatar: '👤'
    },
    onUserClick: () => { }
};

export default TopBar;
