import { requireAuth } from '../_auth.js';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  const url = new URL(request.url);
  const eventId = url.searchParams.get('event_id');

  const query = eventId
    ? `SELECT r.*, e.title as event_title FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE e.organizer_id = ? AND r.event_id = ?
       ORDER BY r.created_at DESC`
    : `SELECT r.*, e.title as event_title FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE e.organizer_id = ?
       ORDER BY r.created_at DESC`;

  const stmt = eventId
    ? env.DB.prepare(query).bind(payload.id, eventId)
    : env.DB.prepare(query).bind(payload.id);

  const { results } = await stmt.all();
  return Response.json(results, { headers: cors });
}
