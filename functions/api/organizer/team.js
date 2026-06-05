import { requireAuth } from '../_auth.js';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload?.is_admin) return Response.json({ error: 'Non autorisé' }, { status: 403, headers: cors });

  const { results } = await env.DB.prepare(
    'SELECT id, name, email, is_admin, created_at FROM organizers ORDER BY created_at'
  ).all();

  return Response.json(results, { headers: cors });
}

export async function onRequestDelete({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload?.is_admin) return Response.json({ error: 'Non autorisé' }, { status: 403, headers: cors });

  const { id } = await request.json();

  if (id === payload.id) {
    return Response.json({ error: 'Impossible de supprimer son propre compte' }, { status: 400, headers: cors });
  }

  await env.DB.prepare('DELETE FROM organizers WHERE id = ? AND is_admin = 0').bind(id).run();
  return Response.json({ success: true }, { headers: cors });
}
