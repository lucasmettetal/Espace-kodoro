import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ActivityLayout } from './ActivityLayout';
import { useUtm } from '../hooks/useUtm';

const MAX_PLACES_PER_BOOKING = 4;
const DISPLAY_PRICE_PER_PERSON = 5;

function getOrCreateDeviceToken(): string {
  const KEY = 'kodoro_device_token';
  try {
    let token = localStorage.getItem(KEY);
    if (!token) {
      token = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(KEY, token);
    }
    return token;
  } catch {
    return '';
  }
}

function formatEventDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
}

type Participant = {
  full_name: string;
  is_minor: boolean;
  age: string;
};

type EventInfo = {
  event_id: number;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  price_cents: number;
  max_places: number;
  available: number;
  is_open: boolean;
};

type FormData = {
  newsletter_consent: boolean;
  customer_name: string;
  email: string;
  phone: string;
  quantity: number;
  participants: Participant[];
  equipment: string[];
  comment: string;
};

const EQUIPMENT_OPTIONS = [
  { id: 'console',   label: 'Console' },
  { id: 'pc',        label: 'PC' },
  { id: 'ecran',     label: 'Écran' },
  { id: 'manettes',  label: 'Manettes' },
  { id: 'jeux',      label: 'Jeux' },
  { id: 'autre',     label: 'Autre' },
];

function emptyParticipant(): Participant {
  return { full_name: '', is_minor: false, age: '' };
}

// ── Styles partagés ────────────────────────────────────────────────────────────
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
    transition: 'border-color 0.2s',
    borderRadius: 0,
  },
  infoBox: {
    background: '#F4EFE4',
    border: '1px solid rgba(95,54,54,0.1)',
    padding: '1rem 1.25rem',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.875rem',
    lineHeight: 1.75,
    color: '#6B5D52',
  },
  warnBox: {
    background: '#FFF8E1',
    border: '1px solid rgba(201,167,0,0.35)',
    padding: '1rem 1.25rem',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.875rem',
    lineHeight: 1.75,
    color: '#7A6200',
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
    transition: 'background 0.2s',
  },
  btnSecondary: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.8rem',
    color: '#6B5D52',
    textDecoration: 'underline' as const,
    padding: 0,
  },
};

function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#C9A700';
}
function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'rgba(95,54,54,0.2)';
}

export function ReservationGamingPage() {
  const utmParams = useUtm();
  const navigate = useNavigate();

  // ── Chargement de l'événement ──────────────────────────────────────────────
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState(false);

  useEffect(() => {
    fetch('/api/event-availability?type=gaming')
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(data => setEventInfo(data))
      .catch(() => setEventError(true))
      .finally(() => setLoadingEvent(false));
  }, []);

  // ── État du formulaire ─────────────────────────────────────────────────────
  const [form, setForm] = useState<FormData>({
    customer_name: '',
    email: '',
    phone: '',
    quantity: 1,
    participants: [emptyParticipant()],
    equipment: [],
    comment: '',
    newsletter_consent: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Gestion du nombre de places ───────────────────────────────────────────
  function setQuantity(n: number) {
    setForm(prev => ({
      ...prev,
      quantity: n,
      participants: Array.from({ length: n }, (_, i) => prev.participants[i] ?? emptyParticipant()),
    }));
  }

  function updateParticipant(idx: number, field: keyof Participant, value: string | boolean) {
    setForm(prev => {
      const participants = [...prev.participants];
      participants[idx] = { ...participants[idx], [field]: value };
      return { ...prev, participants };
    });
  }

  function toggleEquipment(id: string) {
    setForm(prev => ({
      ...prev,
      equipment: prev.equipment.includes(id)
        ? prev.equipment.filter(e => e !== id)
        : [...prev.equipment, id],
    }));
  }

  // ── Soumission du formulaire ───────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventInfo || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        event_id:      eventInfo.event_id,
        customer_name: form.customer_name.trim(),
        email:         form.email.trim(),
        phone:         form.phone.trim(),
        quantity:      form.quantity,
        participants:  form.participants.map(p => ({
          full_name: p.full_name.trim(),
          is_minor:  p.is_minor,
          age:       p.is_minor && p.age ? p.age : null,
        })),
        equipment:          form.equipment,
        comment:            form.comment.trim() || null,
        newsletter_consent: form.newsletter_consent,
        device_token:       getOrCreateDeviceToken(),
        utm_source:   utmParams.utm_source,
        utm_medium:   utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_content:  utmParams.utm_content,
        utm_term:     utmParams.utm_term,
        referrer:     utmParams.referrer,
        landing_page: utmParams.landing_page,
      };

      const res  = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? 'Une erreur est survenue. Réessayez dans quelques instants.');
        return;
      }

      // Première visite → réservation gratuite
      if (data.first_visit) {
        navigate('/merci-reservation-gaming?first_visit=1');
        return;
      }

      // Réservation couverte par un Pass Gaming actif → pas de paiement Stripe
      if (data.pass_reservation) {
        navigate('/merci-reservation-gaming?pass=1');
        return;
      }

      // Redirection vers Stripe Checkout (URL externe)
      window.location.href = data.url;

    } catch {
      setSubmitError('Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.');
    } finally {
      setSubmitting(false);
    }
  }

  const total    = form.quantity * DISPLAY_PRICE_PER_PERSON;
  const hasMinor = form.participants.some(p => p.is_minor);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <ActivityLayout>

      {/* ── Hero compact ──────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #2E1515 0%, #5F3636 55%, #3D1F1F 100%)',
        padding:    'clamp(4rem, 8vw, 7rem) clamp(2rem, 8vw, 8rem) clamp(3rem, 6vw, 5rem)',
        position:   'relative',
        overflow:   'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(201,167,0,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Fil d'Ariane */}
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A700', marginBottom: '0.75rem' }}>
            <Link to="/gaming" style={{ color: 'rgba(201,167,0,0.7)', textDecoration: 'none' }}>Gaming</Link>
            {' '}/{'  '}Réservation
          </p>

          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, lineHeight: 1.15, color: '#F4EFE4', margin: 0, marginBottom: '1.5rem' }}>
            Réserver ma place —{' '}
            <em style={{ fontStyle: 'italic', color: '#C9A700' }}>{eventInfo?.title ?? 'Le Lobby'}</em>
          </h1>

          {/* Infos événement */}
          {!loadingEvent && !eventError && eventInfo && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
              {[
                { label: 'Date',          value: formatEventDate(eventInfo.event_date) },
                { label: 'Horaire',       value: `${eventInfo.start_time} – ${eventInfo.end_time}` },
                { label: 'Lieu',          value: eventInfo.location },
                { label: 'Participation', value: `${DISPLAY_PRICE_PER_PERSON} € / personne` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,167,0,0.7)', margin: 0, marginBottom: '0.2rem' }}>{label}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: 'rgba(244,239,228,0.9)', margin: 0, fontWeight: 500 }}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Corps ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FBF7EF', padding: 'clamp(3rem, 6vw, 6rem) clamp(2rem, 8vw, 8rem)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Chargement de l'événement */}
          {loadingEvent && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#6B5D52', textAlign: 'center' }}>
              Chargement des informations…
            </p>
          )}

          {/* Erreur de chargement — on affiche quand même le formulaire */}
          {eventError && (
            <div style={{ ...S.warnBox, marginBottom: '2rem' }}>
              Impossible de charger les informations de l'événement en ce moment.
              Vous pouvez toujours remplir le formulaire ci-dessous.
            </div>
          )}

          {/* Événement complet */}
          {!loadingEvent && eventInfo && !eventInfo.is_open && (
            <div style={{ ...S.warnBox, marginBottom: '2rem' }}>
              <strong>La soirée est complète.</strong><br />
              Il ne reste plus de places disponibles. Rejoignez le groupe WhatsApp pour être informé des prochaines dates.
            </div>
          )}

          {/* Disponibilité */}
          {!loadingEvent && eventInfo?.is_open && (
            <div style={{ ...S.infoBox, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#4CAF50', fontSize: '1.1rem' }}>●</span>
              <span>
                <strong style={{ color: '#5F3636' }}>{eventInfo.available} place{eventInfo.available > 1 ? 's' : ''} disponible{eventInfo.available > 1 ? 's' : ''}</strong>
                {' '}sur {eventInfo.max_places} — Réservation confirmée uniquement après paiement.
              </span>
            </div>
          )}

          {/* Bannière première soirée offerte */}
          <div style={{ background: '#1a3d1a', border: '1px solid rgba(76,175,80,0.4)', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '0.1rem' }}>🎮</span>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 700, color: '#81C784', margin: '0 0 0.2rem' }}>
                Première soirée ? Elle est offerte !
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: 'rgba(129,199,132,0.8)', margin: 0, lineHeight: 1.65 }}>
                Si c'est ta première visite, tu n'auras rien à payer — la vérification est automatique.
                Viens voir l'ambiance, c'est sans engagement.
              </p>
            </div>
          </div>

          {/* Introduction */}
          <div style={{ ...S.infoBox, marginBottom: '2rem' }}>
            Merci de remplir ce formulaire pour réserver ta place.
            Cela permet de préparer la liste des participants, d'anticiper le matériel et d'organiser la salle.
            <br />
            <strong style={{ color: '#5F3636' }}>Première visite = offerte. Retour = 5 € par soirée.</strong>
          </div>

          {/* ── FORMULAIRE ────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ── Coordonnées du réservant ─────────────────────────── */}
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ ...S.label, color: '#C9A700', fontSize: '0.7rem', marginBottom: '1rem', width: '100%' }}>
                Vos coordonnées
              </legend>
              <div style={{ display: 'grid', gap: '1.25rem' }} className="grid-cols-1 md:grid-cols-2">
                <div>
                  <label htmlFor="customer_name" style={S.label}>Nom et prénom <span style={{ color: '#C9A700' }}>*</span></label>
                  <input
                    id="customer_name" name="customer_name" type="text" required autoComplete="name"
                    placeholder="Jean Dupont"
                    value={form.customer_name}
                    onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                    style={S.input} onFocus={focusBorder} onBlur={blurBorder}
                  />
                </div>
                <div>
                  <label htmlFor="email" style={S.label}>Email <span style={{ color: '#C9A700' }}>*</span></label>
                  <input
                    id="email" name="email" type="email" required autoComplete="email"
                    placeholder="jean@exemple.fr"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    style={S.input} onFocus={focusBorder} onBlur={blurBorder}
                  />
                </div>
              </div>
              <div style={{ marginTop: '1.25rem', maxWidth: 280 }}>
                <label htmlFor="phone" style={S.label}>Téléphone <span style={{ color: '#C9A700' }}>*</span></label>
                <input
                  id="phone" name="phone" type="tel" required autoComplete="tel"
                  placeholder="06 00 00 00 00"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  style={S.input} onFocus={focusBorder} onBlur={blurBorder}
                />
              </div>
            </fieldset>

            {/* ── Nombre de places ────────────────────────────────── */}
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ ...S.label, color: '#C9A700', fontSize: '0.7rem', marginBottom: '0.75rem', width: '100%' }}>
                Nombre de places <span style={{ color: '#C9A700' }}>*</span>
              </legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Array.from({ length: MAX_PLACES_PER_BOOKING }, (_, i) => i + 1).map(n => (
                  <button
                    key={n} type="button"
                    onClick={() => setQuantity(n)}
                    style={{
                      width: 52, height: 52,
                      border:      `2px solid ${form.quantity === n ? '#C9A700' : 'rgba(95,54,54,0.2)'}`,
                      background:  form.quantity === n ? '#C9A700' : 'transparent',
                      color:       form.quantity === n ? '#F4EFE4' : '#5F3636',
                      fontFamily:  "'DM Sans', sans-serif",
                      fontSize:    '1.1rem',
                      fontWeight:  700,
                      cursor:      'pointer',
                      transition:  'all 0.15s',
                      flexShrink:  0,
                    }}
                  >{n}</button>
                ))}
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#6B5D52', marginTop: '0.5rem' }}>
                {form.quantity} place{form.quantity > 1 ? 's' : ''} — total : <strong style={{ color: '#5F3636' }}>{total} €</strong>
              </p>
            </fieldset>

            {/* ── Participants ─────────────────────────────────────── */}
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ ...S.label, color: '#C9A700', fontSize: '0.7rem', marginBottom: '1rem', width: '100%' }}>
                Participant{form.quantity > 1 ? 's' : ''} <span style={{ color: '#C9A700' }}>*</span>
              </legend>
              {form.participants.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#F4EFE4',
                    border: '1px solid rgba(95,54,54,0.1)',
                    padding: '1.25rem',
                    marginBottom: idx < form.participants.length - 1 ? '1rem' : 0,
                  }}
                >
                  <p style={{ ...S.label, color: '#C9A700', marginBottom: '0.875rem' }}>
                    Participant {idx + 1}{idx === 0 ? ' (réservant)' : ''}
                  </p>

                  <div style={{ display: 'grid', gap: '1rem' }} className="grid-cols-1 md:grid-cols-2">
                    <div>
                      <label htmlFor={`full_name_${idx}`} style={S.label}>Nom et prénom <span style={{ color: '#C9A700' }}>*</span></label>
                      <input
                        id={`full_name_${idx}`} type="text" required
                        placeholder="Prénom Nom"
                        value={p.full_name}
                        onChange={e => updateParticipant(idx, 'full_name', e.target.value)}
                        style={S.input} onFocus={focusBorder} onBlur={blurBorder}
                      />
                    </div>
                    <div>
                      <label style={S.label}>Mineur ?</label>
                      <div style={{ display: 'flex', gap: '1.25rem', paddingTop: '0.6rem' }}>
                        {[{ v: false, label: 'Non' }, { v: true, label: 'Oui' }].map(({ v, label }) => (
                          <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#5F3636' }}>
                            <input
                              type="radio"
                              checked={p.is_minor === v}
                              onChange={() => updateParticipant(idx, 'is_minor', v)}
                              style={{ accentColor: '#C9A700', width: 15, height: 15 }}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {p.is_minor && (
                    <div style={{ marginTop: '0.875rem', maxWidth: 200 }}>
                      <label htmlFor={`age_${idx}`} style={S.label}>Âge <span style={{ color: '#C9A700' }}>*</span></label>
                      <input
                        id={`age_${idx}`} type="number" min={1} max={17} required={p.is_minor}
                        placeholder="ex : 14"
                        value={p.age}
                        onChange={e => updateParticipant(idx, 'age', e.target.value)}
                        style={S.input} onFocus={focusBorder} onBlur={blurBorder}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Rappel mineurs */}
              {hasMinor && (
                <div style={{ ...S.warnBox, marginTop: '1rem' }}>
                  <strong>Informations importantes pour les mineurs :</strong><br />
                  Les enfants de moins de 15 ans doivent être accompagnés par un adulte présent sur place
                  pendant toute la soirée.<br />
                  Les mineurs de 15 à 17 ans doivent fournir une autorisation parentale avec un numéro
                  de téléphone d'un responsable légal.
                </div>
              )}
            </fieldset>

            {/* ── Matériel ─────────────────────────────────────────── */}
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ ...S.label, color: '#C9A700', fontSize: '0.7rem', marginBottom: '0.75rem', width: '100%' }}>
                Matériel apporté <span style={{ fontStyle: 'italic', fontSize: '0.6rem', color: '#6B5D52' }}>(optionnel)</span>
              </legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {EQUIPMENT_OPTIONS.map(({ id, label }) => (
                  <label
                    key={id}
                    style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        '0.4rem',
                      cursor:     'pointer',
                      padding:    '0.45rem 0.9rem',
                      border:     `1px solid ${form.equipment.includes(id) ? '#C9A700' : 'rgba(95,54,54,0.2)'}`,
                      background: form.equipment.includes(id) ? 'rgba(201,167,0,0.1)' : 'transparent',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize:   '0.85rem',
                      color:      form.equipment.includes(id) ? '#5F3636' : '#6B5D52',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.equipment.includes(id)}
                      onChange={() => toggleEquipment(id)}
                      style={{ accentColor: '#C9A700', width: 14, height: 14 }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* ── Commentaire ─────────────────────────────────────── */}
            <div>
              <label htmlFor="comment" style={S.label}>
                Commentaire <span style={{ fontStyle: 'italic', fontSize: '0.6rem', color: '#6B5D52' }}>(optionnel)</span>
              </label>
              <textarea
                id="comment" rows={3}
                placeholder="Informations complémentaires, contraintes particulières…"
                value={form.comment}
                onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                style={{ ...S.input, resize: 'vertical' }}
                onFocus={focusBorder as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                onBlur={blurBorder as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
              />
            </div>

            {/* ── Consentement newsletter ──────────────────────────── */}
            <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', padding: '1rem', background: 'rgba(201,167,0,0.06)', border: '1px solid rgba(201,167,0,0.2)' }}>
              <input
                type="checkbox"
                checked={form.newsletter_consent}
                onChange={e => setForm(p => ({ ...p, newsletter_consent: e.target.checked }))}
                style={{ marginTop: '0.2rem', width: '16px', height: '16px', flexShrink: 0, accentColor: '#C9A700', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#5F3636', lineHeight: 1.6 }}>
                J'accepte de recevoir les informations sur les prochaines soirées gaming de l'Espace Ködörö.
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#9B8F89', marginTop: '0.2rem' }}>
                  Optionnel — désinscription possible à tout moment.
                </span>
              </span>
            </label>

            {/* ── Récapitulatif et bouton de paiement ─────────────── */}
            <div style={{ background: '#F4EFE4', border: '1px solid rgba(95,54,54,0.15)', padding: 'clamp(1.25rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ ...S.label, color: '#C9A700', margin: 0 }}>Récapitulatif</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid rgba(95,54,54,0.1)', paddingBottom: '0.75rem' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#5F3636' }}>
                  {form.quantity} place{form.quantity > 1 ? 's' : ''} × {DISPLAY_PRICE_PER_PERSON} €
                </span>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, color: '#5F3636' }}>
                  {total} €
                </span>
              </div>

              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', lineHeight: 1.75, color: '#6B5D52', margin: 0 }}>
                Merci de vérifier que le nombre de places correspond bien aux participants renseignés.
                La réservation sera validée après réception du paiement correspondant.
              </p>

              {submitError && (
                <div style={{ ...S.warnBox, borderColor: 'rgba(220,0,0,0.3)', background: '#FFF0F0', color: '#8B0000' }}>
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (!loadingEvent && !eventInfo?.is_open)}
                style={{
                  ...S.btnPrimary,
                  alignSelf: 'flex-start',
                  opacity: (submitting || (!loadingEvent && !eventInfo?.is_open)) ? 0.6 : 1,
                  cursor:  (submitting || (!loadingEvent && !eventInfo?.is_open)) ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#D4B930'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#C9A700'; }}
              >
                {submitting ? 'Vérification en cours…' : 'Confirmer ma réservation'}
              </button>

              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.06em', color: '#9B8F89', margin: 0 }}>
                Première visite = gratuite. Retour = {total} € via Stripe.
              </p>
            </div>
          </form>
        </div>
      </section>
    </ActivityLayout>
  );
}
