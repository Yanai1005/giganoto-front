import { useState } from 'react';
import {
    CircleDot,
    FolderOpen,
    FileText,
    ShoppingBag,
    Monitor,
    Database,
    Gamepad2,
    Tablet,
    Settings,
    Power,
    MonitorSpeaker
} from 'lucide-react';

const SystemMenu = () => {
    const [selectedIcon, setSelectedIcon] = useState(4);

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
        if (iconData.url) {
            window.open(iconData.url, '_blank', 'noopener,noreferrer');
        } else {
            console.log(`${iconData.title} clicked`);
        }
    };

    return (
        <div className="nintendo-system-menu">
            <div className="nintendo-system-menu__bar">
                {systemIcons.map((iconData, index) => {
                    const IconComponent = iconData.icon;
                    const isSelected = selectedIcon === index;

                    return (
                        <div
                            key={iconData.id}
                            className={`nintendo-system-menu__icon ${isSelected ? 'nintendo-system-menu__icon--selected' : ''}`}
                            onClick={() => handleIconClick(index)}
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

export default SystemMenu;
