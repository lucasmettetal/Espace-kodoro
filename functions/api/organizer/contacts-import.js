// POST /api/organizer/contacts-import
// Import en masse de contacts depuis un CSV (parsé côté client, envoyé en JSON).
// Body: { list_name: string, contacts: [{ email?, first_name?, last_name?, phone?, source? }] }
// Retourne: { total, created, updated, skipped_unsubscribed, skipped_invalid, errors[], already_exists }

import { requireAuth } from '../_auth.js';

export async function onRequestPost({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

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

  let created = 0;
  let updated = 0;
  let already_exists = 0;
  let skipped_unsubscribed = 0;
  let skipped_invalid = 0;
  const errors = [];

  for (const row of contacts) {
    const email = (row.email ?? '').trim().toLowerCase();
    const phone = (row.phone ?? '').trim() || null;

    // Valider email
    const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Valider téléphone (au moins 6 chiffres)
    const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
    const phoneValid  = phoneDigits.length >= 6;

    // Ignorer les lignes sans email ET sans phone valide
    if (!emailValid && !phoneValid) {
      skipped_invalid++;
      errors.push({ email: email || '(vide)', reason: 'Email invalide et téléphone absent/invalide' });
      continue;
    }

    const first_name = (row.first_name ?? '').trim() || null;
    const last_name  = (row.last_name  ?? '').trim() || null;

    try {
      if (emailValid) {
        // ── Chemin normal : contact avec email ───────────────────────────────

        // Vérifier si le contact est déjà désinscrit de cette liste
        const unsubRow = await env.DB.prepare(`
          SELECT cs.status FROM contacts c
          JOIN contact_subscriptions cs ON cs.contact_id = c.id
          WHERE c.email = ? AND cs.list_name = ?
        `).bind(email, list_name).first();

        if (unsubRow && unsubRow.status === 'unsubscribed') {
          skipped_unsubscribed++;
          errors.push({ email, reason: 'Contact déjà désinscrit — non réinscrit' });
          continue;
        }

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

        const subExisting = await env.DB.prepare(`
          SELECT id FROM contact_subscriptions WHERE contact_id = ? AND list_name = ?
        `).bind(contact.id, list_name).first();

        if (!subExisting) {
          const token = crypto.randomUUID();
          await env.DB.prepare(`
            INSERT INTO contact_subscriptions (contact_id, list_name, status, unsubscribe_token)
            VALUES (?, ?, 'subscribed', ?)
          `).bind(contact.id, list_name, token).run();
        }

        if (existing) {
          updated++;
          already_exists++;
        } else {
          created++;
        }

      } else {
        // ── Chemin téléphone uniquement (pas d'email) ────────────────────────
        // Dédoublonnage par téléphone (contacts sans email)
        const existingByPhone = await env.DB.prepare(`
          SELECT id FROM contacts WHERE phone = ? AND email IS NULL
        `).bind(phone).first();

        if (existingByPhone) {
          // Mettre à jour le contact existant
          await env.DB.prepare(`
            UPDATE contacts SET
              first_name = COALESCE(?, first_name),
              last_name  = COALESCE(?, last_name),
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(first_name, last_name, existingByPhone.id).run();

          const contactId = existingByPhone.id;

          // Vérifier désinscription
          const unsubRow = await env.DB.prepare(`
            SELECT status FROM contact_subscriptions WHERE contact_id = ? AND list_name = ?
          `).bind(contactId, list_name).first();

          if (unsubRow && unsubRow.status === 'unsubscribed') {
            skipped_unsubscribed++;
            errors.push({ email: phone, reason: 'Contact (tél) déjà désinscrit — non réinscrit' });
            continue;
          }

          const subExisting = await env.DB.prepare(`
            SELECT id FROM contact_subscriptions WHERE contact_id = ? AND list_name = ?
          `).bind(contactId, list_name).first();

          if (!subExisting) {
            const token = crypto.randomUUID();
            await env.DB.prepare(`
              INSERT INTO contact_subscriptions (contact_id, list_name, status, unsubscribe_token)
              VALUES (?, ?, 'subscribed', ?)
            `).bind(contactId, list_name, token).run();
          }

          updated++;
          already_exists++;
        } else {
          // Créer nouveau contact sans email
          const insertResult = await env.DB.prepare(`
            INSERT INTO contacts (email, first_name, last_name, phone, source)
            VALUES (NULL, ?, ?, ?, 'import')
          `).bind(first_name, last_name, phone).run();

          const contactId = insertResult.meta?.last_row_id;
          if (contactId) {
            const token = crypto.randomUUID();
            await env.DB.prepare(`
              INSERT OR IGNORE INTO contact_subscriptions (contact_id, list_name, status, unsubscribe_token)
              VALUES (?, ?, 'subscribed', ?)
            `).bind(contactId, list_name, token).run();
          }

          created++;
        }
      }

    } catch (err) {
      errors.push({ email: email || phone || '(vide)', reason: err.message });
    }
  }

  return new Response(JSON.stringify({
    total:               contacts.length,
    created,
    updated,
    already_exists,
    skipped_unsubscribed,
    skipped_invalid,
    errors,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
