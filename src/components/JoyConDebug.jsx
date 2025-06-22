// src/components/JoyConDebug.jsx - Debug component for Joy-Con issues
import { useState } from 'react';
import { useJoyConContext } from '../contexts/JoyConContext';

const JoyConDebug = ({ showRawData = false }) => {
    const {
        isSupported,
        isConnected,
        connectedControllers,
        error,
        inputState,
        rawInputData
    } = useJoyConContext();

    const [isExpanded, setIsExpanded] = useState(false);

    if (!isSupported) {
        return (
            <div className="joycon-debug joycon-debug--error">
                <h4>❌ Joy-Con Debug</h4>
                <p>WebHID API not supported</p>
            </div>
        );
    }

    // Safe data extraction with null checks
    const leftStick = inputState?.leftStick || { x: 0, y: 0 };
    const rightStick = inputState?.rightStick || { x: 0, y: 0 };
    const buttons = inputState?.buttons || {};
    const pressedButtons = Object.entries(buttons)
        .filter(([_, pressed]) => pressed)
        .map(([button, _]) => button);

    const debugStyle = {
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px',
        cursor: 'pointer'
    };

    const expandedStyle = {
        ...debugStyle,
        maxHeight: '400px',
        overflowY: 'auto'
    };

    return (
        <div
            style={isExpanded ? expandedStyle : debugStyle}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <h4 style={{ margin: 0, marginRight: '10px' }}>
                    {isConnected ? '🎮' : '🔌'} Joy-Con Debug
                </h4>
                <span style={{ fontSize: '10px' }}>
                    {isExpanded ? '▼' : '▶'} Click to {isExpanded ? 'collapse' : 'expand'}
                </span>
            </div>

            <div>
                <div>Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
                <div>Controllers: {connectedControllers.length}</div>

                {error && (
                    <div style={{ color: '#ff6b6b', marginTop: '5px' }}>
                        Error: {error}
                    </div>
                )}

                {isExpanded && (
                    <>
                        <hr style={{ margin: '10px 0', borderColor: '#333' }} />

                        {/* Controllers Info */}
                        {connectedControllers.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                                <strong>Connected Controllers:</strong>
                                {connectedControllers.map((controller, i) => (
                                    <div key={i} style={{ marginLeft: '10px', fontSize: '11px' }}>
                                        • {controller.name} ({controller.side})
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input State */}
                        {isConnected && (
                            <>
                                <div style={{ marginBottom: '5px' }}>
                                    <strong>Left Stick:</strong> x: {leftStick.x?.toFixed(2) || '0.00'}, y: {leftStick.y?.toFixed(2) || '0.00'}
                                </div>

                                <div style={{ marginBottom: '5px' }}>
                                    <strong>Right Stick:</strong> x: {rightStick.x?.toFixed(2) || '0.00'}, y: {rightStick.y?.toFixed(2) || '0.00'}
                                </div>

                                {pressedButtons.length > 0 && (
                                    <div style={{ marginBottom: '5px' }}>
                                        <strong>Pressed Buttons:</strong> {pressedButtons.join(', ')}
                                    </div>
                                )}

                                {/* Gyro/Accel if available */}
                                {inputState?.gyro && (
                                    <div style={{ marginBottom: '5px', fontSize: '10px' }}>
                                        <strong>Gyro:</strong> x: {inputState.gyro.x?.toFixed(1)},
                                        y: {inputState.gyro.y?.toFixed(1)},
                                        z: {inputState.gyro.z?.toFixed(1)}
                                    </div>
                                )}

                                {/* Raw data section */}
                                {showRawData && rawInputData && (
                                    <>
                                        <hr style={{ margin: '10px 0', borderColor: '#333' }} />
                                        <div style={{ fontSize: '10px' }}>
                                            <strong>Raw Data:</strong>
                                            <pre style={{
                                                margin: '5px 0',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                maxHeight: '100px',
                                                overflow: 'auto'
                                            }}>
                                                {JSON.stringify(rawInputData, null, 2)}
                                            </pre>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default JoyConDebug;
