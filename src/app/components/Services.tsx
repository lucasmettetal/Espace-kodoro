import { Monitor, Heart, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

const services = [
  {
    number: '01',
    icon: Monitor,
    title: 'Coworking',
    description:
      'Un espace de travail partagé, lumineux et équipé. Bureau fixe, espace nomade, wifi haut débit, imprimante, cuisine. Idéal pour les indépendants et les télétravailleurs.',
    tag: 'Travail & Productivité',
    href: '#espaces',
  },
  {
    number: '02',
    icon: Heart,
    title: 'Cabinet Zen',
    description:
      'Un cabinet de soin partagé pour les thérapeutes et professionnels de santé. Location à la demi-journée ou à la journée, dans un cadre apaisant et professionnel.',
    tag: 'Santé & Bien-être',
    href: '#espaces',
  },
  {
    number: '03',
    icon: Calendar,
    title: 'Événements',
    description:
      'Des soirées, ateliers et rencontres communautaires réguliers. L\'aventure Ködörö, c\'est aussi une programmation vivante et des moments de partage.',
    tag: 'Communauté & Culture',
    href: '#activites-agenda',
  },
];

export function Services() {
  return (
    <section id="activites" style={{ background: '#F4EFE4', padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 'clamp(3rem, 6vw, 5rem)',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.7rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#C06040',
                marginBottom: '1rem',
              }}
            >
              02 — Nos services
            </p>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                color: '#1C1612',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Trois univers,<br />
              <em style={{ fontStyle: 'italic', color: '#C06040' }}>un même espace</em>
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
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C06040')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B5D52')}
          >
            En savoir plus →
          </a>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2px',
          }}
          className="max-lg:grid-cols-1"
        >
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.a
                key={service.number}
                href={service.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.1 }}
                style={{
                  display: 'block',
                  background: '#FBF7EF',
                  padding: '3rem',
                  textDecoration: 'none',
                  transition: 'background 0.3s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EAE4D8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#FBF7EF')}
              >
                {/* Ghost number */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '2rem',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '4rem',
                    fontWeight: 300,
                    color: 'rgba(28,22,18,0.05)',
                    lineHeight: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {service.number}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: 'rgba(192,96,64,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#C06040',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.65rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#6B5D52',
                    }}
                  >
                    {service.tag}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    color: '#1C1612',
                    margin: 0,
                    marginBottom: '1rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {service.title}
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
                  {service.description}
                </p>

                <div
                  style={{
                    marginTop: '2rem',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#C06040',
                    letterSpacing: '0.04em',
                  }}
                >
                  Découvrir →
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
