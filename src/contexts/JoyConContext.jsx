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

    // 左右のJoy-Conを個別に管理
    const [leftJoyCon, setLeftJoyCon] = useState(null);
    const [rightJoyCon, setRightJoyCon] = useState(null);
    const [leftJoyConConnected, setLeftJoyConConnected] = useState(false);
    const [rightJoyConConnected, setRightJoyConConnected] = useState(false);

    const intervalRef = useRef(null);
    const listenersRef = useRef(new Map());
    const inputCallbacksRef = useRef(new Set());
    const isInitializedRef = useRef(false);
    const pollingIntervalsRef = useRef({});

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
            let normalizedValue = rawValue;

            if (Math.abs(normalizedValue) < 0.05) {
                normalizedValue = 0;
            }

            normalizedValue = Math.max(-1.0, Math.min(1.0, normalizedValue));
            return normalizedValue;
        }

        if (typeof rawValue === 'number' && rawValue >= 0 && rawValue <= 4095) {
            const delta = rawValue - center;

            if (Math.abs(delta) < STICK_CONSTANTS.DEADZONE_RAW) {
                return 0;
            }

            const normalized = delta / range;
            return Math.max(-1.0, Math.min(1.0, normalized));
        }

        return 0;
    }, []);

    const parseInputData = useCallback((detail, joyConType) => {
        try {
            setRawInputData(detail);

            const buttonStatus = detail.buttonStatus || {};

            const parseStickInput = (stickData, stickName) => {
                if (!stickData) {
                    return { x: 0, y: 0 };
                }

                let rawX = 0, rawY = 0;

                const xProps = ['x', 'horizontal', 'h', 'X'];
                const yProps = ['y', 'vertical', 'v', 'Y'];

                for (const prop of xProps) {
                    if (stickData[prop] !== undefined && stickData[prop] !== null) {
                        rawX = stickData[prop];
                        break;
                    }
                }

                for (const prop of yProps) {
                    if (stickData[prop] !== undefined && stickData[prop] !== null) {
                        rawY = stickData[prop];
                        break;
                    }
                }

                rawX = parseFloat(rawX) || 0;
                rawY = parseFloat(rawY) || 0;

                const isLeftStick = stickName === 'leftStick';
                const calibration = STICK_CONSTANTS.calibration[stickName];

                let x = convertStickValue(rawX, calibration.centerX, calibration.rangeX, stickName, 'X');
                let y = convertStickValue(rawY, calibration.centerY, calibration.rangeY, stickName, 'Y');

                if (isLeftStick) {
                    y = -y;
                }

                return { x, y };
            };

            // 左右のJoy-Conの入力を個別に処理
            let newInputState = {
                leftStick: { x: 0, y: 0 },
                rightStick: { x: 0, y: 0 },
                buttons: {
                    a: false,
                    b: false,
                    x: false,
                    y: false,
                    up: false,
                    down: false,
                    left: false,
                    right: false,
                    l: false,
                    zl: false,
                    r: false,
                    zr: false,
                    plus: false,
                    minus: false,
                    home: false,
                    capture: false,
                    leftStickButton: false,
                    rightStickButton: false,
                    sl: false,
                    sr: false
                },
                gyro: detail.actualGyroscope?.dps || detail.gyroscope || { x: 0, y: 0, z: 0 },
                accel: detail.actualAccelerometer || detail.accelerometer || { x: 0, y: 0, z: 0 }
            };

            // 左Joy-Conの処理
            if (joyConType === 'left' && detail.analogStickLeft) {
                newInputState.leftStick = parseStickInput(detail.analogStickLeft, 'leftStick');
            }

            // 右Joy-Conの処理
            if (joyConType === 'right') {
                if (detail.analogStickLeft) {
                    newInputState.rightStick = parseStickInput(detail.analogStickLeft, 'rightStick');
                }
                if (detail.analogStickRight) {
                    newInputState.rightStick = parseStickInput(detail.analogStickRight, 'rightStick');
                }
            }

            // ボタン処理（左右のJoy-Conのボタンを統合）
            newInputState.buttons = {
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
            };

            setInputState(prevState => ({
                ...prevState,
                ...newInputState
            }));

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
    }, []);

    const connectJoyCon = useCallback(async () => {
        if (!isSupported) {
            setError('WebHID API is not supported');
            return false;
        }

        setIsConnecting(true);
        setError(null);

        try {
            console.log('🎮 Joy-Con接続を開始...');
            await JoyCon.connectJoyCon();
            console.log('✅ Joy-Con接続完了');
            setIsConnecting(false);
            return true;
        } catch (err) {
            console.error('❌ Joy-Con接続失敗:', err);
            setError(`Connection failed: ${err.message}`);
            setIsConnecting(false);
            return false;
        }
    }, [isSupported]);

    const disconnectJoyCon = useCallback(async (joyConType) => {
        try {
            console.log(`🔌 ${joyConType} Joy-Conを切断中...`);

            if (joyConType === 'left' && leftJoyCon) {
                if (leftJoyCon.device && leftJoyCon.device.opened) {
                    await leftJoyCon.device.close();
                }
                setLeftJoyCon(null);
                setLeftJoyConConnected(false);
                console.log('✅ 左Joy-Con切断完了');
            } else if (joyConType === 'right' && rightJoyCon) {
                if (rightJoyCon.device && rightJoyCon.device.opened) {
                    await rightJoyCon.device.close();
                }
                setRightJoyCon(null);
                setRightJoyConConnected(false);
                console.log('✅ 右Joy-Con切断完了');
            }

            // 接続状態を更新
            const hasLeft = joyConType === 'left' ? false : leftJoyConConnected;
            const hasRight = joyConType === 'right' ? false : rightJoyConConnected;
            setIsConnected(hasLeft || hasRight);

        } catch (error) {
            console.error('❌ Joy-Con切断失敗:', error);
        }
    }, [leftJoyCon, rightJoyCon, leftJoyConConnected, rightJoyConConnected]);

    const disconnectAllJoyCons = useCallback(async () => {
        try {
            console.log('🔌 全Joy-Conを切断中...');

            // ポーリングインターバルを停止
            for (const [deviceId, interval] of Object.entries(pollingIntervalsRef.current)) {
                clearInterval(interval);
            }
            pollingIntervalsRef.current = {};

            // 各Joy-Conデバイスを個別に切断
            const connectedDevices = Array.from(JoyCon.connectedJoyCons.values());
            for (const joyCon of connectedDevices) {
                try {
                    if (joyCon && joyCon.device) {
                        console.log(`切断中: ${joyCon.device.productName || 'Unknown Device'}`);

                        // イベントリスナーを削除
                        joyCon.eventListenerAttached = false;

                        // デバイスが開いている場合のみ切断
                        if (joyCon.device.opened) {
                            await joyCon.device.close();
                            console.log(`切断完了: ${joyCon.device.productName || 'Unknown Device'}`);
                        }
                    }
                } catch (deviceError) {
                    console.warn('個別デバイス切断エラー:', deviceError);
                }
            }

            // ライブラリの接続管理をクリア
            JoyCon.connectedJoyCons.clear();

            // アプリケーション内部データをクリア
            setLeftJoyCon(null);
            setRightJoyCon(null);
            setLeftJoyConConnected(false);
            setRightJoyConConnected(false);
            setIsConnected(false);
            setConnectedControllers([]);

            console.log('✅ 全Joy-Con切断完了');

        } catch (error) {
            console.error('❌ 全Joy-Con切断失敗:', error);
        }
    }, []);

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

            return true;
        } catch (error) {
            console.error(`Failed to setup ${joyCon.device.productName}:`, error);
            throw error;
        }
    }, []);

    const startPollingForDevice = useCallback((joyCon, joyConType) => {
        const deviceId = joyCon.device.productName || 'unknown';

        if (pollingIntervalsRef.current[deviceId]) {
            clearInterval(pollingIntervalsRef.current[deviceId]);
        }

        pollingIntervalsRef.current[deviceId] = setInterval(async () => {
            try {
                if (!joyCon.device || !joyCon.device.opened) {
                    console.log(`デバイス切断を検知: ${deviceId}`);
                    clearInterval(pollingIntervalsRef.current[deviceId]);
                    delete pollingIntervalsRef.current[deviceId];
                    return;
                }

                if (typeof joyCon.poll === 'function') {
                    const data = await joyCon.poll();
                    if (data) {
                        parseInputData(data, joyConType);
                    }
                }

                if (typeof joyCon.readInput === 'function') {
                    const data = await joyCon.readInput();
                    if (data) {
                        parseInputData(data, joyConType);
                    }
                }

            } catch (error) {
                console.warn(`ポーリングエラー: ${deviceId}`, error);
                clearInterval(pollingIntervalsRef.current[deviceId]);
                delete pollingIntervalsRef.current[deviceId];
            }
        }, 16);
    }, [parseInputData]);

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
                        const deviceName = joyCon.device.productName;
                        const isLeft = deviceName.includes('(L)') || deviceName.includes('Left');
                        const isRight = deviceName.includes('(R)') || deviceName.includes('Right');

                        controllers.push({
                            id: joyCon.device.productId,
                            name: joyCon.device.productName,
                            side: isLeft ? 'left' : isRight ? 'right' : 'unknown',
                            connected: joyCon.device.opened
                        });

                        if (joyCon.eventListenerAttached) {
                            hasConnected = true;
                            continue;
                        }

                        try {
                            await setupJoyCon(joyCon);

                            const joyConType = isLeft ? 'left' : isRight ? 'right' : 'unknown';

                            const inputListener = (event) => {
                                try {
                                    if (event && event.detail) {
                                        parseInputData(event.detail, joyConType);
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

                                // 左右のJoy-Conを個別に管理
                                if (isLeft) {
                                    setLeftJoyCon(joyCon);
                                    setLeftJoyConConnected(true);
                                    console.log('✅ 左Joy-Con接続完了');
                                } else if (isRight) {
                                    setRightJoyCon(joyCon);
                                    setRightJoyConConnected(true);
                                    console.log('✅ 右Joy-Con接続完了');
                                }

                                startPollingForDevice(joyCon, joyConType);
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

            // ポーリングインターバルをクリア
            for (const [deviceId, interval] of Object.entries(pollingIntervalsRef.current)) {
                clearInterval(interval);
            }
            pollingIntervalsRef.current = {};

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
    }, [isSupported, parseInputData, setupJoyCon, startPollingForDevice]);

    const value = {
        isSupported,
        isConnected,
        isConnecting,
        connectedControllers,
        error,
        inputState,
        rawInputData,
        connectJoyCon,
        disconnectJoyCon,
        disconnectAllJoyCons,
        rumble,
        registerInputCallback,
        updateCalibration,
        stickConstants: STICK_CONSTANTS,
        // 左右のJoy-Conの個別状態
        leftJoyCon,
        rightJoyCon,
        leftJoyConConnected,
        rightJoyConConnected
    };

    return (
        <JoyConContext.Provider value={value}>
            {children}
        </JoyConContext.Provider>
    );
}

export { useJoyConContext, JoyConProvider };
