import { Check } from 'lucide-react';

const plans = [
  {
    id: 'demi-journee',
    label: 'Location',
    name: 'Demi-journée',
    price: '150',
    unit: '4h',
    description: 'Pour vos réunions, ateliers ou petits événements. Capacité jusqu\'à 80 personnes.',
    features: [
      'Accès salle spacieuse',
      'Tables et chaises modulables',
      'Accès cuisine & toilettes',
      'Parking disponible',
      'Wifi gratuit',
      'Nettoyage inclus',
    ],
    cta: 'Demander un devis',
    highlight: false,
  },
  {
    id: 'journee',
    label: 'Location',
    name: 'Journée complète',
    price: '280',
    unit: '8h',
    description: 'Pour vos formations, séminaires et événements plus importants. Configuration flexible selon vos besoins.',
    features: [
      'Accès salle complète',
      'Tables et chaises modulables',
      'Accès cuisine professionnelle',
      'Parking illimité',
      'Wifi haut débit',
      'Support technique inclus',
      'Nettoyage complet',
    ],
    cta: 'Réserver',
    highlight: true,
  },
  {
    id: 'zen',
    label: 'Cabinet Zen',
    name: 'Thérapeute',
    price: '25',
    unit: '/ demi-journée',
    description: 'Pour les thérapeutes et professionnels de santé souhaitant accéder au cabinet de soin partagé.',
    features: [
      'Cabinet entièrement équipé',
      'Table de massage incluse',
      'Confidentialité assurée',
      'Accès entrée indépendante',
      'Listing sur notre site',
      'Tarif adhérent',
    ],
    cta: 'En savoir plus',
    highlight: false,
  },
];

export function Tarifs() {
  return (
    <section id="tarifs" style={{ background: '#5F3636', padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'clamp(3rem, 5vw, 4.5rem)' }}>
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
            06 — Tarifs & Conditions
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
              maxWidth: 600,
            }}
          >
            Location simple<br />
            <em style={{ fontStyle: 'italic', color: '#C9A700' }}>et accessible</em>
          </h2>
        </div>

        {/* Plans grid */}
        <div
          style={{
            display: 'grid',
            gap: '2px',
          }}
          className="grid-cols-3 max-lg:grid-cols-1"
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.highlight ? '#C9A700' : 'rgba(244,239,228,0.05)',
                padding: '3rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >

              {/* Label */}
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: plan.highlight ? 'rgba(244,239,228,0.65)' : '#C9A700',
                  marginBottom: '0.5rem',
                }}
              >
                {plan.label}
              </p>

              {/* Plan name */}
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: plan.highlight ? '#F4EFE4' : '#F4EFE4',
                  margin: 0,
                  marginBottom: '1.5rem',
                }}
              >
                {plan.name}
              </h3>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
                <span
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '3rem',
                    fontWeight: 700,
                    color: plan.highlight ? '#F4EFE4' : '#C9A700',
                    lineHeight: 1,
                  }}
                >
                  {plan.price}€
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.75rem',
                    color: plan.highlight ? 'rgba(244,239,228,0.65)' : 'rgba(244,239,228,0.45)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {plan.unit}
                </span>
              </div>

              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.875rem',
                  lineHeight: 1.7,
                  color: plan.highlight ? 'rgba(244,239,228,0.8)' : 'rgba(244,239,228,0.5)',
                  marginBottom: '2rem',
                  flexGrow: 0,
                }}
              >
                {plan.description}
              </p>

              {/* Divider */}
              <div style={{ height: 1, background: plan.highlight ? 'rgba(244,239,228,0.2)' : 'rgba(244,239,228,0.08)', marginBottom: '2rem' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.875rem',
                      color: plan.highlight ? '#F4EFE4' : 'rgba(244,239,228,0.65)',
                    }}
                  >
                    <Check size={14} color={plan.highlight ? '#F4EFE4' : '#C9A700'} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="#contact"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: plan.highlight ? '#F4EFE4' : 'transparent',
                  color: plan.highlight ? '#C9A700' : '#F4EFE4',
                  border: plan.highlight ? 'none' : '1px solid rgba(244,239,228,0.25)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  padding: '0.875rem',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Coworking */}
        <div style={{ marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
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
            Coworking
          </p>
          <div
            style={{ display: 'grid', gap: '2px' }}
            className="grid-cols-2 max-md:grid-cols-1"
          >
            {[
              {
                name: 'Journée',
                price: '15',
                unit: '/ jour',
                description: 'Pour travailler ponctuellement dans un cadre professionnel et convivial.',
                features: ['Accès espace de travail', 'Wifi haut débit', 'Cuisine & café', 'Imprimante (quota)'],
              },
              {
                name: 'Mensuel',
                price: '120',
                unit: '/ mois',
                description: 'Pour les habitués qui veulent un espace fixe au quotidien.',
                features: ['Accès illimité', 'Bureau attitré', 'Adresse postale', 'Tarif préférentiel location salle'],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: 'rgba(244,239,228,0.05)',
                  padding: '2.5rem 3rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#F4EFE4',
                      margin: 0,
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '2rem', fontWeight: 700, color: '#C9A700', lineHeight: 1 }}>
                      {plan.price}€
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'rgba(244,239,228,0.45)', letterSpacing: '0.04em' }}>
                      {plan.unit}
                    </span>
                  </div>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', lineHeight: 1.7, color: 'rgba(244,239,228,0.5)', margin: 0 }}>
                  {plan.description}
                </p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: 'rgba(244,239,228,0.65)' }}>
                      <Check size={14} color="#C9A700" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  style={{
                    display: 'inline-block',
                    border: '1px solid rgba(244,239,228,0.2)',
                    color: '#F4EFE4',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    padding: '0.75rem 1.5rem',
                    marginTop: '0.5rem',
                    transition: 'opacity 0.2s',
                    alignSelf: 'flex-start',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  En savoir plus
                </a>
              </div>
            ))}
          </div>
        </div>

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.8rem',
            color: 'rgba(244,239,228,0.35)',
            textAlign: 'center',
            marginTop: '2rem',
            letterSpacing: '0.02em',
          }}
        >
          Tarifs indicatifs — contactez-nous pour un devis personnalisé ou des conditions d'adhésion spécifiques.
        </p>
      </div>
    </section>
  );
}
