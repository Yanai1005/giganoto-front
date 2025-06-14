import { useState, useEffect, useCallback } from 'react';

export const useWifi = () => {
    const [networkInfo, setNetworkInfo] = useState({
        isOnline: navigator.onLine,
        connectionType: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
        strength: 75,
        supported: false
    });

    const updateNetworkInfo = useCallback(() => {
        const connection = navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection;

        if (connection) {
            setNetworkInfo(prev => ({
                ...prev,
                isOnline: navigator.onLine,
                connectionType: connection.type || connection.effectiveType || 'unknown',
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
                saveData: connection.saveData || false,
                strength: calculateSignalStrength(connection),
                supported: true
            }));
        } else {
            setNetworkInfo(prev => ({
                ...prev,
                isOnline: navigator.onLine,
                strength: navigator.onLine ? 75 : 0,
                supported: false
            }));
        }
    }, []);

    const calculateSignalStrength = useCallback((connection) => {
        if (!connection) return 0;

        const { effectiveType, downlink, rtt } = connection;

        let baseStrength = 0;
        switch (effectiveType) {
            case '4g':
                baseStrength = 90;
                break;
            case '3g':
                baseStrength = 70;
                break;
            case '2g':
                baseStrength = 40;
                break;
            case 'slow-2g':
                baseStrength = 20;
                break;
            default:
                baseStrength = 50;
        }

        if (downlink && downlink > 10) {
            baseStrength = Math.min(100, baseStrength + 10);
        } else if (downlink && downlink < 1) {
            baseStrength = Math.max(0, baseStrength - 20);
        }

        if (rtt && rtt < 50) {
            baseStrength = Math.min(100, baseStrength + 5);
        } else if (rtt && rtt > 300) {
            baseStrength = Math.max(0, baseStrength - 15);
        }

        return Math.max(0, Math.min(100, baseStrength));
    }, []);

    useEffect(() => {
        updateNetworkInfo();

        const handleOnline = () => updateNetworkInfo();
        const handleOffline = () => updateNetworkInfo();
        const handleConnectionChange = () => updateNetworkInfo();

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const connection = navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection;

        if (connection) {
            connection.addEventListener('change', handleConnectionChange);
        }

        const intervalId = setInterval(updateNetworkInfo, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);

            if (connection) {
                connection.removeEventListener('change', handleConnectionChange);
            }

            clearInterval(intervalId);
        };
    }, [updateNetworkInfo]);

    const getWifiClass = useCallback((strength = networkInfo.strength) => {
        if (!networkInfo.isOnline) return 'wifi-icon--disconnected';
        if (strength > 70) return 'wifi-icon--strong';
        if (strength > 40) return 'wifi-icon--medium';
        if (strength > 10) return 'wifi-icon--weak';
        return 'wifi-icon--disconnected';
    }, [networkInfo.isOnline, networkInfo.strength]);

    const getConnectionDescription = useCallback(() => {
        if (!networkInfo.isOnline) {
            return 'インターネットに接続されていません';
        }

        const { connectionType, effectiveType, downlink } = networkInfo;

        let description = '接続中';
        if (effectiveType && effectiveType !== 'unknown') {
            description += ` (${effectiveType.toUpperCase()})`;
        } else if (connectionType && connectionType !== 'unknown') {
            description += ` (${connectionType})`;
        }

        if (downlink && downlink > 0) {
            description += ` - ${downlink} Mbps`;
        }

        return description;
    }, [networkInfo]);

    const isDataSaverEnabled = useCallback(() => {
        return networkInfo.saveData;
    }, [networkInfo.saveData]);

    const isSlowConnection = useCallback(() => {
        return networkInfo.effectiveType === 'slow-2g' ||
            networkInfo.effectiveType === '2g' ||
            (networkInfo.downlink && networkInfo.downlink < 1);
    }, [networkInfo.effectiveType, networkInfo.downlink]);

    return {
        ...networkInfo,
        getWifiClass,
        getConnectionDescription,
        isDataSaverEnabled,
        isSlowConnection,
        refresh: updateNetworkInfo
    };
};
