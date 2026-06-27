import { hashPassword, requireAuth } from '../_auth.js';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPost({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });
  // Seul un administrateur peut créer de nouveaux comptes organisateur.
  if (!payload.is_admin) return Response.json({ error: 'Accès réservé aux administrateurs' }, { status: 403, headers: cors });

  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return Response.json({ error: 'Tous les champs sont requis' }, { status: 400, headers: cors });
  }

  if (password.length < 8) {
    return Response.json({ error: 'Mot de passe trop court (8 caractères min)' }, { status: 400, headers: cors });
  }

  const existing = await env.DB.prepare(
    'SELECT id FROM organizers WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  if (existing) {
    return Response.json({ error: 'Cet email est déjà utilisé' }, { status: 409, headers: cors });
  }

  const hash = await hashPassword(password);
  await env.DB.prepare(
    'INSERT INTO organizers (name, email, password_hash) VALUES (?, ?, ?)'
  ).bind(name, email.toLowerCase(), hash).run();

  return Response.json({ success: true }, { headers: cors });
}
