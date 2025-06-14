import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh, Zap, User } from 'lucide-react';
import { useBattery, useTime, useWifi } from '../hooks';

const TopBar = ({ onUserClick }) => {
    const batteryIconRef = useRef(null);

    // カスタムフックを使用
    const { currentTime, formatTime } = useTime();
    const {
        level: batteryLevel,
        charging,
        getBatteryClass,
        getBatteryTooltip,
        loading: batteryLoading,
        error: batteryError
    } = useBattery();
    const {
        strength: wifiStrength,
        getWifiClass,
        getConnectionDescription,
        isOnline
    } = useWifi();

    // バッテリー表示の動的更新
    useEffect(() => {
        if (batteryIconRef.current && !batteryLoading) {
            const batteryWidth = `${Math.max(batteryLevel, 5)}%`;
            batteryIconRef.current.style.setProperty('--battery-width', batteryWidth);
        }
    }, [batteryLevel, batteryLoading]);

    // Wi-Fiアイコンを強度に応じて選択
    const getWifiIcon = () => {
        const iconProps = {
            size: 18,
            className: 'wifi-icon__svg'
        };

        if (!isOnline) {
            return <WifiOff {...iconProps} />;
        }

        if (wifiStrength > 70) {
            return <Wifi {...iconProps} />;
        } else if (wifiStrength > 40) {
            return <SignalHigh {...iconProps} />;
        } else if (wifiStrength > 20) {
            return <SignalMedium {...iconProps} />;
        } else if (wifiStrength > 10) {
            return <SignalLow {...iconProps} />;
        } else {
            return <WifiOff {...iconProps} />;
        }
    };

    // バッテリーの状態に応じたスタイルクラス
    const batteryClass = getBatteryClass();
    const wifiClass = getWifiClass();

    return (
        <div className="top-bar">
            <div className="top-bar__user-section">
                <button
                    className="user-avatar"
                    onClick={onUserClick}
                    aria-label="ユーザープロフィール"
                >
                    <User size={20} />
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
                    {getWifiIcon()}
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
                            </div>
                            <div
                                ref={batteryIconRef}
                                className={`battery-icon ${batteryClass}`}
                                title={getBatteryTooltip()}
                                aria-label={getBatteryTooltip()}
                            >
                                {charging && (
                                    <div className="battery-icon__charging-indicator">
                                        <Zap size={14} />
                                    </div>
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
    onUserClick: PropTypes.func
};

TopBar.defaultProps = {
    onUserClick: () => { }
};

export default TopBar;
