import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const TopBar = ({ userProfile, onUserClick }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [batteryLevel] = useState(85);
    const [wifiStrength] = useState(75);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const getBatteryClass = (level) => {
        if (level > 60) return 'battery-icon--high';
        if (level > 20) return 'battery-icon--medium';
        if (level > 10) return 'battery-icon--low';
        return 'battery-icon--critical';
    };

    const getWifiClass = (strength) => {
        if (strength > 70) return 'wifi-icon--strong';
        if (strength > 40) return 'wifi-icon--medium';
        if (strength > 10) return 'wifi-icon--weak';
        return 'wifi-icon--disconnected';
    };

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
                <div className="top-bar__time">{formatTime(currentTime)}</div>
                <div
                    className={`wifi-icon ${getWifiClass(wifiStrength)}`}
                    title={`Wi-Fi強度: ${wifiStrength}%`}
                />
                <div
                    className={`battery-icon ${getBatteryClass(batteryLevel)}`}
                    title={`バッテリー: ${batteryLevel}%`}
                />
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
