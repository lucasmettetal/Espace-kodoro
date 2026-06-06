import { useEffect } from 'react';
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
import { OrganizerLogin } from './pages/OrganizerLogin';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { OrganizerRegister } from './pages/OrganizerRegister';

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

function ScrollToEvents() {
  useEffect(() => {
    const scroll = () => {
      const el = document.getElementById('activites-agenda');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    // Attendre que React ait rendu tous les composants
    const timer = setTimeout(scroll, 150);
    return () => clearTimeout(timer);
  }, []);

  return <Home />;
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gaming" element={<ScrollToEvents />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/politique-de-confidentialite" element={<Confidentialite />} />
        <Route path="/organizer" element={<OrganizerLogin />} />
        <Route path="/organizer/register" element={<OrganizerRegister />} />
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
      </Routes>
    </div>
  );
}
