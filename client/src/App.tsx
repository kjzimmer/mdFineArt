import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import About from './pages/About';
import Admin from './pages/Admin';
import Blog from './pages/Blog';
import Commission from './pages/Commission';
import Contact from './pages/Contact';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import Music from './pages/Music';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg text-text">
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/commission" element={<Commission />} />
            <Route path="/events" element={<Events />} />
            <Route path="/music" element={<Music />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
