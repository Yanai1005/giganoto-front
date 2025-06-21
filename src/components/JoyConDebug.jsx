// src/components/JoyConDetailedDebug.jsx - 詳細デバッグ用
import { useState, useEffect } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

const JoyConDetailedDebug = () => {
    const { inputState, isConnected, rawInputData } = useJoyConContext();
    const [buttonStatusHistory, setButtonStatusHistory] = useState([]);

    useEffect(() => {
        if (!isConnected || !rawInputData?.buttonStatus) return;

        const buttonStatus = rawInputData.buttonStatus;
        const timestamp = Date.now();

        // buttonStatusの全プロパティを記録
        const allProps = Object.keys(buttonStatus);
        const pressedProps = allProps.filter(prop => buttonStatus[prop] === true);

        if (pressedProps.length > 0) {
            setButtonStatusHistory(prev => [
                {
                    timestamp,
                    pressedProps,
                    allProps,
                    buttonStatus: { ...buttonStatus }
                },
                ...prev.slice(0, 9) // 最新10件を保持
            ]);
        }
    }, [rawInputData, isConnected]);

    if (!isConnected) {
        return null;
    }

    const buttonStatus = rawInputData?.buttonStatus || {};
    const allButtonProps = Object.keys(buttonStatus);

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '11px',
            maxWidth: '350px',
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 9998,
            fontFamily: 'monospace'
        }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#74b9ff' }}>Joy-Con 詳細デバッグ</h3>

            {/* buttonStatus の全プロパティ表示 */}
            <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#fdcb6e' }}>利用可能なボタン:</h4>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
                    gap: '2px'
                }}>
                    {allButtonProps.map(prop => (
                        <span
                            key={prop}
                            style={{
                                padding: '2px 4px',
                                backgroundColor: buttonStatus[prop] ? '#00b894' : '#636e72',
                                borderRadius: '2px',
                                fontSize: '9px',
                                textAlign: 'center',
                                fontWeight: buttonStatus[prop] ? 'bold' : 'normal'
                            }}
                        >
                            {prop}
                        </span>
                    ))}
                </div>
            </div>

            {/* 現在のスティック状態 */}
            <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#fd79a8' }}>スティック状態:</h4>
                <div style={{ fontSize: '10px' }}>
                    <div>左: {inputState.leftStick.x.toFixed(2)}, {inputState.leftStick.y.toFixed(2)}</div>
                    <div>右: {inputState.rightStick.x.toFixed(2)}, {inputState.rightStick.y.toFixed(2)}</div>
                </div>
            </div>

            {/* ボタン押下履歴 */}
            <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#a29bfe' }}>ボタン押下履歴:</h4>
                <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                    {buttonStatusHistory.map((entry, index) => (
                        <div
                            key={entry.timestamp}
                            style={{
                                padding: '4px 6px',
                                marginBottom: '2px',
                                backgroundColor: index === 0 ? 'rgba(116, 185, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                                borderRadius: '2px',
                                fontSize: '9px'
                            }}
                        >
                            <div style={{ color: '#74b9ff' }}>
                                {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                            <div style={{ color: '#00b894' }}>
                                押下: {entry.pressedProps.join(', ')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Joy-Con側の情報 */}
            <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e17055' }}>デバイス情報:</h4>
                <div style={{ fontSize: '9px' }}>
                    <div>バッテリー: {rawInputData?.batteryLevel?.level || 'unknown'}</div>
                    <div>左スティック（生）: {rawInputData?.analogStickLeft?.horizontal}, {rawInputData?.analogStickLeft?.vertical}</div>
                    <div>右スティック（生）: {rawInputData?.analogStickRight?.horizontal}, {rawInputData?.analogStickRight?.vertical}</div>
                </div>
            </div>

            {/* テスト指示 */}
            <div style={{
                padding: '8px',
                backgroundColor: 'rgba(116, 185, 255, 0.2)',
                borderRadius: '4px',
                marginBottom: '10px'
            }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#74b9ff' }}>テスト手順:</h4>
                <div style={{ fontSize: '9px' }}>
                    1. 各ボタンを押して色が変わるか確認<br />
                    2. スティックを動かして数値が変わるか確認<br />
                    3. 履歴にボタン名が正しく表示されるか確認
                </div>
            </div>

            {/* 生データプレビュー */}
            <details>
                <summary style={{ cursor: 'pointer', fontSize: '10px', color: '#ddd' }}>
                    buttonStatus生データ
                </summary>
                <pre style={{
                    fontSize: '8px',
                    overflow: 'auto',
                    maxHeight: '100px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    padding: '4px',
                    borderRadius: '2px',
                    marginTop: '4px'
                }}>
                    {JSON.stringify(buttonStatus, null, 2)}
                </pre>
            </details>
        </div>
    );
};

export default JoyConDetailedDebug;
