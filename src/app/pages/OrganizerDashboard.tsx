import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, Plus, Users, Calendar, X, Pencil, Trash2, Download, UserPlus } from 'lucide-react';

type Event = {
  id: number;
  title: string;
  date: string;
  day: string;
  year: string;
  type: string;
  price: string;
  spots_total: number;
  spots_taken: number;
  active: number;
};

type Registration = {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  event_title: string;
};

const emptyForm = { title: '', date: '', day: '', year: new Date().getFullYear().toString(), type: 'Soirée', description: '', price: '', spots_total: '0' };

function exportCSV(registrations: Registration[], filename: string) {
  const headers = ['Nom', 'Email', 'Téléphone', 'Événement', 'Date inscription'];
  const rows = registrations.map(r => [
    r.name, r.email, r.phone || '', r.event_title,
    new Date(r.created_at).toLocaleDateString('fr-FR'),
  ]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function OrganizerDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('kodoro_token');
  const name = localStorage.getItem('kodoro_name') ?? 'Organisateur';
  const isAdmin = localStorage.getItem('kodoro_is_admin') === '1';

  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'events' | 'registrations' | 'team' | 'organizers'>('events');
  const [organizers, setOrganizers] = useState<{id: number, name: string, email: string, is_admin: number, created_at: string}[]>([]);
  const [teamForm, setTeamForm] = useState({ name: '', email: '', password: '' });
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState('');
  const [teamSaving, setTeamSaving] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { navigate('/organizer'); return; }
    fetchEvents();
    fetchRegistrations();
    if (isAdmin) fetchOrganizers();
  }, []);

  async function fetchOrganizers() {
    const res = await fetch('/api/organizer/team', { headers });
    if (res.ok) setOrganizers(await res.json());
  }

  async function deleteOrganizer(id: number) {
    if (!confirm('Supprimer ce compte organisateur ?')) return;
    await fetch('/api/organizer/team', { method: 'DELETE', headers, body: JSON.stringify({ id }) });
    fetchOrganizers();
  }

  async function fetchEvents() {
    const res = await fetch('/api/organizer/events', { headers });
    if (res.status === 401) { logout(); return; }
    setEvents(await res.json());
  }

  async function fetchRegistrations(eventId?: number) {
    const url = eventId ? `/api/organizer/registrations?event_id=${eventId}` : '/api/organizer/registrations';
    const res = await fetch(url, { headers });
    setRegistrations(await res.json());
  }

  function logout() {
    localStorage.removeItem('kodoro_token');
    localStorage.removeItem('kodoro_name');
    navigate('/organizer');
  }

  async function saveEvent() {
    setSaving(true);
    const body = { ...form, spots_total: parseInt(form.spots_total) };
    if (editingEvent) {
      await fetch(`/api/organizer/events/${editingEvent.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    } else {
      await fetch('/api/organizer/events', { method: 'POST', headers, body: JSON.stringify(body) });
    }
    await fetchEvents();
    setShowForm(false);
    setEditingEvent(null);
    setForm(emptyForm);
    setSaving(false);
  }

  async function deleteEvent(id: number) {
    if (!confirm('Supprimer cet événement et toutes ses inscriptions ?')) return;
    await fetch(`/api/organizer/events/${id}`, { method: 'DELETE', headers });
    await fetchEvents();
    if (selectedEventId === id) { setSelectedEventId(null); fetchRegistrations(); }
  }

  function openEdit(event: Event) {
    setEditingEvent(event);
    setForm({
      title: event.title, date: event.date, day: event.day, year: event.year,
      type: event.type, description: event.description, price: event.price,
      spots_total: String(event.spots_total),
    });
    setShowForm(true);
  }

  const filtered = selectedEventId ? registrations.filter(r => r.event_title === events.find(e => e.id === selectedEventId)?.title) : registrations;

  async function changePassword() {
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('Les mots de passe ne correspondent pas'); return; }
    setPwdSaving(true); setPwdError(''); setPwdSuccess('');
    try {
      const res = await fetch('/api/organizer/password', {
        method: 'PUT', headers,
        body: JSON.stringify({ current_password: pwdForm.current, new_password: pwdForm.next }),
      });
      const data = await res.json();
      if (res.ok) { setPwdSuccess('Mot de passe modifié !'); setPwdForm({ current: '', next: '', confirm: '' }); }
      else setPwdError(data.error ?? 'Erreur');
    } catch { setPwdError('Impossible de contacter le serveur'); }
    finally { setPwdSaving(false); }
  }

  async function createTeamMember() {
    setTeamSaving(true);
    setTeamError('');
    setTeamSuccess('');
    try {
      const res = await fetch('/api/organizer/register', {
        method: 'POST',
        headers,
        body: JSON.stringify(teamForm),
      });
      const data = await res.json();
      if (res.ok) {
        setTeamSuccess(`Compte créé pour ${teamForm.name} !`);
        setTeamForm({ name: '', email: '', password: '' });
      } else {
        setTeamError(data.error ?? 'Erreur');
      }
    } catch {
      setTeamError('Impossible de contacter le serveur');
    } finally {
      setTeamSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE4' }}>
      {/* Header */}
      <header style={{ background: '#5F3636', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.2rem', fontWeight: 700, color: '#F4EFE4' }}>
            Espace <em style={{ color: '#C9A700' }}>Ködörö</em>
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: 'rgba(244,239,228,0.5)', marginLeft: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Dashboard — {name}
          </span>
        </div>
        <button onClick={logout} style={{ background: 'none', border: '1px solid rgba(244,239,228,0.2)', color: '#F4EFE4', padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem' }}>
          <LogOut size={14} /> Déconnexion
        </button>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {[
            { key: 'events', label: isAdmin ? 'Tous les événements' : 'Mes événements', icon: Calendar },
            { key: 'registrations', label: 'Inscriptions', icon: Users },
            { key: 'team', label: 'Équipe', icon: UserPlus },
            ...(isAdmin ? [{ key: 'organizers', label: 'Organisateurs', icon: Users }] : []),
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              style={{ background: tab === key ? '#5F3636' : '#EAE4D8', color: tab === key ? '#F4EFE4' : '#5F3636', border: 'none', padding: '0.6rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Events tab */}
        {tab === 'events' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#5F3636', margin: 0 }}>
                Mes événements ({events.length})
              </h2>
              <button
                onClick={() => setShowForm(true)}
                style={{ background: '#C9A700', color: '#F4EFE4', border: 'none', padding: '0.6rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={15} /> Nouvel événement
              </button>
            </div>

            {events.length === 0 ? (
              <div style={{ background: '#EAE4D8', padding: '3rem', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: '#6B5D52' }}>
                Aucun événement pour le moment. Créez-en un !
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {events.map(event => (
                  <div key={event.id} style={{ background: '#FBF7EF', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', display: 'block', marginBottom: '0.25rem' }}>{event.type}</span>
                      <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.1rem', fontWeight: 700, color: '#5F3636' }}>{event.title}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B5D52', marginLeft: '1rem' }}>{event.day} {event.date} {event.year}</span>
                    {isAdmin && (event as any).organizer_name && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#C9A700', marginLeft: '0.75rem' }}>({(event as any).organizer_name})</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      {event.spots_total > 0 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#6B5D52' }}>
                          {event.spots_taken}/{event.spots_total} inscrits
                        </span>
                      )}
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 600, color: '#5F3636' }}>{event.price}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => { setSelectedEventId(event.id); fetchRegistrations(event.id); setTab('registrations'); }}
                          style={{ background: '#EAE4D8', color: '#5F3636', border: 'none', padding: '0.4rem 0.9rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Users size={13} /> Inscrits
                        </button>
                        <button
                          onClick={() => openEdit(event)}
                          style={{ background: '#EAE4D8', color: '#5F3636', border: 'none', padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Modifier"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          style={{ background: 'rgba(192,50,50,0.1)', color: '#c03232', border: 'none', padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Registrations tab */}
        {tab === 'registrations' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#5F3636', margin: 0 }}>
                Inscriptions {selectedEventId ? `— ${events.find(e => e.id === selectedEventId)?.title}` : '(tous les événements)'}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {registrations.length > 0 && (
                  <button
                    onClick={() => exportCSV(registrations, `inscriptions-${selectedEventId ?? 'tous'}.csv`)}
                    style={{ background: '#5F3636', color: '#F4EFE4', border: 'none', padding: '0.5rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Download size={13} /> Export CSV
                  </button>
                )}
                {selectedEventId && (
                  <button onClick={() => { setSelectedEventId(null); fetchRegistrations(); }} style={{ background: 'none', border: '1px solid rgba(95,54,54,0.2)', color: '#6B5D52', padding: '0.4rem 0.75rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <X size={13} /> Voir tout
                  </button>
                )}
              </div>
            </div>

            {registrations.length === 0 ? (
              <div style={{ background: '#EAE4D8', padding: '3rem', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: '#6B5D52' }}>
                Aucune inscription pour le moment.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#5F3636', color: '#F4EFE4' }}>
                      {['Nom', 'Email', 'Téléphone', 'Événement', 'Date inscription'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r, i) => (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? '#FBF7EF' : '#F4EFE4' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#5F3636' }}>{r.name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#6B5D52' }}>{r.email}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#6B5D52' }}>{r.phone || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#6B5D52' }}>{r.event_title}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#6B5D52', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem' }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Team tab */}
        {tab === 'team' && (
          <>
            {/* Changer mot de passe */}
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '1.5rem' }}>
              Mon mot de passe
            </h2>
            <div style={{ background: '#FBF7EF', padding: '2rem', maxWidth: 480, marginBottom: '3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { id: 'current', label: 'Mot de passe actuel' },
                  { id: 'next', label: 'Nouveau mot de passe (8 caractères min)' },
                  { id: 'confirm', label: 'Confirmer le nouveau mot de passe' },
                ].map(field => (
                  <div key={field.id}>
                    <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.35rem' }}>
                      {field.label}
                    </label>
                    <input
                      type="password"
                      value={pwdForm[field.id as keyof typeof pwdForm]}
                      onChange={e => setPwdForm({ ...pwdForm, [field.id]: e.target.value })}
                      style={{ width: '100%', background: '#EAE4D8', border: 'none', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                {pwdError && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#c03232', margin: 0 }}>{pwdError}</p>}
                {pwdSuccess && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#5C7460', margin: 0 }}>{pwdSuccess}</p>}
                <button onClick={changePassword} disabled={pwdSaving}
                  style={{ background: '#5F3636', color: '#F4EFE4', border: 'none', padding: '0.875rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: pwdSaving ? 'not-allowed' : 'pointer', opacity: pwdSaving ? 0.7 : 1 }}>
                  {pwdSaving ? 'Modification...' : 'Changer le mot de passe'}
                </button>
              </div>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '1.5rem' }}>
              Créer un compte organisateur
            </h2>
            <div style={{ background: '#FBF7EF', padding: '2rem', maxWidth: 480 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { id: 'name', label: 'Nom complet', type: 'text' },
                  { id: 'email', label: 'Email', type: 'email' },
                  { id: 'password', label: 'Mot de passe (8 caractères min)', type: 'password' },
                ].map(field => (
                  <div key={field.id}>
                    <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.35rem' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={teamForm[field.id as keyof typeof teamForm]}
                      onChange={e => setTeamForm({ ...teamForm, [field.id]: e.target.value })}
                      style={{ width: '100%', background: '#EAE4D8', border: 'none', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}

                {teamError && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#c03232', margin: 0 }}>{teamError}</p>}
                {teamSuccess && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#5C7460', margin: 0 }}>{teamSuccess}</p>}

                <button
                  onClick={createTeamMember}
                  disabled={teamSaving}
                  style={{ background: '#C9A700', color: '#F4EFE4', border: 'none', padding: '0.875rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: teamSaving ? 'not-allowed' : 'pointer', opacity: teamSaving ? 0.7 : 1, marginTop: '0.5rem' }}
                >
                  {teamSaving ? 'Création...' : 'Créer le compte'}
                </button>
              </div>
            </div>
          </>
        )}
        {/* Organizers tab — admin only */}
        {tab === 'organizers' && isAdmin && (
          <>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '1.5rem' }}>
              Organisateurs ({organizers.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {organizers.map(org => (
                <div key={org.id} style={{ background: '#FBF7EF', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: '#5F3636' }}>{org.name}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B5D52', marginLeft: '1rem' }}>{org.email}</span>
                    {org.is_admin === 1 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C9A700', marginLeft: '0.75rem', background: 'rgba(201,167,0,0.1)', padding: '0.15rem 0.5rem' }}>Admin</span>}
                  </div>
                  {org.is_admin === 0 && (
                    <button
                      onClick={() => deleteOrganizer(org.id)}
                      style={{ background: 'rgba(192,50,50,0.1)', color: '#c03232', border: 'none', padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem' }}
                    >
                      <Trash2 size={13} /> Supprimer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Modal création événement */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(95,54,54,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{ background: '#F4EFE4', padding: '2.5rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.3rem', fontWeight: 700, color: '#5F3636', margin: 0 }}>
                {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingEvent(null); setForm(emptyForm); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5F3636' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { id: 'title', label: 'Titre *' },
                { id: 'date', label: 'Date (ex: 14 Juin) *' },
                { id: 'day', label: 'Jour (ex: Sam.) *' },
                { id: 'year', label: 'Année *' },
                { id: 'price', label: 'Prix (ex: 8 € ou Gratuit) *' },
                { id: 'spots_total', label: 'Nb places (0 = illimité)' },
              ].map(field => (
                <div key={field.id}>
                  <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.35rem' }}>{field.label}</label>
                  <input
                    value={form[field.id as keyof typeof form]}
                    onChange={e => setForm({ ...form, [field.id]: e.target.value })}
                    style={{ width: '100%', background: '#EAE4D8', border: 'none', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.35rem' }}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', background: '#EAE4D8', border: 'none', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', outline: 'none' }}>
                  {['Soirée', 'Culture', 'Formation', 'Bien-être', 'Autre'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.35rem' }}>Description *</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', background: '#EAE4D8', border: 'none', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <button onClick={saveEvent} disabled={saving}
                style={{ background: '#C9A700', color: '#F4EFE4', border: 'none', padding: '0.9rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement...' : editingEvent ? 'Enregistrer les modifications' : 'Créer l\'événement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
