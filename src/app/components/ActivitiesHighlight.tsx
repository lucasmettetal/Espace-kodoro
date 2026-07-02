import { useState } from 'react';

const lobbyFeatures = [
  { emoji: '🎮', text: 'Consoles & freeplay' },
  { emoji: '🕹️', text: 'Rétro gaming' },
  { emoji: '👥', text: 'Multi & co-op' },
  { emoji: '💻', text: 'PC / LAN selon le matériel' },
  { emoji: '🎒', text: 'Tu peux venir seul' },
  { emoji: '🏆', text: 'Petit tournoi possible' },
];

const otherCards = [
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

function SmallCard({ card }: { card: (typeof otherCards)[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        background: hovered ? '#FBF7EF' : '#F4EFE4',
        border: '1px solid rgba(95,54,54,0.1)',
        padding: 'clamp(1.5rem, 2.5vw, 2rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        transition: 'background 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? '0 4px 20px rgba(95,54,54,0.08)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <span style={{ fontSize: '1.5rem', lineHeight: 1, color: card.accent }}>{card.emoji}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: card.accent }}>
          {card.label}
        </span>
      </div>
      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.15rem, 2vw, 1.4rem)', fontWeight: 700, color: '#5F3636', margin: 0 }}>
        {card.title}
      </h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', lineHeight: 1.75, color: '#6B5D52', margin: 0, flex: 1 }}>
        {card.desc}
      </p>
      <a
        href={card.href}
        style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5F3636', textDecoration: 'none', borderBottom: '1px solid rgba(95,54,54,0.3)', paddingBottom: '1px', transition: 'color 0.2s, border-color 0.2s', alignSelf: 'flex-start' }}
        onMouseEnter={e => { e.currentTarget.style.color = card.accent; e.currentTarget.style.borderColor = card.accent; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#5F3636'; e.currentTarget.style.borderColor = 'rgba(95,54,54,0.3)'; }}
      >
        {card.cta} →
      </a>
    </div>
  );
}

export function ActivitiesHighlight() {
  return (
    <section style={{ background: '#F4EFE4', padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem)', borderTop: '1px solid rgba(95,54,54,0.08)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(2.5rem, 5vw, 4rem)', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
              Activités & Rendez-vous
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 700, lineHeight: 1.15, color: '#5F3636', margin: 0, letterSpacing: '-0.01em' }}>
              Ce qui se passe<br />
              <em style={{ fontStyle: 'italic', color: '#C9A700' }}>à Espace Ködörö</em>
            </h2>
          </div>
          <a
            href="/activites"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B5D52', textDecoration: 'none', borderBottom: '1px solid rgba(107,93,82,0.4)', paddingBottom: '2px', whiteSpace: 'nowrap', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#5F3636')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B5D52')}
          >
            Voir toutes les activités →
          </a>
        </div>

        {/* Carte Le Lobby — pleine largeur */}
        <div style={{
          background: 'linear-gradient(135deg, #1a0808 0%, #2e1010 60%, #1f0d0d 100%)',
          border: '1px solid rgba(201,167,0,0.25)',
          marginBottom: '1.5rem',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Halo déco */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(201,167,0,0.07) 0%, transparent 55%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(2rem, 4vw, 3rem) clamp(1.5rem, 4vw, 3rem)', display: 'grid', gap: '2rem', alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-[1fr_auto]">

            {/* Contenu principal */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C9A700', border: '1px solid rgba(201,167,0,0.35)', padding: '0.2rem 0.55rem' }}>
                  Soirée régulière
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,167,0,0.55)' }}>
                  Un vendredi sur deux · 20h – 23h
                </span>
              </div>

              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#F4EFE4', margin: '0 0 0.5rem', letterSpacing: '-0.01em' }}>
                🎮 Le Lobby
              </h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', lineHeight: 1.75, color: 'rgba(244,239,228,0.65)', margin: '0 0 1.75rem', maxWidth: 560 }}>
                Un rendez-vous gaming bi-mensuel à Caussade — consoles, rétro, multi et PC/LAN.
                Ouverts à tous, même si tu ne joues que rarement.
                <strong style={{ color: '#C9A700' }}> La première soirée est offerte.</strong>
              </p>

              {/* Fonctionnalités */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                {lobbyFeatures.map(f => (
                  <span key={f.text} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(201,167,0,0.08)', border: '1px solid rgba(201,167,0,0.18)', padding: '0.3rem 0.75rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: 'rgba(244,239,228,0.75)' }}>
                    <span>{f.emoji}</span> {f.text}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <a
                  href="/reservation-gaming"
                  style={{ display: 'inline-block', background: '#C9A700', color: '#160d0d', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 1.75rem', transition: 'background 0.18s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
                >
                  Réserver ma place
                </a>
                <a
                  href="/pass-gaming"
                  style={{ display: 'inline-block', border: '1px solid rgba(201,167,0,0.5)', color: '#C9A700', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 1.75rem', transition: 'border-color 0.18s, background 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,167,0,0.1)'; e.currentTarget.style.borderColor = '#C9A700'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(201,167,0,0.5)'; }}
                >
                  Pass trimestre — 20 €
                </a>
                <a
                  href="/gaming"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: 'rgba(244,239,228,0.45)', textDecoration: 'none', letterSpacing: '0.04em', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(244,239,228,0.8)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(244,239,228,0.45)')}
                >
                  En savoir plus →
                </a>
              </div>
            </div>

            {/* Logo Le Lobby */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
              <img
                src="/gaming.jpg"
                alt="Le Lobby"
                style={{ width: 'clamp(140px, 18vw, 220px)', height: 'clamp(140px, 18vw, 220px)', objectFit: 'contain', borderRadius: '50%', display: 'block' }}
              />
            </div>

          </div>
        </div>

        {/* Yoga + Autres — 2 colonnes */}
        <div style={{ display: 'grid', gap: '1.5rem' }} className="grid-cols-1 md:grid-cols-2">
          {otherCards.map(card => <SmallCard key={card.title} card={card} />)}
        </div>

      </div>
    </section>
  );
}
