import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, Plus, Users, Calendar, X, Pencil, Trash2, Download, UserPlus, Settings } from 'lucide-react';

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

type Reservation = {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  quantity: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  amount_cents: number;
  stripe_session_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  comment: string;
  created_at: string;
  event_title: string;
  event_slug: string;
  event_date: string;
  participant_names: string;
  minor_names: string;
  minor_count: number;
  equipment: string;
};

const emptyForm = { title: '', date: '', day: '', year: new Date().getFullYear().toString(), type: 'Soirée', description: '', price: '', spots_total: '0' };

const STATUS_LABEL: Record<string, string> = {
  paid: 'Payé', pending: 'En attente', cancelled: 'Annulé', refunded: 'Remboursé',
};
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  paid:      { bg: 'rgba(76,175,80,0.12)',  color: '#2E7D32' },
  pending:   { bg: 'rgba(255,152,0,0.12)',  color: '#E65100' },
  cancelled: { bg: 'rgba(158,158,158,0.15)', color: '#616161' },
  refunded:  { bg: 'rgba(33,150,243,0.12)', color: '#0D47A1' },
};

function exportReservationsCSV(reservations: Reservation[], filename: string) {
  const headers = ['Date', 'Réservant', 'Email', 'Téléphone', 'Places', 'Statut', 'Montant (€)', 'Participants', 'Mineurs', 'Matériel', 'Source', 'Commentaire'];
  const rows = reservations.map(r => [
    new Date(r.created_at).toLocaleDateString('fr-FR'),
    r.customer_name,
    r.email,
    r.phone || '',
    String(r.quantity),
    STATUS_LABEL[r.status] ?? r.status,
    r.amount_cents ? (r.amount_cents / 100).toFixed(2) : '',
    r.participant_names || '',
    r.minor_names || '',
    r.equipment || '',
    [r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(' / '),
    r.comment || '',
  ]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

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
  const [tab, setTab] = useState<'events' | 'registrations' | 'reservations' | 'team' | 'organizers' | 'site'>('events');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationFilter, setReservationFilter] = useState<string>('all');
  const [organizers, setOrganizers] = useState<{id: number, name: string, email: string, is_admin: number, created_at: string}[]>([]);
  const [teamForm, setTeamForm] = useState({ name: '', email: '', password: '' });
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState('');
  const [teamSaving, setTeamSaving] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const defaultSiteConfig = {
    gaming_date: '', gaming_horaire: '20h – 23h', gaming_lieu: 'Espace Ködörö — Caussade',
    gaming_places: '30', gaming_prix: '5 €', gaming_stripe_link: '', gaming_whatsapp_link: '',
    yoga_date: '', yoga_horaire: '', yoga_lieu: 'Espace Ködörö — Caussade',
    yoga_tarif: '', yoga_contact: 'espacekodoro@gmail.com',
    yoga_niveau: 'Tous niveaux — débutants bienvenus',
    yoga_materiel: 'Tapis de yoga conseillé (quelques tapis disponibles sur place)',
    yoga_inscrip: "Inscription recommandée — contacter via l'email ci-dessous",
  };
  const [siteConfig, setSiteConfig] = useState(defaultSiteConfig);
  const [siteSaving, setSiteSaving] = useState(false);
  const [siteError, setSiteError] = useState('');
  const [siteSuccess, setSiteSuccess] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { navigate('/organizer'); return; }
    fetchEvents();
    fetchRegistrations();
    fetchSiteConfig();
    if (isAdmin) fetchOrganizers();
  }, []);

  async function fetchSiteConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) setSiteConfig(await res.json());
    } catch { /* garde les défauts */ }
  }

  async function saveSiteConfig() {
    setSiteSaving(true); setSiteError(''); setSiteSuccess('');
    try {
      const res = await fetch('/api/config', {
        method: 'PUT', headers,
        body: JSON.stringify(siteConfig),
      });
      if (res.ok) setSiteSuccess('Configuration enregistrée !');
      else setSiteError('Erreur lors de l\'enregistrement');
    } catch {
      // En local sans backend, on simule le succès
      if (import.meta.env.DEV) setSiteSuccess('(mode local — non enregistré en base)');
      else setSiteError('Impossible de contacter le serveur');
    }
    finally { setSiteSaving(false); }
  }

  async function fetchOrganizers() {
    try {
      const res = await fetch('/api/organizer/team', { headers });
      if (res.ok) setOrganizers(await res.json());
    } catch { /* pas de backend en local */ }
  }

  async function deleteOrganizer(id: number) {
    if (!confirm('Supprimer ce compte organisateur ?')) return;
    try {
      await fetch('/api/organizer/team', { method: 'DELETE', headers, body: JSON.stringify({ id }) });
    } catch { /* pas de backend en local */ }
    fetchOrganizers();
  }

  async function fetchEvents() {
    try {
      const res = await fetch('/api/organizer/events', { headers });
      if (res.status === 401) { logout(); return; }
      if (res.ok) setEvents(await res.json());
    } catch { /* pas de backend en local */ }
  }

  async function fetchRegistrations(eventId?: number) {
    try {
      const url = eventId ? `/api/organizer/registrations?event_id=${eventId}` : '/api/organizer/registrations';
      const res = await fetch(url, { headers });
      if (res.ok) setRegistrations(await res.json());
    } catch { /* pas de backend en local */ }
  }

  async function fetchReservations(status?: string) {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.set('status', status);
      const res = await fetch(`/api/organizer/reservations?${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations ?? []);
      }
    } catch { /* pas de backend en local */ }
  }

  function logout() {
    localStorage.removeItem('kodoro_token');
    localStorage.removeItem('kodoro_name');
    navigate('/organizer');
  }

  async function saveEvent() {
    setSaving(true);
    try {
      const body = { ...form, spots_total: parseInt(form.spots_total) };
      if (editingEvent) {
        await fetch(`/api/organizer/events/${editingEvent.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      } else {
        await fetch('/api/organizer/events', { method: 'POST', headers, body: JSON.stringify(body) });
      }
      await fetchEvents();
    } catch { /* pas de backend en local */ }
    setShowForm(false);
    setEditingEvent(null);
    setForm(emptyForm);
    setSaving(false);
  }

  async function deleteEvent(id: number) {
    if (!confirm('Supprimer cet événement et toutes ses inscriptions ?')) return;
    try {
      await fetch(`/api/organizer/events/${id}`, { method: 'DELETE', headers });
    } catch { /* pas de backend en local */ }
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
      if (!res.ok) { const d = await res.json(); setPwdError(d.error ?? 'Erreur'); }
      else { setPwdSuccess('Mot de passe modifié !'); setPwdForm({ current: '', next: '', confirm: '' }); }
    } catch { setPwdSuccess('(mode local — non enregistré)'); }
    finally { setPwdSaving(false); }
  }

  async function createTeamMember() {
    setTeamSaving(true); setTeamError(''); setTeamSuccess('');
    try {
      const res = await fetch('/api/organizer/register', {
        method: 'POST', headers, body: JSON.stringify(teamForm),
      });
      if (!res.ok) { const d = await res.json(); setTeamError(d.error ?? 'Erreur'); }
      else { setTeamSuccess(`Compte créé pour ${teamForm.name} !`); setTeamForm({ name: '', email: '', password: '' }); }
    } catch {
      setTeamSuccess('(mode local — non enregistré)');
    } finally {
      setTeamSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE4' }}>
      <style>{`
        .dk-header { background: #5F3636; padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; }
        .dk-subtitle { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: rgba(244,239,228,0.5); margin-left: 1rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .dk-body { max-width: 1100px; margin: 0 auto; padding: 2rem; }
        .dk-tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .dk-tab-btn { border: none; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; white-space: nowrap; }
        .dk-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
        .dk-event-card { background: #FBF7EF; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .dk-event-actions { display: flex; align-items: center; gap: 1.5rem; flex-shrink: 0; }
        @media (max-width: 640px) {
          .dk-header { padding: 0.875rem 1rem; }
          .dk-subtitle { display: none; }
          .dk-body { padding: 1rem; }
          .dk-tab-btn { padding: 0.5rem 0.75rem; font-size: 0.78rem; }
          .dk-section-header { flex-direction: column; align-items: flex-start; }
          .dk-event-card { padding: 1rem; }
          .dk-event-actions { width: 100%; justify-content: flex-end; }
        }
      `}</style>

      {/* Header */}
      <header className="dk-header">
        <div>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.2rem', fontWeight: 700, color: '#F4EFE4' }}>
            Espace <em style={{ color: '#C9A700' }}>Ködörö</em>
          </span>
          <span className="dk-subtitle">Dashboard — {name}</span>
        </div>
        <button onClick={logout} style={{ background: 'none', border: '1px solid rgba(244,239,228,0.2)', color: '#F4EFE4', padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          <LogOut size={14} /> Déconnexion
        </button>
      </header>

      <div className="dk-body">
        {/* Tabs */}
        <div className="dk-tabs">
          {[
            { key: 'events', label: isAdmin ? 'Événements' : 'Mes événements', icon: Calendar },
            { key: 'registrations', label: 'Inscriptions', icon: Users },
            { key: 'reservations', label: 'Réservations Stripe', icon: Calendar },
            { key: 'site', label: 'Site', icon: Settings },
            { key: 'team', label: 'Équipe', icon: UserPlus },
            ...(isAdmin ? [{ key: 'organizers', label: 'Organisateurs', icon: Users }] : []),
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key as any); if (key === 'reservations') fetchReservations(); }}
              className="dk-tab-btn"
              style={{ background: tab === key ? '#5F3636' : '#EAE4D8', color: tab === key ? '#F4EFE4' : '#5F3636' }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Events tab */}
        {tab === 'events' && (
          <>
            <div className="dk-section-header">
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#5F3636', margin: 0 }}>
                {isAdmin ? 'Tous les événements' : 'Mes événements'} ({events.length})
              </h2>
              <button
                onClick={() => setShowForm(true)}
                style={{ background: '#C9A700', color: '#F4EFE4', border: 'none', padding: '0.6rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
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
                  <div key={event.id} className="dk-event-card">
                    <div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', display: 'block', marginBottom: '0.25rem' }}>{event.type}</span>
                      <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.1rem', fontWeight: 700, color: '#5F3636' }}>{event.title}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B5D52', marginLeft: '1rem' }}>{event.day} {event.date} {event.year}</span>
                      {isAdmin && (event as any).organizer_name && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#C9A700', marginLeft: '0.75rem' }}>({(event as any).organizer_name})</span>}
                    </div>
                    <div className="dk-event-actions">
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

        {/* Reservations (Stripe) tab */}
        {tab === 'reservations' && (
          <>
            <div className="dk-section-header">
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#5F3636', margin: 0 }}>
                Réservations Stripe ({reservations.filter(r => reservationFilter === 'all' || r.status === reservationFilter).length})
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Filtre par statut */}
                <select
                  value={reservationFilter}
                  onChange={e => { setReservationFilter(e.target.value); fetchReservations(e.target.value); }}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', padding: '0.45rem 0.75rem', border: '1px solid rgba(95,54,54,0.2)', background: '#FBF7EF', color: '#5F3636', cursor: 'pointer' }}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="paid">Payées</option>
                  <option value="pending">En attente</option>
                  <option value="cancelled">Annulées</option>
                </select>
                <button
                  onClick={() => fetchReservations(reservationFilter)}
                  style={{ background: '#EAE4D8', color: '#5F3636', border: 'none', padding: '0.45rem 0.9rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Actualiser
                </button>
                {reservations.length > 0 && (
                  <button
                    onClick={() => exportReservationsCSV(reservations, `reservations-gaming.csv`)}
                    style={{ background: '#5F3636', color: '#F4EFE4', border: 'none', padding: '0.45rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Download size={13} /> Export CSV
                  </button>
                )}
              </div>
            </div>

            {/* Résumé rapide */}
            {reservations.length > 0 && (() => {
              const paid    = reservations.filter(r => r.status === 'paid');
              const pending = reservations.filter(r => r.status === 'pending');
              const totalEuros = paid.reduce((s, r) => s + (r.amount_cents ?? 0), 0) / 100;
              const totalPlaces = paid.reduce((s, r) => s + r.quantity, 0);
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Places payées', value: totalPlaces },
                    { label: 'Réservations payées', value: paid.length },
                    { label: 'En attente', value: pending.length },
                    { label: 'Total encaissé', value: `${totalEuros.toFixed(2)} €` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#F4EFE4', padding: '0.875rem 1.25rem', flex: '1 1 140px' }}>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', margin: 0, marginBottom: '0.25rem' }}>{label}</p>
                      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: '#5F3636', margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {reservations.length === 0 ? (
              <div style={{ background: '#EAE4D8', padding: '3rem', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: '#6B5D52' }}>
                Aucune réservation pour le moment.{' '}
                <button onClick={() => fetchReservations()} style={{ background: 'none', border: 'none', color: '#5F3636', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                  Charger
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {reservations
                  .filter(r => reservationFilter === 'all' || r.status === reservationFilter)
                  .map(r => (
                    <div key={r.id} style={{ background: '#FBF7EF', padding: '1rem 1.25rem', display: 'grid', gap: '0.5rem' }}>
                      {/* Ligne 1 : identité + statut + montant */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: '#5F3636' }}>{r.customer_name}</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#6B5D52' }}>{r.email}</span>
                          {r.phone && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#9B8F89' }}>{r.phone}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.06em',
                            textTransform: 'uppercase', padding: '0.2rem 0.6rem',
                            background: STATUS_COLOR[r.status]?.bg ?? '#eee',
                            color: STATUS_COLOR[r.status]?.color ?? '#333',
                          }}>
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1rem', fontWeight: 700, color: '#5F3636' }}>
                            {r.amount_cents ? `${(r.amount_cents / 100).toFixed(2)} €` : '—'}
                          </span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#9B8F89' }}>
                            {r.quantity} place{r.quantity > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Ligne 2 : participants */}
                      {r.participant_names && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C9A700', flexShrink: 0, marginTop: 2 }}>Participants</span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#5F3636' }}>{r.participant_names}</span>
                          {r.minor_count > 0 && (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', background: 'rgba(255,152,0,0.12)', color: '#E65100', padding: '0.15rem 0.5rem' }}>
                              {r.minor_count} mineur{r.minor_count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Ligne 3 : matériel + source + commentaire */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {r.equipment && (
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#6B5D52' }}>
                            <span style={{ color: '#C9A700', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Matériel </span>
                            {r.equipment}
                          </span>
                        )}
                        {r.utm_source && (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#9B8F89' }}>
                            Source : {[r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(' / ')}
                          </span>
                        )}
                        {r.comment && (
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#6B5D52', fontStyle: 'italic' }}>
                            "{r.comment}"
                          </span>
                        )}
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#B0A098', marginLeft: 'auto' }}>
                          {new Date(r.created_at).toLocaleString('fr-FR')}
                        </span>
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
            <div className="dk-section-header">
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

        {/* Site tab */}
        {tab === 'site' && (
          <>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#5F3636', margin: 0, marginBottom: '0.5rem' }}>
              Configuration du site
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#6B5D52', marginBottom: '2rem' }}>
              Ces informations apparaissent sur les pages <strong>/gaming</strong> et <strong>/yoga</strong> du site public.
            </p>

            {/* Gaming */}
            <div style={{ background: '#FBF7EF', padding: '2rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A700', margin: 0, marginBottom: '1.25rem' }}>
                🎮 Soirées Gaming
              </p>
              <div style={{ display: 'grid', gap: '1rem' }} className="grid-cols-1 md:grid-cols-2">
                {[
                  { key: 'gaming_date', label: 'Date de la prochaine soirée', placeholder: 'ex : Samedi 14 juin 2025' },
                  { key: 'gaming_horaire', label: 'Horaire', placeholder: 'ex : 20h – 23h' },
                  { key: 'gaming_places', label: 'Nombre de places', placeholder: 'ex : 30' },
                  { key: 'gaming_prix', label: 'Prix (participation)', placeholder: 'ex : 5 €' },
                  { key: 'gaming_stripe_link', label: 'Lien de réservation Stripe', placeholder: 'https://buy.stripe.com/...' },
                  { key: 'gaming_whatsapp_link', label: 'Lien groupe WhatsApp', placeholder: 'https://chat.whatsapp.com/...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.35rem' }}>
                      {label}
                    </label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={siteConfig[key as keyof typeof siteConfig]}
                      onChange={e => setSiteConfig({ ...siteConfig, [key]: e.target.value })}
                      style={{ width: '100%', background: '#EAE4D8', border: 'none', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Yoga */}
            <div style={{ background: '#FBF7EF', padding: '2rem', marginBottom: '2rem' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5C7460', margin: 0, marginBottom: '1.25rem' }}>
                🧘 Yoga
              </p>
              <div style={{ display: 'grid', gap: '1rem' }} className="grid-cols-1 md:grid-cols-2">
                {[
                  { key: 'yoga_date', label: 'Date de la prochaine séance', placeholder: 'ex : Mercredi 18 juin 2025' },
                  { key: 'yoga_horaire', label: 'Horaire', placeholder: 'ex : 18h30 – 19h45' },
                  { key: 'yoga_tarif', label: 'Tarif', placeholder: 'ex : 10 €' },
                  { key: 'yoga_contact', label: 'Contact / réservation', placeholder: 'ex : espacekodoro@gmail.com' },
                  { key: 'yoga_niveau', label: 'Niveau', placeholder: 'ex : Tous niveaux' },
                  { key: 'yoga_materiel', label: 'Matériel à prévoir', placeholder: 'ex : Tapis de yoga conseillé' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5D52', marginBottom: '0.35rem' }}>
                      {label}
                    </label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={siteConfig[key as keyof typeof siteConfig]}
                      onChange={e => setSiteConfig({ ...siteConfig, [key]: e.target.value })}
                      style={{ width: '100%', background: '#EAE4D8', border: 'none', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {siteError && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#c03232', marginBottom: '1rem' }}>{siteError}</p>}
            {siteSuccess && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#5C7460', marginBottom: '1rem' }}>{siteSuccess}</p>}

            <button
              onClick={saveSiteConfig}
              disabled={siteSaving}
              style={{ background: '#C9A700', color: '#F4EFE4', border: 'none', padding: '0.875rem 2rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: siteSaving ? 'not-allowed' : 'pointer', opacity: siteSaving ? 0.7 : 1 }}
            >
              {siteSaving ? 'Enregistrement...' : 'Enregistrer la configuration'}
            </button>
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
