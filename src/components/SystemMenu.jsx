import PropTypes from 'prop-types';

const SystemMenu = ({
    systemIcons = [],
    activeIcon,
    onIconClick,
    notifications = {}
}) => {
    const handleIconClick = (icon) => {
        onIconClick?.(icon);
    };

    const handleKeyDown = (e, icon) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleIconClick(icon);
        }
    };

    const getIconClass = (icon) => {
        const classes = ['system-icon'];

        if (activeIcon === icon.id) {
            classes.push('system-icon--active');
        }

        if (icon.color) {
            classes.push('system-icon--special');
        }

        classes.push(`system-icon--${icon.id}`);

        return classes.join(' ');
    };

    const getNotificationClass = (count) => {
        return count > 9 ? 'system-icon__notification--many' : '';
    };

    return (
        <div className="system-menu">
            <div className="system-menu__icons">
                {systemIcons.map((icon) => (
                    <button
                        key={icon.id}
                        className={getIconClass(icon)}
                        onClick={() => handleIconClick(icon)}
                        onKeyDown={(e) => handleKeyDown(e, icon)}
                        aria-label={icon.title}
                        aria-pressed={activeIcon === icon.id}
                    >
                        {icon.icon}
                        {notifications[icon.id] > 0 && (
                            <div className={`system-icon__notification ${getNotificationClass(notifications[icon.id])}`}>
                                {notifications[icon.id] > 9 ? '9+' : notifications[icon.id]}
                            </div>
                        )}
                        <div className="system-icon__label">
                            {icon.title}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

SystemMenu.propTypes = {
    systemIcons: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            icon: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            color: PropTypes.string
        })
    ),
    activeIcon: PropTypes.string,
    onIconClick: PropTypes.func,
    notifications: PropTypes.object
};

SystemMenu.defaultProps = {
    systemIcons: [],
    notifications: {}
};

export default SystemMenu;
