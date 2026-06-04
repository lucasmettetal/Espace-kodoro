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
        background: '#1C1612',
        color: '#F4EFE4',
        padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.6fr',
            gap: 'clamp(3rem, 6vw, 6rem)',
            alignItems: 'start',
          }}
          className="max-md:grid-cols-1"
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
                color: '#C06040',
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
              Un lieu où tout le monde<br />
              <em style={{ fontStyle: 'italic', color: '#C06040' }}>trouve sa place</em>
            </h2>
            <div
              style={{
                width: 48,
                height: 1,
                background: '#C06040',
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
              . Un nom qui résume parfaitement notre vision.
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
                borderLeft: '2px solid #C06040',
                paddingLeft: '2rem',
              }}
            >
              "Un espace vivant au cœur de Caussade, où professionnels,
              thérapeutes et créateurs se retrouvent pour travailler, soigner
              et créer ensemble."
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '2rem',
              }}
              className="max-sm:grid-cols-1"
            >
              {[
                { value: '3+', label: 'Espaces disponibles' },
                { value: '10+', label: 'Thérapeutes adhérents' },
                { value: '2020', label: 'Année de création' },
              ].map((stat) => (
                <div key={stat.label} style={{ borderTop: '1px solid rgba(244,239,228,0.12)', paddingTop: '1.5rem' }}>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 'clamp(2rem, 3vw, 2.75rem)',
                      fontWeight: 700,
                      color: '#C06040',
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
              indépendants, professions de santé, formateurs et communauté locale
              dans un cadre bienveillant, ouvert et stimulant.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
