import { useEffect, useCallback, useRef, useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

export const useJoyConMouseControl = ({
    enabled = false,
    sensitivity = 0.2, // マウス移動の感度
    deadzone = 0.05,    // ユーザーが調整可能なデッドゾーン（0.0～1.0の範囲で設定）
    showCursor = true
}) => {
    const { inputState, isConnected } = useJoyConContext();
    const [mousePosition, setMousePosition] = useState({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    });
    const [isClicking, setIsClicking] = useState(false);
    const animationFrameRef = useRef(null);
    const lastButtonStateRef = useRef({});
    const velocityRef = useRef({ x: 0, y: 0 });
    // キャリブレーションオフセットの初期値を設定し、未キャリブレーション状態を明確にする
    const [calibrationOffset, setCalibrationOffset] = useState(null);
    const [mouseControlEnabled, setMouseControlEnabled] = useState(true);
    const cursorRef = useRef(null);

    // スティックの中央値をキャリブレーション
    // Joy-Con接続時、およびenabledがtrueになった時に一度だけ自動キャリブレーションを実行
    useEffect(() => {
        // enabledかつ接続済みで、まだキャリブレーションされてない場合のみ実行
        if (enabled && isConnected && inputState.leftStick && calibrationOffset === null) {
            const timer = setTimeout(() => {
                const currentStick = inputState.leftStick;
                const newOffset = {
                    x: parseFloat(currentStick.x) || 0,
                    y: parseFloat(currentStick.y) || 0
                };

                setCalibrationOffset(newOffset);
                velocityRef.current = { x: 0, y: 0 }; // 速度をリセットしてドリフトを防ぐ

                // カーソル位置は画面中央に設定
                setMousePosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2
                });

                console.log('Joy-Con initial calibration successful:', newOffset);
                console.log('Mouse position initialized to center:', {
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2
                });
            }, 1500); // Joy-Conが安定するまで少し長めに待つ

            return () => clearTimeout(timer);
        }
    }, [enabled, isConnected, inputState.leftStick, calibrationOffset]); // calibrationOffsetを依存配列に追加

    // カスタムカーソルを作成・管理
    useEffect(() => {
        if (!showCursor) {
            if (cursorRef.current) {
                document.body.removeChild(cursorRef.current);
                cursorRef.current = null;
            }
            return;
        }

        if (!cursorRef.current) { // カーソルがまだない場合のみ作成
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
                transition: opacity 0.2s ease, background 0.2s ease, transform 0.1s ease;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            `;
            cursor.id = 'joy-con-cursor';
            document.body.appendChild(cursor);
            cursorRef.current = cursor;
        }

        const updateCursorVisuals = () => {
            if (cursorRef.current) {
                cursorRef.current.style.left = `${mousePosition.x}px`;
                cursorRef.current.style.top = `${mousePosition.y}px`;
                cursorRef.current.style.opacity = mouseControlEnabled ? '1' : '0.3';
                cursorRef.current.style.background = mouseControlEnabled ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
            }
        };

        updateCursorVisuals();

        return () => {
            if (cursorRef.current) {
                document.body.removeChild(cursorRef.current);
                cursorRef.current = null;
            }
        };
    }, [showCursor, mouseControlEnabled, mousePosition]); // mousePositionも依存配列に追加し、常に最新を反映

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
            buttons: (type === 'mousedown' || type === 'mouseup' || type === 'click') ? (button === 0 ? 1 : 0) : 0 // clickイベントはbuttonsが0のことがあるので注意
        });

        element.dispatchEvent(event);
        return element;
    }, []);

    // スティック入力を正規化（Joy-Con実測値対応版）
    const normalizeStickInput = useCallback((stick) => {
        if (!stick || calibrationOffset === null) return { x: 0, y: 0 }; // キャリブレーションがまだなら動かさない

        const rawX = parseFloat(stick.x) || 0;
        const rawY = parseFloat(stick.y) || 0;

        // キャリブレーションオフセットを適用
        let adjustedX = rawX - calibrationOffset.x;
        let adjustedY = rawY - calibrationOffset.y;

        // 内部的な「厳密なデッドゾーン」を設定（ノイズ除去用）
        // Joy-Conの個体差やドリフトの程度に合わせて調整してください
        const INTERNAL_NOISE_THRESHOLD = 0.05; // 0.05は一般的に安全な値
        if (Math.abs(adjustedX) < INTERNAL_NOISE_THRESHOLD) adjustedX = 0;
        if (Math.abs(adjustedY) < INTERNAL_NOISE_THRESHOLD) adjustedY = 0;

        // 両方が0の場合は即座に停止
        if (adjustedX === 0 && adjustedY === 0) {
            return { x: 0, y: 0 };
        }

        // Joy-Con実測値の範囲で正規化
        // スティックを最大に倒したときの生の値の範囲に応じて調整
        // デバッグログでスティックを最大に倒したときの rawX/rawY の値を確認し、
        // calibrationOffset からの差分の最大値で maxRange を設定するのが理想的です。
        // 一般的には0.8～1.2あたりが多いですが、個体差があります。
        const MAX_ANALOG_RANGE = 1.0; // 例: キャリブレーション中央から最大傾きまでの実測値範囲

        let normalizedX = 0;
        let normalizedY = 0;

        if (adjustedX !== 0) {
            normalizedX = Math.max(-1, Math.min(1, adjustedX / MAX_ANALOG_RANGE));
        }
        if (adjustedY !== 0) {
            // Joy-Conの場合、負の値が上向き、正の値が下向きなのでY軸は反転
            normalizedY = Math.max(-1, Math.min(1, -adjustedY / MAX_ANALOG_RANGE));
        }

        // ユーザー設定のデッドゾーンを適用
        const magnitude = Math.sqrt(normalizedX ** 2 + normalizedY ** 2);

        // デバッグ情報（調整された値が0でない場合のみ）
        if (magnitude > 0.01) { // わずかな動きでもログを出す閾値
            console.groupCollapsed('Stick Input Debug');
            console.log('Raw Stick:', { x: rawX.toFixed(3), y: rawY.toFixed(3) });
            console.log('Calibration Offset:', { x: calibrationOffset.x.toFixed(3), y: calibrationOffset.y.toFixed(3) });
            console.log('Adjusted Stick (offset applied):', { x: adjustedX.toFixed(3), y: adjustedY.toFixed(3) });
            console.log('Internal Noise Threshold Applied:', { x: (adjustedX === 0 ? 'ZERO' : adjustedX.toFixed(3)), y: (adjustedY === 0 ? 'ZERO' : adjustedY.toFixed(3)) });
            console.log('Normalized Stick (0 to 1 scale):', { x: normalizedX.toFixed(3), y: normalizedY.toFixed(3) });
            console.log('Magnitude:', magnitude.toFixed(3));
            console.log('User Deadzone:', deadzone.toFixed(3));
            console.log('Will Move (Magnitude >= User Deadzone):', magnitude >= deadzone);
            console.groupEnd();
        }


        if (magnitude < deadzone) {
            return { x: 0, y: 0 };
        }

        // デッドゾーン外の値を再スケール (デッドゾーンから外側の範囲を0～1にマッピング)
        const scaleFactor = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
        const finalX = normalizedX * scaleFactor;
        const finalY = normalizedY * scaleFactor;

        return { x: finalX, y: finalY };
    }, [calibrationOffset, deadzone]);

    // スムーズなマウス移動の更新（ドリフト防止対応版）
    const updateMousePosition = useCallback(() => {
        if (!enabled || !isConnected || !mouseControlEnabled || !inputState.leftStick || calibrationOffset === null) {
            velocityRef.current = { x: 0, y: 0 }; // 無効化されたら速度をリセット
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            return;
        }

        const normalizedStick = normalizeStickInput(inputState.leftStick);
        const magnitude = Math.sqrt(normalizedStick.x ** 2 + normalizedStick.y ** 2);

        // 入力が完全に0の場合は速度を即座に0にし、アニメーションを停止
        if (magnitude === 0) {
            velocityRef.current = { x: 0, y: 0 };
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            // console.log('Stick centered, stopping mouse movement.');
            return;
        }

        // 速度を計算 (感度と乗数を調整して速度を決定)
        // 30という乗数は、感度0.2の場合にスティックを最大に倒したときに1フレームあたり6px動くことを意味する。
        // 画面サイズや好みに合わせて調整してください。
        const baseSpeed = sensitivity * 40; // 30から40に上げて応答性を向上

        const targetVelocityX = normalizedStick.x * baseSpeed;
        const targetVelocityY = normalizedStick.y * baseSpeed;

        // 速度を徐々に目標速度に近づける（スムージング）
        // この係数を調整することで、加速・減速の滑らかさを変えられます。
        // 0.8: より滑らかだが反応はやや遅い
        // 0.5: より反応が速いが、動きがややカクつく可能性あり
        const SMOOTHING_ALPHA = 0.6; // 0.7から0.6に下げてレスポンスを向上
        velocityRef.current.x = velocityRef.current.x * SMOOTHING_ALPHA + targetVelocityX * (1 - SMOOTHING_ALPHA);
        velocityRef.current.y = velocityRef.current.y * SMOOTHING_ALPHA + targetVelocityY * (1 - SMOOTHING_ALPHA);

        // 非常に小さい速度は0にする（微細なドリフト速度の停止）
        const VELOCITY_STOP_THRESHOLD = 0.5; // 0.8から0.5に下げてより敏感に停止
        if (Math.abs(velocityRef.current.x) < VELOCITY_STOP_THRESHOLD) velocityRef.current.x = 0;
        if (Math.abs(velocityRef.current.y) < VELOCITY_STOP_THRESHOLD) velocityRef.current.y = 0;

        // 最大速度を制限（カーソルが飛びすぎるのを防ぐ）
        const MAX_CURSOR_VELOCITY = 20; // 15から20に上げて最大速度を増やす
        velocityRef.current.x = Math.max(-MAX_CURSOR_VELOCITY, Math.min(MAX_CURSOR_VELOCITY, velocityRef.current.x));
        velocityRef.current.y = Math.max(-MAX_CURSOR_VELOCITY, Math.min(MAX_CURSOR_VELOCITY, velocityRef.current.y));


        // マウス位置を更新
        setMousePosition(prev => {
            const newX = Math.max(0, Math.min(window.innerWidth - 1,
                prev.x + velocityRef.current.x));
            const newY = Math.max(0, Math.min(window.innerHeight - 1,
                prev.y + velocityRef.current.y));

            // 実際の移動量が小さい場合は、MouseEventを発火しないことで不要な処理を避ける
            const MIN_MOVEMENT_THRESHOLD = 1; // 2から1に下げてより小さな動きでもイベント発火
            if (Math.abs(newX - prev.x) > MIN_MOVEMENT_THRESHOLD || Math.abs(newY - prev.y) > MIN_MOVEMENT_THRESHOLD) {
                fireMouseEvent('mousemove', newX, newY);
                // console.log('Mouse moved to:', { x: Math.round(newX), y: Math.round(newY) });
            }

            return { x: newX, y: newY };
        });

        // 速度が0でない限り、次のフレームをスケジュール
        if (velocityRef.current.x !== 0 || velocityRef.current.y !== 0) {
            animationFrameRef.current = requestAnimationFrame(updateMousePosition);
        } else {
            // 速度が0になったらアニメーションを停止
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }

    }, [enabled, isConnected, mouseControlEnabled, normalizeStickInput, inputState.leftStick, sensitivity, fireMouseEvent, calibrationOffset]);

    // 手動でキャリブレーションをリセットする関数
    const recalibrate = useCallback(() => {
        if (isConnected && inputState.leftStick) {
            const currentStick = inputState.leftStick;
            const newOffset = {
                x: parseFloat(currentStick.x) || 0,
                y: parseFloat(currentStick.y) || 0
            };

            setCalibrationOffset(newOffset);
            velocityRef.current = { x: 0, y: 0 }; // 速度をリセット

            // カーソルを画面中央にリセット
            setMousePosition({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            });

            console.log('Joy-Con recalibrated to:', {
                newOffset: newOffset,
                message: 'スティックを中央に戻してからキャリブレーションしてください'
            });
        } else {
            console.warn('Cannot recalibrate: Joy-Con not connected or stick data unavailable.');
        }
    }, [isConnected, inputState.leftStick]);


    // ボタン入力の処理
    useEffect(() => {
        if (!enabled || !isConnected || !calibrationOffset) return; // キャリブレーションが完了していない場合は処理しない

        const buttons = inputState.buttons || {};
        const currentPosition = mousePosition;

        // Aボタン: 左クリック
        const aPressed = buttons.a;
        const aWasPressed = lastButtonStateRef.current.a;

        if (aPressed && !aWasPressed) {
            setIsClicking(true);
            if (cursorRef.current) {
                cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1.2)';
                cursorRef.current.style.background = 'rgba(0, 0, 255, 0.9)'; // クリック時青色
            }
            fireMouseEvent('mousedown', currentPosition.x, currentPosition.y, 0);
        } else if (!aPressed && aWasPressed) {
            setIsClicking(false);
            if (cursorRef.current) {
                cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorRef.current.style.background = mouseControlEnabled ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
            }
            const element = fireMouseEvent('mouseup', currentPosition.x, currentPosition.y, 0);
            fireMouseEvent('click', currentPosition.x, currentPosition.y, 0);

            if (element && (element.tabIndex >= 0 || ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName))) {
                element.focus(); // クリックした要素にフォーカス
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

                if (cursorRef.current) {
                    cursorRef.current.style.opacity = newState ? '1' : '0.3';
                    cursorRef.current.style.background = newState ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
                }
                // マウス制御オフ時に速度をリセットしてドリフトを防ぐ
                if (!newState) {
                    velocityRef.current = { x: 0, y: 0 };
                    if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                        animationFrameRef.current = null;
                    }
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

    }, [inputState.buttons, enabled, isConnected, mousePosition, fireMouseEvent, recalibrate, mouseControlEnabled, calibrationOffset]);

    // アニメーションループの管理 (ドリフト防止版)
    // このuseEffectは、mouseControlEnabledが変更された際や、
    // スティック入力状態に応じてupdateMousePositionを起動/停止させます。
    useEffect(() => {
        if (enabled && isConnected && mouseControlEnabled && inputState.leftStick && calibrationOffset !== null) {
            const normalizedStick = normalizeStickInput(inputState.leftStick);
            const magnitude = Math.sqrt(normalizedStick.x ** 2 + normalizedStick.y ** 2);

            // スティックがデッドゾーン外に出た場合にのみアニメーションを開始
            // これにより、スティックが中央にある状態での不要なループや微細なドリフトを防ぎます。
            if (magnitude > 0) { // 0.05などの小さい閾値でも可、normalizeStickInputが0を返す場合はここも0になる
                if (!animationFrameRef.current) { // 既に動いていなければ開始
                    animationFrameRef.current = requestAnimationFrame(updateMousePosition);
                }
            } else {
                // スティックが中央に戻ったらアニメーションを停止し、速度をリセット
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                velocityRef.current = { x: 0, y: 0 };
            }
        } else {
            // enabled, isConnected, mouseControlEnabled, calibrationOffset のいずれかが条件を満たさない場合
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            velocityRef.current = { x: 0, y: 0 }; // 速度もリセット
        }

        // クリーンアップ関数
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [enabled, isConnected, mouseControlEnabled, updateMousePosition, inputState.leftStick, normalizeStickInput, calibrationOffset]);

    // デバッグ用：スティック値を監視
    useEffect(() => {
        if (enabled && isConnected && inputState.leftStick && calibrationOffset !== null) {
            const rawX = parseFloat(inputState.leftStick.x) || 0;
            const rawY = parseFloat(inputState.leftStick.y) || 0;

            const adjustedX = rawX - calibrationOffset.x;
            const adjustedY = rawY - calibrationOffset.y;

            // より大きなしきい値でドリフト値を除外してログ出力
            const debugLogThreshold = 0.08; // ログを出すための閾値
            if (Math.abs(adjustedX) > debugLogThreshold || Math.abs(adjustedY) > debugLogThreshold) {
                console.log('Significant Stick Input (adjusted):', {
                    raw: { x: rawX.toFixed(3), y: rawY.toFixed(3) },
                    adjusted: { x: adjustedX.toFixed(3), y: adjustedY.toFixed(3) },
                    mouseControlEnabled,
                    enabled,
                    isConnected
                });
            }
        }
    }, [inputState.leftStick, enabled, isConnected, mouseControlEnabled, calibrationOffset]);


    return {
        mousePosition,
        isClicking,
        isActive: enabled && isConnected && mouseControlEnabled,
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
        rawStickValue: inputState.leftStick
    };
};
