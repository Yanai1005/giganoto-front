import { useState, useEffect, useCallback } from 'react';

export const useBattery = () => {
    const [batteryInfo, setBatteryInfo] = useState({
        level: 0,
        charging: false,
        chargingTime: Infinity,
        dischargingTime: Infinity,
        supported: false,
        loading: true,
        error: null
    });

    const updateBatteryInfo = useCallback((battery) => {
        setBatteryInfo(prev => ({
            ...prev,
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            supported: true,
            loading: false,
            error: null
        }));
    }, []);

    const handleBatteryError = useCallback((error) => {
        console.warn('バッテリー情報の取得に失敗しました:', error);
        setBatteryInfo(prev => ({
            ...prev,
            level: 85,
            charging: false,
            chargingTime: Infinity,
            dischargingTime: Infinity,
            supported: false,
            loading: false,
            error: error.message || 'バッテリー情報を取得できませんでした'
        }));
    }, []);

    useEffect(() => {
        let cleanup = null;

        const initializeBattery = async () => {
            try {
                if ('getBattery' in navigator) {
                    const battery = await navigator.getBattery();

                    // 初期状態を設定
                    updateBatteryInfo(battery);

                    // イベントリスナーを設定
                    const handleChargingChange = () => updateBatteryInfo(battery);
                    const handleLevelChange = () => updateBatteryInfo(battery);
                    const handleChargingTimeChange = () => updateBatteryInfo(battery);
                    const handleDischargingTimeChange = () => updateBatteryInfo(battery);

                    battery.addEventListener('chargingchange', handleChargingChange);
                    battery.addEventListener('levelchange', handleLevelChange);
                    battery.addEventListener('chargingtimechange', handleChargingTimeChange);
                    battery.addEventListener('dischargingtimechange', handleDischargingTimeChange);

                    // クリーンアップ関数
                    cleanup = () => {
                        battery.removeEventListener('chargingchange', handleChargingChange);
                        battery.removeEventListener('levelchange', handleLevelChange);
                        battery.removeEventListener('chargingtimechange', handleChargingTimeChange);
                        battery.removeEventListener('dischargingtimechange', handleDischargingTimeChange);
                    };
                } else {
                    // Battery APIが利用できない場合
                    setBatteryInfo(prev => ({
                        ...prev,
                        level: 85,
                        charging: false,
                        chargingTime: Infinity,
                        dischargingTime: Infinity,
                        supported: false,
                        loading: false,
                        error: 'Battery API is not supported in this browser'
                    }));
                }
            } catch (error) {
                handleBatteryError(error);
            }
        };

        initializeBattery();

        return () => {
            if (cleanup && typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, [updateBatteryInfo, handleBatteryError]);

    const getBatteryClass = useCallback((level, charging) => {
        if (charging) return 'battery-icon--charging';
        if (level > 60) return 'battery-icon--high';
        if (level > 20) return 'battery-icon--medium';
        if (level > 10) return 'battery-icon--low';
        return 'battery-icon--critical';
    }, []);

    // 時間をフォーマット
    const formatBatteryTime = useCallback((seconds) => {
        if (seconds === Infinity || isNaN(seconds) || seconds <= 0) return null;

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}時間${minutes}分`;
        }
        return `${minutes}分`;
    }, []);

    const getBatteryTooltip = useCallback(() => {
        const { level, charging, chargingTime, dischargingTime } = batteryInfo;
        let tooltip = `バッテリー: ${level}%`;

        if (charging) {
            const timeText = formatBatteryTime(chargingTime);
            if (timeText) {
                tooltip += ` - 満充電まで${timeText}`;
            }
        } else {
            const timeText = formatBatteryTime(dischargingTime);
            if (timeText) {
                tooltip += ` - 残り${timeText}`;
            }
        }

        return tooltip;
    }, [batteryInfo, formatBatteryTime]);

    return {
        ...batteryInfo,
        getBatteryClass: (level = batteryInfo.level, charging = batteryInfo.charging) =>
            getBatteryClass(level, charging),
        formatBatteryTime,
        getBatteryTooltip
    };
};
