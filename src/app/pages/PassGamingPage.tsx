import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ActivityLayout } from './ActivityLayout';

const S = {
  label: {
    display: 'block',
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#6B5D52',
    marginBottom: '0.4rem',
  },
  input: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '0.65rem 0.875rem',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.9rem',
    color: '#5F3636',
    background: '#FBF7EF',
    border: '1px solid rgba(95,54,54,0.2)',
    outline: 'none',
    borderRadius: 0,
  },
  btnPrimary: {
    display: 'inline-block',
    background: '#C9A700',
    color: '#F4EFE4',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.875rem',
    fontWeight: 600 as const,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    border: 'none',
    cursor: 'pointer',
    padding: '0.8rem 2rem',
  },
};

type Formula = {
  key: string;
  title: string;
  price: string;
  highlight: boolean;
  features: string[];
};

const FORMULAS: Formula[] = [
  {
    key: 'discovery',
    title: 'Découverte',
    price: 'Gratuit',
    highlight: false,
    features: ['1 soirée offerte', 'Réservation obligatoire', 'Pour tester l\'ambiance'],
  },
  {
    key: 'single',
    title: 'Soirée à l\'unité',
    price: '5 €',
    highlight: false,
    features: ['1 soirée gaming', 'Réservation obligatoire', 'Paiement à chaque soirée'],
  },
  {
    key: 'pass',
    title: 'Pass Gaming Trimestre',
    price: '20 €',
    highlight: true,
    features: ['Accès pendant 3 mois', 'Réservation à chaque soirée', 'Le plus avantageux'],
  },
];

export function PassGamingPage() {
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(searchParams.get('buy') === '1');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/passes/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue. Réessayez dans quelques instants.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActivityLayout>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #2E1515 0%, #5F3636 55%, #3D1F1F 100%)',
        padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem) clamp(3rem, 6vw, 5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(201,167,0,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 980, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '0.75rem' }}>
            <Link to="/gaming" style={{ color: 'rgba(201,167,0,0.7)', textDecoration: 'none' }}>Gaming</Link>
            {' '}/{'  '}Formules
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, lineHeight: 1.15, color: '#F4EFE4', margin: 0, marginBottom: '1rem' }}>
            Formules <em style={{ fontStyle: 'italic', color: '#C9A700' }}>Gaming</em>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.85, color: 'rgba(244,239,228,0.8)', maxWidth: 620, margin: 0 }}>
            Choisissez la formule qui vous convient. Dans tous les cas, une réservation reste nécessaire pour chaque soirée afin d'organiser la salle et le matériel.
          </p>
        </div>
      </section>

      {/* Formules */}
      <section style={{ background: '#FBF7EF', padding: 'clamp(3rem, 6vw, 6rem) clamp(2rem, 8vw, 8rem)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {FORMULAS.map(f => (
              <div
                key={f.key}
                style={{
                  background: '#fff',
                  border: f.highlight ? '2px solid #C9A700' : '1px solid rgba(95,54,54,0.12)',
                  padding: '2rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {f.highlight && (
                  <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#C9A700', color: '#F4EFE4', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.25rem 0.75rem' }}>
                    Recommandé
                  </span>
                )}
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.3rem', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '0.5rem' }}>{f.title}</h2>
                <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '2rem', fontWeight: 700, color: f.highlight ? '#C9A700' : '#5F3636', margin: 0, marginBottom: '1.25rem' }}>{f.price}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
                  {f.features.map(feat => (
                    <li key={feat} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#6B5D52', display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#C9A700' }}>✓</span> {feat}
                    </li>
                  ))}
                </ul>
                {f.key === 'pass' ? (
                  <button
                    onClick={() => { setShowForm(true); setTimeout(() => document.getElementById('pass-form')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
                    style={{ ...S.btnPrimary, marginTop: '1.5rem', width: '100%', textAlign: 'center' }}
                  >
                    Acheter le Pass — 20 €
                  </button>
                ) : (
                  <Link
                    to="/reservation-gaming"
                    style={{ marginTop: '1.5rem', display: 'block', textAlign: 'center', border: '1px solid rgba(95,54,54,0.25)', color: '#5F3636', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none', padding: '0.75rem 1rem' }}
                  >
                    Réserver une soirée
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Formulaire d'achat du pass */}
          {showForm && (
            <div id="pass-form" style={{ marginTop: '3rem', background: '#fff', border: '1px solid rgba(95,54,54,0.12)', padding: 'clamp(1.5rem, 4vw, 2.5rem)', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '0.5rem' }}>
                Acheter le Pass Gaming Trimestre
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#6B5D52', marginBottom: '1.5rem' }}>
                20 € — accès aux soirées gaming pendant 3 mois. Vous serez redirigé vers Stripe pour le paiement sécurisé.
              </p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div>
                    <label htmlFor="pf_first" style={S.label}>Prénom <span style={{ color: '#C9A700' }}>*</span></label>
                    <input id="pf_first" type="text" required value={form.first_name}
                      onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label htmlFor="pf_last" style={S.label}>Nom <span style={{ color: '#C9A700' }}>*</span></label>
                    <input id="pf_last" type="text" required value={form.last_name}
                      onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} style={S.input} />
                  </div>
                </div>
                <div>
                  <label htmlFor="pf_email" style={S.label}>Email <span style={{ color: '#C9A700' }}>*</span></label>
                  <input id="pf_email" type="email" required value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={S.input} />
                </div>
                <div>
                  <label htmlFor="pf_phone" style={S.label}>Téléphone <span style={{ fontStyle: 'italic', fontSize: '0.6rem', color: '#6B5D52' }}>(optionnel)</span></label>
                  <input id="pf_phone" type="tel" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={S.input} />
                </div>

                {error && (
                  <div style={{ background: '#FFF0F0', border: '1px solid rgba(220,0,0,0.3)', color: '#8B0000', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  style={{ ...S.btnPrimary, alignSelf: 'flex-start', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Redirection vers le paiement…' : 'Continuer vers le paiement — 20 €'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </ActivityLayout>
  );
}

export function PassGamingConfirmationPage() {
  return (
    <ActivityLayout>
      <section style={{
        background: 'linear-gradient(135deg, #2E1515 0%, #5F3636 55%, #3D1F1F 100%)',
        padding: 'clamp(5rem, 10vw, 9rem) clamp(2rem, 8vw, 8rem) clamp(4rem, 8vw, 7rem)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(201,167,0,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid #C9A700', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '2rem' }}>🎮</div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '1rem' }}>
            Paiement reçu
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, lineHeight: 1.2, color: '#F4EFE4', margin: 0, marginBottom: '1.5rem' }}>
            Merci pour votre <em style={{ fontStyle: 'italic', color: '#C9A700' }}>Pass Gaming</em> !
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.85, color: 'rgba(244,239,228,0.8)', maxWidth: 580, margin: '0 auto 2.5rem' }}>
            Merci ! Votre pass sera activé dès confirmation du paiement et vous recevrez un email de confirmation. Pensez à réserver votre place pour chaque soirée.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/reservation-gaming" style={{ display: 'inline-block', background: '#C9A700', color: '#F4EFE4', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 2rem' }}>
              Réserver une soirée
            </Link>
            <Link to="/gaming" style={{ display: 'inline-block', border: '1px solid rgba(244,239,228,0.35)', color: 'rgba(244,239,228,0.85)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', padding: '0.75rem 2rem' }}>
              ← Retour Gaming
            </Link>
          </div>
        </div>
      </section>
    </ActivityLayout>
  );
}
