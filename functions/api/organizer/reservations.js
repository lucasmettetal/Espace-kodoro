// GET  /api/organizer/reservations  → liste des réservations (auth requise)
// POST /api/organizer/reservations  → ajout manuel d'une réservation payée + email

import { requireAuth } from '../_auth.js';

function formatEventDateFr(isoDate) {
  if (!isoDate) return '';
  const MOIS  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  const d     = new Date(isoDate + 'T12:00:00');
  const jour  = JOURS[d.getDay()];
  return `${jour.charAt(0).toUpperCase() + jour.slice(1)} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) {
    return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });
  }

  const url      = new URL(request.url);
  const eventId  = url.searchParams.get('event_id');
  const status   = url.searchParams.get('status');

  try {
    // Construire la requête selon le rôle et les filtres
    // Sous-requêtes corrélées pour éviter le produit cartésien participants × équipements
    const base = `
      SELECT
        r.id,
        r.customer_name,
        r.email,
        r.phone,
        r.quantity,
        r.status,
        r.amount_cents,
        r.stripe_session_id,
        r.utm_source,
        r.utm_medium,
        r.utm_campaign,
        r.comment,
        r.created_at,
        e.title     AS event_title,
        e.slug      AS event_slug,
        e.event_date,
        (SELECT GROUP_CONCAT(p.full_name, ' · ') FROM participants p WHERE p.reservation_id = r.id)                              AS participant_names,
        (SELECT GROUP_CONCAT(p.full_name, ' · ') FROM participants p WHERE p.reservation_id = r.id AND p.is_minor = 1)           AS minor_names,
        (SELECT COALESCE(SUM(p.is_minor), 0)     FROM participants p WHERE p.reservation_id = r.id)                              AS minor_count,
        (SELECT GROUP_CONCAT(eq.equipment_type, ', ') FROM equipment_offers eq WHERE eq.reservation_id = r.id)                   AS equipment
      FROM reservations r
      JOIN events e ON r.event_id = e.id
    `;

    const conditions = [];
    const bindings   = [];

    // Non-admin : seulement ses propres événements
    if (!payload.is_admin) {
      conditions.push('e.organizer_id = ?');
      bindings.push(payload.id);
    }

    if (eventId) {
      conditions.push('r.event_id = ?');
      bindings.push(eventId);
    }

    if (status) {
      conditions.push('r.status = ?');
      bindings.push(status);
    }

    const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql    = `${base} ${where} GROUP BY r.id ORDER BY r.created_at DESC`;
    const stmt   = bindings.length
      ? env.DB.prepare(sql).bind(...bindings)
      : env.DB.prepare(sql);

    const { results } = await stmt.all();

    // Compter les places payées par événement pour le résumé
    const summaryStmt = env.DB.prepare(`
      SELECT
        event_id,
        SUM(CASE WHEN status = 'paid' THEN quantity ELSE 0 END) AS paid_spots,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count
      FROM reservations
      ${eventId ? 'WHERE event_id = ?' : ''}
      GROUP BY event_id
    `);
    const summaryResult = eventId
      ? await summaryStmt.bind(eventId).all()
      : await summaryStmt.all();

    return Response.json({
      reservations: results,
      summary: summaryResult.results,
    }, { headers: cors });

  } catch (err) {
    console.error('[organizer/reservations]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

// ── POST : ajout manuel d'une réservation ─────────────────────────────────────
export async function onRequestPost({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) {
    return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });
  }

  const { customer_name, email, phone, quantity, amount_cents, comment, participants, event_slug } = await request.json();

  if (!customer_name || !email || !quantity) {
    return Response.json({ error: 'Nom, email et nombre de places sont requis' }, { status: 400, headers: cors });
  }

  try {
    let event;
    if (event_slug) {
      event = await env.DB.prepare('SELECT * FROM events WHERE slug = ?').bind(event_slug).first();
    } else {
      // Sans slug explicite → prochain Le Lobby actif
      event = await env.DB.prepare(
        "SELECT * FROM events WHERE type = 'gaming' AND active = 1 AND event_date >= date('now') ORDER BY event_date ASC LIMIT 1"
      ).first();
    }
    if (!event) return Response.json({ error: 'Événement introuvable' }, { status: 404, headers: cors });

    // Créer la réservation directement en statut paid
    const { meta } = await env.DB.prepare(`
      INSERT INTO reservations (event_id, customer_name, email, phone, quantity, status, amount_cents, comment, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, datetime('now'), datetime('now'))
    `).bind(event.id, customer_name, email.toLowerCase(), phone ?? null, quantity, amount_cents ?? null, comment ?? null).run();

    const reservationId = meta.last_row_id;

    // Insérer les participants
    if (participants?.length) {
      const stmts = participants.map(p =>
        env.DB.prepare('INSERT INTO participants (reservation_id, full_name, is_minor, age) VALUES (?, ?, ?, ?)')
          .bind(reservationId, p.full_name, p.is_minor ? 1 : 0, p.age ?? null)
      );
      await env.DB.batch(stmts);
    }

    // Envoyer l'email de confirmation si Resend est configuré
    if (env.RESEND_API_KEY) {
      const siteUrl    = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');
      const from       = env.EMAIL_FROM ?? 'Espace Ködörö <onboarding@resend.dev>';
      const euroAmount = amount_cents ? (amount_cents / 100).toFixed(2) : null;
      const eventTitle = event.title ?? 'Le Lobby';
      const eventDate  = event.event_date ? formatEventDateFr(event.event_date) : '';
      const horaire    = (event.start_time && event.end_time) ? `${event.start_time.replace(':00','h')} – ${event.end_time.replace(':00','h')}` : '20h – 23h';
      const lieu       = event.location ?? 'Espace Ködörö — Caussade';

      const participantList = (participants ?? []).length > 0
        ? `<ul style="margin:0.5rem 0 0;padding-left:1.25rem;color:#5F3636;">${(participants ?? []).map(p => `<li>${p.full_name}${p.is_minor ? ` <span style="color:#E65100;font-size:0.85em;">(mineur)</span>` : ''}</li>`).join('')}</ul>`
        : '';

      const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4EFE4;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE4;padding:2rem 1rem;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid rgba(95,54,54,0.12);">
<tr><td style="background:#5F3636;padding:2rem;text-align:center;">
  <p style="margin:0 0 0.25rem;font-size:0.7rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(244,239,228,0.6);">Espace Ködörö — Caussade</p>
  <h1 style="margin:0;font-size:1.6rem;font-weight:700;color:#F4EFE4;">Votre réservation est <em style="color:#C9A700;font-style:italic;">confirmée</em></h1>
</td></tr>
<tr><td style="padding:2rem;">
  <p style="margin:0 0 1.25rem;color:#5F3636;font-size:1rem;">Bonjour ${customer_name},</p>
  <p style="margin:0 0 1.5rem;color:#6B5D52;line-height:1.75;">Votre réservation est bien enregistrée. Nous avons hâte de vous accueillir !</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7EF;border:1px solid rgba(95,54,54,0.1);margin-bottom:1.5rem;">
  <tr><td style="padding:1.25rem;">
    <p style="margin:0 0 0.75rem;font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#C9A700;">Détails de votre réservation</p>
    <table cellpadding="0" cellspacing="0">
      <tr><td style="padding:0.3rem 1rem 0.3rem 0;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#9B8F89;">Événement</td><td style="padding:0.3rem 0;font-size:0.9rem;color:#5F3636;font-weight:500;">${eventTitle} — Espace Ködörö</td></tr>
      ${eventDate ? `<tr><td style="padding:0.3rem 1rem 0.3rem 0;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#9B8F89;">Date</td><td style="padding:0.3rem 0;font-size:0.9rem;color:#5F3636;font-weight:500;">${eventDate}</td></tr>` : ''}
      <tr><td style="padding:0.3rem 1rem 0.3rem 0;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#9B8F89;">Horaire</td><td style="padding:0.3rem 0;font-size:0.9rem;color:#5F3636;font-weight:500;">${horaire}</td></tr>
      <tr><td style="padding:0.3rem 1rem 0.3rem 0;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#9B8F89;">Lieu</td><td style="padding:0.3rem 0;font-size:0.9rem;color:#5F3636;font-weight:500;">${lieu}</td></tr>
      <tr><td style="padding:0.3rem 1rem 0.3rem 0;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#9B8F89;">Places</td><td style="padding:0.3rem 0;font-size:0.9rem;color:#5F3636;font-weight:500;">${quantity} place${quantity > 1 ? 's' : ''}</td></tr>
      ${euroAmount ? `<tr><td style="padding:0.3rem 1rem 0.3rem 0;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#9B8F89;">Montant</td><td style="padding:0.3rem 0;font-size:0.9rem;color:#5F3636;font-weight:500;">${euroAmount} €</td></tr>` : ''}
    </table>
    ${participantList ? `<p style="margin:1rem 0 0.25rem;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#9B8F89;">Participants</p>${participantList}` : ''}
  </td></tr></table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border:1px solid rgba(201,167,0,0.25);margin-bottom:1.5rem;">
  <tr><td style="padding:1rem 1.25rem;">
    <p style="margin:0 0 0.5rem;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:#C9A700;">Informations pratiques</p>
    <ul style="margin:0;padding-left:1.25rem;color:#7A6200;font-size:0.875rem;line-height:1.75;">
      <li>Présentez-vous à l'accueil dès 20h</li>
      <li>Si vous apportez du matériel, merci de le signaler à l'entrée</li>
      <li>Les mineurs de moins de 15 ans doivent être accompagnés d'un adulte</li>
    </ul>
  </td></tr></table>
  <p style="margin:0 0 1.5rem;color:#6B5D52;font-size:0.875rem;line-height:1.75;">Une question ? Contactez-nous à <a href="mailto:gaming.kodoro@gmail.com" style="color:#5F3636;">gaming.kodoro@gmail.com</a></p>
  <p style="margin:0;color:#6B5D52;font-size:0.875rem;">À très bientôt,<br><strong style="color:#5F3636;">L'équipe de l'Espace Ködörö</strong></p>
</td></tr>
<tr><td style="background:#F4EFE4;padding:1.25rem;text-align:center;border-top:1px solid rgba(95,54,54,0.08);">
  <p style="margin:0;font-size:0.7rem;color:#9B8F89;">Espace Ködörö · 25 boulevard Didier Rey · 82300 Caussade<br><a href="${siteUrl}" style="color:#9B8F89;">espace-kodoro.fr</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          reply_to: env.EMAIL_REPLY_TO ?? 'gaming.kodoro@gmail.com',
          to: [email],
          subject: `Réservation confirmée — ${eventTitle} · Espace Ködörö`,
          html,
        }),
      });
      if (!resendRes.ok) console.error('[organizer/reservations POST] Resend error:', await resendRes.text());
    }

    return Response.json({ success: true, reservation_id: reservationId }, { headers: cors });

  } catch (err) {
    console.error('[organizer/reservations POST]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}
