// GET /api/organizer/reservations
// Retourne la liste des réservations avec les participants.
// Réservé aux organisateurs authentifiés.
// Query params :
//   ?event_id=1   → filtrer par événement
//   ?status=paid  → filtrer par statut (paid, pending, cancelled, refunded)

import { requireAuth } from '../_auth.js';

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
    // GROUP_CONCAT agrège les noms des participants en une seule chaîne
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
        GROUP_CONCAT(p.full_name, ' · ') AS participant_names,
        GROUP_CONCAT(CASE WHEN p.is_minor = 1 THEN p.full_name END, ' · ') AS minor_names,
        SUM(p.is_minor) AS minor_count,
        GROUP_CONCAT(eq.equipment_type, ', ') AS equipment
      FROM reservations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN participants p ON p.reservation_id = r.id
      LEFT JOIN equipment_offers eq ON eq.reservation_id = r.id
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
