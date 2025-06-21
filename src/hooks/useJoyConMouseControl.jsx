// src/hooks/useJoyConMouseControl.jsx - スティック値スケール修正版
import { useEffect, useCallback, useRef, useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

export const useJoyConMouseControl = ({
    enabled = false, // デフォルトを無効に変更
    sensitivity = 0.2, // 感度を少し上げる
    deadzone = 0.2, // デッドゾーンを20%に調整
    showCursor = true
}) => {
    const { inputState, isConnected } = useJoyConContext();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);
    const animationFrameRef = useRef(null);
    const lastButtonStateRef = useRef({});
    const velocityRef = useRef({ x: 0, y: 0 });
    const [calibrationOffset, setCalibrationOffset] = useState({ x: -2, y: 2 }); // 固定値を初期キャリブレーションに設定
    const [mouseControlEnabled, setMouseControlEnabled] = useState(false); // マウス制御の手動有効化
    const cursorRef = useRef(null); // カーソル要素の参照

    // スティックの中央値をキャリブレーション
    useEffect(() => {
        if (enabled && isConnected && inputState.leftStick) {
            // 少し遅延を入れてから安定した値でキャリブレーション
            const timer = setTimeout(() => {
                const currentStick = inputState.leftStick;
                const newOffset = {
                    x: parseFloat(currentStick.x) || 0,
                    y: parseFloat(currentStick.y) || 0
                };

                setCalibrationOffset(newOffset);
                // マウス位置を画面中央に設定
                setMousePosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2
                });

                console.log('Joy-Con calibrated to:', newOffset);
            }, 1000); // 1秒待ってからキャリブレーション

            return () => clearTimeout(timer);
        }
    }, [enabled, isConnected]);

    // カスタムカーソルを作成・管理
    useEffect(() => {
        if (!showCursor) return;

        // カスタムカーソル要素を作成
        const cursor = document.createElement('div');
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: rgba(255, 0, 0, 0.8);
            border: 2px solid white;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: opacity 0.2s ease;
        `;
        cursor.id = 'joy-con-cursor';
        document.body.appendChild(cursor);
        cursorRef.current = cursor;

        // 初期位置を画面中央に設定
        const updateCursorPosition = () => {
            if (cursorRef.current) {
                cursorRef.current.style.left = `${mousePosition.x}px`;
                cursorRef.current.style.top = `${mousePosition.y}px`;
                cursorRef.current.style.opacity = mouseControlEnabled ? '1' : '0.3';
            }
        };

        updateCursorPosition();

        return () => {
            if (cursorRef.current) {
                document.body.removeChild(cursorRef.current);
                cursorRef.current = null;
            }
        };
    }, [showCursor]);

    // マウス位置が変更されたときにカーソル位置を更新
    useEffect(() => {
        if (cursorRef.current) {
            cursorRef.current.style.left = `${mousePosition.x}px`;
            cursorRef.current.style.top = `${mousePosition.y}px`;
            cursorRef.current.style.opacity = mouseControlEnabled ? '1' : '0.3';
        }
    }, [mousePosition, mouseControlEnabled]);

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
        if (!stick) return { x: 0, y: 0 };

        // Joy-Conのスティック値は文字列の場合があるので数値に変換
        const rawX = parseFloat(stick.x) || 0;
        const rawY = parseFloat(stick.y) || 0;

        console.log('Raw stick input:', { rawX, rawY, calibrationOffset });

        // キャリブレーションオフセットを適用
        let adjustedX = rawX - calibrationOffset.x;
        let adjustedY = rawY - calibrationOffset.y;

        // デバッグ: 調整後の値をログ出力
        console.log('Adjusted stick input:', { adjustedX, adjustedY });

        // より厳しい最小値チェック（0.2未満は完全に無視）
        if (Math.abs(adjustedX) < 0.2) adjustedX = 0;
        if (Math.abs(adjustedY) < 0.2) adjustedY = 0;

        // 実際のJoy-Con値範囲に基づいて正規化
        // X軸: -1.4 〜 1.1 (範囲幅: 2.5)
        // Y軸: -1.0 〜 0.9 (範囲幅: 1.9)
        const xRange = { min: -1.4, max: 1.1 };
        const yRange = { min: -1.0, max: 0.9 };

        // 調整後の値を-1〜1に正規化
        let normalizedX = 0;
        let normalizedY = 0;

        // X軸の正規化（より安全な方法）
        if (Math.abs(adjustedX) > 0.2) { // しきい値を0.2に下げる
            if (adjustedX > 0) {
                normalizedX = Math.min(1, adjustedX / xRange.max);
            } else {
                normalizedX = Math.max(-1, adjustedX / Math.abs(xRange.min));
            }
        }

        // Y軸の正規化（より安全な方法） - Y軸を反転
        if (Math.abs(adjustedY) > 0.2) { // しきい値を0.2に下げる
            if (adjustedY > 0) {
                // Y軸を反転しない：正の値を正のまま（下方向に移動）
                normalizedY = Math.min(1, adjustedY / yRange.max);
            } else {
                // Y軸を反転しない：負の値を負のまま（上方向に移動）
                normalizedY = Math.max(-1, adjustedY / Math.abs(yRange.min));
            }
        }

        // デッドゾーンを適用（正規化後の値で）
        const magnitude = Math.sqrt(normalizedX ** 2 + normalizedY ** 2);

        // デバッグログを表示（調整後の値が0でない場合のみ）
        if (adjustedX !== 0 || adjustedY !== 0) {
            console.log('Stick processing:', {
                raw: { x: rawX.toFixed(3), y: rawY.toFixed(3) },
                calibration: {
                    x: calibrationOffset.x.toFixed(3),
                    y: calibrationOffset.y.toFixed(3)
                },
                adjusted: { x: adjustedX.toFixed(3), y: adjustedY.toFixed(3) },
                normalized: { x: normalizedX.toFixed(3), y: normalizedY.toFixed(3) },
                magnitude: magnitude.toFixed(3),
                deadzone: deadzone,
                willMove: magnitude >= deadzone
            });
        }

        if (magnitude < deadzone) {
            return { x: 0, y: 0 };
        }

        // デッドゾーン外の値を再スケール
        const scaleFactor = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
        const finalX = normalizedX * scaleFactor;
        const finalY = normalizedY * scaleFactor;

        return { x: finalX, y: finalY };
    }, [calibrationOffset, deadzone]);

    // スムーズなマウス移動の更新
    const updateMousePosition = useCallback(() => {
        if (!enabled || !isConnected || !inputState.leftStick) return; // leftStickの存在チェックを追加

        const normalizedStick = normalizeStickInput(inputState.leftStick);
        const magnitude = Math.sqrt(normalizedStick.x ** 2 + normalizedStick.y ** 2);

        // デバッグ用ログ（重要な情報のみ）
        if (magnitude > 0.05) { // デバッグしきい値を0.05に下げる
            console.log('Movement calculation:', {
                enabled: enabled,
                connected: isConnected,
                normalized: {
                    x: normalizedStick.x.toFixed(3),
                    y: normalizedStick.y.toFixed(3)
                },
                magnitude: magnitude.toFixed(3),
                velocity: {
                    x: (normalizedStick.x * sensitivity * 30).toFixed(1), // 速度計算を更新
                    y: (normalizedStick.y * sensitivity * 30).toFixed(1)
                },
                willMove: magnitude > 0.1 // しきい値を更新
            });
        }

        if (magnitude > 0.1) { // 移動しきい値を0.1に下げる
            // 速度を計算（感度を適用） - 移動量を調整
            const targetVelocityX = normalizedStick.x * sensitivity * 30; // 20から30に少し上げる
            const targetVelocityY = normalizedStick.y * sensitivity * 30;

            // 速度をスムーズに調整
            velocityRef.current.x = velocityRef.current.x * 0.7 + targetVelocityX * 0.3;
            velocityRef.current.y = velocityRef.current.y * 0.7 + targetVelocityY * 0.3;

            // 非常に小さい速度は0にする（振動防止）
            if (Math.abs(velocityRef.current.x) < 0.5) velocityRef.current.x = 0; // 1.0から0.5に下げる
            if (Math.abs(velocityRef.current.y) < 0.5) velocityRef.current.y = 0;

            // マウス位置を更新
            setMousePosition(prev => {
                const newX = Math.max(0, Math.min(window.innerWidth - 1,
                    prev.x + velocityRef.current.x));
                const newY = Math.max(0, Math.min(window.innerHeight - 1,
                    prev.y + velocityRef.current.y));

                // 位置が実際に変わった場合のみマウス移動イベントを発火
                if (Math.abs(newX - prev.x) > 2 || Math.abs(newY - prev.y) > 2) { // しきい値を1から2に上げる
                    fireMouseEvent('mousemove', newX, newY);
                }

                return { x: newX, y: newY };
            });
        } else {
            // スティックが中央にある時は速度を急速に減衰
            velocityRef.current.x *= 0.3;
            velocityRef.current.y *= 0.3;

            // 非常に小さい速度は完全に停止
            if (Math.abs(velocityRef.current.x) < 0.2) velocityRef.current.x = 0; // 0.5から0.2に下げる
            if (Math.abs(velocityRef.current.y) < 0.2) velocityRef.current.y = 0;
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
            // カーソルの視覚フィードバック
            if (cursorRef.current) {
                cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1.2)';
                cursorRef.current.style.background = 'rgba(0, 0, 255, 0.9)';
            }
            fireMouseEvent('mousedown', currentPosition.x, currentPosition.y, 0);
        } else if (!aPressed && aWasPressed) {
            setIsClicking(false);
            // カーソルを元に戻す
            if (cursorRef.current) {
                cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorRef.current.style.background = mouseControlEnabled ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
            }
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

        // Minusボタン: マウス制御のオン/オフ切り替え
        const minusPressed = buttons.minus;
        const minusWasPressed = lastButtonStateRef.current.minus;

        if (minusPressed && !minusWasPressed) {
            setMouseControlEnabled(prev => {
                const newState = !prev;
                console.log('Mouse control:', newState ? 'ENABLED' : 'DISABLED');

                // カーソルの見た目を更新
                if (cursorRef.current) {
                    cursorRef.current.style.opacity = newState ? '1' : '0.3';
                    cursorRef.current.style.background = newState ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
                }

                return newState;
            });
        }

        lastButtonStateRef.current = {
            a: aPressed,
            b: bPressed,
            x: xPressed,
            plus: plusPressed,
            minus: minusPressed
        };

    }, [inputState.buttons, enabled, isConnected, mousePosition, fireMouseEvent, recalibrate]);

    // アニメーションループの管理
    useEffect(() => {
        if (enabled && isConnected) { // mouseControlEnabledチェックを削除
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
    }, [enabled, isConnected, updateMousePosition]); // mouseControlEnabledを依存配列から削除

    return {
        mousePosition,
        isClicking,
        isActive: enabled && isConnected, // 外部のenabledとJoy-Con接続状態のみをチェック
        mouseControlEnabled,
        setMouseControlEnabled,
        enableMouseControl: () => {
            setMouseControlEnabled(true);
            if (cursorRef.current) {
                cursorRef.current.style.opacity = '1';
                cursorRef.current.style.background = 'rgba(0, 255, 0, 0.8)';
            }
        },
        disableMouseControl: () => {
            setMouseControlEnabled(false);
            if (cursorRef.current) {
                cursorRef.current.style.opacity = '0.3';
                cursorRef.current.style.background = 'rgba(255, 0, 0, 0.8)';
            }
        },
        recalibrate,
        calibrationOffset,
        rawStickValue: inputState.leftStick // デバッグ用
    };
};
