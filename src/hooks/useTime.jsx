import { useState, useEffect, useCallback } from 'react';

export const useTime = (updateInterval = 1000) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, updateInterval);

        return () => clearInterval(timer);
    }, [updateInterval]);

    const formatTime = useCallback((date = currentTime, options = {}) => {
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            ...options
        };

        return date.toLocaleTimeString('ja-JP', defaultOptions);
    }, [currentTime]);

    const formatDate = useCallback((date = currentTime, options = {}) => {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            ...options
        };

        return date.toLocaleDateString('ja-JP', defaultOptions);
    }, [currentTime]);

    const getISOString = useCallback((date = currentTime) => {
        return date.toISOString();
    }, [currentTime]);

    const getTimestamp = useCallback((date = currentTime) => {
        return date.getTime();
    }, [currentTime]);

    const getRelativeTime = useCallback((targetDate, baseDate = currentTime) => {
        const diffInSeconds = Math.floor((baseDate - targetDate) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds}秒前`;
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}分前`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}時間前`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}日前`;
        }
    }, [currentTime]);

    return {
        currentTime,
        formatTime,
        formatDate,
        getISOString,
        getTimestamp,
        getRelativeTime
    };
};
