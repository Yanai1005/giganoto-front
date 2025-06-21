// src/components/SimpleJoyConCursor.jsx - 修正版
import { useJoyConMouseControl } from '../hooks/useJoyConMouseControl';
import { useJoyConContext } from '../contexts/JoyConContext';

const SimpleJoyConCursor = ({
    enabled = true,
    sensitivity = 0.3,
    showVisualCursor = true,
    showDebugInfo = true
}) => {
    const { inputState } = useJoyConContext();
    const {
        mousePosition,
        isClicking,
        isActive,
        recalibrate,
        calibrationOffset,
        rawStickValue
    } = useJoyConMouseControl({
        enabled,
        sensitivity
    });

    if (!isActive) {
        return null;
    }

    // スティック値を数値に変換
    const rawX = parseFloat(rawStickValue?.x) || 0;
    const rawY = parseFloat(rawStickValue?.y) || 0;
    const adjustedX = rawX - calibrationOffset.x;
    const adjustedY = rawY - calibrationOffset.y;

    return (
        <>
            {/* 詳細デバッグ情報 */}
            {showDebugInfo && (
                <div
                    style={{
                        position: 'fixed',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.9)',
                        color: 'white',
                        padding: '15px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        zIndex: 999998,
                        minWidth: '280px',
                        border: '1px solid #00b894'
                    }}
                >
                    <div style={{ color: '#00b894', fontWeight: 'bold', marginBottom: '8px' }}>
                        Joy-Con マウス制御デバッグ
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <strong>生スティック値:</strong><br />
                        X: {rawX.toFixed(1)}, Y: {rawY.toFixed(1)}
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <strong>キャリブレーション:</strong><br />
                        X: {calibrationOffset.x.toFixed(1)}, Y: {calibrationOffset.y.toFixed(1)}
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <strong>調整後の値:</strong><br />
                        X: {adjustedX.toFixed(1)}, Y: {adjustedY.toFixed(1)}
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <strong>マウス位置:</strong><br />
                        X: {mousePosition.x.toFixed(0)}, Y: {mousePosition.y.toFixed(0)}
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <strong>状態:</strong> {isClicking ? '🔴 クリック中' : '🟢 待機中'}
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <strong>推奨デッドゾーン:</strong> {Math.max(Math.abs(adjustedX), Math.abs(adjustedY)).toFixed(1)}
                    </div>

                    <button
                        onClick={recalibrate}
                        style={{
                            padding: '6px 12px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            marginRight: '5px'
                        }}
                    >
                        キャリブレーション
                    </button>

                    <div style={{ marginTop: '8px', fontSize: '10px', color: '#ccc' }}>
                        ヒント: スティックを中央に戻してから<br />
                        キャリブレーションボタンを押してください
                    </div>
                </div>
            )}

            {/* カーソル表示 */}
            {showVisualCursor && (
                <div
                    className="simple-joycon-cursor"
                    style={{
                        position: 'fixed',
                        left: mousePosition.x,
                        top: mousePosition.y,
                        width: '18px',
                        height: '18px',
                        background: isClicking ? '#ff4757' : '#2ed573',
                        border: '3px solid #ffffff',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 999999,
                        boxShadow: `0 0 ${isClicking ? '20px' : '12px'} rgba(46, 213, 115, 0.6)`,
                        transition: 'all 0.1s ease'
                    }}
                >
                    {/* 内部のドット */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '6px',
                            height: '6px',
                            background: '#ffffff',
                            borderRadius: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                    />

                    {/* クリック時の効果 */}
                    {isClicking && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: '35px',
                                height: '35px',
                                border: '3px solid #ff4757',
                                borderRadius: '50%',
                                transform: 'translate(-50%, -50%)',
                                animation: 'click-pulse 0.4s ease-out'
                            }}
                        />
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes click-pulse {
                    0% {
                        width: 18px;
                        height: 18px;
                        opacity: 1;
                    }
                    100% {
                        width: 50px;
                        height: 50px;
                        opacity: 0;
                    }
                }
            `}</style>
        </>
    );
};

export default SimpleJoyConCursor;
