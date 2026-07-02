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

function formatTime(t: string | undefined): string {
  if (!t) return '';
  if (t === '00:00') return 'minuit';
  return t.replace(':00', 'h');
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

  const start     = formatTime(event.start_time);
  const end       = formatTime(event.end_time);
  const timeStr   = [start, end].filter(Boolean).join(' – ');
  const placesStr = event.is_open
    ? `${event.available} place${event.available > 1 ? 's' : ''} dispo`
    : 'Complet';

  return (
    <div style={{ background: '#160d0d', borderBottom: '1px solid rgba(201,167,0,0.2)', marginTop: 72 }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(0.875rem, 2vw, 1.125rem) clamp(1.5rem, 8vw, 8rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>

        {/* Gauche : badge + infos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap', flex: '1 1 auto', minWidth: 0 }}>

          {/* Badge plein */}
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.55rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#160d0d',
            background: '#C9A700',
            padding: '0.22rem 0.6rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            🎮 Le Lobby
          </span>

          {/* Texte principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
                fontWeight: 700,
                color: '#F4EFE4',
                whiteSpace: 'nowrap',
              }}>
                Soirée gaming à Caussade
              </span>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.82rem',
                color: 'rgba(244,239,228,0.55)',
                whiteSpace: 'nowrap',
              }}>
                {formatDate(event.event_date)}{timeStr ? ` · ${timeStr}` : ''}
                {' '}·{' '}
                <span style={{ color: event.is_open ? '#81C784' : '#E57373', fontWeight: 500 }}>
                  {placesStr}
                </span>
              </span>
            </div>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.7rem',
              color: 'rgba(244,239,228,0.3)',
              letterSpacing: '0.02em',
            }}>
              Consoles · rétro · multijoueur · PC/LAN
            </span>
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
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            padding: '0.7rem 1.5rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
