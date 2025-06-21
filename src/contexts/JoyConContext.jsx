import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as JoyCon from 'joy-con-webhid';

const JoyConContext = createContext();

export const useJoyConContext = () => {
    const context = useContext(JoyConContext);
    if (!context) {
        throw new Error('useJoyConContext must be used within a JoyConProvider');
    }
    return context;
};

export const JoyConProvider = ({ children }) => {
    const [isSupported, setIsSupported] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedControllers, setConnectedControllers] = useState([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [rawInputData, setRawInputData] = useState(null);
    const [inputState, setInputState] = useState({
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0 },
        buttons: {},
        gyro: { x: 0, y: 0, z: 0 },
        accel: { x: 0, y: 0, z: 0 }
    });

    const intervalRef = useRef(null);
    const listenersRef = useRef(new Map());
    const inputCallbacksRef = useRef(new Set());
    const isInitializedRef = useRef(false);

    // Check WebHID support
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
        try {
            setRawInputData(detail);
            console.log('Raw Joy-Con input data:', detail);

            // buttonStatusオブジェクトからボタン状態を取得
            const buttonStatus = detail.buttonStatus || {};

            const newInputState = {
                leftStick: {
                    x: parseFloat(detail.analogStickLeft?.horizontal) || 0,
                    y: parseFloat(detail.analogStickLeft?.vertical) || 0
                },
                rightStick: {
                    x: parseFloat(detail.analogStickRight?.horizontal) || 0,
                    y: parseFloat(detail.analogStickRight?.vertical) || 0
                },
                buttons: {
                    // buttonStatusから直接取得
                    a: buttonStatus.a || false,
                    b: buttonStatus.b || false,
                    x: buttonStatus.x || false,
                    y: buttonStatus.y || false,

                    // D-pad
                    up: buttonStatus.up || false,
                    down: buttonStatus.down || false,
                    left: buttonStatus.left || false,
                    right: buttonStatus.right || false,

                    // ショルダーボタン
                    l: buttonStatus.l || false,
                    zl: buttonStatus.zl || false,
                    r: buttonStatus.r || false,
                    zr: buttonStatus.zr || false,

                    // システムボタン
                    plus: buttonStatus.plus || false,
                    minus: buttonStatus.minus || false,
                    home: buttonStatus.home || false,
                    capture: buttonStatus.capture || false,

                    // スティックボタン
                    leftStickButton: buttonStatus.leftStick || buttonStatus.leftStickButton || false,
                    rightStickButton: buttonStatus.rightStick || buttonStatus.rightStickButton || false,

                    // 他の可能なボタン名もチェック
                    sl: buttonStatus.sl || false,
                    sr: buttonStatus.sr || false
                },
                gyro: detail.actualGyroscope?.dps || detail.gyroscope || { x: 0, y: 0, z: 0 },
                accel: detail.actualAccelerometer || detail.accelerometer || { x: 0, y: 0, z: 0 }
            };
            console.log('buttonStatus object:', buttonStatus);

            const pressedButtons = Object.entries(newInputState.buttons)
                .filter(([_, pressed]) => pressed)
                .map(([button, _]) => button);

            if (pressedButtons.length > 0) {
                console.log('Pressed buttons:', pressedButtons);
            }

            if (Math.abs(newInputState.leftStick.x) > 0.1 || Math.abs(newInputState.leftStick.y) > 0.1) {
                console.log('Left stick:', newInputState.leftStick);
            }

            setInputState(newInputState);

            inputCallbacksRef.current.forEach(callback => {
                try {
                    requestAnimationFrame(() => {
                        try {
                            callback(newInputState);
                        } catch (err) {
                            console.error('Error in Joy-Con input callback:', err);
                        }
                    });
                } catch (err) {
                    console.error('Error scheduling Joy-Con input callback:', err);
                }
            });

            return newInputState;
        } catch (error) {
            console.error('Error parsing Joy-Con input data:', error);
            console.error('Raw detail object:', detail);
            return null;
        }
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

    // Dummy rumble function (disabled)
    const rumble = useCallback(async (frequency = 320, amplitude = 0.5, duration = 200) => {
        console.log('Rumble disabled');
        // 振動は無効化
        return Promise.resolve();
    }, []);

    // Register input callback
    const registerInputCallback = useCallback((callback) => {
        if (typeof callback !== 'function') {
            console.error('Input callback must be a function');
            return () => { };
        }

        inputCallbacksRef.current.add(callback);

        return () => {
            inputCallbacksRef.current.delete(callback);
        };
    }, []);

    // Safe setup function for Joy-Con (without vibration)
    const setupJoyCon = useCallback(async (joyCon) => {
        try {
            console.log(`Setting up ${joyCon.device.productName}...`);

            if (!joyCon.device.opened) {
                await joyCon.open();
            }

            const setupTasks = [
                {
                    name: 'enableStandardFullMode',
                    task: () => joyCon.enableStandardFullMode?.()
                },
                {
                    name: 'enableIMUMode',
                    task: () => joyCon.enableIMUMode?.()
                }
                // enableVibrationを削除
            ];

            for (const { name, task } of setupTasks) {
                try {
                    if (task && typeof task === 'function') {
                        await task();
                        console.log(`✅ ${name} enabled`);
                    } else {
                        console.log(`⚠️ ${name} not available`);
                    }
                } catch (err) {
                    console.warn(`❌ ${name} failed:`, err.message);
                }
            }

            let deviceInfo = {
                type: joyCon.device.productName,
                productId: joyCon.device.productId,
                vendorId: joyCon.device.vendorId,
                opened: joyCon.device.opened
            };

            try {
                if (typeof joyCon.getDeviceInfo === 'function') {
                    const extendedInfo = await joyCon.getDeviceInfo();
                    deviceInfo = { ...deviceInfo, ...extendedInfo };
                }
            } catch (infoError) {
                console.warn(`Could not get extended device info: ${infoError.message}`);
            }

            console.log(`Successfully connected ${joyCon.device.productName}:`, deviceInfo);

            // Welcome rumble削除
            console.log('Setup completed without vibration');

            return true;
        } catch (error) {
            console.error(`Failed to setup ${joyCon.device.productName}:`, error);
            throw error;
        }
    }, []);

    // Initialize Joy-Con monitoring
    useEffect(() => {
        if (!isSupported || isInitializedRef.current) return;

        isInitializedRef.current = true;

        const startMonitoring = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(async () => {
                try {
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
                            await setupJoyCon(joyCon);

                            const inputListener = (event) => {
                                try {
                                    console.log('Raw event received:', event);
                                    if (event && event.detail) {
                                        console.log('Event detail:', event.detail);
                                        parseInputData(event.detail);
                                    } else {
                                        console.warn('Invalid event structure:', event);
                                    }
                                } catch (err) {
                                    console.error('Error in input listener:', err);
                                }
                            };

                            try {
                                joyCon.addEventListener('hidinput', inputListener);
                                listenersRef.current.set(joyCon.device.productId, {
                                    listener: inputListener,
                                    joyCon: joyCon
                                });
                                joyCon.eventListenerAttached = true;
                                hasConnected = true;
                                console.log(`Event listener attached to ${joyCon.device.productName}`);
                            } catch (listenerError) {
                                console.error('Failed to attach event listener:', listenerError);
                            }

                        } catch (err) {
                            console.error(`Failed to setup ${joyCon.device.productName}:`, err);
                        }
                    }

                    setConnectedControllers(controllers);
                    setIsConnected(hasConnected);
                } catch (err) {
                    console.error('Error in monitoring loop:', err);
                }
            }, 2000);
        };

        startMonitoring();

        return () => {
            isInitializedRef.current = false;

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            for (const [productId, { listener, joyCon }] of listenersRef.current.entries()) {
                try {
                    if (joyCon && typeof joyCon.removeEventListener === 'function') {
                        joyCon.removeEventListener('hidinput', listener);
                        joyCon.eventListenerAttached = false;
                    }
                } catch (err) {
                    console.warn(`Error removing event listener for product ${productId}:`, err);
                }
            }

            listenersRef.current.clear();
            inputCallbacksRef.current.clear();
        };
    }, [isSupported, parseInputData, setupJoyCon]);

    const value = {
        isSupported,
        isConnected,
        isConnecting,
        connectedControllers,
        error,
        inputState,
        rawInputData,
        connectJoyCon,
        rumble,
        registerInputCallback
    };

    return (
        <JoyConContext.Provider value={value}>
            {children}
        </JoyConContext.Provider>
    );
};
