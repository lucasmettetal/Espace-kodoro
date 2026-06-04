import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '../components/Footer';

export function LegalLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  // Remonter en haut de page à l'ouverture
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ background: '#F4EFE4', minHeight: '100vh' }}>
      {/* En-tête simple */}
      <header
        style={{
          background: '#F4EFE4',
          borderBottom: '1px solid rgba(28,22,18,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 2rem',
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <img
              src="/logo.jpg"
              alt="Espace Ködörö"
              style={{ height: 48, width: 48, borderRadius: '50%', display: 'block', objectFit: 'cover' }}
            />
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#1C1612',
                letterSpacing: '-0.01em',
              }}
            >
              Espace <em style={{ fontStyle: 'italic', color: '#C06040' }}>Ködörö</em>
            </span>
          </Link>

          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#6B5D52',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      {/* Contenu */}
      <main
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 2rem) clamp(4rem, 8vw, 6rem)',
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#C06040',
            marginBottom: '1rem',
          }}
        >
          Informations légales
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: '#1C1612',
            margin: 0,
            marginBottom: subtitle ? '0.75rem' : '2.5rem',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.95rem',
              color: '#6B5D52',
              marginBottom: '2.5rem',
            }}
          >
            {subtitle}
          </p>
        )}

        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.95rem',
            lineHeight: 1.8,
            color: '#3D332B',
          }}
        >
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Petits composants de mise en forme réutilisables
export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.4rem',
          fontWeight: 700,
          color: '#1C1612',
          margin: 0,
          marginBottom: '1rem',
        }}
      >
        {heading}
      </h2>
      {children}
    </section>
  );
}

export function ToComplete({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        background: 'rgba(192,96,64,0.12)',
        color: '#A8503A',
        padding: '0.1rem 0.4rem',
        borderRadius: 3,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}
