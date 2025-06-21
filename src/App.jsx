import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { JoyConProvider } from './contexts/JoyConContext';
import Home from './pages/Home';
import Game from './pages/Game';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <JoyConProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/game/:gameType" element={<Game />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </Router>
      </JoyConProvider>
    </ThemeProvider>
  );
}

export default App;
