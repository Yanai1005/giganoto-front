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
    Power
} from 'lucide-react';

const SystemMenu = () => {
    const [selectedIcon, setSelectedIcon] = useState(4); // データ管理を選択状態に

    // 実際のNintendo Switchのシステムアイコン
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
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            padding: '20px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0px',
                backgroundColor: 'rgba(45, 45, 45, 0.95)',
                borderRadius: '50px',
                padding: '12px 20px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative'
            }}>
                {systemIcons.map((iconData, index) => {
                    const IconComponent = iconData.icon;
                    const isSelected = selectedIcon === index;

                    return (
                        <div
                            key={iconData.id}
                            onClick={() => handleIconClick(index)}
                            style={{
                                position: 'relative',
                                width: '48px',
                                height: '48px',
                                borderRadius: '8px',
                                background: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                                margin: '0 2px',
                                boxShadow: isSelected
                                    ? `0 4px 16px rgba(255, 255, 255, 0.2)`
                                    : 'none',
                                opacity: isSelected ? 1 : 0.7,
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.transform = 'scale(1.04)';
                                    e.currentTarget.style.opacity = '1';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.opacity = '0.7';
                                }
                            }}
                        >
                            <IconComponent
                                size={22}
                                color={iconData.bgColor}
                                strokeWidth={2.2}
                                style={{
                                    filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5))'
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SystemMenu;
