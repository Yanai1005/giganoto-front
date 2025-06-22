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

// JoyConProviderを関数宣言として定義
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

    // Parse Joy-Con input dat

    const parseInputData = useCallback((detail) => {
        try {
            setRawInputData(detail);

            console.log('🔍 RAW INPUT DATA RECEIVED:', {
                hasAnalogStickLeft: !!detail.analogStickLeft,
                hasAnalogStickRight: !!detail.analogStickRight,
                leftStickData: detail.analogStickLeft,
                rightStickData: detail.analogStickRight,
            });

            const buttonStatus = detail.buttonStatus || {};

            const parseStickInput = (stickData, stickName) => {
                if (!stickData) {
                    return { x: 0, y: 0 };
                }

                let x = 0, y = 0;

                // プロパティ名の統一的な検索
                const possibleXProps = ['x', 'horizontal', 'h'];
                const possibleYProps = ['y', 'vertical', 'v'];

                // X値の取得
                for (const prop of possibleXProps) {
                    if (stickData[prop] !== undefined && stickData[prop] !== null) {
                        const rawValue = parseFloat(stickData[prop]);
                        if (!isNaN(rawValue)) {
                            x = rawValue;
                            console.log(`✅ ${stickName} X found: ${prop} = ${rawValue}`);
                            break;
                        }
                    }
                }

                // Y値の取得
                for (const prop of possibleYProps) {
                    if (stickData[prop] !== undefined && stickData[prop] !== null) {
                        const rawValue = parseFloat(stickData[prop]);
                        if (!isNaN(rawValue)) {
                            y = rawValue;
                            console.log(`✅ ${stickName} Y found: ${prop} = ${rawValue}`);
                            break;
                        }
                    }
                }

                // 範囲外の値を適切にスケール（-2〜2の範囲を-1〜1に正規化）
                if (Math.abs(x) > 1.0 || Math.abs(y) > 1.0) {
                    console.log(`🔧 ${stickName} scaling from extended range:`, { originalX: x, originalY: y });

                    // -2〜2の範囲を-1〜1にマッピング
                    x = Math.max(-1.0, Math.min(1.0, x / 2.0));
                    y = Math.max(-1.0, Math.min(1.0, y / 2.0));

                    console.log(`🔧 ${stickName} scaled values:`, { scaledX: x, scaledY: y });
                }

                // 左スティックの場合はY軸を反転（上が正になるように）
                if (stickName === 'leftStick') {
                    y = -y;
                }

                const magnitude = Math.sqrt(x * x + y * y);

                // アクティブな入力のログ出力
                if (magnitude > 0.05) {
                    console.log(`🎮 ${stickName} ACTIVE:`, {
                        x: x.toFixed(3),
                        y: y.toFixed(3),
                        magnitude: magnitude.toFixed(3)
                    });
                }

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

            // 左スティックの最終確認
            const leftMagnitude = Math.sqrt(newInputState.leftStick.x ** 2 + newInputState.leftStick.y ** 2);
            if (leftMagnitude > 0.01) {
                console.log('🚀 LEFT STICK FINAL:', {
                    ...newInputState.leftStick,
                    magnitude: leftMagnitude.toFixed(3)
                });
            }

            setInputState(newInputState);

            // コールバック実行
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
                                    console.log('🎮 Raw event received from Joy-Con:', {
                                        eventType: event?.type,
                                        hasDetail: !!event?.detail,
                                        detailKeys: event?.detail ? Object.keys(event.detail) : 'N/A'
                                    });

                                    if (event && event.detail) {
                                        console.log('🔍 Event detail (FULL):', event.detail);
                                        parseInputData(event.detail);
                                    } else {
                                        console.warn('❌ Invalid event structure:', event);
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
}

// 名前付きエクスポート
export { useJoyConContext, JoyConProvider };
