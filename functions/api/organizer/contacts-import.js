// POST /api/organizer/contacts/import
// Import en masse de contacts depuis un CSV (parsé côté client, envoyé en JSON).
// Body: { list_name: string, contacts: [{ email, first_name?, last_name?, phone? }] }
// Retourne: { imported: N, updated: N, errors: [{ email, reason }] }

import { requireAuth } from '../_auth.js';

export async function onRequestPost({ request, env }) {
  const authError = await requireAuth(request, env);
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { list_name, contacts } = body;

  if (!list_name || !Array.isArray(contacts) || contacts.length === 0) {
    return new Response(JSON.stringify({ error: 'list_name et contacts[] requis' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const VALID_LISTS = ['gaming', 'evenements', 'yoga', 'kodoro_general'];
  if (!VALID_LISTS.includes(list_name)) {
    return new Response(JSON.stringify({ error: 'Liste invalide' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let imported = 0;
  let updated = 0;
  const errors = [];

  for (const row of contacts) {
    const email = (row.email ?? '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ email: email || '(vide)', reason: 'Email invalide' });
      continue;
    }

    const first_name = (row.first_name ?? '').trim() || null;
    const last_name  = (row.last_name  ?? '').trim() || null;
    const phone      = (row.phone      ?? '').trim() || null;

    try {
      // Upsert contact
      const existing = await env.DB.prepare('SELECT id FROM contacts WHERE email = ?').bind(email).first();

      await env.DB.prepare(`
        INSERT INTO contacts (email, first_name, last_name, phone, source)
        VALUES (?, ?, ?, ?, 'import')
        ON CONFLICT(email) DO UPDATE SET
          first_name = COALESCE(excluded.first_name, first_name),
          last_name  = COALESCE(excluded.last_name,  last_name),
          phone      = COALESCE(excluded.phone,       phone),
          updated_at = datetime('now')
      `).bind(email, first_name, last_name, phone).run();

      const contact = await env.DB.prepare('SELECT id FROM contacts WHERE email = ?').bind(email).first();

      // Upsert subscription — ne pas réabonner quelqu'un qui s'est désabonné
      const token = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT OR IGNORE INTO contact_subscriptions (contact_id, list_name, status, unsubscribe_token)
        VALUES (?, ?, 'subscribed', ?)
      `).bind(contact.id, list_name, token).run();

      if (existing) updated++; else imported++;

    } catch (err) {
      errors.push({ email, reason: err.message });
    }
  }

  return new Response(JSON.stringify({ imported, updated, errors, total: contacts.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
