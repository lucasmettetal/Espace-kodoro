import { useState } from 'react';

const cards = [
  {
    emoji: '🎮',
    label: 'Soirée mensuelle',
    title: 'Gaming',
    desc: 'Consoles, rétro, multijoueurs — un rendez-vous convivial pour jouer ensemble.',
    cta: 'Voir la page gaming',
    href: '/gaming',
    accent: '#C9A700',
  },
  {
    emoji: '🧘',
    label: 'Séances régulières',
    title: 'Yoga',
    desc: 'Des séances accessibles à tous les niveaux dans un cadre calme et convivial.',
    cta: 'Voir les séances',
    href: '/yoga',
    accent: '#5C7460',
  },
  {
    emoji: '✦',
    label: 'Ateliers & rencontres',
    title: 'Autres activités',
    desc: 'Numérique, jeux, projets locaux — un lieu vivant ouvert aux initiatives.',
    cta: 'Voir toutes les activités',
    href: '/activites',
    accent: '#8B7355',
  },
];

function Card({ card }: { card: (typeof cards)[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: hovered ? '#FBF7EF' : '#F4EFE4',
        border: '1px solid rgba(95,54,54,0.1)',
        padding: 'clamp(1.75rem, 3vw, 2.25rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'background 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? '0 4px 20px rgba(95,54,54,0.08)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span
          style={{
            fontSize: '1.75rem',
            lineHeight: 1,
            color: card.accent,
          }}
        >
          {card.emoji}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: card.accent,
          }}
        >
          {card.label}
        </span>
      </div>

      <h3
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
          fontWeight: 700,
          color: '#5F3636',
          margin: 0,
        }}
      >
        {card.title}
      </h3>

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.875rem',
          lineHeight: 1.75,
          color: '#6B5D52',
          margin: 0,
          flex: 1,
        }}
      >
        {card.desc}
      </p>

      <a
        href={card.href}
        style={{
          display: 'inline-block',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.8rem',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#5F3636',
          textDecoration: 'none',
          borderBottom: '1px solid rgba(95,54,54,0.3)',
          paddingBottom: '1px',
          transition: 'color 0.2s, border-color 0.2s',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = card.accent;
          e.currentTarget.style.borderColor = card.accent;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = '#5F3636';
          e.currentTarget.style.borderColor = 'rgba(95,54,54,0.3)';
        }}
      >
        {card.cta} →
      </a>
    </div>
  );
}

export function ActivitiesHighlight() {
  return (
    <section
      style={{
        background: '#F4EFE4',
        padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem)',
        borderTop: '1px solid rgba(95,54,54,0.08)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.7rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#C9A700',
                marginBottom: '1rem',
              }}
            >
              Activités & Rendez-vous
            </p>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                color: '#5F3636',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Ce qui se passe<br />
              <em style={{ fontStyle: 'italic', color: '#C9A700' }}>à Espace Ködörö</em>
            </h2>
          </div>
          <a
            href="/activites"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#6B5D52',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(107,93,82,0.4)',
              paddingBottom: '2px',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#5F3636')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B5D52')}
          >
            Voir toutes les activités →
          </a>
        </div>

        {/* Cards */}
        <div
          style={{ display: 'grid', gap: '1.5rem' }}
          className="grid-cols-1 md:grid-cols-3"
        >
          {cards.map((card) => (
            <Card key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
