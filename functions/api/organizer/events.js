import { requireAuth } from '../_auth.js';

export async function onRequestGet({ request, env }) {
  const payload = await requireAuth(request);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401 });

  const { results } = await env.DB.prepare(
    'SELECT * FROM events WHERE organizer_id = ? ORDER BY year, date'
  ).bind(payload.id).all();

  return Response.json(results);
}

export async function onRequestPost({ request, env }) {
  const payload = await requireAuth(request);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401 });

  const { title, date, day, year, type, description, price, spots_total } = await request.json();

  if (!title || !date || !day || !year || !type || !description || !price) {
    return Response.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const result = await env.DB.prepare(
    `INSERT INTO events (title, date, day, year, type, description, price, spots_total, organizer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(title, date, day, year, type, description, price, spots_total ?? 0, payload.id).run();

  return Response.json({ success: true, id: result.meta.last_row_id }, { status: 201 });
}
