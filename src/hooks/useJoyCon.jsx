import { useState, useEffect, useCallback, useRef } from 'react';
import * as JoyCon from 'joy-con-webhid';

export const useJoyCon = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedControllers, setConnectedControllers] = useState([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [inputState, setInputState] = useState({
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0 },
        buttons: {},
        gyro: { x: 0, y: 0, z: 0 },
        accel: { x: 0, y: 0, z: 0 }
    });

    const intervalRef = useRef(null);
    const listenersRef = useRef(new Map());

    useEffect(() => {
        const checkSupport = () => {
            const supported = 'hid' in navigator;
            setIsSupported(supported);

            if (!supported) {
                setError('WebHID API is not supported in this browser');
            }
        };

        checkSupport();
    }, []);

    // Parse Joy-Con input data
    const parseInputData = useCallback((detail) => {
        const newInputState = {
            leftStick: {
                x: detail.analogStickLeft?.horizontal || 0,
                y: detail.analogStickLeft?.vertical || 0
            },
            rightStick: {
                x: detail.analogStickRight?.horizontal || 0,
                y: detail.analogStickRight?.vertical || 0
            },
            buttons: {
                // Face buttons
                a: detail.buttonA || false,
                b: detail.buttonB || false,
                x: detail.buttonX || false,
                y: detail.buttonY || false,

                // D-pad
                up: detail.dpadUp || false,
                down: detail.dpadDown || false,
                left: detail.dpadLeft || false,
                right: detail.dpadRight || false,

                // Shoulder buttons
                l: detail.buttonL || false,
                zl: detail.buttonZL || false,
                r: detail.buttonR || false,
                zr: detail.buttonZR || false,

                // System buttons
                plus: detail.buttonPlus || false,
                minus: detail.buttonMinus || false,
                home: detail.buttonHome || false,
                capture: detail.buttonCapture || false,

                // Stick buttons
                leftStickButton: detail.buttonStickL || false,
                rightStickButton: detail.buttonStickR || false
            },
            gyro: detail.gyroscope || { x: 0, y: 0, z: 0 },
            accel: detail.accelerometer || { x: 0, y: 0, z: 0 }
        };

        setInputState(newInputState);
        return newInputState;
    }, []);

    // Connect Joy-Con controllers
    const connectJoyCon = useCallback(async () => {
        if (!isSupported) {
            setError('WebHID API is not supported');
            return false;
        }

        setIsConnecting(true);
        setError(null);

        try {
            await JoyCon.connectJoyCon();
            setIsConnecting(false);
            return true;
        } catch (err) {
            console.error('Failed to connect Joy-Con:', err);
            setError(`Connection failed: ${err.message}`);
            setIsConnecting(false);
            return false;
        }
    }, [isSupported]);

    // Rumble function
    const rumble = useCallback(async (frequency = 320, amplitude = 0.5, duration = 200) => {
        try {
            for (const joyCon of JoyCon.connectedJoyCons.values()) {
                if (joyCon.device.opened) {
                    await joyCon.rumble(frequency, frequency, amplitude);

                    // Stop rumble after duration
                    if (duration > 0) {
                        setTimeout(async () => {
                            try {
                                await joyCon.rumble(0, 0, 0);
                            } catch (err) {
                                console.warn('Failed to stop rumble:', err);
                            }
                        }, duration);
                    }
                }
            }
        } catch (err) {
            console.error('Rumble failed:', err);
        }
    }, []);

    useEffect(() => {
        if (!isSupported) return;

        const startMonitoring = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(async () => {
                const controllers = [];
                let hasConnected = false;

                for (const joyCon of JoyCon.connectedJoyCons.values()) {
                    controllers.push({
                        id: joyCon.device.productId,
                        name: joyCon.device.productName,
                        side: joyCon.device.productName.includes('Left') ? 'left' : 'right',
                        connected: joyCon.device.opened
                    });

                    if (joyCon.eventListenerAttached) {
                        hasConnected = true;
                        continue;
                    }

                    try {
                        // Setup Joy-Con
                        await joyCon.open();
                        await joyCon.enableStandardFullMode();
                        await joyCon.enableIMUMode();
                        await joyCon.enableVibration();

                        // Get device info
                        const deviceInfo = await joyCon.getDeviceInfo();
                        console.log(`Connected ${joyCon.device.productName}:`, deviceInfo);

                        // Welcome rumble
                        await joyCon.rumble(600, 600, 0.3);
                        setTimeout(async () => {
                            try {
                                await joyCon.rumble(0, 0, 0);
                            } catch (err) {
                                console.warn('Failed to stop welcome rumble:', err);
                            }
                        }, 150);

                        // Setup input listener
                        const inputListener = ({ detail }) => {
                            parseInputData(detail);
                        };

                        joyCon.addEventListener('hidinput', inputListener);
                        listenersRef.current.set(joyCon.device.productId, inputListener);
                        joyCon.eventListenerAttached = true;
                        hasConnected = true;

                    } catch (err) {
                        console.error(`Failed to setup ${joyCon.device.productName}:`, err);
                    }
                }

                setConnectedControllers(controllers);
                setIsConnected(hasConnected);
            }, 2000);
        };

        startMonitoring();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            // Clean up listeners
            for (const [productId, listener] of listenersRef.current.entries()) {
                for (const joyCon of JoyCon.connectedJoyCons.values()) {
                    if (joyCon.device.productId === productId) {
                        joyCon.removeEventListener('hidinput', listener);
                        joyCon.eventListenerAttached = false;
                    }
                }
            }
            listenersRef.current.clear();
        };
    }, [isSupported, parseInputData]);

    return {
        isSupported,
        isConnected,
        isConnecting,
        connectedControllers,
        error,
        inputState,
        connectJoyCon,
        rumble
    };
};
