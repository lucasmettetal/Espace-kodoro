import { useState, useEffect } from 'react';
import { ActivityLayout } from './ActivityLayout';

type YogaConfig = {
  yoga_date: string;
  yoga_horaire: string;
  yoga_lieu: string;
  yoga_tarif: string;
  yoga_contact: string;
  yoga_niveau: string;
  yoga_materiel: string;
  yoga_inscrip: string;
};

const DEFAULTS: YogaConfig = {
  yoga_date: '',
  yoga_horaire: '',
  yoga_lieu: 'Espace Ködörö — Caussade',
  yoga_tarif: '',
  yoga_contact: 'espacekodoro@gmail.com',
  yoga_niveau: 'Tous niveaux — débutants bienvenus',
  yoga_materiel: 'Tapis de yoga conseillé (quelques tapis disponibles sur place)',
  yoga_inscrip: "Inscription recommandée — contacter via l'email ci-dessous",
};

export function YogaPage() {
  const [cfg, setCfg] = useState<YogaConfig>(DEFAULTS);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCfg({ ...DEFAULTS, ...data }); })
      .catch(() => {});
  }, []);

  const contactHref = cfg.yoga_contact.includes('@')
    ? `mailto:${cfg.yoga_contact}`
    : cfg.yoga_contact || 'mailto:espacekodoro@gmail.com';

  return (
    <ActivityLayout>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #3B4D3E 0%, #5C7460 55%, #3B4D3E 100%)',
          padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem) clamp(4rem, 8vw, 7rem)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(201,167,0,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1.25rem' }}>
            Activité régulière — Espace Ködörö
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 700, lineHeight: 1.1, color: '#F4EFE4', margin: 0, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            <em style={{ fontStyle: 'italic', color: '#C9A700' }}>Yoga</em>
            <br />à l'Espace Ködörö
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', lineHeight: 1.75, color: 'rgba(244,239,228,0.75)', maxWidth: 560, marginBottom: '2.5rem' }}>
            Des séances de yoga dans un cadre calme et convivial à Caussade.
          </p>
          <a
            href={contactHref}
            style={{ display: 'inline-block', background: '#C9A700', color: '#F4EFE4', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 2rem', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
          >
            Réserver une séance
          </a>
        </div>
      </section>

      {/* ── Prochaine séance ─────────────────────────────────────────────────── */}
      <section style={{ background: '#FBF7EF', padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '3rem', alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-2">
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
                Prochaine séance
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2, color: '#5F3636', margin: 0, marginBottom: '2rem' }}>
                {cfg.yoga_date || 'Date à confirmer'}
              </h2>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Horaire', value: cfg.yoga_horaire || 'À confirmer' },
                  { label: 'Lieu', value: cfg.yoga_lieu },
                  { label: 'Tarif', value: cfg.yoga_tarif || 'À confirmer' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
                    <dt style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', flexShrink: 0, width: 80 }}>
                      {label}
                    </dt>
                    <dd style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#5F3636', fontWeight: 500, margin: 0 }}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <a
                href={contactHref}
                style={{ display: 'inline-block', background: '#C9A700', color: '#F4EFE4', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 2rem', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
              >
                Nous contacter
              </a>
            </div>

            {/* Infos pratiques */}
            <div style={{ background: '#F4EFE4', border: '1px solid rgba(95,54,54,0.1)', padding: 'clamp(1.5rem, 3vw, 2rem)' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1.25rem' }}>
                Informations pratiques
              </p>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { label: 'Niveau', value: cfg.yoga_niveau },
                  { label: 'Matériel', value: cfg.yoga_materiel },
                  { label: 'Inscription', value: cfg.yoga_inscrip },
                  { label: 'Contact', value: cfg.yoga_contact },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.3rem' }}>
                      {label}
                    </dt>
                    <dd style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', margin: 0, lineHeight: 1.6 }}>
                      {value || 'À confirmer'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ── L'ambiance ───────────────────────────────────────────────────────── */}
      <section style={{ background: '#F4EFE4', padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem)', borderTop: '1px solid rgba(95,54,54,0.08)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
            L'esprit du lieu
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '1.25rem' }}>
            Un espace calme, ouvert à tous
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', lineHeight: 1.85, color: '#6B5D52', margin: 0 }}>
            Les séances de yoga à l'Espace Ködörö se déroulent dans la grande salle de vie, un espace
            lumineux et convivial au cœur de Caussade. L'objectif est de proposer des séances accessibles,
            sans pression, dans un cadre agréable. Que vous soyez débutant ou pratiquant régulier, vous
            êtes les bienvenu·e·s.
          </p>
        </div>
      </section>

      {/* ── Contact CTA ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#5C7460', padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
            Inscription & informations
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: '#F4EFE4', margin: 0, marginBottom: '1rem' }}>
            Une question sur les séances ?
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', lineHeight: 1.8, color: 'rgba(244,239,228,0.7)', marginBottom: '2rem' }}>
            N'hésitez pas à nous contacter pour toute question sur les prochaines séances, les horaires
            ou les inscriptions.
          </p>
          <a
            href={contactHref}
            style={{ display: 'inline-block', background: '#C9A700', color: '#F4EFE4', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 2rem', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
          >
            Nous contacter
          </a>
        </div>
      </section>
    </ActivityLayout>
  );
}
