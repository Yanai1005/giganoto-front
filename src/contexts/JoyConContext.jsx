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

    // Parse Joy-Con input data
    const parseInputData = useCallback((detail) => {
        try {
            setRawInputData(detail);

            // 詳細デバッグ：受信データの全体構造を確認
            console.log('🔍 RAW INPUT DATA RECEIVED:', {
                hasAnalogStickLeft: !!detail.analogStickLeft,
                hasAnalogStickRight: !!detail.analogStickRight,
                leftStickData: detail.analogStickLeft,
                rightStickData: detail.analogStickRight,
                allKeys: Object.keys(detail)
            });

            if (detail.analogStickLeft) {
                console.log('🕹️ Left stick data structure (ALWAYS):', detail.analogStickLeft);
            }

            // buttonStatusオブジェクトからボタン状態を取得
            const buttonStatus = detail.buttonStatus || {};

            const parseStickInput = (stickData, stickName) => {
                console.log(`🔍 ${stickName} - PARSING START:`, {
                    hasStickData: !!stickData,
                    stickDataType: typeof stickData,
                    stickData: stickData
                });

                if (!stickData) {
                    console.log(`❌ ${stickName} - NO STICK DATA, returning zeros`);
                    return { x: 0, y: 0 };
                }

                // デバッグ用：生データの構造を詳細確認
                console.log(`${stickName} raw data structure (DETAILED):`, {
                    data: stickData,
                    keys: Object.keys(stickData),
                    hasRawData: !!stickData.rawData,
                    rawDataType: typeof stickData.rawData,
                    rawDataLength: stickData.rawData ? stickData.rawData.length : 'N/A'
                });

                // Joy-Conの生データがある場合はバイナリ変換を適用
                if (stickData.rawData && Array.isArray(stickData.rawData)) {
                    const data = stickData.rawData;
                    console.log(`${stickName} rawData array (length: ${data.length}):`, data);

                    let x = 0, y = 0;
                    let conversionSuccess = false;

                    // 複数の変換方法を試す
                    const tryConversion = (method, xCalc, yCalc) => {
                        try {
                            const testX = xCalc();
                            const testY = yCalc();

                            console.log(`${stickName} ${method} conversion result:`, { x: testX, y: testY });

                            // 妥当な範囲内かチェック
                            if (Math.abs(testX) <= 1.5 && Math.abs(testY) <= 1.5) {
                                return { x: testX, y: testY, success: true };
                            }
                            return { success: false };
                        } catch (err) {
                            console.warn(`${stickName} ${method} conversion failed:`, err);
                            return { success: false };
                        }
                    };

                    // Method 1: 標準的なJoy-Con変換（左スティック）
                    if (stickName === 'leftStick' && data.length >= 3) {
                        // 標準的な左スティック変換
                        const result1 = tryConversion('Left-Standard-Method1',
                            () => {
                                const raw = (data[1] << 8) | data[0];
                                return (raw - 2048) / 2048.0;
                            },
                            () => {
                                const rawY = (data[2] << 4) | (data[1] >> 4);
                                return (rawY - 2048) / 2048.0;
                            }
                        );
                        if (result1.success) {
                            x = result1.x;
                            y = result1.y;
                            conversionSuccess = true;
                            console.log('🎯 Left stick using Standard-Method1');
                        }

                        // 別の左スティック変換方法
                        if (!conversionSuccess) {
                            const result2 = tryConversion('Left-Standard-Method2',
                                () => {
                                    const raw = data[0] | (data[1] << 8);
                                    return (raw - 2048) / 2048.0;
                                },
                                () => {
                                    const rawY = data[2] | ((data[1] & 0xF0) << 4);
                                    return (rawY - 2048) / 2048.0;
                                }
                            );
                            if (result2.success) {
                                x = result2.x;
                                y = result2.y;
                                conversionSuccess = true;
                                console.log('🎯 Left stick using Standard-Method2');
                            }
                        }

                        // 12ビット値として変換
                        if (!conversionSuccess && data.length >= 3) {
                            const result3 = tryConversion('Left-12bit',
                                () => {
                                    const raw = data[0] | ((data[1] & 0x0F) << 8);
                                    return (raw - 2048) / 2048.0;
                                },
                                () => {
                                    const rawY = (data[1] >> 4) | (data[2] << 4);
                                    return (rawY - 2048) / 2048.0;
                                }
                            );
                            if (result3.success) {
                                x = result3.x;
                                y = result3.y;
                                conversionSuccess = true;
                                console.log('🎯 Left stick using 12bit method');
                            }
                        }
                    }

                    if (stickName === 'rightStick' && data.length >= 6) {
                        // Method 2a: 右スティック方式1
                        const result = tryConversion('Right-Method1',
                            () => {
                                const raw = (data[4] << 8) | data[3];
                                return (raw - 2048) / 2048.0;
                            },
                            () => {
                                const rawY = (data[5] << 4) | (data[4] >> 4);
                                return (rawY - 2048) / 2048.0;
                            }
                        );
                        if (result.success) {
                            x = result.x;
                            y = result.y;
                            conversionSuccess = true;
                        }

                        // Method 2b: 右スティック方式2（データ位置が異なる場合）
                        if (!conversionSuccess && data.length >= 9) {
                            const result2 = tryConversion('Right-Method2',
                                () => {
                                    const raw = (data[7] << 8) | data[6];
                                    return (raw - 2048) / 2048.0;
                                },
                                () => {
                                    const rawY = (data[8] << 4) | (data[7] >> 4);
                                    return (rawY - 2048) / 2048.0;
                                }
                            );
                            if (result2.success) {
                                x = result2.x;
                                y = result2.y;
                                conversionSuccess = true;
                            }
                        }

                        // Method 3: 16ビット値として直接変換
                        if (!conversionSuccess && data.length >= 4) {
                            const result3 = tryConversion('Right-16bit',
                                () => {
                                    const raw = (data[1] << 8) | data[0];
                                    return (raw / 32768.0) - 1.0;
                                },
                                () => {
                                    const rawY = (data[3] << 8) | data[2];
                                    return (rawY / 32768.0) - 1.0;
                                }
                            );
                            if (result3.success) {
                                x = result3.x;
                                y = result3.y;
                                conversionSuccess = true;
                            }
                        }
                    }

                    if (conversionSuccess) {
                        console.log(`${stickName} binary conversion successful:`, { x, y });
                        return { x, y };
                    } else {
                        console.warn(`${stickName} all binary conversion methods failed`);
                    }
                }

                // joy-con-webhidライブラリの実際のプロパティ名を確認
                let x = 0, y = 0;

                // より多くの可能なプロパティ名をチェック
                const possibleXProps = ['x', 'horizontal', 'h', 'left', 'right', 'hStick', 'stickX', 'analogX'];
                const possibleYProps = ['y', 'vertical', 'v', 'up', 'down', 'vStick', 'stickY', 'analogY'];

                console.log(`🔍 ${stickName} - SEARCHING FOR PROPERTIES:`, {
                    allProperties: Object.keys(stickData),
                    searchingFor: { x: possibleXProps, y: possibleYProps }
                });

                // X値の検索
                for (const prop of possibleXProps) {
                    if (stickData[prop] !== undefined && stickData[prop] !== null) {
                        const rawValue = stickData[prop];
                        x = parseFloat(rawValue);
                        if (!isNaN(x)) {
                            console.log(`✅ ${stickName} X found in property: ${prop}, raw value: ${rawValue}, parsed: ${x}`);
                            break;
                        } else {
                            console.log(`⚠️ ${stickName} X property ${prop} is NaN: ${rawValue}`);
                        }
                    }
                }

                // Y値の検索
                for (const prop of possibleYProps) {
                    if (stickData[prop] !== undefined && stickData[prop] !== null) {
                        const rawValue = stickData[prop];
                        y = parseFloat(rawValue);
                        if (!isNaN(y)) {
                            console.log(`✅ ${stickName} Y found in property: ${prop}, raw value: ${rawValue}, parsed: ${y}`);
                            break;
                        } else {
                            console.log(`⚠️ ${stickName} Y property ${prop} is NaN: ${rawValue}`);
                        }
                    }
                }

                // 値が見つからない場合、すべてのプロパティを表示
                if (x === 0 && y === 0) {
                    console.log(`🚨 ${stickName} - NO VALID VALUES FOUND. All properties:`, stickData);

                    // デフォルト値として0以外の小さな値も試す
                    for (const [key, value] of Object.entries(stickData)) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && Math.abs(numValue) > 0.001) {
                            console.log(`🔍 ${stickName} - Found non-zero numeric property: ${key} = ${numValue}`);
                        }
                    }
                }

                // すべてのプロパティを表示（問題がある時のみ）
                if (Math.abs(x) > 1.5 || Math.abs(y) > 1.5) {
                    console.log(`⚠️ ${stickName} extreme values detected. All properties:`, stickData);
                }

                // 極端な値の処理を改良
                if (Math.abs(x) > 1.0 || Math.abs(y) > 1.0) {
                    console.warn(`🚨 ${stickName} values out of range, attempting correction:`, { x, y });

                    // -1や1の極端な値の場合、無効なデータとして扱う
                    if ((Math.abs(x) >= 0.99 && Math.abs(y) >= 0.99) || (x === -1 && y === 1)) {
                        console.warn(`🚫 ${stickName} detected invalid extreme values, setting to zero:`, { x, y });
                        x = 0;
                        y = 0;
                    } else {
                        // 範囲外だが有効そうな値の場合は正規化
                        const originalX = x, originalY = y;
                        x = Math.max(-1.0, Math.min(1.0, x / 2.0));
                        y = Math.max(-1.0, Math.min(1.0, y / 2.0));
                        console.log(`🔧 ${stickName} normalized values:`, {
                            original: { x: originalX, y: originalY },
                            normalized: { x, y }
                        });
                    }
                }

                // 値が文字列の"x-2y2"のような形式の場合の対処
                if (typeof stickData.horizontal === 'string' && stickData.horizontal.includes('x')) {
                    console.warn(`Invalid stick data format detected for ${stickName}:`, stickData);
                    return { x: 0, y: 0 };
                }

                // デバッグ：変換後の値を確認
                const finalResult = { x, y };

                // 最終チェック：極端な値が残っていたら無効化
                if ((Math.abs(x) >= 0.99 && Math.abs(y) >= 0.99) || (x === -1 && y === 1)) {
                    console.error(`🚫 ${stickName} FINAL CHECK: Invalid extreme values detected, forcing to zero:`, finalResult);
                    finalResult.x = 0;
                    finalResult.y = 0;
                }

                console.log(`🔍 ${stickName} parsed values (DETAILED FINAL):`, {
                    x: finalResult.x,
                    y: finalResult.y,
                    xType: typeof finalResult.x,
                    yType: typeof finalResult.y,
                    magnitude: Math.sqrt(finalResult.x * finalResult.x + finalResult.y * finalResult.y).toFixed(3),
                    isZero: finalResult.x === 0 && finalResult.y === 0,
                    originalStickData: stickData
                });

                return finalResult;
            };

            const newInputState = {
                leftStick: parseStickInput(detail.analogStickLeft, 'leftStick'),
                rightStick: parseStickInput(detail.analogStickRight, 'rightStick'),
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

            // 最終的な入力状態の検証
            if (newInputState.leftStick.x === -1 && newInputState.leftStick.y === 1) {
                console.error('🚨 CRITICAL: Invalid left stick values detected in final state, resetting to zero');
                newInputState.leftStick = { x: 0, y: 0 };
            }

            // 常に左スティックの最終状態をログ出力（デバッグ用）
            console.log('🎯 Left stick FINAL STATE:', {
                ...newInputState.leftStick,
                magnitude: Math.sqrt(newInputState.leftStick.x ** 2 + newInputState.leftStick.y ** 2).toFixed(3),
                isActive: Math.sqrt(newInputState.leftStick.x ** 2 + newInputState.leftStick.y ** 2) > 0.05
            });

            // アクティブな左スティックの動きを強調表示
            const leftMagnitude = Math.sqrt(newInputState.leftStick.x ** 2 + newInputState.leftStick.y ** 2);
            if (leftMagnitude > 0.01) { // より低い閾値で検知
                console.log('🚀 Left stick MOVEMENT DETECTED:', {
                    ...newInputState.leftStick,
                    magnitude: leftMagnitude.toFixed(3)
                });
            }

            if (Math.abs(newInputState.rightStick.x) > 0.1 || Math.abs(newInputState.rightStick.y) > 0.1) {
                console.log('Right stick:', newInputState.rightStick);
                // 生データも表示してデバッグ
                if (detail.analogStickRight) {
                    console.log('Right stick raw data:', detail.analogStickRight);
                }
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
