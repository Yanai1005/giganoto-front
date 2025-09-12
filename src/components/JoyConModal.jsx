import { useJoyConContext } from '../contexts/JoyConContext';
import { useJoyConCursor } from '../hooks/useJoyConCursor';
import { X } from 'lucide-react';

const JoyConModal = ({ isOpen, onClose }) => {
    const {
        isSupported,
        isConnected,
        isConnecting,
        connectedControllers,
        error,
        connectJoyCon,
        disconnectJoyCon,
        disconnectAllJoyCons,
        leftJoyConConnected,
        rightJoyConConnected
    } = useJoyConContext();

    // Joy-Conカーソル機能を有効化
    const {
        mousePosition,
        isClicking,
        isActive: isJoyConActive,
        cursorVisible
    } = useJoyConCursor({
        enabled: true,
        sensitivity: 0.8,
        deadzone: 0.2,
        showCursor: true,
        smoothing: 0.85,
        invertY: true,
        useRightJoyConForClick: true
    });

    const handleConnect = async () => {
        console.log('🔗 Joy-Con接続ボタンがクリックされました');
        await connectJoyCon();
    };

    const handleDisconnect = async (joyConType) => {
        console.log(`🔌 ${joyConType} Joy-Con切断ボタンがクリックされました`);
        await disconnectJoyCon(joyConType);
    };

    const handleDisconnectAll = async () => {
        console.log('🔌 全Joy-Con切断ボタンがクリックされました');
        await disconnectAllJoyCons();
    };

    if (!isOpen) return null;

    return (
        <div className="joycon-modal-overlay" onClick={onClose}>
            <div className="joycon-modal" onClick={(e) => e.stopPropagation()}>
                <div className="joycon-modal__header">
                    <h2 className="joycon-modal__title">
                        <span className="joycon-modal__icon">🎮</span>
                        Joy-Con設定
                    </h2>
                    <button className="joycon-modal__close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="joycon-modal__content">
                    {!isSupported ? (
                        <div className="joycon-modal__error">
                            <span className="joycon-modal__error-icon">⚠️</span>
                            <span className="joycon-modal__error-text">
                                WebHID APIがサポートされていません
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* 接続状態表示 */}
                            {isConnected ? (
                                <div className="joycon-modal__status">
                                    <div className="joycon-modal__status-header">
                                        <span className="joycon-modal__status-icon">✅</span>
                                        <span className="joycon-modal__status-text">
                                            Joy-Con接続中 ({connectedControllers.length}台)
                                        </span>
                                    </div>

                                    <div className="joycon-modal__controllers">
                                        {connectedControllers.map((controller, index) => (
                                            <div key={index} className="joycon-modal__controller">
                                                <div className="joycon-modal__controller-info">
                                                    <span className="joycon-modal__controller-name">
                                                        {controller.name}
                                                    </span>
                                                    <span className={`joycon-modal__controller-status ${controller.connected ? 'connected' : 'disconnected'
                                                        }`}>
                                                        {controller.connected ? '接続済み' : '未接続'}
                                                    </span>
                                                </div>
                                                <button
                                                    className="joycon-modal__disconnect-btn"
                                                    onClick={() => handleDisconnect(controller.side)}
                                                    disabled={!controller.connected}
                                                >
                                                    切断
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="joycon-modal__actions">
                                        <button
                                            className="joycon-modal__button joycon-modal__button--primary"
                                            onClick={handleConnect}
                                            disabled={isConnecting}
                                        >
                                            {isConnecting ? (
                                                <>
                                                    <span className="joycon-modal__spinner"></span>
                                                    接続中...
                                                </>
                                            ) : (
                                                '追加接続'
                                            )}
                                        </button>

                                        <button
                                            className="joycon-modal__button joycon-modal__button--secondary"
                                            onClick={handleDisconnectAll}
                                        >
                                            全切断
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="joycon-modal__prompt">
                                    <div className="joycon-modal__prompt-content">
                                        <span className="joycon-modal__prompt-icon">🎮</span>
                                        <span className="joycon-modal__prompt-text">
                                            Joy-Conを接続してください
                                        </span>
                                    </div>
                                    <button
                                        className="joycon-modal__button joycon-modal__button--primary"
                                        onClick={handleConnect}
                                        disabled={isConnecting}
                                    >
                                        {isConnecting ? (
                                            <>
                                                <span className="joycon-modal__spinner"></span>
                                                接続中...
                                            </>
                                        ) : (
                                            'Joy-Con接続'
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* 接続状態の詳細情報 */}
                            {isJoyConActive && (
                                <div className="joycon-modal__status-info">
                                    <h3>接続状態</h3>
                                    <div className="joycon-modal__status-info__item">
                                        <span className="joycon-modal__status-info__label">カーソル表示:</span>
                                        <span className={`joycon-modal__status-info__value ${cursorVisible ? 'active' : 'inactive'
                                            }`}>
                                            {cursorVisible ? '表示中' : '非表示'}
                                        </span>
                                    </div>
                                    <div className="joycon-modal__status-info__item">
                                        <span className="joycon-modal__status-info__label">カーソル位置:</span>
                                        <span className="joycon-modal__status-info__value">
                                            X: {Math.round(mousePosition.x)}, Y: {Math.round(mousePosition.y)}
                                        </span>
                                    </div>
                                    <div className="joycon-modal__status-info__item">
                                        <span className="joycon-modal__status-info__label">クリック状態:</span>
                                        <span className={`joycon-modal__status-info__value ${isClicking ? 'active' : 'inactive'
                                            }`}>
                                            {isClicking ? 'クリック中' : '待機中'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* 操作方法の説明 */}
                            <div className="joycon-modal__instructions">
                                <h3>操作方法</h3>
                                <div className="joycon-modal__instructions__list">
                                    <div className="joycon-modal__instructions__item">
                                        <span className="joycon-modal__instructions__button">左スティック</span>
                                        <span className="joycon-modal__instructions__action">カーソル移動</span>
                                    </div>
                                    <div className="joycon-modal__instructions__item">
                                        <span className="joycon-modal__instructions__button">右Joy-Con Aボタン</span>
                                        <span className="joycon-modal__instructions__action">左クリック</span>
                                    </div>
                                    <div className="joycon-modal__instructions__item">
                                        <span className="joycon-modal__instructions__button">右Joy-Con Bボタン</span>
                                        <span className="joycon-modal__instructions__action">右クリック</span>
                                    </div>
                                </div>
                            </div>

                            {/* エラー表示 */}
                            {error && (
                                <div className="joycon-modal__error">
                                    <span className="joycon-modal__error-icon">⚠️</span>
                                    <span className="joycon-modal__error-text">{error}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoyConModal; 
