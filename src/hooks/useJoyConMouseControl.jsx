// src/hooks/useJoyConMouseControl.jsx - スティック値スケール修正版
import { useEffect, useCallback, useRef, useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

export const useJoyConMouseControl = ({
    enabled = true,
    sensitivity = 0.3, // 感度を大幅に下げる
    deadzone = 3.0, // デッドゾーンを大きく（Joy-Conの値は-100〜100程度の範囲）
    showCursor = true
}) => {
    const { inputState, isConnected } = useJoyConContext();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);
    const animationFrameRef = useRef(null);
    const lastButtonStateRef = useRef({});
    const velocityRef = useRef({ x: 0, y: 0 });
    const [calibrationOffset, setCalibrationOffset] = useState({ x: 0, y: 0 });

    // スティックの中央値をキャリブレーション
    useEffect(() => {
        if (enabled && isConnected) {
            // 接続時に現在のスティック位置を中央として記録
            const currentStick = inputState.leftStick;
            setCalibrationOffset({
                x: currentStick.x || 0,
                y: currentStick.y || 0
            });

            // マウス位置を画面中央に設定
            setMousePosition({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            });

            console.log('Joy-Con calibrated to:', currentStick);
        }
    }, [enabled, isConnected]);

    // マウスイベントを発火する関数
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

    // スティック入力を正規化（Joy-Conの実際の値範囲に対応）
    const normalizeStickInput = useCallback((stick) => {
        // Joy-Conのスティック値は文字列の場合があるので数値に変換
        const rawX = parseFloat(stick.x) || 0;
        const rawY = parseFloat(stick.y) || 0;

        // キャリブレーションオフセットを適用
        const adjustedX = rawX - calibrationOffset.x;
        const adjustedY = rawY - calibrationOffset.y;

        console.log('Stick processing:', {
            raw: { x: rawX, y: rawY },
            offset: calibrationOffset,
            adjusted: { x: adjustedX, y: adjustedY }
        });

        // 大きなデッドゾーンを適用
        const magnitude = Math.sqrt(adjustedX ** 2 + adjustedY ** 2);

        if (magnitude < deadzone) {
            return { x: 0, y: 0 };
        }

        // Joy-Conの値範囲（おそらく-100〜100程度）を-1〜1に正規化
        const maxRange = 100; // Joy-Conの最大値を仮定
        const normalizedX = Math.max(-1, Math.min(1, adjustedX / maxRange));
        const normalizedY = Math.max(-1, Math.min(1, adjustedY / maxRange));

        // デッドゾーン外の値を再スケール
        const scaleFactor = (magnitude - deadzone) / (maxRange - deadzone);
        const finalX = normalizedX * Math.min(1, scaleFactor);
        const finalY = normalizedY * Math.min(1, scaleFactor);

        return { x: finalX, y: finalY };
    }, [calibrationOffset, deadzone]);

    // スムーズなマウス移動の更新
    const updateMousePosition = useCallback(() => {
        if (!enabled || !isConnected) return;

        const normalizedStick = normalizeStickInput(inputState.leftStick);
        const magnitude = Math.sqrt(normalizedStick.x ** 2 + normalizedStick.y ** 2);

        // デバッグ用ログ
        if (magnitude > 0.05) {
            console.log('Movement calculation:', {
                normalized: normalizedStick,
                magnitude,
                sensitivity
            });
        }

        if (magnitude > 0.05) {
            // 速度を計算（感度を適用）
            const targetVelocityX = normalizedStick.x * sensitivity * 100; // 100倍してピクセル単位に
            const targetVelocityY = normalizedStick.y * sensitivity * 100;

            // 速度をスムーズに調整
            velocityRef.current.x = velocityRef.current.x * 0.7 + targetVelocityX * 0.3;
            velocityRef.current.y = velocityRef.current.y * 0.7 + targetVelocityY * 0.3;

            // 非常に小さい速度は0にする（振動防止）
            if (Math.abs(velocityRef.current.x) < 0.5) velocityRef.current.x = 0;
            if (Math.abs(velocityRef.current.y) < 0.5) velocityRef.current.y = 0;

            // マウス位置を更新
            setMousePosition(prev => {
                const newX = Math.max(0, Math.min(window.innerWidth - 1,
                    prev.x + velocityRef.current.x));
                const newY = Math.max(0, Math.min(window.innerHeight - 1,
                    prev.y + velocityRef.current.y));

                // 位置が実際に変わった場合のみマウス移動イベントを発火
                if (Math.abs(newX - prev.x) > 1 || Math.abs(newY - prev.y) > 1) {
                    fireMouseEvent('mousemove', newX, newY);
                }

                return { x: newX, y: newY };
            });
        } else {
            // スティックが中央にある時は速度を急速に減衰
            velocityRef.current.x *= 0.3;
            velocityRef.current.y *= 0.3;

            // 非常に小さい速度は完全に停止
            if (Math.abs(velocityRef.current.x) < 0.1) velocityRef.current.x = 0;
            if (Math.abs(velocityRef.current.y) < 0.1) velocityRef.current.y = 0;
        }

        animationFrameRef.current = requestAnimationFrame(updateMousePosition);
    }, [enabled, isConnected, normalizeStickInput, inputState.leftStick, sensitivity, fireMouseEvent]);

    // 手動でキャリブレーションをリセットする関数
    const recalibrate = useCallback(() => {
        if (isConnected && inputState.leftStick) {
            const currentStick = inputState.leftStick;
            const newOffset = {
                x: parseFloat(currentStick.x) || 0,
                y: parseFloat(currentStick.y) || 0
            };

            setCalibrationOffset(newOffset);

            // 速度もリセット
            velocityRef.current = { x: 0, y: 0 };

            console.log('Joy-Con recalibrated to:', newOffset);
        }
    }, [isConnected, inputState.leftStick]);

    // ボタン入力の処理
    useEffect(() => {
        if (!enabled || !isConnected) return;

        const buttons = inputState.buttons || {};
        const currentPosition = mousePosition;

        // Aボタン: 左クリック
        const aPressed = buttons.a;
        const aWasPressed = lastButtonStateRef.current.a;

        if (aPressed && !aWasPressed) {
            setIsClicking(true);
            fireMouseEvent('mousedown', currentPosition.x, currentPosition.y, 0);
        } else if (!aPressed && aWasPressed) {
            setIsClicking(false);
            const element = fireMouseEvent('mouseup', currentPosition.x, currentPosition.y, 0);
            fireMouseEvent('click', currentPosition.x, currentPosition.y, 0);

            if (element && (element.tabIndex >= 0 ||
                ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName))) {
                element.focus();
            }
        }

        // Bボタン: 右クリック
        const bPressed = buttons.b;
        const bWasPressed = lastButtonStateRef.current.b;

        if (bPressed && !bWasPressed) {
            fireMouseEvent('contextmenu', currentPosition.x, currentPosition.y, 2);
        }

        // Xボタン: ダブルクリック
        const xPressed = buttons.x;
        const xWasPressed = lastButtonStateRef.current.x;

        if (xPressed && !xWasPressed) {
            fireMouseEvent('dblclick', currentPosition.x, currentPosition.y, 0);
        }

        // Plusボタン: キャリブレーションリセット
        const plusPressed = buttons.plus;
        const plusWasPressed = lastButtonStateRef.current.plus;

        if (plusPressed && !plusWasPressed) {
            recalibrate();
        }

        lastButtonStateRef.current = {
            a: aPressed,
            b: bPressed,
            x: xPressed,
            plus: plusPressed
        };

    }, [inputState.buttons, enabled, isConnected, mousePosition, fireMouseEvent, recalibrate]);

    // アニメーションループの管理
    useEffect(() => {
        if (enabled && isConnected) {
            animationFrameRef.current = requestAnimationFrame(updateMousePosition);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
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
        recalibrate,
        calibrationOffset,
        rawStickValue: inputState.leftStick // デバッグ用
    };
};
