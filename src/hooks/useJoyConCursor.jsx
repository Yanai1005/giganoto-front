import { useEffect, useCallback, useRef, useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

export const useJoyConCursor = ({
    enabled = true,
    sensitivity = 0.8, // 感度を上げる
    deadzone = 0.05,   // デッドゾーンを小さくする
    showCursor = true,
    smoothing = 0.85   // スムージング係数を追加
}) => {
    const { inputState, isConnected } = useJoyConContext();

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);

    const animationFrameRef = useRef(null);
    const lastButtonStateRef = useRef({});
    const velocityRef = useRef({ x: 0, y: 0 });
    const cursorRef = useRef(null);
    const lastUpdateTime = useRef(0);

    // デバッグログを大幅に削減
    const debugLogRef = useRef(0);

    const getLeftStick = useCallback(() => {
        if (!inputState?.leftStick) {
            return { x: 0, y: 0 };
        }

        const stick = inputState.leftStick;
        let x = parseFloat(stick.x) || 0;
        let y = parseFloat(stick.y) || 0;

        // NaN チェック
        if (isNaN(x)) x = 0;
        if (isNaN(y)) y = 0;

        // Joy-Conの範囲外値への対応（-2〜2の範囲を期待）
        // JoyConContextで既に正規化されているはずだが、念のため再チェック
        if (Math.abs(x) > 1.5 || Math.abs(y) > 1.5) {
            console.warn('🚨 Extreme values detected in cursor hook:', { x, y });
            x = Math.max(-1.0, Math.min(1.0, x / 2.0));
            y = Math.max(-1.0, Math.min(1.0, y / 2.0));
        }

        // デバッグログ（アクティブな入力のみ）
        debugLogRef.current++;
        if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05) {
            console.log('🎮 Cursor hook - Active LEFT stick:', {
                x: x.toFixed(3),
                y: y.toFixed(3),
                magnitude: Math.sqrt(x * x + y * y).toFixed(3)
            });
        }

        return { x, y };
    }, [inputState]);

    const getButtons = useCallback(() => {
        return inputState?.buttons || {};
    }, [inputState]);

    // 初期マウス位置設定
    useEffect(() => {
        setMousePosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });
    }, []);

    // カーソル要素の作成（視認性重視）
    useEffect(() => {
        if (!showCursor) return;

        // 既存のカーソルを削除
        const existingCursor = document.getElementById('joy-con-cursor');
        if (existingCursor) {
            existingCursor.remove();
        }

        const cursor = document.createElement('div');
        cursor.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            width: 24px !important;
            height: 24px !important;
            background: radial-gradient(circle, #00ff00 0%, #00cc00 50%, #009900 100%) !important;
            border: 3px solid #ffffff !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            z-index: 999999 !important;
            transform: translate(-50%, -50%) !important;
            will-change: transform !important;
            box-shadow: 
                0 0 12px rgba(0, 255, 0, 0.8),
                0 0 24px rgba(0, 255, 0, 0.4),
                inset 0 2px 4px rgba(255, 255, 255, 0.3) !important;
            opacity: 1 !important;
            display: block !important;
            visibility: visible !important;
        `;

        cursor.id = 'joy-con-cursor';
        document.body.appendChild(cursor);
        cursorRef.current = cursor;

        // カーソルが確実に作成されたことをログ出力
        console.log('✅ Joy-Con cursor created:', {
            element: cursor,
            position: cursor.getBoundingClientRect(),
            styles: window.getComputedStyle(cursor),
            visible: cursor.offsetParent !== null
        });

        // 初期位置を画面中央に設定
        cursor.style.left = `${window.innerWidth / 2}px`;
        cursor.style.top = `${window.innerHeight / 2}px`;

        return () => {
            if (cursorRef.current && document.body.contains(cursorRef.current)) {
                document.body.removeChild(cursorRef.current);
                cursorRef.current = null;
                console.log('🗑️ Joy-Con cursor removed');
            }
        };
    }, [showCursor]);

    // カーソル位置更新（確実な表示）
    useEffect(() => {
        if (cursorRef.current) {
            // left/topプロパティを直接設定（より確実）
            cursorRef.current.style.left = `${mousePosition.x}px`;
            cursorRef.current.style.top = `${mousePosition.y}px`;

            // 接続状態に応じた視覚的フィードバック
            if (enabled && isConnected) {
                cursorRef.current.style.opacity = '1';
                cursorRef.current.style.background = 'radial-gradient(circle, #00ff00 0%, #00cc00 50%, #009900 100%)';
                cursorRef.current.style.borderColor = '#ffffff';
            } else {
                cursorRef.current.style.opacity = '0.5';
                cursorRef.current.style.background = 'radial-gradient(circle, #808080 0%, #606060 50%, #404040 100%)';
                cursorRef.current.style.borderColor = '#cccccc';
            }

            // 位置更新をログ出力（確認用）
            if (Math.abs(velocityRef.current.x) > 0.1 || Math.abs(velocityRef.current.y) > 0.1) {
                console.log('🎯 Cursor position update:', {
                    x: mousePosition.x.toFixed(1),
                    y: mousePosition.y.toFixed(1),
                    velocityX: velocityRef.current.x.toFixed(3),
                    velocityY: velocityRef.current.y.toFixed(3),
                    visible: cursorRef.current.offsetParent !== null
                });
            }
        }
    }, [mousePosition, enabled, isConnected]);

    // マウスイベント発火の最適化
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

    // スティック入力の正規化（Y軸問題対応版）
    const normalizeStickInput = useCallback((stick) => {
        if (!stick) return { x: 0, y: 0 };

        let x = parseFloat(stick.x) || 0;
        let y = parseFloat(stick.y) || 0;

        if (isNaN(x)) x = 0;
        if (isNaN(y)) y = 0;

        // 極端な値の検出と修正
        if (Math.abs(x) > 2.0) x = Math.sign(x) * 1.0;
        if (Math.abs(y) > 2.0) y = Math.sign(y) * 1.0;

        // Y軸特有の問題：値が取得できていない場合の代替処理
        const magnitude = Math.sqrt(x * x + y * y);

        // Y軸のデバッグ情報
        if (Math.abs(x) > 0.02 || Math.abs(y) > 0.02) {
            console.log('🔍 Normalizing input:', {
                rawX: x.toFixed(3),
                rawY: y.toFixed(3),
                magnitude: magnitude.toFixed(3),
                deadzone: deadzone,
                willPassDeadzone: magnitude > deadzone
            });
        }

        // デッドゾーン適用
        if (magnitude < deadzone) {
            return { x: 0, y: 0 };
        }

        // デッドゾーン補正
        const adjustedMagnitude = Math.min(1, (magnitude - deadzone) / (1.0 - deadzone));

        // Y軸を重視した応答カーブ
        let responseCurve = adjustedMagnitude;

        // 小さな入力でも確実に反応するように調整
        if (adjustedMagnitude < 0.3) {
            responseCurve = adjustedMagnitude * 1.5; // Y軸の反応を向上
        } else {
            responseCurve = 0.45 + (adjustedMagnitude - 0.3) * 0.8;
        }

        responseCurve = Math.min(1.0, responseCurve);

        const angle = Math.atan2(y, x);
        const normalizedX = Math.cos(angle) * responseCurve;
        const normalizedY = Math.sin(angle) * responseCurve;

        // Y軸の動きを特に詳しくログ出力
        if (Math.abs(normalizedY) > 0.01) {
            console.log('✅ Y-axis movement detected:', {
                rawY: y.toFixed(3),
                normalizedY: normalizedY.toFixed(3),
                responseCurve: responseCurve.toFixed(3),
                angle: (angle * 180 / Math.PI).toFixed(1) + '°'
            });
        }

        return {
            x: normalizedX,
            y: normalizedY
        };
    }, [deadzone]);

    // 高性能アニメーションループ
    const updateMousePosition = useCallback((currentTime) => {
        if (!enabled || !isConnected) {
            animationFrameRef.current = requestAnimationFrame(updateMousePosition);
            return;
        }

        // フレームレート制限（60FPS）
        if (currentTime - lastUpdateTime.current < 16.67) {
            animationFrameRef.current = requestAnimationFrame(updateMousePosition);
            return;
        }

        const stick = getLeftStick();
        const normalizedStick = normalizeStickInput(stick);
        const inputMagnitude = Math.sqrt(normalizedStick.x ** 2 + normalizedStick.y ** 2);

        if (inputMagnitude > 0.001) {
            // Y軸を重視したスケールファクター
            const baseSpeedX = 6.0; // X軸の基本速度
            const baseSpeedY = 8.0; // Y軸の基本速度を上げる
            const speedMultiplier = 1 + (inputMagnitude * 2.5); // 速度倍率を上げる

            const targetVelocityX = normalizedStick.x * sensitivity * baseSpeedX * speedMultiplier;
            const targetVelocityY = normalizedStick.y * sensitivity * baseSpeedY * speedMultiplier;

            // Y軸の動きを特に詳しくログ
            if (Math.abs(normalizedStick.y) > 0.01) {
                console.log('🎯 Y-axis velocity calculation:', {
                    normalizedY: normalizedStick.y.toFixed(3),
                    sensitivity: sensitivity,
                    baseSpeedY: baseSpeedY,
                    speedMultiplier: speedMultiplier.toFixed(2),
                    targetVelocityY: targetVelocityY.toFixed(3)
                });
            }

            // 適応的スムージング（Y軸を優遇）
            const dynamicSmoothingX = smoothing - (inputMagnitude * 0.3);
            const dynamicSmoothingY = smoothing - (inputMagnitude * 0.4); // Y軸のスムージングを少し緩く

            velocityRef.current.x = velocityRef.current.x * dynamicSmoothingX + targetVelocityX * (1 - dynamicSmoothingX);
            velocityRef.current.y = velocityRef.current.y * dynamicSmoothingY + targetVelocityY * (1 - dynamicSmoothingY);

            // Y軸の最終速度をログ出力
            if (Math.abs(velocityRef.current.y) > 0.1) {
                console.log('🚀 Final Y velocity:', velocityRef.current.y.toFixed(3));
            }
        } else {
            // 慣性減衰
            velocityRef.current.x *= 0.92;
            velocityRef.current.y *= 0.92;

            // 小さな値のクリア
            if (Math.abs(velocityRef.current.x) < 0.01) velocityRef.current.x = 0;
            if (Math.abs(velocityRef.current.y) < 0.01) velocityRef.current.y = 0;
        }

        // マウス位置更新（Y軸の動きを詳しく追跡）
        setMousePosition(prev => {
            const newX = Math.max(0, Math.min(window.innerWidth - 1, prev.x + velocityRef.current.x));
            const newY = Math.max(0, Math.min(window.innerHeight - 1, prev.y + velocityRef.current.y));

            // Y軸の変化を詳しくログ
            if (Math.abs(newY - prev.y) > 0.5) {
                console.log('📍 Y position update:', {
                    prevY: prev.y.toFixed(1),
                    newY: newY.toFixed(1),
                    deltaY: (newY - prev.y).toFixed(1),
                    velocityY: velocityRef.current.y.toFixed(3)
                });
            }

            // mousemoveイベント発火（移動があった場合のみ）
            if (Math.abs(newX - prev.x) > 0.5 || Math.abs(newY - prev.y) > 0.5) {
                fireMouseEvent('mousemove', newX, newY);
            }

            return { x: newX, y: newY };
        });

        lastUpdateTime.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(updateMousePosition);
    }, [enabled, isConnected, getLeftStick, normalizeStickInput, sensitivity, smoothing, fireMouseEvent]);

    // ボタン処理（最適化）
    useEffect(() => {
        if (!enabled || !isConnected) return;

        const buttons = getButtons();
        const currentPosition = mousePosition;

        // Aボタン（左クリック）
        const aPressed = buttons.a || false;
        const aWasPressed = lastButtonStateRef.current.a || false;

        if (aPressed && !aWasPressed) {
            setIsClicking(true);
            if (cursorRef.current) {
                cursorRef.current.style.transform += ' scale(1.2)';
            }
            fireMouseEvent('mousedown', currentPosition.x, currentPosition.y, 0);
        } else if (!aPressed && aWasPressed) {
            setIsClicking(false);
            if (cursorRef.current) {
                cursorRef.current.style.transform = cursorRef.current.style.transform.replace(' scale(1.2)', '');
            }
            const element = fireMouseEvent('mouseup', currentPosition.x, currentPosition.y, 0);
            fireMouseEvent('click', currentPosition.x, currentPosition.y, 0);

            // フォーカス処理
            if (element && (element.tabIndex >= 0 ||
                ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName))) {
                element.focus();
            }
        }

        // Bボタン（右クリック）
        const bPressed = buttons.b || false;
        const bWasPressed = lastButtonStateRef.current.b || false;

        if (bPressed && !bWasPressed) {
            fireMouseEvent('contextmenu', currentPosition.x, currentPosition.y, 2);
        }

        lastButtonStateRef.current = {
            a: aPressed,
            b: bPressed
        };

    }, [enabled, isConnected, getButtons, mousePosition, fireMouseEvent]);

    // アニメーションループ開始
    useEffect(() => {
        if (enabled && isConnected) {
            animationFrameRef.current = requestAnimationFrame(updateMousePosition);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [enabled, isConnected, updateMousePosition]);

    return {
        mousePosition,
        isClicking,
        isActive: enabled && isConnected,
        isCalibrating: false,
        isCalibrated: true,
        calibrationOffset: { x: 0, y: 0 },
        recalibrate: () => { },
        startAutoCalibration: () => { },
        // デバッグ用の追加情報
        cursorVisible: cursorRef.current ? cursorRef.current.offsetParent !== null : false,
        cursorElement: cursorRef.current
    };
};
