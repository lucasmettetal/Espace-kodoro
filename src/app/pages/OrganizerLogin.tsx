import { useState } from 'react';
import { useNavigate } from 'react-router';

export function OrganizerLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/organizer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('kodoro_token', data.token);
        localStorage.setItem('kodoro_name', data.name);
        localStorage.setItem('kodoro_is_admin', data.is_admin ? '1' : '0');
        navigate('/organizer/dashboard');
      } else {
        setError(data.error ?? 'Erreur de connexion');
      }
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#5F3636', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: '#F4EFE4', padding: '3rem', width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', margin: 0 }}>
            Espace Ködörö
          </p>
          <a href="/" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B5D52', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ← Site principal
          </a>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.75rem', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '2rem' }}>
          Espace organisateur
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            { id: 'email', label: 'Email', type: 'email' },
            { id: 'password', label: 'Mot de passe', type: 'password' },
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

          {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#C9A700', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ background: '#C9A700', color: '#F4EFE4', border: 'none', padding: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
