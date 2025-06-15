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
        { id: 'online', icon: CircleDot, title: 'Nintendo Switch Online', bgColor: '#E60012' },
        { id: 'folder', icon: FolderOpen, title: 'ユーザー', bgColor: '#FF7A00' },
        { id: 'news', icon: FileText, title: 'ニュース', bgColor: '#00B894' },
        { id: 'shop', icon: ShoppingBag, title: 'ニンテンドーeショップ', bgColor: '#E84393' },
        { id: 'mii', icon: Monitor, title: 'Mii', bgColor: '#0984E3' },
        { id: 'database', icon: Database, title: 'データ管理', bgColor: '#00CEC9' },
        { id: 'controller', icon: Gamepad2, title: 'コントローラー', bgColor: '#636E72' },
        { id: 'tablet', icon: Tablet, title: 'アルバム', bgColor: '#636E72' },
        { id: 'settings', icon: Settings, title: '設定', bgColor: '#636E72' },
        { id: 'power', icon: Power, title: 'スリープ', bgColor: '#636E72' }
    ];

    const handleIconClick = (index) => {
        setSelectedIcon(index);
        console.log(`${systemIcons[index].title} clicked`);
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
