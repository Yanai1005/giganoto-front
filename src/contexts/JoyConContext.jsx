import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as JoyCon from 'joy-con-webhid';

const JoyConContext = createContext();

function useJoyConContext() {
    const context = useContext(JoyConContext);
    if (!context) {
        throw new Error('useJoyConContext must be used within a JoyConProvider');
    }
    return context;
}

function JoyConProvider({ children }) {
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

    const STICK_CONSTANTS = {
        MIN_RAW: 0,
        MAX_RAW: 4095,
        CENTER_RAW: 2047.5,
        DEADZONE_RAW: 100,
        OUTPUT_MIN: -1.0,
        OUTPUT_MAX: 1.0,
        calibration: {
            leftStick: { centerX: 2047.5, centerY: 2047.5, rangeX: 1800, rangeY: 1800 },
            rightStick: { centerX: 2047.5, centerY: 2047.5, rangeX: 1800, rangeY: 1800 }
        }
    };
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

    const convertStickValue = useCallback((rawValue, center, range, stickName, axis) => {
        if (typeof rawValue === 'number' && Math.abs(rawValue) <= 3.0) {
            console.log(`⚠️ ${stickName} ${axis}: 既に正規化済みの値を検出`, rawValue);

            let normalizedValue = rawValue;

            if (Math.abs(normalizedValue) < 0.05) {
                normalizedValue = 0;
            }

            normalizedValue = Math.max(-1.0, Math.min(1.0, normalizedValue));

            return normalizedValue;
        }

        if (typeof rawValue === 'number' && rawValue >= 0 && rawValue <= 4095) {
            console.log(`🔧 ${stickName} ${axis}: 12bit変換`, {
                raw: rawValue,
                center: center,
                range: range
            });

            const delta = rawValue - center;

            if (Math.abs(delta) < STICK_CONSTANTS.DEADZONE_RAW) {
                return 0;
            }

            const normalized = delta / range;

            return Math.max(-1.0, Math.min(1.0, normalized));
        }

        console.warn(`❓ ${stickName} ${axis}: 不明なデータ形式`, rawValue, typeof rawValue);
        return 0;
    }, []);

    const parseInputData = useCallback((detail) => {
        try {
            setRawInputData(detail);

            console.log('🔍 完全なRAWデータ:', {
                analogStickLeft: detail.analogStickLeft,
                analogStickRight: detail.analogStickRight,
                detail: detail
            });

            const buttonStatus = detail.buttonStatus || {};

            const parseStickInput = (stickData, stickName) => {
                if (!stickData) {
                    return { x: 0, y: 0 };
                }

                console.log(`🎮 ${stickName} RAWデータ:`, stickData);

                let rawX = 0, rawY = 0;

                const xProps = ['x', 'horizontal', 'h', 'X'];
                const yProps = ['y', 'vertical', 'v', 'Y'];

                for (const prop of xProps) {
                    if (stickData[prop] !== undefined && stickData[prop] !== null) {
                        rawX = stickData[prop];
                        console.log(`✅ ${stickName} X値発見: ${prop} = ${rawX} (型: ${typeof rawX})`);
                        break;
                    }
                }

                for (const prop of yProps) {
                    if (stickData[prop] !== undefined && stickData[prop] !== null) {
                        rawY = stickData[prop];
                        console.log(`✅ ${stickName} Y値発見: ${prop} = ${rawY} (型: ${typeof rawY})`);
                        break;
                    }
                }

                rawX = parseFloat(rawX) || 0;
                rawY = parseFloat(rawY) || 0;

                console.log(`📊 ${stickName} 変換前:`, { rawX, rawY });

                const isLeftStick = stickName === 'leftStick';
                const calibration = STICK_CONSTANTS.calibration[stickName];

                let x = convertStickValue(rawX, calibration.centerX, calibration.rangeX, stickName, 'X');
                let y = convertStickValue(rawY, calibration.centerY, calibration.rangeY, stickName, 'Y');

                if (isLeftStick) {
                    y = -y;
                }

                console.log(`🎯 ${stickName} 最終結果:`, { x: x.toFixed(3), y: y.toFixed(3) });

                return { x, y };
            };

            const newInputState = {
                leftStick: parseStickInput(detail.analogStickLeft, 'leftStick'),
                rightStick: parseStickInput(detail.analogStickRight, 'rightStick'),
                buttons: {
                    a: buttonStatus.a || false,
                    b: buttonStatus.b || false,
                    x: buttonStatus.x || false,
                    y: buttonStatus.y || false,
                    up: buttonStatus.up || false,
                    down: buttonStatus.down || false,
                    left: buttonStatus.left || false,
                    right: buttonStatus.right || false,
                    l: buttonStatus.l || false,
                    zl: buttonStatus.zl || false,
                    r: buttonStatus.r || false,
                    zr: buttonStatus.zr || false,
                    plus: buttonStatus.plus || false,
                    minus: buttonStatus.minus || false,
                    home: buttonStatus.home || false,
                    capture: buttonStatus.capture || false,
                    leftStickButton: buttonStatus.leftStick || buttonStatus.leftStickButton || false,
                    rightStickButton: buttonStatus.rightStick || buttonStatus.rightStickButton || false,
                    sl: buttonStatus.sl || false,
                    sr: buttonStatus.sr || false
                },
                gyro: detail.actualGyroscope?.dps || detail.gyroscope || { x: 0, y: 0, z: 0 },
                accel: detail.actualAccelerometer || detail.accelerometer || { x: 0, y: 0, z: 0 }
            };

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
            return null;
        }
    }, [convertStickValue]);

    const updateCalibration = useCallback((stickName, centerX, centerY, rangeX, rangeY) => {
        STICK_CONSTANTS.calibration[stickName] = {
            centerX: centerX || STICK_CONSTANTS.CENTER_RAW,
            centerY: centerY || STICK_CONSTANTS.CENTER_RAW,
            rangeX: rangeX || 1800,
            rangeY: rangeY || 1800
        };

        console.log(`🎯 ${stickName} 較正更新:`, STICK_CONSTANTS.calibration[stickName]);
    }, []);

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

    const rumble = useCallback(async (frequency = 320, amplitude = 0.5, duration = 200) => {
        console.log('Rumble disabled');
        return Promise.resolve();
    }, []);

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
            return true;
        } catch (error) {
            console.error(`Failed to setup ${joyCon.device.productName}:`, error);
            throw error;
        }
    }, []);

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
                                    if (event && event.detail) {
                                        parseInputData(event.detail);
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
        registerInputCallback,
        updateCalibration,
        stickConstants: STICK_CONSTANTS
    };

    return (
        <JoyConContext.Provider value={value}>
            {children}
        </JoyConContext.Provider>
    );
}

export { useJoyConContext, JoyConProvider };
