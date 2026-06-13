import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X } from 'lucide-react';
import { Footer } from '../components/Footer';

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Activités', to: '/activites' },
  { label: 'Gaming', to: '/gaming' },
  { label: 'Yoga', to: '/yoga' },
];

export function ActivityLayout({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: '#F4EFE4', minHeight: '100vh' }}>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: 'box-shadow 0.4s ease',
          background: '#F4EFE4',
          boxShadow: scrolled
            ? '0 2px 12px rgba(95,54,54,0.12)'
            : '0 1px 0 rgba(95,54,54,0.08)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem' }}>
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 72,
            }}
          >
            {/* Logo */}
            <Link
              to="/"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
              }}
            >
              <img
                src="/logo.jpg"
                alt="Espace Ködörö"
                style={{ height: 60, width: 60, display: 'block', objectFit: 'contain' }}
              />
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#5F3636',
                  letterSpacing: '-0.01em',
                }}
              >
                Espace <em style={{ fontStyle: 'italic', color: '#C9A700' }}>Ködörö</em>
              </span>
            </Link>

            {/* Desktop links */}
            <ul
              style={{ gap: '2.5rem', listStyle: 'none', margin: 0, padding: 0 }}
              className="hidden md:flex"
            >
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.875rem',
                        fontWeight: active ? 600 : 400,
                        color: active ? '#C9A700' : '#5F3636',
                        textDecoration: 'none',
                        letterSpacing: '0.02em',
                        opacity: active ? 1 : 0.75,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e =>
                        (e.currentTarget.style.opacity = active ? '1' : '0.75')
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* CTA + burger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <a
                href="mailto:espacekodoro@gmail.com"
                className="hidden md:inline-flex"
                style={{
                  background: '#C9A700',
                  color: '#F4EFE4',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  padding: '0.6rem 1.5rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
              >
                Contact
              </a>
              <button
                className="md:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: '#5F3636',
                }}
                aria-label="Menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            style={{
              background: '#F4EFE4',
              borderTop: '1px solid rgba(95,54,54,0.1)',
              padding: '1.5rem 2rem',
            }}
          >
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '1rem',
                      color: '#5F3636',
                      textDecoration: 'none',
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:espacekodoro@gmail.com"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'inline-block',
                    background: '#C9A700',
                    color: '#F4EFE4',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    padding: '0.6rem 1.5rem',
                    marginTop: '0.5rem',
                  }}
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        )}
      </header>

      <main style={{ paddingTop: 72 }}>{children}</main>

      <Footer />
    </div>
  );
}
