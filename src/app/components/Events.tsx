import { useState, useEffect } from 'react';

type Event = {
  id: number;
  date: string;
  day: string;
  year: string;
  title: string;
  type: string;
  description: string;
  price: string;
  spots: string;
};

const typeColors: Record<string, string> = {
  'Soirée': '#C9A700',
  'Culture': '#5C7460',
  'Formation': '#5F3636',
  'Bien-être': '#8B7355',
};

export function Events() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch('/content/events.json')
      .then(r => r.json())
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  return (
    <section id="activites-agenda" style={{ background: '#FBF7EF', padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(3rem, 5vw, 4rem)', flexWrap: 'wrap', gap: '1.5rem' }}>
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
              05 — Agenda & Événements
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
              À venir chez<br />
              <em style={{ fontStyle: 'italic', color: '#C9A700' }}>Espace Ködörö</em>
            </h2>
          </div>
          <a
            href="#contact"
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
            }}
          >
            Voir tout l'agenda →
          </a>
        </div>

        {/* Event list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {events.map((event, i) => (
            <div
              key={event.id}
              style={{
                display: 'grid',
                gap: '2rem',
                padding: '2rem 0',
                borderBottom: '1px solid rgba(95,54,54,0.1)',
                borderTop: i === 0 ? '1px solid rgba(95,54,54,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
                background: hovered === event.id ? 'rgba(201,167,0,0.06)' : 'transparent',
                alignItems: 'center',
              }}
              className="grid-cols-[80px_1fr_auto] max-sm:grid-cols-1"
              onMouseEnter={() => setHovered(event.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Date */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.65rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#6B5D52',
                    marginBottom: '0.25rem',
                  }}
                >
                  {event.day}
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: '#C9A700',
                    lineHeight: 1,
                  }}
                >
                  {event.date.split(' ')[0]}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.65rem',
                    color: '#6B5D52',
                    letterSpacing: '0.06em',
                  }}
                >
                  {event.date.split(' ')[1]}
                </div>
              </div>

              {/* Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.6rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#F4EFE4',
                      background: typeColors[event.type] ?? '#5F3636',
                      padding: '0.2rem 0.6rem',
                    }}
                  >
                    {event.type}
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.65rem',
                      color: '#6B5D52',
                    }}
                  >
                    {event.spots}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#5F3636',
                    margin: 0,
                    marginBottom: '0.4rem',
                  }}
                >
                  {event.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.85rem',
                    lineHeight: 1.65,
                    color: '#6B5D52',
                    margin: 0,
                  }}
                >
                  {event.description}
                </p>
              </div>

              {/* Price + CTA */}
              <div style={{ textAlign: 'right', flexShrink: 0 }} className="max-sm:text-left">
                <div
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#5F3636',
                    marginBottom: '0.75rem',
                  }}
                >
                  {event.price}
                </div>
                <a
                  href="#contact"
                  style={{
                    display: 'inline-block',
                    border: '1px solid rgba(95,54,54,0.25)',
                    color: '#5F3636',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    padding: '0.5rem 1.25rem',
                    transition: 'background 0.2s, color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#C9A700'; e.currentTarget.style.color = '#F4EFE4'; e.currentTarget.style.borderColor = '#C9A700'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5F3636'; e.currentTarget.style.borderColor = 'rgba(95,54,54,0.25)'; }}
                >
                  S'inscrire
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
