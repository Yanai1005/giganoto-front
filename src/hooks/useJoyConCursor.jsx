import { useEffect, useCallback, useRef, useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

export const useJoyConCursor = ({
    enabled = true,
    sensitivity = 0.3,
    deadzone = 0.08, // デッドゾーンを0.18から0.08に下げてより敏感に
    showCursor = true,
    autoCalibrate = false, // キャリブレーション機能を無効化
    calibrationTime = 3000
}) => {
    const { inputState, isConnected } = useJoyConContext();

    // デバッグ用：JoyConの接続状態とinputStateを定期的にログ出力
    useEffect(() => {
        const debugInterval = setInterval(() => {
            // デバッグログの頻度を減らしてパフォーマンス向上
            if (enabled && isConnected) {
                console.log('🎮 JoyCon Status (NATURAL CURSOR MODE):', {
                    enabled,
                    isConnected,
                    hasInputState: !!inputState,
                    hasLeftStick: !!(inputState?.leftStick),
                    leftStickValues: inputState?.leftStick
                });
            }
        }, 10000); // 5秒ごと → 10秒ごとに変更

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
            width: 18px;
            height: 18px;
            background: radial-gradient(circle, rgba(0, 255, 100, 0.9) 0%, rgba(0, 200, 80, 0.7) 100%);
            border: 2px solid rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: all 0.1s ease-out;
            box-shadow: 
                0 0 8px rgba(0, 255, 100, 0.4),
                0 2px 6px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(1px);
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
            // より美しい視覚的フィードバック
            cursorRef.current.style.background = enabled && isConnected ?
                'radial-gradient(circle, rgba(0, 255, 100, 0.9) 0%, rgba(0, 200, 80, 0.7) 100%)' :
                'radial-gradient(circle, rgba(128, 128, 128, 0.6) 0%, rgba(100, 100, 100, 0.4) 100%)';
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

        // デッドゾーン適用（滑らかな開始のため）
        const magnitude = Math.sqrt(adjustedX * adjustedX + adjustedY * adjustedY);
        if (magnitude < deadzone) {
            return { x: 0, y: 0 };
        }

        // デッドゾーン境界での滑らかな移行
        const adjustedMagnitude = (magnitude - deadzone) / (1.0 - deadzone);
        const clampedMagnitude = Math.min(1, adjustedMagnitude);

        // より反応しやすい応答カーブを適用（適度なバランス）
        let responseCurve;
        if (clampedMagnitude < 0.5) {
            // 小さな動きでも適度に反応するよう調整
            responseCurve = clampedMagnitude * clampedMagnitude * 1.5; // 0.8から1.5に上げて反応性向上
        } else {
            // 大きな動きでも適切に反応
            const t = (clampedMagnitude - 0.5) * 2.0;
            const smoothStep = t * t * (3.0 - 2.0 * t);
            responseCurve = 0.375 + smoothStep * 0.625; // 最大値を1.0に戻す
        }

        const angle = Math.atan2(adjustedY, adjustedX);
        const normalizedX = Math.cos(angle) * responseCurve;
        const normalizedY = Math.sin(angle) * responseCurve;

        // デバッグ情報（重要な変化のみ表示）
        if (magnitude > deadzone + 0.02) { // 閾値を下げて反応をより確認しやすく
            console.log('🎮 LEFT Stick - Balanced cursor control:', {
                raw: { x: adjustedX.toFixed(3), y: adjustedY.toFixed(3) },
                magnitude: magnitude.toFixed(3),
                responseCurve: responseCurve.toFixed(3),
                normalized: { x: normalizedX.toFixed(3), y: normalizedY.toFixed(3) }
            });
        }

        return { x: normalizedX, y: normalizedY };
    }, [deadzone]);

    // Update mouse position based on stick input
    const updateMousePosition = useCallback((frameCount = 0) => {
        if (!enabled || !isConnected) {
            return;
        }

        const stick = getLeftStick();
        const normalizedStick = normalizeStickInput(stick);
        const magnitude = Math.sqrt(normalizedStick.x ** 2 + normalizedStick.y ** 2); if (magnitude > 0.005) { // 閾値を下げて反応しやすく
            // バランスの取れた速度計算
            const baseSpeed = 0.1; // 0.06から0.1に上げて適度な速度に
            const targetVelocityX = normalizedStick.x * sensitivity * baseSpeed;
            const targetVelocityY = normalizedStick.y * sensitivity * baseSpeed;

            // 適度なスムージング（反応と滑らかさのバランス）
            const inputMagnitude = Math.sqrt(normalizedStick.x ** 2 + normalizedStick.y ** 2);
            const baseSmoothingFactor = 0.15; // 0.1から0.15に上げて適度な反応性
            const adaptiveSmoothingFactor = baseSmoothingFactor + (inputMagnitude * 0.1); // 0.05から0.1に上げる

            velocityRef.current.x = velocityRef.current.x * (1 - adaptiveSmoothingFactor) + targetVelocityX * adaptiveSmoothingFactor;
            velocityRef.current.y = velocityRef.current.y * (1 - adaptiveSmoothingFactor) + targetVelocityY * adaptiveSmoothingFactor;

            // デバッグログを減らしてパフォーマンス向上
            if (frameCount % 60 === 0) { // 60フレームごと（1秒ごと）
                console.log('🖱️ Balanced velocity calculated:', {
                    normalizedStick,
                    inputMagnitude: inputMagnitude.toFixed(3),
                    adaptiveSmoothingFactor: adaptiveSmoothingFactor.toFixed(3),
                    target: { x: targetVelocityX.toFixed(3), y: targetVelocityY.toFixed(3) },
                    smoothed: { x: velocityRef.current.x.toFixed(3), y: velocityRef.current.y.toFixed(3) }
                });
            } setMousePosition(prev => {
                const newX = Math.max(0, Math.min(window.innerWidth - 1,
                    prev.x + velocityRef.current.x));
                const newY = Math.max(0, Math.min(window.innerHeight - 1,
                    prev.y + velocityRef.current.y));

                // 細かいマウスイベント発火（滑らかさ向上）
                if (Math.abs(newX - prev.x) > 0.05 || Math.abs(newY - prev.y) > 0.05) {
                    fireMouseEvent('mousemove', newX, newY);
                }

                return { x: newX, y: newY };
            });
        } else {
            // 適度な減速（バランスの取れた停止感）
            const currentVelocityMagnitude = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.y ** 2);

            // バランスの取れた減速率
            let decelerationFactor;
            if (currentVelocityMagnitude > 0.2) {
                decelerationFactor = 0.9; // 高速時は適度な減速
            } else if (currentVelocityMagnitude > 0.05) {
                decelerationFactor = 0.93; // 中速時は緩やかな減速
            } else {
                decelerationFactor = 0.96; // 低速時は緩やかな減速
            }

            velocityRef.current.x *= decelerationFactor;
            velocityRef.current.y *= decelerationFactor;

            // 慣性による継続移動
            if (Math.abs(velocityRef.current.x) > 0.002 || Math.abs(velocityRef.current.y) > 0.002) {
                setMousePosition(prev => {
                    const newX = Math.max(0, Math.min(window.innerWidth - 1,
                        prev.x + velocityRef.current.x));
                    const newY = Math.max(0, Math.min(window.innerHeight - 1,
                        prev.y + velocityRef.current.y));

                    // 慣性移動でも滑らかなマウスイベント
                    if (Math.abs(newX - prev.x) > 0.02 || Math.abs(newY - prev.y) > 0.02) {
                        fireMouseEvent('mousemove', newX, newY);
                    }

                    return { x: newX, y: newY };
                });
            }

            // 適度な閾値で滑らかな停止
            if (Math.abs(velocityRef.current.x) < 0.002) velocityRef.current.x = 0;
            if (Math.abs(velocityRef.current.y) < 0.002) velocityRef.current.y = 0;
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

    // 高品質60FPSアニメーションループ（自然で滑らかな動き）
    useEffect(() => {
        let lastFrameTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;
        let frameCount = 0;

        const animate = (currentTime) => {
            frameCount++;

            // ログを大幅に削減（30秒ごと）
            if (frameCount % 1800 === 0) { // 60FPS × 30秒 = 1800フレーム
                console.log('🔄 Smooth animation running:', {
                    enabled,
                    isConnected,
                    frameCount,
                    fps: (1000 / (currentTime - lastFrameTime)).toFixed(1)
                });
            }

            if (currentTime - lastFrameTime >= frameInterval) {
                if (enabled && isConnected) {
                    updateMousePosition(frameCount);
                }
                lastFrameTime = currentTime;
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        if (enabled && isConnected) {
            console.log('🔄 Starting natural cursor animation loop');
            animationFrameRef.current = requestAnimationFrame(animate);
        }

        return () => {
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
