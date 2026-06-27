import { verifyPassword, signJWT } from '../_auth.js';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPost({ request, env }) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: 'Email et mot de passe requis' }, { status: 400, headers: cors });
  }

  const organizer = await env.DB.prepare(
    'SELECT * FROM organizers WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  const passwordOk = organizer && await verifyPassword(password, organizer.password_hash);
  if (!passwordOk) {
    return Response.json({ error: 'Email ou mot de passe incorrect' }, { status: 401, headers: cors });
  }

  const token = await signJWT({ id: organizer.id, email: organizer.email, name: organizer.name, is_admin: organizer.is_admin ?? 0 }, env);

  return Response.json({ token, name: organizer.name, is_admin: organizer.is_admin ?? 0 }, { headers: cors });
}
