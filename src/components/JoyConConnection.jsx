import { useJoyConContext } from '../contexts/JoyConContext';

const JoyConConnection = () => {
    const {
        isSupported,
        isConnected,
        isConnecting,
        connectedControllers,
        error,
        connectJoyCon
    } = useJoyConContext();

    const handleConnect = async () => {
        await connectJoyCon();
    };

    if (!isSupported) {
        return (
            <div className="joycon-connection">
                <div className="joycon-connection__error">
                    <span className="joycon-connection__icon">⚠️</span>
                    <span className="joycon-connection__text">
                        WebHID APIがサポートされていません
                    </span>
                </div>
            </div>
        );
    }

    if (isConnected) {
        return (
            <div className="joycon-connection">
                <div className="joycon-connection__status">
                    <span className="joycon-connection__icon">��</span>
                    <div className="joycon-connection__info">
                        <span className="joycon-connection__text">Joy-Con接続中</span>
                        <span className="joycon-connection__count">
                            {connectedControllers.length}台接続
                        </span>
                    </div>
                </div>
                <div className="joycon-connection__controllers">
                    {connectedControllers.map((controller, index) => (
                        <div key={index} className="joycon-connection__controller">
                            <span className="joycon-connection__controller-name">
                                {controller.name}
                            </span>
                            <span className={`joycon-connection__controller-status ${controller.connected ? 'connected' : 'disconnected'
                                }`}>
                                {controller.connected ? '接続済み' : '未接続'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="joycon-connection">
            <div className="joycon-connection__prompt">
                <span className="joycon-connection__icon">🎮</span>
                <span className="joycon-connection__text">
                    Joy-Conを接続してください
                </span>
            </div>
            <button
                className="joycon-connection__button"
                onClick={handleConnect}
                disabled={isConnecting}
            >
                {isConnecting ? (
                    <>
                        <span className="joycon-connection__spinner"></span>
                        接続中...
                    </>
                ) : (
                    'Joy-Con接続'
                )}
            </button>
            {error && (
                <div className="joycon-connection__error">
                    <span className="joycon-connection__error-text">{error}</span>
                </div>
            )}
        </div>
    );
};

export default JoyConConnection; 
