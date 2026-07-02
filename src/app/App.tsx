import { Routes, Route } from 'react-router';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Services } from './components/Services';
import { Spaces } from './components/Spaces';
import { Therapists } from './components/Therapists';
import { ActivitiesHighlight } from './components/ActivitiesHighlight';
import { LobbyBanner } from './components/LobbyBanner';
import { Events } from './components/Events';
import { Tarifs } from './components/Tarifs';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { MentionsLegales } from './pages/MentionsLegales';
import { Confidentialite } from './pages/Confidentialite';
import { OrganizerLogin } from './pages/OrganizerLogin';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { OrganizerRegister } from './pages/OrganizerRegister';
import { GamingPage } from './pages/GamingPage';
import { ReservationGamingPage } from './pages/ReservationGamingPage';
import { MerciReservationGamingPage } from './pages/MerciReservationGamingPage';
import { PassGamingPage, PassGamingConfirmationPage } from './pages/PassGamingPage';
import { YogaPage } from './pages/YogaPage';
import { ActivitesPage } from './pages/ActivitesPage';

function Home() {
  return (
    <>
      <Navigation />
      <LobbyBanner />
      <Hero />
      <About />
      <Services />
      <Spaces />
      <Therapists />
      <ActivitiesHighlight />
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
        <Route path="/activites" element={<ActivitesPage />} />
        <Route path="/gaming" element={<GamingPage />} />
        <Route path="/reservation-gaming" element={<ReservationGamingPage />} />
        <Route path="/merci-reservation-gaming" element={<MerciReservationGamingPage />} />
        <Route path="/pass-gaming" element={<PassGamingPage />} />
        <Route path="/pass-gaming/confirmation" element={<PassGamingConfirmationPage />} />
        <Route path="/yoga" element={<YogaPage />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/politique-de-confidentialite" element={<Confidentialite />} />
        <Route path="/organizer" element={<OrganizerLogin />} />
        <Route path="/organizer/register" element={<OrganizerRegister />} />
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
      </Routes>
    </div>
  );
}
