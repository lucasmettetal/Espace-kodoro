import { requireAuth } from '../../_auth.js';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPut({ params, request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  const event = await env.DB.prepare(
    'SELECT * FROM events WHERE id = ? AND organizer_id = ?'
  ).bind(params.id, payload.id).first();

  if (!event) return Response.json({ error: 'Événement introuvable' }, { status: 404, headers: cors });

  const { title, date, day, year, type, description, price, spots_total } = await request.json();

  await env.DB.prepare(
    `UPDATE events SET title=?, date=?, day=?, year=?, type=?, description=?, price=?, spots_total=? WHERE id=?`
  ).bind(title, date, day, year, type, description, price, spots_total ?? 0, params.id).run();

  return Response.json({ success: true }, { headers: cors });
}

export async function onRequestDelete({ params, request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  const event = await env.DB.prepare(
    'SELECT * FROM events WHERE id = ? AND organizer_id = ?'
  ).bind(params.id, payload.id).first();

  if (!event) return Response.json({ error: 'Événement introuvable' }, { status: 404, headers: cors });

  await env.DB.prepare('DELETE FROM registrations WHERE event_id = ?').bind(params.id).run();
  await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(params.id).run();

  return Response.json({ success: true }, { headers: cors });
}
