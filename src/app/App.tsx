import { Routes, Route } from 'react-router';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Services } from './components/Services';
import { Spaces } from './components/Spaces';
import { Therapists } from './components/Therapists';
import { Events } from './components/Events';
import { Tarifs } from './components/Tarifs';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { MentionsLegales } from './pages/MentionsLegales';
import { Confidentialite } from './pages/Confidentialite';

function Home() {
  return (
    <>
      <Navigation />
      <Hero />
      <About />
      <Services />
      <Spaces />
      <Therapists />
      <Events />
      <Tarifs />
      <Contact />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/politique-de-confidentialite" element={<Confidentialite />} />
      </Routes>
    </div>
  );
}
