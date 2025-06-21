// src/components/JoyConConnectionModal.jsx - 振動無効版
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Gamepad2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useJoyConContext } from '../contexts/JoyConContext';

const JoyConConnectionModal = ({ onClose, onConnect }) => {
    const {
        isSupported,
        isConnected,
        isConnecting,
        connectedControllers,
        error,
        connectJoyCon
    } = useJoyConContext();

    const [step, setStep] = useState('instruction');

    useEffect(() => {
        if (isConnected && connectedControllers.length > 0) {
            setStep('success');
        } else if (error) {
            setStep('error');
        } else if (isConnecting) {
            setStep('connecting');
        }
    }, [isConnected, connectedControllers, error, isConnecting]);

    const handleConnect = async () => {
        setStep('connecting');
        const success = await connectJoyCon();
        if (!success) {
            setStep('error');
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!isSupported) {
        return (
            <div className="modal-backdrop">
                <div className="joycon-modal">
                    <div className="joycon-modal__header">
                        <h2>Joy-Con接続</h2>
                        <button onClick={handleClose} className="modal-close-btn">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="joycon-modal__content">
                        <div className="joycon-modal__status joycon-modal__status--error">
                            <AlertCircle size={48} />
                            <h3>WebHID APIがサポートされていません</h3>
                            <p>
                                Joy-Conを使用するには、Chrome、Edge、またはOpera（バージョン89以降）が必要です。
                                また、HTTPS接続が必要です。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-backdrop">
            <div className="joycon-modal">
                <div className="joycon-modal__header">
                    <h2>Joy-Con接続</h2>
                    <button onClick={handleClose} className="modal-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="joycon-modal__content">
                    {step === 'instruction' && (
                        <div className="joycon-modal__step">
                            <div className="joycon-modal__icon">
                                <Gamepad2 size={64} />
                            </div>
                            <h3>Joy-Conを接続します</h3>
                            <div className="joycon-modal__instructions">
                                <ol>
                                    <li>Joy-Conの電源を入れてください</li>
                                    <li>下のボタンを押してペアリングを開始します</li>
                                    <li>ブラウザの画面でJoy-Conを選択してください</li>
                                    <li>左右のJoy-Conを個別にペアリングしてください</li>
                                </ol>
                            </div>
                            <button
                                className="joycon-connect-btn"
                                onClick={handleConnect}
                                disabled={isConnecting}
                            >
                                <Gamepad2 size={20} />
                                Joy-Conを接続
                            </button>
                        </div>
                    )}

                    {step === 'connecting' && (
                        <div className="joycon-modal__step">
                            <div className="joycon-modal__status joycon-modal__status--loading">
                                <Loader2 size={48} className="spinning" />
                                <h3>接続中...</h3>
                                <p>ブラウザの画面でJoy-Conを選択してください</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="joycon-modal__step">
                            <div className="joycon-modal__status joycon-modal__status--success">
                                <CheckCircle size={48} />
                                <h3>接続完了！</h3>
                                <div className="connected-controllers">
                                    {connectedControllers.map((controller, index) => (
                                        <div key={controller.id} className="controller-item">
                                            <Gamepad2 size={24} />
                                            <span>{controller.name}</span>
                                            <span className={`controller-status controller-status--${controller.side}`}>
                                                {controller.side === 'left' ? 'L' : 'R'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="joycon-modal__actions">
                                    <button
                                        className="close-btn"
                                        onClick={handleClose}
                                    >
                                        完了
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="joycon-modal__step">
                            <div className="joycon-modal__status joycon-modal__status--error">
                                <AlertCircle size={48} />
                                <h3>接続に失敗しました</h3>
                                <p>{error}</p>
                                <div className="joycon-modal__actions">
                                    <button
                                        className="retry-btn"
                                        onClick={() => setStep('instruction')}
                                    >
                                        再試行
                                    </button>
                                    <button
                                        className="close-btn"
                                        onClick={handleClose}
                                    >
                                        閉じる
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

JoyConConnectionModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onConnect: PropTypes.func
};

export default JoyConConnectionModal;
