import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div>
            <Link to="/game">
                <button>ゲーム開始</button>
            </Link>
        </div>
    );
};

export default Home;
