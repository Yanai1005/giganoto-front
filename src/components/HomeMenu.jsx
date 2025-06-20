import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
    House,
    Gamepad2,
    Settings,
    MonitorSpeaker
} from 'lucide-react';

const HomeMenu = ({ onIconClick, activeIcon }) => {
    const navigate = useNavigate();
    const [selectedIcon, setSelectedIcon] = useState(4);

    const systemIcons = [
        { id: 'controller', icon: Gamepad2, title: 'コントローラー', bgColor: '#636E72' },
        { id: 'House', icon: House, title: 'スリープ', bgColor: '#636E72' },
        { id: 'settings', icon: Settings, title: '設定', bgColor: '#636E72' }
    ];

    const handleIconClick = (index) => {
        setSelectedIcon(index);
        const iconData = systemIcons[index];

        // 親コンポーネントに通知（設定アイコンの場合など）
        if (onIconClick) {
            onIconClick(iconData);
        }

        // アイコン別の処理
        if (iconData.id === 'House') {
            navigate('/');
        } else if (iconData.id === 'settings') {
            navigate('/settings');
        }
    };

    return (
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
    );
};

export default HomeMenu;
