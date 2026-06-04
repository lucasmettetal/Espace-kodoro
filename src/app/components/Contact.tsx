import { useState } from 'react';
import { MapPin, Mail, Clock } from 'lucide-react';

// ID de formulaire Formspree (https://formspree.io/f/xlgkeqzg)
const FORMSPREE_ID = 'xlgkeqzg';

const infos = [
  { icon: MapPin, label: 'Adresse', value: '25 boulevard Didier Rey\n82300 Caussade, France' },
  { icon: Mail, label: 'Email', value: 'espacekodoro@gmail.com' },
  { icon: Clock, label: 'Horaires', value: 'Lun — Ven : 9h – 19h\nSam : sur rendez-vous' },
];

const subjects = [
  'Renseignements coworking',
  'Cabinet Zen — thérapeute',
  'Événement — billetterie',
  'Autre demande',
];

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" style={{ background: '#F4EFE4', padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem)' }}>
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
            07 — Contact
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#5F3636',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Parlons de votre projet<br />
            <em style={{ fontStyle: 'italic', color: '#C9A700' }}>ensemble</em>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 'clamp(3rem, 6vw, 6rem)',
            alignItems: 'start',
          }}
          className="grid-cols-[1fr_1.5fr] max-md:grid-cols-1"
        >
          {/* Left: info + carte */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {infos.map((info) => {
                const Icon = info.icon;
                return (
                  <div key={info.label} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        background: 'rgba(201,167,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#C9A700',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: '0.65rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#6B5D52',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {info.label}
                      </p>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.925rem',
                          lineHeight: 1.6,
                          color: '#5F3636',
                          margin: 0,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {info.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carte OpenStreetMap */}
            <div style={{ marginTop: '3rem', overflow: 'hidden', aspectRatio: '4/3', position: 'relative' }}>
              <iframe
                title="Localisation Espace Ködörö"
                src="https://www.openstreetmap.org/export/embed.html?bbox=1.5274%2C44.1614%2C1.5474%2C44.1714&layer=mapnik&marker=44.1664%2C1.5374"
                width="100%"
                height="100%"
                style={{ border: 'none', display: 'block', filter: 'sepia(20%) saturate(80%)' }}
                loading="lazy"
                allowFullScreen
              />
              <a
                href="https://maps.google.com/?q=25+boulevard+Didier+Rey+82300+Caussade"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  position: 'absolute',
                  bottom: '0.75rem',
                  right: '0.75rem',
                  background: '#5F3636',
                  color: '#F4EFE4',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '0.4rem 0.9rem',
                  textDecoration: 'none',
                  letterSpacing: '0.03em',
                }}
              >
                Google Maps →
              </a>
            </div>
          </div>

          {/* Right: formulaire */}
          <div>
            {sent ? (
              <div
                style={{
                  background: '#5C7460',
                  padding: '3rem',
                  color: '#F4EFE4',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    marginBottom: '1rem',
                  }}
                >
                  Message envoyé !
                </div>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    color: 'rgba(244,239,228,0.8)',
                  }}
                >
                  Merci de nous avoir contacté. Nous vous répondrons dans les plus brefs délais.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Nom + Email */}
                <div
                  style={{ display: 'grid', gap: '1rem' }}
                  className="grid-cols-2 max-sm:grid-cols-1"
                >
                  <div>
                    <label
                      htmlFor="name"
                      style={{
                        display: 'block',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '0.65rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#6B5D52',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Nom complet *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      style={{
                        width: '100%',
                        background: '#EAE4D8',
                        border: 'none',
                        padding: '0.875rem 1rem',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.9rem',
                        color: '#5F3636',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'background 0.2s',
                      }}
                      onFocus={e => (e.currentTarget.style.background = '#D8CCBA')}
                      onBlur={e => (e.currentTarget.style.background = '#EAE4D8')}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      style={{
                        display: 'block',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '0.65rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#6B5D52',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      style={{
                        width: '100%',
                        background: '#EAE4D8',
                        border: 'none',
                        padding: '0.875rem 1rem',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.9rem',
                        color: '#5F3636',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'background 0.2s',
                      }}
                      onFocus={e => (e.currentTarget.style.background = '#D8CCBA')}
                      onBlur={e => (e.currentTarget.style.background = '#EAE4D8')}
                    />
                  </div>
                </div>

                {/* Sujet */}
                <div>
                  <label
                    htmlFor="subject"
                    style={{
                      display: 'block',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.65rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#6B5D52',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Sujet *
                  </label>
                  <select
                    id="subject"
                    required
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#EAE4D8',
                      border: 'none',
                      padding: '0.875rem 1rem',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.9rem',
                      color: form.subject ? '#5F3636' : '#6B5D52',
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onFocus={e => (e.currentTarget.style.background = '#D8CCBA')}
                    onBlur={e => (e.currentTarget.style.background = '#EAE4D8')}
                  >
                    <option value="" disabled>Choisir un sujet...</option>
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    style={{
                      display: 'block',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.65rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#6B5D52',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#EAE4D8',
                      border: 'none',
                      padding: '0.875rem 1rem',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.9rem',
                      color: '#5F3636',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      transition: 'background 0.2s',
                    }}
                    onFocus={e => (e.currentTarget.style.background = '#D8CCBA')}
                    onBlur={e => (e.currentTarget.style.background = '#EAE4D8')}
                  />
                </div>

                {error && (
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.85rem',
                      color: '#C9A700',
                      margin: 0,
                    }}
                  >
                    Une erreur est survenue. Veuillez réessayer ou nous écrire directement à espacekodoro@gmail.com.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#D4B930' : '#C9A700',
                    color: '#F4EFE4',
                    border: 'none',
                    padding: '1rem 2rem',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    alignSelf: 'flex-start',
                    transition: 'background 0.2s',
                    opacity: loading ? 0.8 : 1,
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#D4B930'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#C9A700'; }}
                >
                  {loading ? 'Envoi en cours…' : 'Envoyer le message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
