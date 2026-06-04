import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Activités', href: '#activites' },
  { label: 'Nos Espaces', href: '#espaces' },
  { label: 'Thérapeutes', href: '#therapeutes' },
  { label: 'Événements', href: '#activites-agenda' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'Contact', href: '#contact' },
];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'box-shadow 0.4s ease',
        background: '#F4EFE4',
        boxShadow: scrolled ? '0 2px 12px rgba(28,22,18,0.12)' : '0 1px 0 rgba(28,22,18,0.08)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          {/* Logo */}
          <a href="#" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <img
              src="/logo.jpg"
              alt="Espace Ködörö"
              style={{ height: 60, width: 60, borderRadius: '50%', display: 'block', objectFit: 'cover' }}
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
          </a>

          {/* Desktop links */}
          <ul
            style={{
              display: 'flex',
              gap: '2.5rem',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
            className="hidden md:flex"
          >
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: '#1C1612',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    opacity: 0.75,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.75')}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a
              href="#contact"
              className="hidden md:inline-flex"
              style={{
                background: '#C06040',
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
              onMouseEnter={e => (e.currentTarget.style.background = '#A8503A')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C06040')}
            >
              Réserver
            </a>

            {/* Mobile hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#1C1612' }}
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: '#F4EFE4', borderTop: '1px solid rgba(28,22,18,0.1)', padding: '1.5rem 2rem' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '1rem',
                    color: '#1C1612',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'inline-block',
                  background: '#C06040',
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
                Réserver
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
