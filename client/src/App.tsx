import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Tour from './pages/Tour';
import Tips from './pages/Tips';
import Guide from './pages/Guide';
import Language from './pages/Language';
import Settings from './pages/Settings';
import FontSize from './pages/FontSize';
import Feedback from './pages/Feedback';
import About from './pages/About';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tour" element={<Tour />} />
      <Route path="/tour/:slug" element={<Tour />} />
      <Route path="/tour/:slug/:spot" element={<Tour />} />
      <Route path="/tips/:slug" element={<Tips />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="/language" element={<Language />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/font" element={<FontSize />} />
      <Route path="/settings/feedback" element={<Feedback />} />
      <Route path="/settings/about" element={<About />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
