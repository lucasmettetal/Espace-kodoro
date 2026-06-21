// GET /api/organizer/contacts?list=gaming
// Retourne les contacts abonnés à une liste donnée.

import { requireAuth } from '../_auth.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  const url      = new URL(request.url);
  const listName = url.searchParams.get('list') ?? 'gaming';

  try {
    const { results: contacts } = await env.DB.prepare(`
      SELECT
        c.id, c.email, c.first_name, c.last_name, c.phone, c.source,
        cs.status, cs.subscribed_at, cs.unsubscribed_at
      FROM contacts c
      JOIN contact_subscriptions cs ON cs.contact_id = c.id
      WHERE cs.list_name = ?
      ORDER BY cs.subscribed_at DESC
    `).bind(listName).all();

    const subscribed   = contacts.filter(c => c.status === 'subscribed').length;
    const unsubscribed = contacts.filter(c => c.status === 'unsubscribed').length;

    return Response.json({ contacts, stats: { subscribed, unsubscribed, total: contacts.length } }, { headers: cors });
  } catch (err) {
    console.error('[contacts]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}
