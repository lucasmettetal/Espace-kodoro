import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

export function OrganizerRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', token: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token') ?? '';
    setForm(f => ({ ...f, token }));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/organizer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, token: form.token }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error ?? 'Erreur lors de la création du compte');
      }
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#5F3636', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: '#F4EFE4', padding: '3rem', width: '100%', maxWidth: 440 }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '0.5rem' }}>
          Espace Ködörö
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.75rem', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '2rem' }}>
          Créer un compte organisateur
        </h1>

        {done ? (
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: '#5F3636', marginBottom: '1.5rem' }}>
              Compte créé avec succès ! Tu peux maintenant te connecter.
            </p>
            <button
              onClick={() => navigate('/organizer')}
              style={{ background: '#C9A700', color: '#F4EFE4', border: 'none', padding: '0.9rem 2rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Se connecter
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { id: 'name', label: 'Nom complet', type: 'text' },
              { id: 'email', label: 'Email', type: 'email' },
              { id: 'password', label: 'Mot de passe (8 caractères min)', type: 'password' },
              { id: 'confirm', label: 'Confirmer le mot de passe', type: 'password' },
            ].map(field => (
              <div key={field.id}>
                <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.4rem' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required
                  value={form[field.id as keyof typeof form]}
                  onChange={e => setForm({ ...form, [field.id]: e.target.value })}
                  style={{ width: '100%', background: '#EAE4D8', border: 'none', padding: '0.875rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            {/* Token caché pré-rempli depuis l'URL */}
            <div>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.4rem' }}>
                Code d'invitation
              </label>
              <input
                type="text"
                required
                value={form.token}
                onChange={e => setForm({ ...form, token: e.target.value })}
                style={{ width: '100%', background: '#EAE4D8', border: 'none', padding: '0.875rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Code fourni par l'administrateur"
              />
            </div>

            {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#c03232', margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{ background: '#C9A700', color: '#F4EFE4', border: 'none', padding: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem' }}
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
