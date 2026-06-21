import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ActivityLayout } from './ActivityLayout';
import { useUtm, buildUtmQuery } from '../hooks/useUtm';

type SiteConfig = {
  gaming_date: string;
  gaming_horaire: string;
  gaming_lieu: string;
  gaming_places: string;
  gaming_prix: string;
  gaming_stripe_link: string;
  gaming_whatsapp_link: string;
};

const DEFAULTS: SiteConfig = {
  gaming_date: '',
  gaming_horaire: '20h – 23h',
  gaming_lieu: 'Espace Ködörö — Caussade',
  gaming_places: '30',
  gaming_prix: '5 €',
  gaming_stripe_link: '',
  gaming_whatsapp_link: '',
};

const features = [
  { emoji: '🎮', title: 'Freeplay consoles' },
  { emoji: '🕹️', title: 'Rétro gaming' },
  { emoji: '👥', title: 'Jeux multijoueurs' },
  { emoji: '🏆', title: 'Petit tournoi possible' },
  { emoji: '💻', title: 'Coin PC / LAN selon le matériel disponible' },
  { emoji: '💬', title: 'Échanges autour du projet associatif' },
];

const faq: { q: string; a: string }[] = [
  {
    q: 'Est-ce que je dois être bon aux jeux vidéo pour venir ?',
    a: "Non, la soirée est ouverte à tous les niveaux. L'objectif est de jouer, découvrir et passer un bon moment.",
  },
  {
    q: 'Est-ce que je peux venir seul ?',
    a: "Oui, c'est justement l'occasion de rencontrer d'autres joueurs.",
  },
  {
    q: 'Est-ce que je peux apporter mon matériel ?',
    a: 'Oui, console, PC, écran, manettes ou jeux sont les bienvenus. Merci simplement de prévenir à l\'avance.',
  },
  {
    q: 'Est-ce que c\'est une salle e-sport ?',
    a: "Non, le projet démarre simplement. L'objectif est de construire progressivement un rendez-vous gaming local selon les envies, les moyens disponibles et les personnes motivées.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(95,54,54,0.1)', padding: '1.25rem 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
      >
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', fontWeight: 600, color: '#5F3636', lineHeight: 1.5 }}>
          {q}
        </span>
        <span style={{ flexShrink: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A700', fontSize: '1.2rem', lineHeight: 1, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none' }}>
          +
        </span>
      </button>
      {open && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', lineHeight: 1.75, color: '#6B5D52', margin: 0, marginTop: '0.75rem' }}>
          {a}
        </p>
      )}
    </div>
  );
}

export function GamingPage() {
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULTS);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCfg({ ...DEFAULTS, ...data }); })
      .catch(() => {});
  }, []);

  const waHref = cfg.gaming_whatsapp_link || '#contact';
  const utms = useUtm();
  const reservationHref = `/reservation-gaming${buildUtmQuery(utms)}`;

  return (
    <ActivityLayout>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #2E1515 0%, #5F3636 55%, #3D1F1F 100%)',
          padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem) clamp(4rem, 8vw, 7rem)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(201,167,0,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1.25rem' }}>
            Activité régulière — Espace Ködörö
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 700, lineHeight: 1.1, color: '#F4EFE4', margin: 0, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            Soirées <em style={{ fontStyle: 'italic', color: '#C9A700' }}>Gaming</em>
            <br />à Caussade
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', lineHeight: 1.75, color: 'rgba(244,239,228,0.75)', maxWidth: 600, marginBottom: '2.5rem' }}>
            Un rendez-vous pour jouer, rencontrer d'autres joueurs et construire une communauté gaming locale.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <Link
              to={reservationHref}
              style={{ display: 'inline-block', background: '#C9A700', color: '#F4EFE4', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 2rem', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
            >
              Réserver la prochaine soirée
            </Link>
            <a
              href={waHref}
              target={cfg.gaming_whatsapp_link ? '_blank' : undefined}
              rel="noopener noreferrer"
              style={{ display: 'inline-block', border: '1px solid rgba(244,239,228,0.35)', color: 'rgba(244,239,228,0.85)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 2rem', transition: 'border-color 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A700'; e.currentTarget.style.color = '#C9A700'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(244,239,228,0.35)'; e.currentTarget.style.color = 'rgba(244,239,228,0.85)'; }}
            >
              Rejoindre le groupe WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── Prochaine soirée ─────────────────────────────────────────────────── */}
      <section style={{ background: '#FBF7EF', padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '3rem', alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-2">
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
                Prochaine soirée
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2, color: '#5F3636', margin: 0, marginBottom: '2rem' }}>
                {cfg.gaming_date || 'Date à confirmer'}
              </h2>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Horaire', value: cfg.gaming_horaire },
                  { label: 'Lieu', value: cfg.gaming_lieu },
                  { label: 'Places', value: `${cfg.gaming_places} places maximum` },
                  { label: 'Participation', value: cfg.gaming_prix },
                  { label: 'Réservation', value: 'Obligatoire — confirmée après paiement' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
                    <dt style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', flexShrink: 0, width: 110 }}>
                      {label}
                    </dt>
                    <dd style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#5F3636', fontWeight: 500, margin: 0 }}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link
                to={reservationHref}
                style={{ display: 'inline-block', background: '#C9A700', color: '#F4EFE4', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 2rem', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
              >
                Réserver ma place — {cfg.gaming_prix}
              </Link>
            </div>

            <div style={{ background: '#F4EFE4', border: '1px solid rgba(95,54,54,0.1)', padding: 'clamp(1.5rem, 3vw, 2rem)' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '0.75rem' }}>
                Pourquoi un paiement en ligne ?
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', lineHeight: 1.8, color: '#6B5D52', margin: 0 }}>
                Votre place est réservée uniquement après paiement. Le paiement en ligne permet de confirmer
                les places à l'avance et de faciliter l'accueil le soir de la soirée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Le concept ───────────────────────────────────────────────────────── */}
      <section style={{ background: '#F4EFE4', padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem)', borderTop: '1px solid rgba(95,54,54,0.08)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '3rem', alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-[1fr_2fr]">
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
                Le concept
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2, color: '#5F3636', margin: 0 }}>
                Un rendez-vous local,<br />
                <em style={{ fontStyle: 'italic', color: '#C9A700' }}>pas une salle e-sport</em>
              </h2>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', lineHeight: 1.85, color: '#6B5D52', margin: 0 }}>
              Après une première rencontre test encourageante, l'objectif est de créer un rendez-vous gaming régulier
              à Caussade. L'idée n'est pas de faire un cybercafé ou une salle e-sport complète, mais de
              proposer un moment convivial pour jouer, échanger, découvrir des jeux, partager du matériel
              et construire ensemble les prochains formats.
            </p>
          </div>
        </div>
      </section>

      {/* ── Ce qu'on retrouve ────────────────────────────────────────────────── */}
      <section style={{ background: '#FBF7EF', padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
            Au programme
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '2.5rem' }}>
            Ce qu'on peut retrouver pendant les soirées
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }} className="grid-cols-2 md:grid-cols-3">
            {features.map(f => (
              <div key={f.title} style={{ background: '#F4EFE4', border: '1px solid rgba(95,54,54,0.08)', padding: 'clamp(1.25rem, 2vw, 1.5rem)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{f.emoji}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: '#5F3636', lineHeight: 1.4 }}>
                  {f.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Matériel + Mineurs ───────────────────────────────────────────────── */}
      <section style={{ background: '#F4EFE4', padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem)', borderTop: '1px solid rgba(95,54,54,0.08)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '3rem', alignItems: 'center' }} className="grid-cols-1 lg:grid-cols-2">
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
                Matériel bienvenu
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '1.25rem' }}>
                Vous pouvez apporter du matériel
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', lineHeight: 1.8, color: '#6B5D52', margin: 0 }}>
                Si vous souhaitez apporter une console, un PC, un écran, des manettes ou des jeux, c'est
                possible. Merci simplement de prévenir à l'avance afin d'adapter l'organisation de la salle,
                les branchements et l'espace disponible.
              </p>
            </div>
            <div style={{ background: '#FBF7EF', border: '1px solid rgba(95,54,54,0.1)', padding: 'clamp(1.5rem, 3vw, 2rem)' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '0.75rem' }}>
                Informations pour les mineurs
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', lineHeight: 1.8, color: '#6B5D52', margin: 0 }}>
                Les enfants de moins de 15 ans doivent être accompagnés par un adulte présent sur place
                pendant la soirée. Les mineurs de 15 à 17 ans doivent fournir une autorisation parentale
                avec un numéro de téléphone d'un responsable légal. Merci de nous prévenir à l'avance
                si un mineur participe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WhatsApp ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#5F3636', padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem)', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
            Communauté gaming
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, color: '#F4EFE4', margin: 0, marginBottom: '1.25rem' }}>
            Suivre les prochaines soirées
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', lineHeight: 1.8, color: 'rgba(244,239,228,0.7)', marginBottom: '2rem' }}>
            Un groupe WhatsApp est disponible pour suivre les prochaines dates, proposer des idées,
            indiquer le matériel que vous pouvez apporter et participer à l'organisation du projet gaming.
          </p>
          <a
            href={waHref}
            target={cfg.gaming_whatsapp_link ? '_blank' : undefined}
            rel="noopener noreferrer"
            style={{ display: 'inline-block', background: '#C9A700', color: '#F4EFE4', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 2rem', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
          >
            Rejoindre le groupe WhatsApp
          </a>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section style={{ background: '#F4EFE4', padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
            Questions fréquentes
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '2rem' }}>
            FAQ
          </h2>
          <div style={{ borderTop: '1px solid rgba(95,54,54,0.1)' }}>
            {faq.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>
    </ActivityLayout>
  );
}
