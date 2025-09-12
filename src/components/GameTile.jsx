import { forwardRef } from 'react';
import PropTypes from 'prop-types';

const GameTile = forwardRef(({
    game,
    selected = false,
    onClick,
    className = '',
    loading = false
}, ref) => {
    const handleClick = () => {
        if (!loading) {
            onClick?.(game);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !loading) {
            e.preventDefault();
            handleClick();
        }
    };

    const tileClasses = [
        'game-tile',
        selected && 'game-tile--selected',
        loading && 'game-tile--loading',
        className
    ].filter(Boolean).join(' ');

    const imageClasses = [
        'game-tile__image',
        loading && 'game-tile__image--loading'
    ].filter(Boolean).join(' ');

    return (
        <div
            ref={ref}
            className={tileClasses}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`${game.title}を選択`}
            aria-pressed={selected}
        >
            <div className="game-tile__content">
                <div className={imageClasses}>
                    <img
                        src={game.image}
                        alt={game.title}
                        loading="lazy"
                    />
                </div>
                <div className="game-tile__info">
                    <h3 className="game-tile__title">{game.title}</h3>
                    <p className="game-tile__description">{game.description}</p>
                </div>
            </div>

            {loading && (
                <div className="game-tile__loading">
                    <div className="game-tile__spinner"></div>
                </div>
            )}
        </div>
    );
});

GameTile.displayName = 'GameTile';

GameTile.propTypes = {
    game: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        image: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        gameType: PropTypes.string.isRequired
    }).isRequired,
    selected: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
    loading: PropTypes.bool
};

export default GameTile;
