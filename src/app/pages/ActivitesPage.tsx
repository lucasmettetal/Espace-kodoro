import { useState } from 'react';
import { Link } from 'react-router';
import { ActivityLayout } from './ActivityLayout';

const activities = [
  {
    id: 'gaming',
    emoji: '🎮',
    label: 'Soirée',
    title: 'Soirées Gaming',
    description:
      'Un rendez-vous pour jouer, rencontrer d\'autres joueurs, découvrir des jeux, partager du matériel et construire une communauté gaming locale à Caussade.',
    cta: 'Découvrir',
    to: '/gaming',
    labelColor: '#C9A700',
  },
  {
    id: 'yoga',
    emoji: '🧘',
    label: 'Bien-être',
    title: 'Yoga',
    description:
      'Des séances de yoga à l\'Espace Ködörö, dans un cadre calme et convivial.',
    cta: 'Voir les prochaines dates',
    to: '/yoga',
    labelColor: '#5C7460',
  },
  {
    id: 'jeux',
    emoji: '🎲',
    label: 'Convivial',
    title: 'Jeux & rencontres',
    description:
      'Des moments conviviaux autour de jeux de société, de rencontres et de projets locaux à Caussade.',
    cta: 'Nous contacter',
    to: null,
    href: 'mailto:espacekodoro@gmail.com',
    labelColor: '#6B5D52',
  },
];

function ActivityCard({ activity }: { activity: (typeof activities)[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: '#FBF7EF',
        border: '1px solid rgba(95,54,54,0.1)',
        padding: 'clamp(1.75rem, 3vw, 2.5rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        transition: 'box-shadow 0.2s',
        boxShadow: hovered ? '0 4px 24px rgba(95,54,54,0.09)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <span style={{ fontSize: '2.2rem', lineHeight: 1, flexShrink: 0 }}>{activity.emoji}</span>
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: activity.labelColor,
              display: 'block',
              marginBottom: '0.4rem',
            }}
          >
            {activity.label}
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
              fontWeight: 700,
              color: '#5F3636',
              margin: 0,
              marginBottom: '0.75rem',
            }}
          >
            {activity.title}
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem',
              lineHeight: 1.75,
              color: '#6B5D52',
              margin: 0,
            }}
          >
            {activity.description}
          </p>
        </div>
      </div>

      <div>
        {activity.to ? (
          <Link
            to={activity.to}
            style={{
              display: 'inline-block',
              border: '1px solid rgba(95,54,54,0.25)',
              color: '#5F3636',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '0.55rem 1.25rem',
              transition: 'background 0.2s, color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#C9A700';
              e.currentTarget.style.color = '#F4EFE4';
              e.currentTarget.style.borderColor = '#C9A700';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#5F3636';
              e.currentTarget.style.borderColor = 'rgba(95,54,54,0.25)';
            }}
          >
            {activity.cta}
          </Link>
        ) : (
          <a
            href={activity.href}
            style={{
              display: 'inline-block',
              border: '1px solid rgba(95,54,54,0.25)',
              color: '#5F3636',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '0.55rem 1.25rem',
              transition: 'background 0.2s, color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#C9A700';
              e.currentTarget.style.color = '#F4EFE4';
              e.currentTarget.style.borderColor = '#C9A700';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#5F3636';
              e.currentTarget.style.borderColor = 'rgba(95,54,54,0.25)';
            }}
          >
            {activity.cta}
          </a>
        )}
      </div>
    </div>
  );
}

export function ActivitesPage() {
  return (
    <ActivityLayout>
      {/* Hero */}
      <section
        style={{
          background: '#F4EFE4',
          padding:
            'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem) clamp(2rem, 4vw, 3rem)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
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
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#5F3636',
              margin: 0,
              marginBottom: '1.25rem',
              letterSpacing: '-0.01em',
            }}
          >
            Ce qui se passe<br />
            <em style={{ fontStyle: 'italic', color: '#C9A700' }}>
              à l'Espace Ködörö
            </em>
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
              lineHeight: 1.75,
              color: '#6B5D52',
              maxWidth: 640,
              margin: 0,
            }}
          >
            L'Espace Ködörö accueille des activités, des rencontres et des rendez-vous
            réguliers à Caussade : gaming, yoga, ateliers, moments conviviaux et
            projets locaux.
          </p>
        </div>
      </section>

      {/* Activity cards */}
      <section
        style={{
          background: '#F4EFE4',
          padding:
            'clamp(1rem, 2vw, 2rem) clamp(2rem, 8vw, 8rem) clamp(5rem, 10vw, 8rem)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gap: '1.5rem' }}
            className="grid-cols-1 md:grid-cols-2"
          >
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          {/* Proposer une activité */}
          <div
            style={{
              marginTop: '2rem',
              background: '#FBF7EF',
              border: '1px solid rgba(201,167,0,0.3)',
              padding: 'clamp(1.5rem, 3vw, 2rem)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#C9A700',
                  margin: 0,
                  marginBottom: '0.4rem',
                }}
              >
                Vous avez un projet ?
              </p>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.95rem',
                  color: '#5F3636',
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Proposer une activité à l'Espace Ködörö
              </p>
            </div>
            <a
              href="mailto:espacekodoro@gmail.com"
              style={{
                display: 'inline-block',
                background: '#C9A700',
                color: '#F4EFE4',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '0.6rem 1.5rem',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
            >
              Nous contacter
            </a>
          </div>
        </div>
      </section>
    </ActivityLayout>
  );
}
