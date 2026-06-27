import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ActivityLayout } from './ActivityLayout';

// ─────────────────────────────────────────────────────────────
//  CONSTANTES — à modifier si l'événement change
// ─────────────────────────────────────────────────────────────
const EVENT_LABEL   = 'Vendredi 26 juin 2026';
const EVENT_HORAIRE = '20h – 23h';
const EVENT_LIEU    = 'Espace Ködörö — Caussade';

// Lien WhatsApp — remplacez [LIEN_WHATSAPP] par l'URL réelle du groupe
// ex : 'https://chat.whatsapp.com/XXXXXXXXXXXXXXXXXXXXXXX'
const WHATSAPP_LINK_FALLBACK = '[LIEN_WHATSAPP]';

// Contact — remplacez par votre email ou lien de contact réel
const CONTACT_FALLBACK = 'espacekodoro@gmail.com';
// ─────────────────────────────────────────────────────────────

type SiteConfig = {
  gaming_whatsapp_link: string;
};

export function MerciReservationGamingPage() {
  const [cfg, setCfg] = useState<SiteConfig>({ gaming_whatsapp_link: '' });
  const [searchParams] = useSearchParams();
  const isPass = searchParams.get('pass') === '1';
  const isFirstVisit = searchParams.get('first_visit') === '1';

  // Charger la config pour récupérer le lien WhatsApp dynamique
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCfg(data); })
      .catch(() => {});
  }, []);

  // Scroll en haut à l'arrivée sur la page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const waHref = cfg.gaming_whatsapp_link || WHATSAPP_LINK_FALLBACK;
  const waIsReal = waHref !== WHATSAPP_LINK_FALLBACK && waHref.startsWith('http');

  return (
    <ActivityLayout>

      {/* ── Section principale ────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #2E1515 0%, #5F3636 55%, #3D1F1F 100%)',
        padding:    'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem) clamp(4rem, 8vw, 7rem)',
        position:   'relative',
        overflow:   'hidden',
        textAlign:  'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(201,167,0,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Icône de confirmation */}
          <div style={{
            width: 72, height: 72,
            borderRadius: '50%',
            border: '2px solid #C9A700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            fontSize: '2rem',
          }}>
            ✓
          </div>

          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
            {isFirstVisit ? 'Première soirée offerte' : isPass ? 'Réservation enregistrée' : 'Paiement reçu'}
          </p>

          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, lineHeight: 1.2, color: '#F4EFE4', margin: 0, marginBottom: '1.5rem' }}>
            {isFirstVisit ? (
              <>Bienvenue à ta{' '}<em style={{ fontStyle: 'italic', color: '#C9A700' }}>première soirée</em> !</>
            ) : (
              <>Merci pour votre{' '}<em style={{ fontStyle: 'italic', color: '#C9A700' }}>réservation</em> !</>
            )}
          </h1>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.85, color: 'rgba(244,239,228,0.8)', maxWidth: 580, margin: '0 auto 2rem' }}>
            {isFirstVisit
              ? "Ta première soirée est offerte — ta place est réservée, rien à payer. Viens voir l'ambiance, rencontrer la communauté, et si tu aimes, on espère te revoir !"
              : isPass
              ? "Votre place est réservée grâce à votre Pass Gaming — aucun paiement supplémentaire n'est nécessaire pour cette soirée. Vous recevrez les informations utiles avant la soirée."
              : "Votre paiement a bien été reçu. Votre place sera enregistrée après validation finale du paiement. Vous recevrez les informations utiles avant la soirée."}
          </p>

          {/* Rappel de l'événement */}
          <div style={{
            background: 'rgba(244,239,228,0.06)',
            border: '1px solid rgba(201,167,0,0.3)',
            padding: '1.5rem 2rem',
            display: 'inline-block',
            textAlign: 'left',
            marginBottom: '2.5rem',
          }}>
            {[
              { label: 'Événement', value: 'Soirée Gaming — Espace Ködörö' },
              { label: 'Date',      value: EVENT_LABEL },
              { label: 'Horaire',   value: EVENT_HORAIRE },
              { label: 'Lieu',      value: EVENT_LIEU },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,167,0,0.7)', flexShrink: 0, minWidth: 80 }}>
                  {label}
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: 'rgba(244,239,228,0.85)', fontWeight: 500 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <Link
              to="/gaming"
              style={{
                display: 'inline-block',
                border: '1px solid rgba(244,239,228,0.35)',
                color: 'rgba(244,239,228,0.85)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '0.75rem 2rem',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A700'; e.currentTarget.style.color = '#C9A700'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(244,239,228,0.35)'; e.currentTarget.style.color = 'rgba(244,239,228,0.85)'; }}
            >
              ← Retour à la page Gaming
            </Link>

            {waIsReal && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#C9A700',
                  color: '#F4EFE4',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  padding: '0.75rem 2rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
              >
                Rejoindre le groupe WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Section informations complémentaires ──────────────────────── */}
      <section style={{ background: '#FBF7EF', padding: 'clamp(3rem, 6vw, 5rem) clamp(2rem, 8vw, 8rem)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div style={{ background: '#F4EFE4', border: '1px solid rgba(95,54,54,0.1)', padding: '1.25rem 1.5rem' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '0.5rem' }}>
              Confirmation de votre réservation
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', lineHeight: 1.8, color: '#6B5D52', margin: 0 }}>
              Votre réservation sera confirmée après vérification du paiement.
              Si vous ne recevez pas de confirmation dans les 24h, contactez-nous à{' '}
              <a href={`mailto:${CONTACT_FALLBACK}`} style={{ color: '#5F3636' }}>{CONTACT_FALLBACK}</a>.
            </p>
          </div>

          <div style={{ background: '#F4EFE4', border: '1px solid rgba(95,54,54,0.1)', padding: '1.25rem 1.5rem' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '0.5rem' }}>
              Suivre les prochaines soirées
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', lineHeight: 1.8, color: '#6B5D52', margin: 0 }}>
              Rejoignez le groupe WhatsApp pour être informé des prochaines dates,
              partager vos idées et contribuer à l'organisation des soirées gaming.
              {waIsReal && (
                <>
                  {' '}<a href={waHref} target="_blank" rel="noopener noreferrer" style={{ color: '#5F3636', fontWeight: 600 }}>→ Rejoindre le groupe</a>
                </>
              )}
            </p>
          </div>

        </div>
      </section>

    </ActivityLayout>
  );
}
