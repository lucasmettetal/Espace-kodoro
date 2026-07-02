import { useState, useEffect } from 'react';

type EventInfo = {
  event_date: string;
  start_time: string;
  end_time: string;
  available: number;
  is_open: boolean;
};

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
}

export function LobbyBanner() {
  const [event, setEvent] = useState<EventInfo | null>(null);

  useEffect(() => {
    fetch('/api/event-availability?type=gaming')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setEvent(data); })
      .catch(() => {});
  }, []);

  if (!event) return null;

  const timeLabel = [
    event.start_time?.replace(':00', 'h'),
    event.end_time?.replace(':00', 'h'),
  ].filter(Boolean).join(' – ');

  return (
    <div style={{
      background: '#160d0d',
      borderTop:    '1px solid rgba(201,167,0,0.18)',
      borderBottom: '1px solid rgba(201,167,0,0.12)',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(1rem, 2.5vw, 1.5rem) clamp(2rem, 8vw, 8rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>

        {/* Infos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.55rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#C9A700',
            border: '1px solid rgba(201,167,0,0.4)',
            padding: '0.2rem 0.55rem',
            whiteSpace: 'nowrap',
          }}>
            Prochain Le Lobby
          </span>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
              fontWeight: 700,
              color: '#F4EFE4',
            }}>
              {formatDate(event.event_date)}
            </span>
            {timeLabel && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem',
                color: 'rgba(244,239,228,0.5)',
              }}>
                · {timeLabel}
              </span>
            )}
            {event.is_open ? (
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.8rem',
                color: '#81C784',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}>
                <span style={{ fontSize: '0.6rem' }}>●</span>
                {event.available} place{event.available > 1 ? 's' : ''} dispo
              </span>
            ) : (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#E57373' }}>
                Complet
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <a
          href="/reservation-gaming"
          style={{
            display: 'inline-block',
            background: '#C9A700',
            color: '#160d0d',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            padding: '0.6rem 1.4rem',
            whiteSpace: 'nowrap',
            transition: 'background 0.18s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
          onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
        >
          Réserver ma place
        </a>
      </div>
    </div>
  );
}
