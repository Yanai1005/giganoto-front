import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useJoyConContext } from '../contexts/JoyConContext';
import { useJoyConCursor } from '../hooks/useJoyConCursor';
import JoyConConnection from './JoyConConnection';
import {
    CircleDot,
    FileText,
    ShoppingBag,
    Gamepad2,
    Settings,
    Power,
    MonitorSpeaker,
    X
} from 'lucide-react';

const SystemMenu = ({ onIconClick, activeIcon }) => {
    const navigate = useNavigate();
    const [selectedIcon, setSelectedIcon] = useState(4);
    const [showJoyConModal, setShowJoyConModal] = useState(false);

    // Joy-Conの状態を取得
    const {
        isConnected,
        connectedControllers,
        leftJoyConConnected,
        rightJoyConConnected
    } = useJoyConContext();

    // Joy-Conカーソル機能の状態を取得
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

    const systemIcons = [
        { id: 'online', icon: CircleDot, title: 'Giganoto', bgColor: '#E60012', url: 'https://hackz-community.doorkeeper.jp/events/184015' },
        { id: 'news', icon: FileText, title: 'ニュース', bgColor: '#00B894', url: 'https://topaz.dev/' },
        { id: 'shop', icon: ShoppingBag, title: 'ショップ', bgColor: '#E84393', url: 'https://suzuri.jp/hackz-inc' },
        { id: 'controller', icon: Gamepad2, title: 'コントローラー', bgColor: '#636E72' },
        { id: 'settings', icon: Settings, title: '設定', bgColor: '#636E72' },
        { id: 'power', icon: Power, title: 'スリープ', bgColor: '#636E72' }
    ];

    const handleIconClick = (index) => {
        setSelectedIcon(index);
        const iconData = systemIcons[index];

        if (onIconClick) {
            onIconClick(iconData);
        }

        if (iconData.id === 'power') {
            if (window.confirm('アプリケーションを終了しますか？')) {
                window.close();
            }
        } else if (iconData.id === 'settings') {
            navigate('/settings');
        } else if (iconData.id === 'controller') {
            setShowJoyConModal(true);
        } else if (iconData.url) {
            window.open(iconData.url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleCloseModal = () => {
        setShowJoyConModal(false);
    };

    return (
        <>
            <div className="nintendo-system-menu">
                <div className="nintendo-system-menu__bar">
                    {systemIcons.map((iconData, index) => {
                        const IconComponent = iconData.icon;
                        const isSelected = selectedIcon === index || activeIcon === iconData.id;

                        return (
                            <div
                                key={iconData.id}
                                className={`nintendo-system-menu__icon ${isSelected ? 'nintendo-system-menu__icon--selected' : ''}`}
                                onClick={() => handleIconClick(index)}
                                title={iconData.title}
                            >
                                <IconComponent
                                    size={22}
                                    color={iconData.bgColor}
                                    strokeWidth={2.2}
                                />
                            </div>
                        );
                    })}
                </div>

                <div
                    className="nintendo-system-menu__pc-icon"
                    onClick={() => console.log('PC mode clicked')}
                    title="PC接続モード"
                >
                    <MonitorSpeaker
                        size={28}
                        color="rgba(255, 255, 255, 0.8)"
                        strokeWidth={2}
                    />
                </div>
            </div>

            {/* Joy-Con接続モーダル */}
            {showJoyConModal && (
                <div className="joycon-modal">
                    <div className="joycon-modal__backdrop" onClick={handleCloseModal} />
                    <div className="joycon-modal__content">
                        <div className="joycon-modal__header">
                            <h2 className="joycon-modal__title">
                                <Gamepad2 size={24} />
                                Joy-Con接続
                            </h2>
                            <button
                                className="joycon-modal__close"
                                onClick={handleCloseModal}
                                aria-label="閉じる"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="joycon-modal__body">
                            <JoyConConnection />

                            {isJoyConActive && (
                                <div className="joycon-modal__status">
                                    <h3>接続状態</h3>
                                    <div className="joycon-modal__status-grid">
                                        <div className="joycon-modal__status-item">
                                            <span className="joycon-modal__status-label">接続状況:</span>
                                            <span className="joycon-modal__status-value joycon-modal__status-value--connected">
                                                {isConnected ? '接続中' : '未接続'}
                                            </span>
                                        </div>
                                        <div className="joycon-modal__status-item">
                                            <span className="joycon-modal__status-label">左Joy-Con:</span>
                                            <span className={`joycon-modal__status-value ${leftJoyConConnected ? 'joycon-modal__status-value--connected' : 'joycon-modal__status-value--disconnected'
                                                }`}>
                                                {leftJoyConConnected ? '接続済み' : '未接続'}
                                            </span>
                                        </div>
                                        <div className="joycon-modal__status-item">
                                            <span className="joycon-modal__status-label">右Joy-Con:</span>
                                            <span className={`joycon-modal__status-value ${rightJoyConConnected ? 'joycon-modal__status-value--connected' : 'joycon-modal__status-value--disconnected'
                                                }`}>
                                                {rightJoyConConnected ? '接続済み' : '未接続'}
                                            </span>
                                        </div>
                                        <div className="joycon-modal__status-item">
                                            <span className="joycon-modal__status-label">カーソル表示:</span>
                                            <span className={`joycon-modal__status-value ${cursorVisible ? 'joycon-modal__status-value--connected' : 'joycon-modal__status-value--disconnected'
                                                }`}>
                                                {cursorVisible ? '表示中' : '非表示'}
                                            </span>
                                        </div>
                                        <div className="joycon-modal__status-item">
                                            <span className="joycon-modal__status-label">カーソル位置:</span>
                                            <span className="joycon-modal__status-value">
                                                X: {Math.round(mousePosition.x)}, Y: {Math.round(mousePosition.y)}
                                            </span>
                                        </div>
                                        <div className="joycon-modal__status-item">
                                            <span className="joycon-modal__status-label">クリック状態:</span>
                                            <span className={`joycon-modal__status-value ${isClicking ? 'joycon-modal__status-value--connected' : 'joycon-modal__status-value--disconnected'
                                                }`}>
                                                {isClicking ? 'クリック中' : '待機中'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="joycon-modal__instructions">
                                <h3>操作方法</h3>
                                <div className="joycon-modal__instructions-list">
                                    <div className="joycon-modal__instruction-item">
                                        <span className="joycon-modal__instruction-button">左スティック</span>
                                        <span className="joycon-modal__instruction-action">カーソル移動</span>
                                    </div>
                                    <div className="joycon-modal__instruction-item">
                                        <span className="joycon-modal__instruction-button">右Joy-Con Aボタン</span>
                                        <span className="joycon-modal__instruction-action">左クリック</span>
                                    </div>
                                    <div className="joycon-modal__instruction-item">
                                        <span className="joycon-modal__instruction-button">右Joy-Con Bボタン</span>
                                        <span className="joycon-modal__instruction-action">右クリック</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

SystemMenu.propTypes = {
    onIconClick: PropTypes.func,
    activeIcon: PropTypes.string,
};

SystemMenu.defaultProps = {
    onIconClick: () => { },
    activeIcon: '',
};

export default SystemMenu;
