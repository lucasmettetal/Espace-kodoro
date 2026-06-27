// GET /api/organizer/contacts?list=gaming&search=lucas&status=subscribed&source=import
// Retourne les contacts d'une liste avec filtres optionnels.

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
  const search   = (url.searchParams.get('search') ?? '').trim();
  const status   = url.searchParams.get('status') ?? 'all';   // 'subscribed' | 'unsubscribed' | 'all'
  const source   = url.searchParams.get('source') ?? '';       // 'import' | 'reservation' | 'manual' | ''

  try {
    const conditions = ['cs.list_name = ?'];
    const bindings   = [listName];

    if (status !== 'all') {
      conditions.push('cs.status = ?');
      bindings.push(status);
    }

    if (source) {
      conditions.push('c.source = ?');
      bindings.push(source);
    }

    if (search) {
      conditions.push('(c.email LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)');
      const like = `%${search}%`;
      bindings.push(like, like, like);
    }

    const where = conditions.join(' AND ');

    const { results: contacts } = await env.DB.prepare(`
      SELECT
        c.id, c.email, c.first_name, c.last_name, c.phone, c.source,
        cs.list_name, cs.status, cs.subscribed_at, cs.unsubscribed_at
      FROM contacts c
      JOIN contact_subscriptions cs ON cs.contact_id = c.id
      WHERE ${where}
      ORDER BY cs.subscribed_at DESC
    `).bind(...bindings).all();

    const subscribed   = contacts.filter(c => c.status === 'subscribed').length;
    const unsubscribed = contacts.filter(c => c.status === 'unsubscribed').length;

    return Response.json({ contacts, stats: { subscribed, unsubscribed, total: contacts.length } }, { headers: cors });
  } catch (err) {
    console.error('[contacts]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}
