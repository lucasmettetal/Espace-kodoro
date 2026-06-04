import { ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

export function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: '#1C1612',
      }}
    >
      {/* Image de fond plein écran */}
      <motion.img
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        src="/hero.jpg"
        alt="Espace Ködörö — la grande salle de vie partagée à Caussade"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
        }}
      />

      {/* Voile sombre pour la lisibilité du texte */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to right, rgba(28,22,18,0.88) 0%, rgba(28,22,18,0.6) 45%, rgba(28,22,18,0.2) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Contenu */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 1280,
          margin: '0 auto',
          padding: 'clamp(7rem, 10vw, 9rem) clamp(2rem, 5vw, 5rem) 4rem',
        }}
      >
        <div style={{ maxWidth: 620 }}>
          {/* Label */}
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.7rem',
              fontWeight: 400,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(244,239,228,0.85)',
              marginBottom: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span style={{ display: 'inline-block', width: 32, height: 1, background: '#C06040' }} />
            Caussade — Tarn-et-Garonne
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(3.5rem, 7vw, 6.5rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              color: '#F4EFE4',
              margin: 0,
              marginBottom: '1.75rem',
              letterSpacing: '-0.02em',
            }}
          >
            Univers<br />
            <em style={{ fontStyle: 'italic', color: '#C06040' }}>Partagés</em>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '1.05rem',
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'rgba(244,239,228,0.8)',
              maxWidth: 420,
              marginBottom: '3rem',
            }}
          >
            Un espace de vie et de travail collaboratif au cœur de Caussade —
            coworking, soins thérapeutiques et événements.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.35 }}
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
          >
            <a
              href="#espaces"
              style={{
                background: '#C06040',
                color: '#F4EFE4',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '0.875rem 2rem',
                display: 'inline-block',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#A8503A')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C06040')}
            >
              Découvrir nos espaces
            </a>
            <a
              href="#activites"
              style={{
                border: '1px solid rgba(244,239,228,0.4)',
                color: '#F4EFE4',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '0.875rem 2rem',
                display: 'inline-block',
                transition: 'background 0.2s, color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F4EFE4'; e.currentTarget.style.color = '#1C1612'; e.currentTarget.style.borderColor = '#F4EFE4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#F4EFE4'; e.currentTarget.style.borderColor = 'rgba(244,239,228,0.4)'; }}
            >
              Nos activités
            </a>
          </motion.div>
        </div>
      </div>

      {/* Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '3rem',
          right: 'clamp(2rem, 5vw, 5rem)',
          zIndex: 2,
          background: 'rgba(28,22,18,0.55)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(244,239,228,0.15)',
          color: '#F4EFE4',
          padding: '1.25rem 1.5rem',
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          lineHeight: 1.8,
        }}
        className="max-md:hidden"
      >
        <div style={{ color: '#C06040', marginBottom: '0.25rem' }}>Depuis 2020</div>
        <div>L'aventure continue</div>
        <div style={{ opacity: 0.5, marginTop: '0.25rem' }}>Caussade, France</div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: 'clamp(2rem, 5vw, 5rem)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(244,239,228,0.8)',
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
        className="hidden md:flex"
      >
        <ArrowDown size={12} />
        Défiler
      </motion.div>
    </section>
  );
}
