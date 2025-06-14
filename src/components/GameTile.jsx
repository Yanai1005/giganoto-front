import PropTypes from 'prop-types';

const GameTile = ({
    game,
    selected = false,
    onClick,
    className = '',
    loading = false
}) => {
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
        !game.image && 'game-tile__image--placeholder'
    ].filter(Boolean).join(' ');

    return (
        <div
            className={tileClasses}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={loading ? -1 : 0}
            role="button"
            aria-label={`${game.title}を選択`}
            aria-pressed={selected}
            aria-disabled={loading}
        >
            <div className="game-tile__container">
                <div
                    className={imageClasses}
                    style={{
                        backgroundImage: game.image ? `url(${game.image})` : 'none'
                    }}
                >
                    {!game.image && !loading && '🎮'}
                </div>

                <div className="game-tile__title">
                    {game.title}
                </div>
            </div>
        </div>
    );
};

GameTile.propTypes = {
    game: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        image: PropTypes.string,
        path: PropTypes.string.isRequired
    }).isRequired,
    selected: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
    loading: PropTypes.bool
};

export default GameTile;
