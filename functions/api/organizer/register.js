import { hashPassword } from '../_auth.js';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPost({ request, env }) {
  const { name, email, password, token } = await request.json();

  const validToken = env.REGISTER_TOKEN;
  if (!validToken || token !== validToken) {
    return Response.json({ error: 'Token invalide' }, { status: 403, headers: cors });
  }

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
