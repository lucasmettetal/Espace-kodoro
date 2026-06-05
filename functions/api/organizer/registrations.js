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

  let stmt;
  if (payload.is_admin) {
    stmt = eventId
      ? env.DB.prepare(`SELECT r.*, e.title as event_title, o.name as organizer_name FROM registrations r JOIN events e ON r.event_id = e.id JOIN organizers o ON e.organizer_id = o.id WHERE r.event_id = ? ORDER BY r.created_at DESC`).bind(eventId)
      : env.DB.prepare(`SELECT r.*, e.title as event_title, o.name as organizer_name FROM registrations r JOIN events e ON r.event_id = e.id JOIN organizers o ON e.organizer_id = o.id ORDER BY r.created_at DESC`);
  } else {
    stmt = eventId
      ? env.DB.prepare(`SELECT r.*, e.title as event_title FROM registrations r JOIN events e ON r.event_id = e.id WHERE e.organizer_id = ? AND r.event_id = ? ORDER BY r.created_at DESC`).bind(payload.id, eventId)
      : env.DB.prepare(`SELECT r.*, e.title as event_title FROM registrations r JOIN events e ON r.event_id = e.id WHERE e.organizer_id = ? ORDER BY r.created_at DESC`).bind(payload.id);
  }

  const { results } = await stmt.all();
  return Response.json(results, { headers: cors });
}
