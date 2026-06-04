import { motion } from 'motion/react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export function About() {
  return (
    <section
      id="about"
      style={{
        background: '#5F3636',
        color: '#F4EFE4',
        padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gap: 'clamp(3rem, 6vw, 6rem)',
            alignItems: 'start',
          }}
          className="grid-cols-[1fr_1.6fr] max-md:grid-cols-1"
        >
          {/* Left */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.7rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#C9A700',
                marginBottom: '1.5rem',
              }}
            >
              01 — Manifeste
            </p>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                color: '#F4EFE4',
                margin: 0,
                marginBottom: '2rem',
                letterSpacing: '-0.01em',
              }}
            >
              Un espace<br />
              <em style={{ fontStyle: 'italic', color: '#C9A700' }}>pour vos projets</em>
            </h2>
            <div
              style={{
                width: 48,
                height: 1,
                background: '#C9A700',
                marginBottom: '2rem',
              }}
            />
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                lineHeight: 1.8,
                color: 'rgba(244,239,228,0.6)',
                letterSpacing: '0.02em',
              }}
            >
              Espace Ködörö en Sango, la langue de Centrafrique, signifie{' '}
              <em style={{ color: 'rgba(244,239,228,0.9)', fontStyle: 'normal' }}>
                "univers partagés"
              </em>
              . Depuis 2020, nous accueillons vos événements, réunions, formations et moments spéciaux dans une ambiance chaleureuse et bienveillante.
            </p>
          </motion.div>

          {/* Right */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}
          >
            <p
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                fontWeight: 400,
                fontStyle: 'italic',
                lineHeight: 1.7,
                color: 'rgba(244,239,228,0.85)',
                margin: 0,
                borderLeft: '2px solid #C9A700',
                paddingLeft: '2rem',
              }}
            >
              "Une salle spacieuse au cœur de Caussade, disponible pour vos réunions, formations, événements et occasions spéciales. Un lieu de partage et de convivialité."
            </p>

            <div
              style={{
                display: 'grid',
                gap: '2rem',
              }}
              className="grid-cols-3 max-sm:grid-cols-1"
            >
              {[
                { value: '80+', label: 'Personnes max' },
                { value: '2', label: 'Espaces à louer' },
                { value: '2020', label: 'Depuis' },
              ].map((stat) => (
                <div key={stat.label} style={{ borderTop: '1px solid rgba(244,239,228,0.12)', paddingTop: '1.5rem' }}>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 'clamp(2rem, 3vw, 2.75rem)',
                      fontWeight: 700,
                      color: '#C9A700',
                      lineHeight: 1,
                      marginBottom: '0.5rem',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.8rem',
                      color: 'rgba(244,239,228,0.5)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1rem',
                lineHeight: 1.8,
                color: 'rgba(244,239,228,0.65)',
              }}
            >
              Installés au 25 boulevard Didier Rey à Caussade, nous accueillons
              entreprises, associations, particuliers et professionnels pour vos événements,
              formations, réunions et occasions spéciales dans un cadre bienveillant et convivial.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
