import { useState } from 'react';
import { X } from 'lucide-react';

type Event = {
  id: number;
  title: string;
  date: string;
  day: string;
  type: string;
  price: string;
  spots_total: number;
  spots_taken: number;
};

type Props = {
  event: Event;
  onClose: () => void;
};

export function RegisterModal({ event, onClose }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const spotsLeft = event.spots_total > 0 ? event.spots_total - event.spots_taken : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error ?? 'Une erreur est survenue.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Impossible de contacter le serveur.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(95,54,54,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#F4EFE4', width: '100%', maxWidth: 480,
          padding: '2.5rem', position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#5F3636' }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '0.5rem' }}>
          Inscription
        </p>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '0.5rem' }}>
          {event.title}
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B5D52', margin: 0, marginBottom: '1.5rem' }}>
          {event.day} {event.date} · {event.price}
          {spotsLeft !== null && (
            <span style={{ marginLeft: '0.75rem', color: spotsLeft <= 5 ? '#C9A700' : '#6B5D52' }}>
              · {spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''}
            </span>
          )}
        </p>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.3rem', fontWeight: 700, color: '#5F3636', marginBottom: '0.75rem' }}>
              Inscription confirmée !
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#6B5D52', margin: 0 }}>
              À bientôt chez Espace Ködörö 🎉
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { id: 'name', label: 'Nom complet *', type: 'text', required: true },
              { id: 'email', label: 'Email *', type: 'email', required: true },
              { id: 'phone', label: 'Téléphone (optionnel)', type: 'tel', required: false },
            ].map(field => (
              <div key={field.id}>
                <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.4rem' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required={field.required}
                  value={form[field.id as keyof typeof form]}
                  onChange={e => setForm({ ...form, [field.id]: e.target.value })}
                  style={{ width: '100%', background: '#EAE4D8', border: 'none', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            {status === 'error' && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#C9A700', margin: 0 }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                background: '#C9A700', color: '#F4EFE4', border: 'none',
                padding: '0.9rem', fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.06em',
                textTransform: 'uppercase', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1, marginTop: '0.5rem',
              }}
            >
              {status === 'loading' ? 'Envoi...' : "Confirmer l'inscription"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
