// src/hooks/useJoyConCursor.jsx - Improved calibration system
import { useEffect, useCallback, useRef, useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

export const useJoyConCursor = ({
    enabled = true,
    sensitivity = 0.3,
    deadzone = 0.3, // デッドゾーンを大きく
    showCursor = true,
    autoCalibrate = true, // 自動キャリブレーション
    calibrationTime = 3000 // キャリブレーション時間（ミリ秒）
}) => {
    const { inputState, isConnected } = useJoyConContext();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calibrationOffset, setCalibrationOffset] = useState({ x: 0, y: 0 });
    const [isCalibrated, setIsCalibrated] = useState(true); // デフォルトでキャリブレーション済みとする

    const animationFrameRef = useRef(null);
    const lastButtonStateRef = useRef({});
    const velocityRef = useRef({ x: 0, y: 0 });
    const cursorRef = useRef(null);

    // キャリブレーション用の値収集
    const calibrationValuesRef = useRef([]);
    const calibrationTimerRef = useRef(null);

    // Safe getter for right stick with null checks
    const getRightStick = useCallback(() => {
        if (!inputState || !inputState.rightStick) {
            return { x: 0, y: 0 };
        }

        const stick = inputState.rightStick;
        return {
            x: parseFloat(stick.x) || 0,
            y: parseFloat(stick.y) || 0
        };
    }, [inputState]);

    // Safe getter for buttons with null checks
    const getButtons = useCallback(() => {
        if (!inputState || !inputState.buttons) {
            return {};
        }
        return inputState.buttons;
    }, [inputState]);

    // Initialize mouse position to center of screen
    useEffect(() => {
        setMousePosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });
    }, []);

    // 自動キャリブレーション
    const startAutoCalibration = useCallback(() => {
        if (!enabled || !isConnected || !autoCalibrate) return;

        console.log('🎯 右スティックJoy-Con自動キャリブレーション開始...');
        setIsCalibrating(true);
        setIsCalibrated(false);
        calibrationValuesRef.current = [];

        // キャリブレーション期間中に値を収集
        const collectCalibrationData = () => {
            const stick = getRightStick();
            calibrationValuesRef.current.push({ x: stick.x, y: stick.y });

            if (calibrationValuesRef.current.length < calibrationTime / 100) {
                calibrationTimerRef.current = setTimeout(collectCalibrationData, 100);
            } else {
                // 収集完了 - 中央値を計算
                finishCalibration();
            }
        };

        calibrationTimerRef.current = setTimeout(collectCalibrationData, 500);
    }, [enabled, isConnected, autoCalibrate, calibrationTime, getRightStick]);

    // キャリブレーション完了処理
    const finishCalibration = useCallback(() => {
        const values = calibrationValuesRef.current;
        if (values.length === 0) return;

        // 中央値（median）を計算（平均値より外れ値に強い）
        const xValues = values.map(v => v.x).sort((a, b) => a - b);
        const yValues = values.map(v => v.y).sort((a, b) => a - b);

        const medianX = xValues[Math.floor(xValues.length / 2)];
        const medianY = yValues[Math.floor(yValues.length / 2)];

        // より保守的なオフセット計算
        const newOffset = {
            x: medianX,
            y: medianY
        };

        setCalibrationOffset(newOffset);
        setIsCalibrating(false);
        setIsCalibrated(true);

        console.log('✅ 右スティックJoy-Conキャリブレーション完了');
        console.log(`📊 収集データ数: ${values.length}`);
        console.log(`🎯 オフセット値: x=${newOffset.x.toFixed(3)}, y=${newOffset.y.toFixed(3)}`);
        console.log(`📈 X値範囲: ${Math.min(...xValues).toFixed(3)} ~ ${Math.max(...xValues).toFixed(3)}`);
        console.log(`📈 Y値範囲: ${Math.min(...yValues).toFixed(3)} ~ ${Math.max(...yValues).toFixed(3)}`);
    }, []);

    // 手動キャリブレーション（強化版）
    const manualCalibrate = useCallback(() => {
        const stick = getRightStick();

        // 複数回サンプリングして安定した値を取得
        const samples = [];
        const sampleCount = 10;

        const collectSamples = (count) => {
            if (count > 0) {
                const currentStick = getRightStick();
                samples.push({ x: currentStick.x, y: currentStick.y });
                setTimeout(() => collectSamples(count - 1), 50);
            } else {
                // 平均値を計算
                const avgX = samples.reduce((sum, s) => sum + s.x, 0) / samples.length;
                const avgY = samples.reduce((sum, s) => sum + s.y, 0) / samples.length;

                setCalibrationOffset({ x: avgX, y: avgY });
                setIsCalibrated(true);
                velocityRef.current = { x: 0, y: 0 };

                console.log('🔧 右スティック強化手動キャリブレーション完了:');
                console.log(`📊 サンプル数: ${samples.length}`);
                console.log(`🎯 平均オフセット: x=${avgX.toFixed(3)}, y=${avgY.toFixed(3)}`);
                console.log(`📈 X範囲: ${Math.min(...samples.map(s => s.x)).toFixed(3)} ~ ${Math.max(...samples.map(s => s.x)).toFixed(3)}`);
                console.log(`📈 Y範囲: ${Math.min(...samples.map(s => s.y)).toFixed(3)} ~ ${Math.max(...samples.map(s => s.y)).toFixed(3)}`);
            }
        };

        console.log('🔧 右スティック手動キャリブレーション開始 - 右スティックを離してください...');
        collectSamples(sampleCount);
    }, [getRightStick]);

    // 接続時の自動キャリブレーション
    useEffect(() => {
        if (enabled && isConnected && autoCalibrate && !isCalibrated) {
            setIsCalibrated(true); // 自動キャリブレーションが無効の場合はデフォルトでキャリブレーション済み
            const timer = setTimeout(() => {
                startAutoCalibration();
            }, 1000);
            return () => clearTimeout(timer);
        } else if (enabled && isConnected && !autoCalibrate) {
            setIsCalibrated(true); // 自動キャリブレーション無効時はデフォルトで有効
        }
    }, [enabled, isConnected, autoCalibrate, isCalibrated, startAutoCalibration]);

    // Create and manage custom cursor
    useEffect(() => {
        if (!showCursor) return;

        const cursor = document.createElement('div');
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: ${isCalibrating ? 'rgba(255, 165, 0, 0.8)' : (isCalibrated ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)')};
            border: 2px solid white;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: all 0.2s ease;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        `;

        // キャリブレーション状態の表示
        if (isCalibrating) {
            cursor.innerHTML = '🎯';
            cursor.style.fontSize = '12px';
            cursor.style.textAlign = 'center';
            cursor.style.lineHeight = '16px';
        } else if (!isCalibrated) {
            cursor.innerHTML = '❌';
            cursor.style.fontSize = '12px';
            cursor.style.textAlign = 'center';
            cursor.style.lineHeight = '16px';
        }

        cursor.id = 'joy-con-cursor';
        document.body.appendChild(cursor);
        cursorRef.current = cursor;

        return () => {
            if (cursorRef.current && document.body.contains(cursorRef.current)) {
                document.body.removeChild(cursorRef.current);
                cursorRef.current = null;
            }
        };
    }, [showCursor, isCalibrating, isCalibrated]);

    // Update cursor position and status
    useEffect(() => {
        if (cursorRef.current) {
            cursorRef.current.style.left = `${mousePosition.x}px`;
            cursorRef.current.style.top = `${mousePosition.y}px`;
            cursorRef.current.style.opacity = enabled && isConnected ? '1' : '0.3';

            // 状態に応じて色を更新
            if (isCalibrating) {
                cursorRef.current.style.background = 'rgba(255, 165, 0, 0.8)'; // オレンジ
            } else if (isCalibrated) {
                cursorRef.current.style.background = 'rgba(0, 255, 0, 0.8)'; // 緑
            } else {
                cursorRef.current.style.background = 'rgba(255, 0, 0, 0.8)'; // 赤
            }
        }
    }, [mousePosition, enabled, isConnected, isCalibrating, isCalibrated]);

    // Fire mouse events
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

    // シンプルな正規化処理（動作確認用）
    const normalizeStickInput = useCallback((stick) => {
        if (!stick) return { x: 0, y: 0 };

        // 一時的にキャリブレーションを無効にして生の値を使用
        let adjustedX = stick.x; // - calibrationOffset.x;
        let adjustedY = stick.y; // - calibrationOffset.y;

        // 最小限のデッドゾーン適用
        const magnitude = Math.sqrt(adjustedX ** 2 + adjustedY ** 2);
        if (magnitude < deadzone) {
            return { x: 0, y: 0 };
        }

        // シンプルな正規化（複雑な処理を一時的に削除）
        const normalizedMagnitude = Math.min(1, magnitude);
        const angle = Math.atan2(adjustedY, adjustedX);
        const normalizedX = Math.cos(angle) * normalizedMagnitude;
        const normalizedY = Math.sin(angle) * normalizedMagnitude;

        // デバッグ情報（常に表示して動作確認）
        console.log('🎮 Stage 3 - Very slow (かなり遅く):', {
            raw: { x: stick.x.toFixed(3), y: stick.y.toFixed(3) },
            adjusted: { x: adjustedX.toFixed(3), y: adjustedY.toFixed(3) },
            magnitude: magnitude.toFixed(3),
            deadzone: deadzone,
            normalized: { x: normalizedX.toFixed(3), y: normalizedY.toFixed(3) }
        });

        return { x: normalizedX, y: normalizedY };
    }, [deadzone]);

    // Update mouse position based on stick input
    const updateMousePosition = useCallback(() => {
        if (!enabled || !isConnected || isCalibrating) return; // isCalibrated条件を一時的に削除

        const stick = getRightStick();
        const normalizedStick = normalizeStickInput(stick);
        const magnitude = Math.sqrt(normalizedStick.x ** 2 + normalizedStick.y ** 2);

        if (magnitude > 0.01) { // 閾値を緩めて反応しやすく
            // 速度計算（段階3: かなり遅く）
            const targetVelocityX = normalizedStick.x * sensitivity * 0.5; // 1.0 → 0.5に半減
            const targetVelocityY = normalizedStick.y * sensitivity * 0.5;

            // シンプルな速度更新（複雑な慣性を一時的に削除）
            velocityRef.current.x = targetVelocityX;
            velocityRef.current.y = targetVelocityY;

            // 位置更新
            setMousePosition(prev => {
                const newX = Math.max(0, Math.min(window.innerWidth - 1,
                    prev.x + velocityRef.current.x));
                const newY = Math.max(0, Math.min(window.innerHeight - 1,
                    prev.y + velocityRef.current.y));

                if (Math.abs(newX - prev.x) > 0.01 || Math.abs(newY - prev.y) > 0.01) {
                    fireMouseEvent('mousemove', newX, newY);
                }

                return { x: newX, y: newY };
            });
        } else {
            // 適度な速度減衰（完全停止は避けて操作性を保つ）
            velocityRef.current.x *= 0.1;
            velocityRef.current.y *= 0.1;

            // 極小値は完全にゼロにする
            if (Math.abs(velocityRef.current.x) < 0.01) velocityRef.current.x = 0;
            if (Math.abs(velocityRef.current.y) < 0.01) velocityRef.current.y = 0;
        }

        animationFrameRef.current = requestAnimationFrame(updateMousePosition);
    }, [enabled, isConnected, isCalibrating, getRightStick, normalizeStickInput, sensitivity, fireMouseEvent]);

    // Handle button presses
    useEffect(() => {
        if (!enabled || !isConnected || isCalibrating) return;

        const buttons = getButtons();
        const currentPosition = mousePosition;

        // Plus button: 手動キャリブレーション
        const plusPressed = buttons.plus || false;
        const plusWasPressed = lastButtonStateRef.current.plus || false;

        if (plusPressed && !plusWasPressed) {
            manualCalibrate();
        }

        // Minus button: 自動キャリブレーション再実行
        const minusPressed = buttons.minus || false;
        const minusWasPressed = lastButtonStateRef.current.minus || false;

        if (minusPressed && !minusWasPressed) {
            startAutoCalibration();
        }

        // A button: Left click (キャリブレーション済みの場合のみ)
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

            // B button: Right click
            const bPressed = buttons.b || false;
            const bWasPressed = lastButtonStateRef.current.b || false;

            if (bPressed && !bWasPressed) {
                fireMouseEvent('contextmenu', currentPosition.x, currentPosition.y, 2);
            }
        }

        // Store button states
        lastButtonStateRef.current = {
            plus: plusPressed,
            minus: minusPressed,
            a: buttons.a || false,
            b: buttons.b || false
        };

    }, [enabled, isConnected, isCalibrating, isCalibrated, getButtons, mousePosition, fireMouseEvent, manualCalibrate, startAutoCalibration]);

    // フレームレート制限付きアニメーションループ
    useEffect(() => {
        let lastFrameTime = 0;
        const targetFPS = 60; // 60FPSに上げてスムーズに
        const frameInterval = 1000 / targetFPS;

        const animate = (currentTime) => {
            if (currentTime - lastFrameTime >= frameInterval) {
                if (enabled && isConnected && !isCalibrating) {
                    updateMousePosition();
                }
                lastFrameTime = currentTime;
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        if (enabled && isConnected) {
            animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [enabled, isConnected, isCalibrating, updateMousePosition]);

    // Cleanup
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
        isActive: enabled && isConnected && isCalibrated,
        isCalibrating,
        isCalibrated,
        calibrationOffset,
        recalibrate: manualCalibrate,
        startAutoCalibration
    };
};
