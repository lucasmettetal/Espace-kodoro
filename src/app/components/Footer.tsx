import { Link } from 'react-router';

// Réseaux sociaux
const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/espacekodoro',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/espace_kodoro/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const footerLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Activités', href: '/activites' },
  { label: 'Gaming', href: '/gaming' },
  { label: 'Yoga', href: '/yoga' },
  { label: 'Rendez-vous', href: '/#activites-agenda' },
  { label: 'Contact', href: '/#contact' },
];

export function Footer() {
  return (
    <footer style={{ background: '#5F3636', padding: '4rem clamp(2rem, 8vw, 8rem) 2.5rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Top row */}
        <div
          style={{
            display: 'grid',
            gap: '2rem',
            alignItems: 'start',
            marginBottom: '3rem',
            paddingBottom: '3rem',
            borderBottom: '1px solid rgba(244,239,228,0.1)',
          }}
          className="grid-cols-[1fr_auto] max-md:grid-cols-1"
        >
          {/* Brand + réseaux sociaux */}
          <div>
            <a
              href="#"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#F4EFE4',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                marginBottom: '1rem',
              }}
            >
              <img
                src="/logo.jpg"
                alt="Espace Ködörö"
                style={{ height: 40, width: 40, display: 'block', objectFit: 'contain' }}
              />
              Espace <em style={{ fontStyle: 'italic', color: '#C9A700' }}>Ködörö</em>
            </a>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem',
                lineHeight: 1.7,
                color: 'rgba(244,239,228,0.45)',
                maxWidth: 360,
                margin: 0,
                marginBottom: '1.5rem',
              }}
            >
              Un espace de vie partagé au 25 boulevard Didier Rey,<br />
              82300 Caussade — Tarn-et-Garonne, France.
            </p>

            {/* Icônes réseaux sociaux */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(244,239,228,0.07)',
                    color: 'rgba(244,239,228,0.5)',
                    textDecoration: 'none',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#C9A700';
                    e.currentTarget.style.color = '#F4EFE4';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(244,239,228,0.07)';
                    e.currentTarget.style.color = 'rgba(244,239,228,0.5)';
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <nav>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem 2.5rem',
              }}
            >
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.85rem',
                      color: 'rgba(244,239,228,0.55)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#F4EFE4')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244,239,228,0.55)')}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              color: 'rgba(244,239,228,0.3)',
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} Espace Ködörö — Tous droits réservés
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Mentions légales', to: '/mentions-legales' },
              { label: 'Politique de confidentialité', to: '/politique-de-confidentialite' },
              { label: 'Espace organisateur', to: '/organizer' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.62rem',
                  letterSpacing: '0.06em',
                  color: 'rgba(244,239,228,0.25)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(244,239,228,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244,239,228,0.25)')}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
