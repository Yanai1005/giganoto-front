import { useEffect, useCallback, useRef, useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

export const useJoyConCursor = ({
    enabled = true,
    sensitivity = 0.8,
    deadzone = 0.4,  // デッドゾーンを0.2に変更（参考コードに合わせる）
    showCursor = true,
    smoothing = 0.85,
    invertY = true
}) => {
    const { inputState, isConnected } = useJoyConContext();

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);

    const animationFrameRef = useRef(null);
    const lastButtonStateRef = useRef({});
    const velocityRef = useRef({ x: 0, y: 0 });
    const cursorRef = useRef(null);
    const lastUpdateTime = useRef(0);
    const isInitializedRef = useRef(false);

    // 初期マウス位置を画面中央に設定
    useEffect(() => {
        if (!isInitializedRef.current) {
            setMousePosition({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            });
            isInitializedRef.current = true;
        }
    }, []);

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

        // 参考コードに合わせた正規化処理
        if (Math.abs(x) > 2 || Math.abs(y) > 2) {
            x = Math.max(-1, Math.min(1, x / 2));
            y = Math.max(-1, Math.min(1, y / 2));
        }

        // デッドゾーン適用（参考コードに合わせる）
        if (Math.abs(x) <= deadzone) x = 0;
        if (Math.abs(y) <= deadzone) y = 0;

        // Y軸の反転制御（Joy-Conの上方向を画面上方向に）
        if (invertY) {
            y = -y;
        }

        return { x, y };
    }, [inputState, deadzone, invertY]);

    const getButtons = useCallback(() => {
        return inputState?.buttons || {};
    }, [inputState]);

    // カーソル要素の作成
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

        // 初期位置を画面中央に設定
        cursor.style.left = `${window.innerWidth / 2}px`;
        cursor.style.top = `${window.innerHeight / 2}px`;

        return () => {
            if (cursorRef.current && document.body.contains(cursorRef.current)) {
                document.body.removeChild(cursorRef.current);
                cursorRef.current = null;
            }
        };
    }, [showCursor]);

    // カーソル位置更新
    useEffect(() => {
        if (cursorRef.current) {
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
        }
    }, [mousePosition, enabled, isConnected]);

    // マウスイベント発火
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

    // スティック入力の正規化（参考コードに合わせる）
    const normalizeStickInput = useCallback((stick) => {
        if (!stick) return { x: 0, y: 0 };

        let x = parseFloat(stick.x) || 0;
        let y = parseFloat(stick.y) || 0;

        if (isNaN(x)) x = 0;
        if (isNaN(y)) y = 0;

        // 参考コードに合わせた正規化
        if (Math.abs(x) > 2) x = Math.max(-1, Math.min(1, x / 2));
        if (Math.abs(y) > 2) y = Math.max(-1, Math.min(1, y / 2));

        // デッドゾーン適用
        if (Math.abs(x) <= deadzone) x = 0;
        if (Math.abs(y) <= deadzone) y = 0;

        return { x, y };
    }, [deadzone]);

    // マウス位置更新（参考コードの処理に合わせる）
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
            // 参考コードに合わせた速度計算
            const baseSpeed = 6.0;
            const speedMultiplier = 1 + (inputMagnitude * 2.5);

            const targetVelocityX = normalizedStick.x * sensitivity * baseSpeed * speedMultiplier;
            const targetVelocityY = normalizedStick.y * sensitivity * baseSpeed * speedMultiplier;

            // スムージング適用
            velocityRef.current.x = velocityRef.current.x * smoothing + targetVelocityX * (1 - smoothing);
            velocityRef.current.y = velocityRef.current.y * smoothing + targetVelocityY * (1 - smoothing);
        } else {
            // 慣性減衰
            velocityRef.current.x *= 0.92;
            velocityRef.current.y *= 0.92;

            // 小さな値のクリア
            if (Math.abs(velocityRef.current.x) < 0.01) velocityRef.current.x = 0;
            if (Math.abs(velocityRef.current.y) < 0.01) velocityRef.current.y = 0;
        }

        // マウス位置更新
        setMousePosition(prev => {
            const newX = Math.max(0, Math.min(window.innerWidth - 1, prev.x + velocityRef.current.x));
            const newY = Math.max(0, Math.min(window.innerHeight - 1, prev.y + velocityRef.current.y));

            // mousemoveイベント発火（移動があった場合のみ）
            if (Math.abs(newX - prev.x) > 0.5 || Math.abs(newY - prev.y) > 0.5) {
                fireMouseEvent('mousemove', newX, newY);
            }

            return { x: newX, y: newY };
        });

        lastUpdateTime.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(updateMousePosition);
    }, [enabled, isConnected, getLeftStick, normalizeStickInput, sensitivity, smoothing, fireMouseEvent]);

    // ボタン処理
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
        cursorVisible: cursorRef.current ? cursorRef.current.offsetParent !== null : false,
        cursorElement: cursorRef.current
    };
};
