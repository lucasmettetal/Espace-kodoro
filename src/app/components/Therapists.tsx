const therapistTypes = [
  'Ostéopathie',
  'Naturopathie',
  'Sophrologie',
  'Psychologie',
  'Kinésithérapie',
  'Réflexologie',
  'Acupuncture',
  'Coaching',
];

const steps = [
  {
    step: '01',
    title: 'Prise de contact',
    desc: 'Contactez-nous pour discuter de votre activité et de vos besoins en termes d\'espace et de planning.',
  },
  {
    step: '02',
    title: 'Visite des lieux',
    desc: 'Venez découvrir le cabinet Zen, les espaces communs et l\'atmosphère bienveillante de Ködörö.',
  },
  {
    step: '03',
    title: 'Adhésion',
    desc: 'Signez votre convention d\'adhésion et rejoignez notre réseau de thérapeutes partenaires.',
  },
];

export function Therapists() {
  return (
    <section id="therapeutes" style={{ background: '#F4EFE4', padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gap: 'clamp(3rem, 6vw, 6rem)',
            alignItems: 'start',
          }}
          className="grid-cols-2 max-md:grid-cols-1"
        >
          {/* Left */}
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
              04 — Thérapeutes adhérents
            </p>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                color: '#5F3636',
                margin: 0,
                marginBottom: '1.5rem',
                letterSpacing: '-0.01em',
              }}
            >
              Rejoignez notre<br />
              <em style={{ fontStyle: 'italic', color: '#C9A700' }}>communauté de soignants</em>
            </h2>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1rem',
                lineHeight: 1.8,
                color: '#6B5D52',
                marginBottom: '2.5rem',
                maxWidth: 440,
              }}
            >
              Le cabinet Zen accueille des praticiens de santé et thérapeutes dans un cadre
              professionnel partagé. En devenant adhérent, vous intégrez un réseau bienveillant
              et bénéficiez d'un espace de consultation clé en main.
            </p>

            {/* Disciplines */}
            <div style={{ marginBottom: '3rem' }}>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#6B5D52',
                  marginBottom: '1rem',
                }}
              >
                Disciplines accueillies
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {therapistTypes.map((type) => (
                  <span
                    key={type}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.8rem',
                      color: '#5F3636',
                      background: '#EAE4D8',
                      padding: '0.3rem 0.75rem',
                    }}
                  >
                    {type}
                  </span>
                ))}
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8rem',
                    color: '#C9A700',
                    background: 'rgba(201,167,0,0.1)',
                    padding: '0.3rem 0.75rem',
                  }}
                >
                  Et bien d'autres...
                </span>
              </div>
            </div>

            <a
              href="#contact"
              style={{
                display: 'inline-block',
                background: '#C9A700',
                color: '#F4EFE4',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '0.875rem 2rem',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#D4B930')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C9A700')}
            >
              Candidater comme thérapeute
            </a>
          </div>

          {/* Right: steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {steps.map((step, i) => (
              <div
                key={step.step}
                style={{
                  display: 'flex',
                  gap: '2rem',
                  padding: '2.5rem 0',
                  borderBottom: i < steps.length - 1 ? '1px solid rgba(95,54,54,0.1)' : 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.7rem',
                    fontWeight: 400,
                    color: '#C9A700',
                    letterSpacing: '0.08em',
                    flexShrink: 0,
                    paddingTop: '0.2rem',
                    minWidth: 32,
                  }}
                >
                  {step.step}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#5F3636',
                      margin: 0,
                      marginBottom: '0.6rem',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.9rem',
                      lineHeight: 1.75,
                      color: '#6B5D52',
                      margin: 0,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
