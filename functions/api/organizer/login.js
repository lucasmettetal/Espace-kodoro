import { hashPassword, signJWT } from '../_auth.js';

export async function onRequestPost({ request, env }) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: 'Email et mot de passe requis' }, { status: 400 });
  }

  const hash = await hashPassword(password);
  const organizer = await env.DB.prepare(
    'SELECT * FROM organizers WHERE email = ? AND password_hash = ?'
  ).bind(email.toLowerCase(), hash).first();

  if (!organizer) {
    return Response.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
  }

  const token = await signJWT({ id: organizer.id, email: organizer.email, name: organizer.name });

  return Response.json({ token, name: organizer.name });
}
