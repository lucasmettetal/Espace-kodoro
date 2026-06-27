import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, Plus, Users, Calendar, X, Pencil, Trash2, Download, UserPlus, Settings, ChevronDown, ChevronUp, Mail, Send } from 'lucide-react';

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
  const [tab, setTab] = useState<'events' | 'registrations' | 'reservations' | 'campaigns' | 'team' | 'organizers' | 'site'>('events');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationFilter, setReservationFilter] = useState<string>('all');
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [manualForm, setManualForm] = useState({ customer_name: '', email: '', phone: '', quantity: 1, amount_cents: '', status: 'paid', comment: '' });
  const [manualParticipants, setManualParticipants] = useState<{ full_name: string; is_minor: boolean }[]>([{ full_name: '', is_minor: false }]);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // ── Campagnes ──────────────────────────────────────────────────────────────
  type Campaign = { id: number; list_name: string; subject: string; sender_email: string; created_at: string; sent_at: string | null; sent_count: number; failed_count: number };
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignForm, setCampaignForm] = useState({ list_name: 'gaming', subject: '', html_content: '' });
  const [campaignStats, setCampaignStats] = useState<{ subscribed: number } | null>(null);
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignPreviewCount, setCampaignPreviewCount] = useState<number | null>(null);

  // ── Import CSV ─────────────────────────────────────────────────────────────
  const [csvList, setCsvList] = useState('gaming');
  const [csvParsed, setCsvParsed] = useState<{ email: string; first_name: string; last_name: string; phone: string }[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ imported: number; updated: number; errors: { email: string; reason: string }[] } | null>(null);
  const [csvError, setCsvError] = useState('');

  function parseCsv(text: string) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return null;

    // Auto-détecter le séparateur : ; ou ,
    const firstLine = lines[0];
    const sep = firstLine.includes(';') ? ';' : ',';

    const splitLine = (line: string) =>
      line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));

    const rawHeaders = splitLine(firstLine);
    const headers = rawHeaders.map(h => h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''));

    const COL: Record<string, string[]> = {
      email:      ['email', 'email', 'adresseemail', 'adressee-mail', 'courriel', 'emailaddress', 'emal'],
      first_name: ['firstname', 'prenom', 'first_name', 'givenname', 'forename'],
      last_name:  ['lastname', 'nom', 'last_name', 'nomdefamille', 'surname', 'familyname'],
      phone:      ['phone', 'telephone', 'phonenumber', 'numerodeteleph', 'mobile', 'portable'],
    };
    const idx: Record<string, number> = {};
    for (const [field, aliases] of Object.entries(COL)) {
      const found = headers.findIndex(h => aliases.some(a => h.includes(a)));
      if (found !== -1) idx[field] = found;
    }
    if (idx.email === undefined) return null;

    return lines.slice(1)
      .filter(l => l.trim())
      .map(line => {
        const cols = splitLine(line);
        return {
          email:      (cols[idx.email]      ?? '').toLowerCase().trim(),
          first_name: cols[idx.first_name]  ?? '',
          last_name:  cols[idx.last_name]   ?? '',
          phone:      cols[idx.phone]        ?? '',
        };
      }).filter(r => r.email);
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setCsvResult(null);
    setCsvError('');
    setCsvParsed([]);
    const reader = new FileReader();
    reader.onload = ev => {
      const result = parseCsv(ev.target?.result as string);
      if (result === null) {
        setCsvError('Colonne "email" introuvable. Vérifie que le CSV contient bien une colonne email.');
        return;
      }
      if (result.length === 0) {
        setCsvError('Aucune ligne valide trouvée dans le fichier.');
        return;
      }
      setCsvParsed(result);
    };
    reader.readAsText(file, 'UTF-8');
  }

  async function importCsv() {
    if (csvParsed.length === 0) return;
    setCsvImporting(true);
    setCsvResult(null);
    try {
      const res = await fetch('/api/organizer/contacts-import', {
        method: 'POST',
        headers,
        body: JSON.stringify({ list_name: csvList, contacts: csvParsed }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setCsvResult({ imported: 0, updated: 0, errors: [{ email: '', reason: `Erreur ${res.status} — ${text.slice(0, 120)}` }] });
        return;
      }
      const data = await res.json();
      setCsvResult(data);
      fetchContactStats(csvList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setCsvResult({ imported: 0, updated: 0, errors: [{ email: '', reason: msg }] });
    } finally {
      setCsvImporting(false);
    }
  }

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

  async function fetchCampaigns() {
    try {
      const res = await fetch('/api/organizer/campaigns', { headers });
      if (res.ok) { const d = await res.json(); setCampaigns(d.campaigns ?? []); }
    } catch { /* pas de backend en local */ }
  }

  type Contact = { id: number; email: string; first_name: string; last_name: string; phone: string; source: string; status: string; subscribed_at: string };
  const [contactsList, setContactsList] = useState<Contact[]>([]);
  const [contactsListName, setContactsListName] = useState('gaming');
  const [showContactsList, setShowContactsList] = useState(false);

  async function fetchContactStats(listName: string) {
    try {
      const res = await fetch(`/api/organizer/contacts?list=${listName}`, { headers });
      if (res.ok) { const d = await res.json(); setCampaignStats(d.stats); }
    } catch { /* */ }
  }

  async function fetchContactsList(listName: string) {
    try {
      const res = await fetch(`/api/organizer/contacts?list=${listName}`, { headers });
      if (res.ok) { const d = await res.json(); setContactsList(d.contacts ?? []); setCampaignStats(d.stats); }
    } catch { /* */ }
  }

  async function previewCampaign() {
    if (!campaignForm.list_name) return;
    try {
      const res = await fetch('/api/organizer/campaigns', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campaignForm, preview_only: true }),
      });
      if (res.ok) { const d = await res.json(); setCampaignPreviewCount(d.recipient_count); }
    } catch { /* */ }
  }

  async function sendCampaign() {
    if (!campaignForm.subject.trim() || !campaignForm.html_content.trim()) {
      alert('Remplis le sujet et le contenu.');
      return;
    }
    if (!confirm(`Envoyer à ${campaignPreviewCount ?? '?'} contacts ? Cette action est irréversible.`)) return;
    setCampaignSending(true);
    try {
      const res = await fetch('/api/organizer/campaigns', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm),
      });
      const d = await res.json();
      if (res.ok) {
        alert(`✅ ${d.sent} emails envoyés${d.failed > 0 ? ` (${d.failed} échecs)` : ''}.`);
        setCampaignForm(f => ({ ...f, subject: '', html_content: '' }));
        setCampaignPreviewCount(null);
        fetchCampaigns();
      } else {
        alert(d.error ?? 'Erreur lors de l\'envoi');
      }
    } catch { alert('Erreur réseau'); }
    finally { setCampaignSending(false); }
  }

  const resetManualForm = () => {
    setManualForm({ customer_name: '', email: '', phone: '', quantity: 1, amount_cents: '', status: 'paid', comment: '' });
    setManualParticipants([{ full_name: '', is_minor: false }]);
    setEditingReservation(null);
    setShowManualForm(false);
  };

  function openEditReservation(r: Reservation) {
    setEditingReservation(r);
    setManualForm({
      customer_name: r.customer_name,
      email: r.email,
      phone: r.phone ?? '',
      quantity: r.quantity,
      amount_cents: r.amount_cents ? (r.amount_cents / 100).toString() : '',
      status: r.status,
      comment: r.comment ?? '',
    });
    const parts = r.participant_names
      ? r.participant_names.split(' · ').map(name => ({
          full_name: name,
          is_minor: r.minor_names?.split(' · ').includes(name) ?? false,
        }))
      : [{ full_name: '', is_minor: false }];
    setManualParticipants(parts.length ? parts : [{ full_name: '', is_minor: false }]);
    setShowManualForm(true);
  }

  async function submitManualReservation(e: React.FormEvent) {
    e.preventDefault();
    setManualSubmitting(true);
    try {
      const body = {
        ...manualForm,
        amount_cents: manualForm.amount_cents ? Math.round(parseFloat(manualForm.amount_cents) * 100) : null,
        participants: manualParticipants.filter(p => p.full_name.trim()),
      };

      let res;
      if (editingReservation) {
        res = await fetch(`/api/organizer/reservations/${editingReservation.id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/organizer/reservations', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();
      if (res.ok) {
        resetManualForm();
        fetchReservations(reservationFilter);
        if (!editingReservation) alert('Réservation ajoutée et email envoyé !');
      } else {
        alert(data.error ?? 'Erreur');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setManualSubmitting(false);
    }
  }

  async function deleteReservation(id: number, name: string) {
    if (!confirm(`Supprimer la réservation de ${name} ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/organizer/reservations/${id}`, { method: 'DELETE', headers });
      if (res.ok) fetchReservations(reservationFilter);
      else alert('Erreur lors de la suppression');
    } catch { alert('Erreur réseau'); }
  }

  function toggleRow(id: number) {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
            { key: 'reservations', label: 'Réservations', icon: Calendar },
            { key: 'campaigns', label: 'Campagnes email', icon: Send },
            { key: 'site', label: 'Site', icon: Settings },
            { key: 'team', label: 'Équipe', icon: UserPlus },
            ...(isAdmin ? [{ key: 'organizers', label: 'Organisateurs', icon: Users }] : []),
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key as any); if (key === 'reservations') fetchReservations(); if (key === 'campaigns') { fetchCampaigns(); fetchContactStats('gaming'); } }}
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

        {/* Reservations tab */}
        {tab === 'reservations' && (() => {
          const filtered = reservations.filter(r => reservationFilter === 'all' || r.status === reservationFilter);
          const paid = reservations.filter(r => r.status === 'paid');
          const pending = reservations.filter(r => r.status === 'pending');
          const totalEuros = paid.reduce((s, r) => s + (r.amount_cents ?? 0), 0) / 100;
          const totalPlaces = paid.reduce((s, r) => s + r.quantity, 0);

          const kpis = [
            { label: 'Places payées', value: String(totalPlaces), accent: '#2E7D32' },
            { label: 'Réservations', value: String(paid.length), accent: '#5F3636' },
            { label: 'En attente', value: String(pending.length), accent: '#E65100' },
            { label: 'Encaissé', value: `${totalEuros.toFixed(2)} €`, accent: '#C9A700' },
          ];

          const filterBtns = [
            { key: 'all', label: 'Tous' },
            { key: 'paid', label: 'Payées' },
            { key: 'pending', label: 'En attente' },
            { key: 'cancelled', label: 'Annulées' },
          ];

          return (
            <>
              {/* Barre d'actions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: '#5F3636', margin: 0 }}>
                  Réservations gaming
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { resetManualForm(); setShowManualForm(true); }}
                    style={{ background: '#C9A700', color: '#fff', border: 'none', padding: '0.5rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                  >
                    <Plus size={13} /> Ajouter
                  </button>
                  {reservations.length > 0 && (
                    <button
                      onClick={() => exportReservationsCSV(filtered, `reservations-gaming.csv`)}
                      style={{ background: '#EAE4D8', color: '#5F3636', border: 'none', padding: '0.5rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Download size={13} /> CSV
                    </button>
                  )}
                  <button
                    onClick={() => fetchReservations(reservationFilter)}
                    style={{ background: '#EAE4D8', color: '#5F3636', border: 'none', padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Actualiser"
                  >
                    ↻
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {kpis.map(({ label, value, accent }) => (
                  <div key={label} style={{ background: '#fff', border: '1px solid rgba(95,54,54,0.08)', borderLeft: `3px solid ${accent}`, padding: '0.875rem 1rem' }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B8F89', margin: '0 0 0.3rem' }}>{label}</p>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, color: '#5F3636', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Filtres statut */}
              <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem' }}>
                {filterBtns.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setReservationFilter(key); fetchReservations(key); }}
                    style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', padding: '0.4rem 0.9rem',
                      border: 'none', cursor: 'pointer',
                      background: reservationFilter === key ? '#5F3636' : '#EAE4D8',
                      color: reservationFilter === key ? '#F4EFE4' : '#5F3636',
                      fontWeight: reservationFilter === key ? 600 : 400,
                    }}
                  >
                    {label}
                    {key !== 'all' && (
                      <span style={{ marginLeft: '0.4rem', opacity: 0.7, fontSize: '0.7rem' }}>
                        ({reservations.filter(r => r.status === key).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Liste */}
              {filtered.length === 0 ? (
                <div style={{ background: '#F4EFE4', padding: '3rem', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: '#9B8F89', border: '1px dashed rgba(95,54,54,0.15)' }}>
                  <p style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Aucune réservation ici.</p>
                  <button onClick={() => { resetManualForm(); setShowManualForm(true); }} style={{ background: '#C9A700', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                    + Ajouter manuellement
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {filtered.map(r => {
                    const expanded = expandedRows.has(r.id);
                    const sc = STATUS_COLOR[r.status];
                    return (
                      <div key={r.id} style={{ background: '#fff', border: '1px solid rgba(95,54,54,0.07)', borderLeft: `3px solid ${sc?.color ?? '#ccc'}`, overflow: 'hidden' }}>
                        {/* Ligne principale */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', flexWrap: 'wrap' }}>
                          {/* Identité */}
                          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                            <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: '#5F3636', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.customer_name}
                            </p>
                            <p style={{ margin: '0.1rem 0 0', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#9B8F89' }}>
                              {r.email}{r.phone ? ` · ${r.phone}` : ''}
                            </p>
                          </div>

                          {/* Badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', background: '#F4EFE4', color: '#5F3636', padding: '0.2rem 0.55rem', fontWeight: 600 }}>
                              {r.quantity} pl.
                            </span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', background: sc?.bg, color: sc?.color }}>
                              {STATUS_LABEL[r.status]}
                            </span>
                            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '0.95rem', fontWeight: 700, color: '#5F3636', minWidth: '3.5rem', textAlign: 'right' }}>
                              {r.amount_cents ? `${(r.amount_cents / 100).toFixed(2)} €` : '—'}
                            </span>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '2px', marginLeft: 'auto', flexShrink: 0 }}>
                            <button
                              onClick={() => toggleRow(r.id)}
                              style={{ background: '#F4EFE4', border: 'none', padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#6B5D52', display: 'flex', alignItems: 'center' }}
                              title={expanded ? 'Réduire' : 'Voir détails'}
                            >
                              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button
                              onClick={() => openEditReservation(r)}
                              style={{ background: '#F4EFE4', border: 'none', padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#5F3636', display: 'flex', alignItems: 'center' }}
                              title="Modifier"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteReservation(r.id, r.customer_name)}
                              style={{ background: 'rgba(192,50,50,0.06)', border: 'none', padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#c03232', display: 'flex', alignItems: 'center' }}
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Détails expandés */}
                        {expanded && (
                          <div style={{ borderTop: '1px solid rgba(95,54,54,0.07)', padding: '0.75rem 1rem', background: '#FDFAF5', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {r.participant_names && (
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C9A700' }}>Participants</span>
                                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#5F3636' }}>{r.participant_names}</span>
                                {r.minor_count > 0 && (
                                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', background: 'rgba(255,152,0,0.1)', color: '#E65100', padding: '0.15rem 0.45rem' }}>
                                    {r.minor_count} mineur{r.minor_count > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                            {r.equipment && (
                              <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#6B5D52' }}>
                                <span style={{ color: '#C9A700', fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Matériel </span>
                                {r.equipment}
                              </p>
                            )}
                            {r.comment && (
                              <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#6B5D52', fontStyle: 'italic' }}>"{r.comment}"</p>
                            )}
                            {r.utm_source && (
                              <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#B0A098' }}>
                                Source : {[r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(' / ')}
                              </p>
                            )}
                            <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#C0B8B0' }}>
                              {new Date(r.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* Modal ajout / édition de réservation */}
        {showManualForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,15,15,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={e => e.target === e.currentTarget && resetManualForm()}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              {/* Header modale */}
              <div style={{ background: '#5F3636', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.2rem', fontWeight: 700, color: '#F4EFE4', margin: 0 }}>
                  {editingReservation ? 'Modifier la réservation' : 'Nouvelle réservation'}
                </h2>
                <button onClick={resetManualForm} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#F4EFE4', padding: '0.3rem', display: 'flex', borderRadius: '2px' }}><X size={18} /></button>
              </div>

              <form onSubmit={submitManualReservation} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Section : Réservant */}
                <div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A700', margin: '0 0 0.75rem', borderBottom: '1px solid #F4EFE4', paddingBottom: '0.4rem' }}>Réservant</p>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {[
                      { label: 'Nom complet *', key: 'customer_name', type: 'text', required: true },
                      { label: 'Email *', key: 'email', type: 'email', required: true },
                      { label: 'Téléphone', key: 'phone', type: 'tel', required: false },
                    ].map(({ label, key, type, required }) => (
                      <div key={key}>
                        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', display: 'block', marginBottom: '0.3rem' }}>{label}</label>
                        <input
                          type={type} required={required}
                          value={(manualForm as any)[key]}
                          onChange={e => setManualForm(f => ({ ...f, [key]: e.target.value }))}
                          style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', boxSizing: 'border-box', outline: 'none' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section : Réservation */}
                <div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A700', margin: '0 0 0.75rem', borderBottom: '1px solid #F4EFE4', paddingBottom: '0.4rem' }}>Réservation</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', display: 'block', marginBottom: '0.3rem' }}>Places *</label>
                      <input
                        type="number" min={1} max={10} required
                        value={manualForm.quantity}
                        onChange={e => {
                          const qty = parseInt(e.target.value) || 1;
                          setManualForm(f => ({ ...f, quantity: qty }));
                          setManualParticipants(Array.from({ length: qty }, (_, i) => manualParticipants[i] ?? { full_name: '', is_minor: false }));
                        }}
                        style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', display: 'block', marginBottom: '0.3rem' }}>Montant (€)</label>
                      <input
                        type="number" step="0.01" min={0} placeholder="5.00"
                        value={manualForm.amount_cents}
                        onChange={e => setManualForm(f => ({ ...f, amount_cents: e.target.value }))}
                        style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', display: 'block', marginBottom: '0.3rem' }}>Statut</label>
                      <select
                        value={manualForm.status}
                        onChange={e => setManualForm(f => ({ ...f, status: e.target.value }))}
                        style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', boxSizing: 'border-box' }}
                      >
                        <option value="paid">Payé</option>
                        <option value="pending">En attente</option>
                        <option value="cancelled">Annulé</option>
                        <option value="refunded">Remboursé</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section : Participants */}
                <div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A700', margin: '0 0 0.75rem', borderBottom: '1px solid #F4EFE4', paddingBottom: '0.4rem' }}>Participants</p>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {manualParticipants.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#B0A098', width: '1.2rem', flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                        <input
                          type="text" placeholder={`Nom du participant ${i + 1}`}
                          value={p.full_name}
                          onChange={e => setManualParticipants(arr => arr.map((x, j) => j === i ? { ...x, full_name: e.target.value } : x))}
                          style={{ flex: 1, padding: '0.55rem 0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#5F3636' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}>
                          <input type="checkbox" checked={p.is_minor} onChange={e => setManualParticipants(arr => arr.map((x, j) => j === i ? { ...x, is_minor: e.target.checked } : x))} />
                          Mineur
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commentaire */}
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', display: 'block', marginBottom: '0.3rem' }}>Commentaire</label>
                  <input
                    type="text" placeholder="ex: payé en espèces, contacté via WhatsApp..."
                    value={manualForm.comment}
                    onChange={e => setManualForm(f => ({ ...f, comment: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#5F3636', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #F4EFE4' }}>
                  <button type="button" onClick={resetManualForm} style={{ background: 'none', border: '1px solid #EAE4D8', color: '#6B5D52', padding: '0.65rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', cursor: 'pointer' }}>
                    Annuler
                  </button>
                  <button type="submit" disabled={manualSubmitting} style={{ background: '#5F3636', color: '#F4EFE4', border: 'none', padding: '0.65rem 1.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, cursor: manualSubmitting ? 'wait' : 'pointer', opacity: manualSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {manualSubmitting ? 'Enregistrement...' : editingReservation ? <><Pencil size={13} /> Enregistrer</> : <><Mail size={13} /> Ajouter + email</>}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Campaigns tab */}
        {tab === 'campaigns' && (() => {
          const LIST_OPTIONS = [
            { value: 'reservations',   label: 'Inscrits (réservations payées)', sender: 'gaming@espace-kodoro.fr' },
            { value: 'gaming',         label: 'Gaming (opt-in)',                 sender: 'gaming@espace-kodoro.fr' },
            { value: 'evenements',     label: 'Événements',                      sender: 'evenements@espace-kodoro.fr' },
            { value: 'kodoro_general', label: 'Général Ködörö',                  sender: 'evenements@espace-kodoro.fr' },
          ];
          const currentList = LIST_OPTIONS.find(l => l.value === campaignForm.list_name) ?? LIST_OPTIONS[0];

          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: '#5F3636', margin: 0 }}>Campagnes email</h2>
              </div>

              {/* ── Import CSV ─────────────────────────────────────────────── */}
              <div style={{ background: '#fff', border: '1px solid rgba(95,54,54,0.08)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A700', margin: '0 0 1rem' }}>Importer des contacts CSV</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', display: 'block', marginBottom: '0.3rem' }}>Liste cible</label>
                    <select
                      value={csvList}
                      onChange={e => setCsvList(e.target.value)}
                      style={{ padding: '0.55rem 0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#5F3636' }}
                    >
                      <option value="gaming">Gaming</option>
                      <option value="evenements">Événements</option>
                      <option value="kodoro_general">Général Ködörö</option>
                    </select>
                    <p style={{ margin: '0.25rem 0 0', fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#9B8F89' }}>
                      La liste "Inscrits" se remplit automatiquement via les réservations payées.
                    </p>
                  </div>
                  <div>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', display: 'block', marginBottom: '0.3rem' }}>Fichier CSV</label>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCsvFile}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#5F3636' }}
                    />
                  </div>
                  {csvParsed.length > 0 && (
                    <button
                      type="button"
                      onClick={importCsv}
                      disabled={csvImporting}
                      style={{ background: csvImporting ? '#9B8F89' : '#5F3636', color: '#F4EFE4', border: 'none', padding: '0.6rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, cursor: csvImporting ? 'wait' : 'pointer' }}
                    >
                      {csvImporting ? 'Import...' : `Importer ${csvParsed.length} contacts`}
                    </button>
                  )}
                </div>
                {csvError && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: '#FBE9E7', borderLeft: '3px solid #C62828' }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#C62828', margin: 0 }}>⚠ {csvError}</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#9B8F89', margin: '0.4rem 0 0' }}>
                      Colonnes attendues : email (ou e-mail, courriel), firstname (ou prénom), lastname (ou nom)
                    </p>
                  </div>
                )}
                {csvParsed.length > 0 && !csvResult && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#2E7D32', margin: '0.75rem 0 0' }}>
                    ✓ {csvFileName} — {csvParsed.length} contact{csvParsed.length > 1 ? 's' : ''} prêt{csvParsed.length > 1 ? 's' : ''} à importer
                    {csvParsed[0]?.first_name ? ' (avec prénom)' : ''}{csvParsed[0]?.last_name ? ' (avec nom)' : ''}
                  </p>
                )}
                {csvResult && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ padding: '0.75rem 1rem', background: csvResult.errors.length === 0 ? '#E8F5E9' : '#FFF8E1', borderLeft: `3px solid ${csvResult.errors.length === 0 ? '#2E7D32' : '#C9A700'}` }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#5F3636', margin: 0 }}>
                        ✓ {csvResult.imported} nouveau{csvResult.imported > 1 ? 'x' : ''} · {csvResult.updated} mis à jour
                        {csvResult.errors.length > 0 && ` · ${csvResult.errors.length} ligne${csvResult.errors.length > 1 ? 's' : ''} ignorée${csvResult.errors.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    {csvResult.errors.length > 0 && (
                      <div style={{ marginTop: '0.5rem', border: '1px solid #EAE4D8', maxHeight: '180px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Mono', monospace", fontSize: '0.72rem' }}>
                          <thead>
                            <tr style={{ background: '#F4EFE4' }}>
                              <th style={{ textAlign: 'left', padding: '0.35rem 0.75rem', color: '#9B8F89' }}>Email</th>
                              <th style={{ textAlign: 'left', padding: '0.35rem 0.75rem', color: '#9B8F89' }}>Raison</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvResult.errors.map((e, i) => (
                              <tr key={i} style={{ borderTop: '1px solid #EAE4D8' }}>
                                <td style={{ padding: '0.35rem 0.75rem', color: '#C62828' }}>{e.email || '(vide)'}</td>
                                <td style={{ padding: '0.35rem 0.75rem', color: '#6B5D52' }}>{e.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#9B8F89', margin: '0.5rem 0 0' }}>
                  Colonnes reconnues : email (requis), firstname/prénom, lastname/nom, phone/téléphone
                </p>
              </div>

              {/* ── Liste de contacts ──────────────────────────────────────── */}
              <div style={{ background: '#fff', border: '1px solid rgba(95,54,54,0.08)', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const next = !showContactsList;
                    setShowContactsList(next);
                    if (next) fetchContactsList(contactsListName);
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A700' }}
                >
                  <span>Consulter la liste de contacts</span>
                  <span style={{ fontSize: '1rem', color: '#9B8F89' }}>{showContactsList ? '▲' : '▼'}</span>
                </button>
                {showContactsList && (
                  <div style={{ padding: '0 1.5rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <select
                        value={contactsListName}
                        onChange={e => { setContactsListName(e.target.value); fetchContactsList(e.target.value); }}
                        style={{ padding: '0.5rem 0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#5F3636' }}
                      >
                        <option value="gaming">Gaming</option>
                        <option value="evenements">Événements</option>
                        <option value="kodoro_general">Général Ködörö</option>
                      </select>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#9B8F89' }}>
                        {contactsList.length} contact{contactsList.length > 1 ? 's' : ''} · {contactsList.filter(c => c.status === 'subscribed').length} abonné{contactsList.filter(c => c.status === 'subscribed').length > 1 ? 's' : ''}
                      </span>
                    </div>
                    {contactsList.length === 0 ? (
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#9B8F89', margin: 0 }}>Aucun contact dans cette liste.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #EAE4D8' }}>
                              {['Prénom', 'Nom', 'Email', 'Téléphone', 'Statut', 'Ajouté le'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.75rem', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B8F89', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {contactsList.map(c => (
                              <tr key={c.id} style={{ borderBottom: '1px solid #F4EFE4' }}>
                                <td style={{ padding: '0.5rem 0.75rem', color: '#5F3636' }}>{c.first_name || '—'}</td>
                                <td style={{ padding: '0.5rem 0.75rem', color: '#5F3636' }}>{c.last_name || '—'}</td>
                                <td style={{ padding: '0.5rem 0.75rem', color: '#5F3636' }}>{c.email}</td>
                                <td style={{ padding: '0.5rem 0.75rem', color: '#6B5D52' }}>{c.phone || '—'}</td>
                                <td style={{ padding: '0.5rem 0.75rem' }}>
                                  <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', background: c.status === 'subscribed' ? '#E8F5E9' : '#FBE9E7', color: c.status === 'subscribed' ? '#2E7D32' : '#C62828', fontSize: '0.72rem', fontFamily: "'DM Mono', monospace" }}>
                                    {c.status === 'subscribed' ? 'abonné' : 'désabonné'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', color: '#9B8F89', whiteSpace: 'nowrap' }}>{new Date(c.subscribed_at).toLocaleDateString('fr-FR')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '1.5rem', alignItems: 'start' }}>

                {/* Formulaire de création */}
                <div style={{ background: '#fff', border: '1px solid rgba(95,54,54,0.08)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A700', margin: 0 }}>Nouvelle campagne</p>

                  <div>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', display: 'block', marginBottom: '0.3rem' }}>Liste destinataires</label>
                    <select
                      value={campaignForm.list_name}
                      onChange={e => { setCampaignForm(f => ({ ...f, list_name: e.target.value })); setCampaignPreviewCount(null); fetchContactStats(e.target.value); }}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636' }}
                    >
                      {LIST_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label} — {o.sender}</option>)}
                    </select>
                    {campaignStats && (
                      <p style={{ margin: '0.4rem 0 0', fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: campaignStats.subscribed > 0 ? '#2E7D32' : '#9B8F89' }}>
                        {campaignStats.subscribed} contact{campaignStats.subscribed > 1 ? 's' : ''} abonné{campaignStats.subscribed > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', display: 'block', marginBottom: '0.3rem' }}>Sujet *</label>
                    <input
                      type="text" placeholder="Ex: Soirée Gaming — Vendredi 26 juin 🎮"
                      value={campaignForm.subject}
                      onChange={e => setCampaignForm(f => ({ ...f, subject: e.target.value }))}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', display: 'block', marginBottom: '0.3rem' }}>Message *</label>
                    <textarea
                      rows={12}
                      placeholder={'Bonjour à tous,\n\nMerci d\'être venus hier soir ! La prochaine soirée gaming aura lieu...\n\nÀ très bientôt,\nLucas — Espace Ködörö'}
                      value={campaignForm.html_content}
                      onChange={e => setCampaignForm(f => ({ ...f, html_content: e.target.value }))}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #EAE4D8', background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
                    />
                    <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.75rem', background: '#FBF7EF', border: '1px solid rgba(201,167,0,0.2)' }}>
                      <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#7A6200' }}>
                        ✦ Écris ton message en texte simple — la mise en page Espace Ködörö est appliquée automatiquement. Saute une ligne entre chaque paragraphe. Tu peux aussi utiliser <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0 3px' }}>&lt;b&gt;</code>, <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0 3px' }}>&lt;a href="..."&gt;</code> si besoin.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={previewCampaign}
                      style={{ background: '#EAE4D8', color: '#5F3636', border: 'none', padding: '0.65rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                      Vérifier ({campaignPreviewCount !== null ? `${campaignPreviewCount} destinataires` : '?'})
                    </button>
                    <button
                      type="button"
                      onClick={sendCampaign}
                      disabled={campaignSending || campaignPreviewCount === 0}
                      style={{ flex: 1, background: campaignSending ? '#9B8F89' : '#5F3636', color: '#F4EFE4', border: 'none', padding: '0.65rem 1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, cursor: campaignSending ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <Send size={14} /> {campaignSending ? 'Envoi en cours...' : 'Envoyer la campagne'}
                    </button>
                  </div>
                </div>

                {/* Panneau info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Expéditeur */}
                  <div style={{ background: '#F4EFE4', padding: '1rem 1.25rem', borderLeft: '3px solid #C9A700' }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', margin: '0 0 0.5rem' }}>Expéditeur</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#5F3636', margin: 0 }}>{currentList.sender}</p>
                  </div>

                  {/* Bonnes pratiques */}
                  <div style={{ background: '#fff', border: '1px solid rgba(95,54,54,0.08)', padding: '1rem 1.25rem' }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', margin: '0 0 0.75rem' }}>Bonnes pratiques</p>
                    {[
                      'Sujet clair, sans majuscules agressives',
                      'Peu de liens (1-2 max)',
                      'Pas de pièce jointe',
                      'Adresse cohérente avec la liste',
                      'Ne pas envoyer plus d\'1 fois/semaine',
                      'Le lien de désinscription est auto-ajouté',
                    ].map(tip => (
                      <p key={tip} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B5D52', margin: '0 0 0.4rem', paddingLeft: '0.75rem', borderLeft: '2px solid #EAE4D8' }}>{tip}</p>
                    ))}
                  </div>

                  {/* Historique campagnes */}
                  {campaigns.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid rgba(95,54,54,0.08)', padding: '1rem 1.25rem' }}>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A700', margin: '0 0 0.75rem' }}>Historique</p>
                      {campaigns.slice(0, 5).map(c => (
                        <div key={c.id} style={{ borderBottom: '1px solid #F4EFE4', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#5F3636', margin: '0 0 0.15rem', fontWeight: 500 }}>{c.subject}</p>
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#9B8F89', margin: 0 }}>
                            {c.list_name} · {c.sent_at ? `${c.sent_count} envoyés` : 'Non envoyée'} · {new Date(c.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

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
