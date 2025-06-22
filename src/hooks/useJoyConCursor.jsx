import { useEffect, useCallback, useRef, useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

export const useJoyConCursor = ({
    enabled = true,
    sensitivity = 0.3,
    deadzone = 0.1, // デッドゾーンを0.03から0.1に拡大
    showCursor = true,
    autoCalibrate = false, // キャリブレーション機能を無効化
    calibrationTime = 3000
}) => {
    const { inputState, isConnected } = useJoyConContext();

    // デバッグ用：JoyConの接続状態とinputStateを定期的にログ出力
    useEffect(() => {
        const debugInterval = setInterval(() => {
            console.log('🎮 JoyCon Debug Status (LEFT STICK MODE):', {
                enabled,
                isConnected,
                hasInputState: !!inputState,
                hasLeftStick: !!(inputState?.leftStick),
                leftStickValues: inputState?.leftStick
            });
        }, 5000); // 5秒ごと

        return () => clearInterval(debugInterval);
    }, [enabled, isConnected, inputState]);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calibrationOffset, setCalibrationOffset] = useState({ x: 0, y: 0 });
    const [isCalibrated, setIsCalibrated] = useState(false); // 初期値をfalseに変更

    const animationFrameRef = useRef(null);
    const lastButtonStateRef = useRef({});
    const velocityRef = useRef({ x: 0, y: 0 });
    const cursorRef = useRef(null);

    const calibrationValuesRef = useRef([]);
    const calibrationTimerRef = useRef(null); const getLeftStick = useCallback(() => {
        if (!inputState || !inputState.leftStick) {
            console.log('🎮 No inputState or leftStick available');
            return { x: 0, y: 0 };
        }

        const stick = inputState.leftStick;

        // より詳細なデバッグ情報
        console.log('🎮 Raw LEFT stick input received (DETAILED):', {
            raw: stick,
            xValue: stick.x,
            yValue: stick.y,
            xType: typeof stick.x,
            yType: typeof stick.y,
            xIsNumber: !isNaN(Number(stick.x)),
            yIsNumber: !isNaN(Number(stick.y))
        });

        // 確実に数値に変換
        let x = parseFloat(stick.x) || 0;
        let y = parseFloat(stick.y) || 0;

        // NaN チェック
        if (isNaN(x)) x = 0;
        if (isNaN(y)) y = 0;

        // 値がゼロでない場合はログ出力
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
            console.log('🎮 Valid LEFT stick input (converted - DETAILED):', {
                x,
                y,
                originalTypes: { x: typeof stick.x, y: typeof stick.y },
                originalValues: { x: stick.x, y: stick.y },
                convertedMagnitude: Math.sqrt(x * x + y * y),
                isExtremeValue: (Math.abs(x) >= 0.99 || Math.abs(y) >= 0.99)
            });
        }

        return { x, y };
    }, [inputState]);

    const getButtons = useCallback(() => {
        if (!inputState || !inputState.buttons) {
            return {};
        }
        return inputState.buttons;
    }, [inputState]);

    useEffect(() => {
        setMousePosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });
    }, []);

    const startAutoCalibration = useCallback(() => {
        if (!enabled || !isConnected || !autoCalibrate) return;


        setIsCalibrating(true);
        setIsCalibrated(false);
        calibrationValuesRef.current = [];

        const collectCalibrationData = () => {
            const stick = getLeftStick();
            calibrationValuesRef.current.push({ x: stick.x, y: stick.y });

            if (calibrationValuesRef.current.length < calibrationTime / 100) {
                calibrationTimerRef.current = setTimeout(collectCalibrationData, 100);
            } else {
                finishCalibration();
            }
        };

        calibrationTimerRef.current = setTimeout(collectCalibrationData, 500);
    }, [enabled, isConnected, autoCalibrate, calibrationTime, getLeftStick]);

    const finishCalibration = useCallback(() => {
        const values = calibrationValuesRef.current;
        if (values.length === 0) return;

        const xValues = values.map(v => v.x).sort((a, b) => a - b);
        const yValues = values.map(v => v.y).sort((a, b) => a - b);

        const medianX = xValues[Math.floor(xValues.length / 2)];
        const medianY = yValues[Math.floor(yValues.length / 2)];

        const newOffset = {
            x: medianX,
            y: medianY
        };

        setCalibrationOffset(newOffset);
        setIsCalibrating(false);
        setIsCalibrated(true);


    }, []);

    const manualCalibrate = useCallback(() => {
        const stick = getLeftStick();

        const samples = [];
        const sampleCount = 10;

        const collectSamples = (count) => {
            if (count > 0) {
                const currentStick = getLeftStick();
                samples.push({ x: currentStick.x, y: currentStick.y });
                setTimeout(() => collectSamples(count - 1), 50);
            } else {
                const avgX = samples.reduce((sum, s) => sum + s.x, 0) / samples.length;
                const avgY = samples.reduce((sum, s) => sum + s.y, 0) / samples.length;

                setCalibrationOffset({ x: avgX, y: avgY });
                setIsCalibrated(true);
                velocityRef.current = { x: 0, y: 0 };


            }
        };


        collectSamples(sampleCount);
    }, [getLeftStick]);

    // キャリブレーション効果を無効化
    useEffect(() => {
        // 何もしない（キャリブレーション機能を無効）
    }, []);

    useEffect(() => {
        if (!showCursor) return;

        const cursor = document.createElement('div');
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: rgba(0, 255, 0, 0.8);
            border: 2px solid white;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: all 0.2s ease;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        `;

        cursor.id = 'joy-con-cursor';
        document.body.appendChild(cursor);
        cursorRef.current = cursor;

        return () => {
            if (cursorRef.current && document.body.contains(cursorRef.current)) {
                document.body.removeChild(cursorRef.current);
                cursorRef.current = null;
            }
        };
    }, [showCursor]);

    useEffect(() => {
        if (cursorRef.current) {
            cursorRef.current.style.left = `${mousePosition.x}px`;
            cursorRef.current.style.top = `${mousePosition.y}px`;
            cursorRef.current.style.opacity = enabled && isConnected ? '1' : '0.3';
            // キャリブレーション状態に関係なく緑色で表示
            cursorRef.current.style.background = 'rgba(0, 255, 0, 0.8)';
        }
    }, [mousePosition, enabled, isConnected]);

    const fireMouseEvent = useCallback((type, x, y, button = 0) => {
        const element = document.elementFromPoint(x, y);
        if (!element) return null;

        const event = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y,
            screenX: x + window.screenX,
            screenY: y + window.screenY,
            button: button,
            buttons: button === 0 ? 1 : 0
        });

        element.dispatchEvent(event);
        return element;
    }, []);

    const normalizeStickInput = useCallback((stick) => {
        if (!stick) return { x: 0, y: 0 };

        // 確実に数値に変換
        let adjustedX = parseFloat(stick.x) || 0;
        let adjustedY = parseFloat(stick.y) || 0;

        // NaN チェック
        if (isNaN(adjustedX)) adjustedX = 0;
        if (isNaN(adjustedY)) adjustedY = 0;

        // 極端な値の検出と対処
        const isExtremeValue = (Math.abs(adjustedX) >= 0.99 || Math.abs(adjustedY) >= 0.99);
        if (isExtremeValue) {
            console.log('🚨 Extreme LEFT stick value detected, potentially invalid:', {
                raw: { x: adjustedX, y: adjustedY },
                magnitude: Math.sqrt(adjustedX * adjustedX + adjustedY * adjustedY)
            });
            // 極端な値の場合、少し減衰させる
            adjustedX *= 0.8;
            adjustedY *= 0.8;
        }

        // 最小限のデッドゾーン適用
        const magnitude = Math.sqrt(adjustedX * adjustedX + adjustedY * adjustedY);
        if (magnitude < deadzone) {
            return { x: 0, y: 0 };
        }

        // シンプルな正規化（複雑な処理を一時的に削除）
        const normalizedMagnitude = Math.min(1, magnitude);
        const angle = Math.atan2(adjustedY, adjustedX);
        const normalizedX = Math.cos(angle) * normalizedMagnitude;
        const normalizedY = Math.sin(angle) * normalizedMagnitude;

        // デバッグ情報（常に表示して動作確認）
        console.log('🎮 LEFT Stick - Using left stick for cursor control:', {
            raw: { x: adjustedX.toFixed(3), y: adjustedY.toFixed(3) },
            rawTypes: { x: typeof stick.x, y: typeof stick.y },
            magnitude: magnitude.toFixed(3),
            deadzone: deadzone,
            normalized: { x: normalizedX.toFixed(3), y: normalizedY.toFixed(3) },
            isValidInput: !isNaN(adjustedX) && !isNaN(adjustedY),
            wasExtremeValue: isExtremeValue
        });

        return { x: normalizedX, y: normalizedY };
    }, [deadzone]);

    // Update mouse position based on stick input
    const updateMousePosition = useCallback(() => {
        console.log('🖱️ updateMousePosition called:', { enabled, isConnected });

        if (!enabled || !isConnected) {
            console.log('🎮 Update stopped:', { enabled, isConnected });
            return;
        }

        const stick = getLeftStick();
        const normalizedStick = normalizeStickInput(stick);
        const magnitude = Math.sqrt(normalizedStick.x ** 2 + normalizedStick.y ** 2);

        if (magnitude > 0.01) { // 閾値を緩めて反応しやすく
            // 速度計算（段階3: かなり遅く）
            const targetVelocityX = normalizedStick.x * sensitivity * 0.5; // 1.0 → 0.5に半減
            const targetVelocityY = normalizedStick.y * sensitivity * 0.5;

            // シンプルな速度更新（複雑な慣性を一時的に削除）
            velocityRef.current.x = targetVelocityX;
            velocityRef.current.y = targetVelocityY;

            console.log('🖱️ Velocity calculated:', {
                normalizedStick,
                sensitivity,
                velocity: { x: targetVelocityX, y: targetVelocityY },
                magnitude
            });

            setMousePosition(prev => {
                const newX = Math.max(0, Math.min(window.innerWidth - 1,
                    prev.x + velocityRef.current.x));
                const newY = Math.max(0, Math.min(window.innerHeight - 1,
                    prev.y + velocityRef.current.y));

                console.log('🖱️ Mouse position update:', {
                    prev: { x: prev.x, y: prev.y },
                    new: { x: newX, y: newY },
                    delta: { x: newX - prev.x, y: newY - prev.y },
                    windowSize: { width: window.innerWidth, height: window.innerHeight }
                });

                if (Math.abs(newX - prev.x) > 0.01 || Math.abs(newY - prev.y) > 0.01) {
                    fireMouseEvent('mousemove', newX, newY);
                    console.log('🖱️ Mouse event fired');
                } else {
                    console.log('🖱️ Mouse movement too small, event not fired');
                }

                return { x: newX, y: newY };
            });
        } else {
            velocityRef.current.x *= 0.1;
            velocityRef.current.y *= 0.1;


            if (Math.abs(velocityRef.current.x) < 0.01) velocityRef.current.x = 0;
            if (Math.abs(velocityRef.current.y) < 0.01) velocityRef.current.y = 0;
        }

        animationFrameRef.current = requestAnimationFrame(updateMousePosition);
    }, [enabled, isConnected, getLeftStick, normalizeStickInput, sensitivity, fireMouseEvent]);

    useEffect(() => {
        if (!enabled || !isConnected) return;

        const buttons = getButtons();
        const currentPosition = mousePosition;

        const plusPressed = buttons.plus || false;
        const plusWasPressed = lastButtonStateRef.current.plus || false;

        if (plusPressed && !plusWasPressed) {
            manualCalibrate();
        }

        const minusPressed = buttons.minus || false;
        const minusWasPressed = lastButtonStateRef.current.minus || false;

        if (minusPressed && !minusWasPressed) {
            startAutoCalibration();
        }

        if (isCalibrated) {
            const aPressed = buttons.a || false;
            const aWasPressed = lastButtonStateRef.current.a || false;

            if (aPressed && !aWasPressed) {
                setIsClicking(true);
                if (cursorRef.current) {
                    cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1.2)';
                }
                fireMouseEvent('mousedown', currentPosition.x, currentPosition.y, 0);
            } else if (!aPressed && aWasPressed) {
                setIsClicking(false);
                if (cursorRef.current) {
                    cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
                }
                const element = fireMouseEvent('mouseup', currentPosition.x, currentPosition.y, 0);
                fireMouseEvent('click', currentPosition.x, currentPosition.y, 0);

                if (element && (element.tabIndex >= 0 ||
                    ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName))) {
                    element.focus();
                }
            }

            const bPressed = buttons.b || false;
            const bWasPressed = lastButtonStateRef.current.b || false;

            if (bPressed && !bWasPressed) {
                fireMouseEvent('contextmenu', currentPosition.x, currentPosition.y, 2);
            }
        }

        lastButtonStateRef.current = {
            plus: plusPressed,
            minus: minusPressed,
            a: buttons.a || false,
            b: buttons.b || false
        };

    }, [enabled, isConnected, getButtons, mousePosition, fireMouseEvent]);

    // フレームレート制限付きアニメーションループ
    useEffect(() => {
        let lastFrameTime = 0;
        const targetFPS = 60; // 60FPSに上げてスムーズに
        const frameInterval = 1000 / targetFPS;
        let frameCount = 0;

        const animate = (currentTime) => {
            frameCount++;

            // 60フレームごとにログ出力（1秒ごと）
            if (frameCount % 60 === 0) {
                console.log('🔄 Animation loop running:', {
                    enabled,
                    isConnected,
                    frameCount,
                    currentTime: Math.round(currentTime)
                });
            }

            if (currentTime - lastFrameTime >= frameInterval) {
                if (enabled && isConnected) {
                    updateMousePosition();
                }
                lastFrameTime = currentTime;
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        console.log('🔄 Starting animation loop:', { enabled, isConnected });
        if (enabled && isConnected) {
            animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => {
            console.log('🔄 Stopping animation loop');
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [enabled, isConnected, updateMousePosition]);

    useEffect(() => {
        return () => {
            if (calibrationTimerRef.current) {
                clearTimeout(calibrationTimerRef.current);
            }
        };
    }, []);

    return {
        mousePosition,
        isClicking,
        isActive: enabled && isConnected, // キャリブレーション条件を削除
        isCalibrating: false, // 常にfalse
        isCalibrated: true, // 常にtrue
        calibrationOffset: { x: 0, y: 0 }, // 常にゼロ
        recalibrate: () => { }, // 空の関数
        startAutoCalibration: () => { } // 空の関数
    };
};
