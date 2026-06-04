const spaces = [
  {
    id: 'coworking',
    number: '01',
    label: 'Espace de travail',
    title: 'Le Coworking',
    description:
      'Un plateau de travail ouvert et modulable, pensé pour les indépendants, freelances et télétravailleurs. Équipé de postes de travail, connexion fibre, zones de réunion et espace détente.',
    image: 'https://images.unsplash.com/photo-1694272604617-9c2ff92d5697?w=900&h=700&fit=crop&auto=format',
    imageAlt: 'Espace coworking chaleureux',
    features: ['Poste fixe ou nomade', 'Fibre haut débit', 'Salle de réunion', 'Cuisine & café', 'Imprimante'],
    cta: 'Voir les tarifs',
    ctaHref: '#tarifs',
    reversed: false,
  },
  {
    id: 'zen',
    number: '02',
    label: 'Cabinet partagé',
    title: 'Cabinet Zen',
    description:
      'Un espace dédié aux thérapeutes et professionnels de santé. Conçu pour la consultation et le soin, dans un environnement apaisant et entièrement équipé, disponible à la demi-journée.',
    image: '/espacezen.jpg',
    imageAlt: 'Cabinet Zen de l\'Espace Ködörö — table de massage et coin soin',
    features: ['Demi-journée ou journée', 'Table de massage', 'Confidentialité assurée', 'Accès thérapeutes adhérents'],
    cta: 'Devenir thérapeute adhérent',
    ctaHref: '#therapeutes',
    reversed: true,
  },
];

export function Spaces() {
  return (
    <section id="espaces" style={{ background: '#1C1612' }}>
      {/* Section header */}
      <div style={{ padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
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
            03 — Nos espaces
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#F4EFE4',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Des lieux qui inspirent<br />
            <em style={{ fontStyle: 'italic', color: '#C06040' }}>la création et le soin</em>
          </h2>
        </div>
      </div>

      {/* Spaces */}
      {spaces.map((space) => (
        <div
          key={space.id}
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(3rem, 6vw, 6rem)',
            alignItems: 'center',
          }}
          className="max-md:grid-cols-1"
        >
          {/* Image */}
          <div style={{ position: 'relative', order: space.reversed ? 2 : 1 }}>
            <img
              src={space.image}
              alt={space.imageAlt}
              style={{
                width: '100%',
                aspectRatio: '4/3',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {/* Number overlay */}
            <div
              style={{
                position: 'absolute',
                top: '-1rem',
                left: space.reversed ? 'auto' : '-1rem',
                right: space.reversed ? '-1rem' : 'auto',
                fontFamily: "'DM Mono', monospace",
                fontSize: '7rem',
                fontWeight: 300,
                color: 'rgba(192,96,64,0.15)',
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {space.number}
            </div>
          </div>

          {/* Text */}
          <div style={{ direction: 'ltr' }}>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.65rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#C06040',
                marginBottom: '1.25rem',
              }}
            >
              {space.label}
            </p>
            <h3
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                fontWeight: 700,
                color: '#F4EFE4',
                margin: 0,
                marginBottom: '1.25rem',
                letterSpacing: '-0.01em',
              }}
            >
              {space.title}
            </h3>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.95rem',
                lineHeight: 1.8,
                color: 'rgba(244,239,228,0.65)',
                marginBottom: '2rem',
              }}
            >
              {space.description}
            </p>

            {/* Features */}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {space.features.map((f) => (
                <li
                  key={f}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.875rem',
                    color: 'rgba(244,239,228,0.7)',
                  }}
                >
                  <span style={{ width: 5, height: 5, background: '#C06040', borderRadius: '50%', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={space.ctaHref}
              style={{
                display: 'inline-block',
                border: '1px solid rgba(244,239,228,0.25)',
                color: '#F4EFE4',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '0.75rem 1.75rem',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#C06040'; e.currentTarget.style.borderColor = '#C06040'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(244,239,228,0.25)'; }}
            >
              {space.cta}
            </a>
          </div>
        </div>
      ))}
    </section>
  );
}
