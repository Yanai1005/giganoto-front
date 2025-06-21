// src/components/JoyConCalibrationUI.jsx - キャリブレーション用UIコンポーネント
import { useEffect, useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

const JoyConCalibrationUI = ({ cursorControl, onClose }) => {
    const { inputState, isConnected } = useJoyConContext();
    const [showInstructions, setShowInstructions] = useState(true);

    // Safe getter for left stick
    const getLeftStick = () => {
        if (!inputState || !inputState.leftStick) {
            return { x: 0, y: 0 };
        }
        return {
            x: parseFloat(inputState.leftStick.x) || 0,
            y: parseFloat(inputState.leftStick.y) || 0
        };
    };

    const currentStick = getLeftStick();
    const { calibrationOffset, isCalibrating, isCalibrated } = cursorControl;

    useEffect(() => {
        if (isCalibrated) {
            const timer = setTimeout(() => {
                setShowInstructions(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isCalibrated]);

    if (!isConnected) {
        return null;
    }

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        color: 'white',
        fontFamily: 'sans-serif'
    };

    const cardStyle = {
        background: '#2c3e50',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '500px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
    };

    const statusStyle = {
        padding: '20px',
        borderRadius: '8px',
        margin: '20px 0',
        fontSize: '16px'
    };

    const getStatusStyle = () => {
        if (isCalibrating) {
            return {
                ...statusStyle,
                background: 'rgba(255, 165, 0, 0.2)',
                border: '2px solid #ff6b35'
            };
        } else if (isCalibrated) {
            return {
                ...statusStyle,
                background: 'rgba(0, 255, 0, 0.2)',
                border: '2px solid #00ff00'
            };
        } else {
            return {
                ...statusStyle,
                background: 'rgba(255, 0, 0, 0.2)',
                border: '2px solid #ff4757'
            };
        }
    };

    const buttonStyle = {
        padding: '10px 20px',
        margin: '5px',
        background: '#3498db',
        border: 'none',
        borderRadius: '5px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px'
    };

    return (
        <div style={overlayStyle}>
            <div style={cardStyle}>
                <h2>🎮 Joy-Con カーソルキャリブレーション</h2>

                <div style={getStatusStyle()}>
                    {isCalibrating && (
                        <>
                            <h3>🎯 キャリブレーション中...</h3>
                            <p>Joy-Conの左スティックを中央位置で保持してください</p>
                            <div style={{ fontSize: '24px', margin: '10px 0' }}>
                                ⏳ 測定中...
                            </div>
                        </>
                    )}

                    {!isCalibrating && isCalibrated && (
                        <>
                            <h3>✅ キャリブレーション完了</h3>
                            <p>Joy-Conカーソルが使用可能です</p>
                            <div style={{ fontSize: '14px', marginTop: '10px' }}>
                                オフセット値: X={calibrationOffset.x.toFixed(3)}, Y={calibrationOffset.y.toFixed(3)}
                            </div>
                        </>
                    )}

                    {!isCalibrating && !isCalibrated && (
                        <>
                            <h3>❌ キャリブレーションが必要です</h3>
                            <p>正確なカーソル制御のためにキャリブレーションを実行してください</p>
                        </>
                    )}
                </div>

                {/* リアルタイムスティック値表示 */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '15px',
                    borderRadius: '5px',
                    margin: '15px 0',
                    fontFamily: 'monospace'
                }}>
                    <h4>📊 リアルタイム値</h4>
                    <div>生の値: X={currentStick.x.toFixed(3)}, Y={currentStick.y.toFixed(3)}</div>
                    <div>調整後: X={(currentStick.x - calibrationOffset.x).toFixed(3)}, Y={(currentStick.y - calibrationOffset.y).toFixed(3)}</div>
                    <div>距離: {Math.sqrt((currentStick.x - calibrationOffset.x) ** 2 + (currentStick.y - calibrationOffset.y) ** 2).toFixed(3)}</div>
                </div>

                {/* 操作説明 */}
                <div style={{ fontSize: '14px', marginBottom: '20px' }}>
                    <p><strong>操作方法:</strong></p>
                    <p>🎮 <strong>+ボタン</strong>: 手動キャリブレーション（現在の位置を中央とする）</p>
                    <p>🎮 <strong>-ボタン</strong>: 自動キャリブレーション再実行</p>
                    <p>🖱️ <strong>Aボタン</strong>: 左クリック</p>
                    <p>🖱️ <strong>Bボタン</strong>: 右クリック</p>
                </div>

                {/* 制御ボタン */}
                <div>
                    <button
                        style={buttonStyle}
                        onClick={() => cursorControl.recalibrate()}
                    >
                        手動キャリブレーション
                    </button>
                    <button
                        style={buttonStyle}
                        onClick={() => cursorControl.startAutoCalibration()}
                        disabled={isCalibrating}
                    >
                        自動キャリブレーション
                    </button>
                    {(isCalibrated || !showInstructions) && (
                        <button
                            style={{ ...buttonStyle, background: '#e74c3c' }}
                            onClick={onClose}
                        >
                            閉じる
                        </button>
                    )}
                </div>

                {showInstructions && (
                    <div style={{ marginTop: '20px', fontSize: '12px', opacity: 0.8 }}>
                        <p>💡 ヒント: スティックが勝手に動く場合は、スティックを中央で数秒間保持してからキャリブレーションしてください</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoyConCalibrationUI;
