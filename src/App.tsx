import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import SocraticLanding from './pages/socratic/Landing';
import AvisoLegal from './pages/AvisoLegal';
import Privacidad from './pages/Privacidad';
import Condiciones from './pages/Condiciones';
import ScrollToTop from './components/ScrollToTop';
import CookieBanner from './components/CookieBanner';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/socratic" element={<SocraticLanding />} />
        <Route path="/aviso-legal" element={<AvisoLegal />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/condiciones" element={<Condiciones />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
    </Router>
  );
}

export default App;
