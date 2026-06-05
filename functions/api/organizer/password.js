import { hashPassword, requireAuth } from '../_auth.js';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPut({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  const { current_password, new_password } = await request.json();

  if (!current_password || !new_password) {
    return Response.json({ error: 'Champs requis manquants' }, { status: 400, headers: cors });
  }

  if (new_password.length < 8) {
    return Response.json({ error: 'Nouveau mot de passe trop court (8 caractères min)' }, { status: 400, headers: cors });
  }

  const currentHash = await hashPassword(current_password);
  const organizer = await env.DB.prepare(
    'SELECT * FROM organizers WHERE id = ? AND password_hash = ?'
  ).bind(payload.id, currentHash).first();

  if (!organizer) {
    return Response.json({ error: 'Mot de passe actuel incorrect' }, { status: 401, headers: cors });
  }

  const newHash = await hashPassword(new_password);
  await env.DB.prepare(
    'UPDATE organizers SET password_hash = ? WHERE id = ?'
  ).bind(newHash, payload.id).run();

  return Response.json({ success: true }, { headers: cors });
}
