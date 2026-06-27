// GET /api/organizer/campaigns-stats
// Retourne les statistiques globales pour l'onglet Campagnes email.

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

  try {
    const [
      gamingRow,
      generalRow,
      reservationsRow,
      csvImportsRow,
      unsubscribedRow,
      lastCampaignRow,
      lastImportRow,
    ] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as n FROM contact_subscriptions WHERE list_name='gaming' AND status='subscribed'`).first(),
      env.DB.prepare(`SELECT COUNT(*) as n FROM contact_subscriptions WHERE list_name='kodoro_general' AND status='subscribed'`).first(),
      env.DB.prepare(`SELECT COUNT(*) as n FROM reservations WHERE status='paid'`).first(),
      env.DB.prepare(`SELECT COUNT(*) as n FROM contacts WHERE source='import'`).first(),
      env.DB.prepare(`SELECT COUNT(*) as n FROM contact_subscriptions WHERE status='unsubscribed'`).first(),
      env.DB.prepare(`
        SELECT ec.subject, ec.sent_at, COUNT(*) as sent_count
        FROM email_campaigns ec
        JOIN email_logs el ON el.campaign_id = ec.id
        WHERE el.status = 'sent'
        GROUP BY ec.id
        ORDER BY ec.sent_at DESC
        LIMIT 1
      `).first(),
      env.DB.prepare(`SELECT MAX(created_at) as last_import FROM contacts WHERE source='import'`).first(),
    ]);

    return Response.json({
      gaming:          gamingRow?.n ?? 0,
      kodoro_general:  generalRow?.n ?? 0,
      reservations:    reservationsRow?.n ?? 0,
      csv_imports:     csvImportsRow?.n ?? 0,
      unsubscribed:    unsubscribedRow?.n ?? 0,
      last_campaign:   lastCampaignRow
        ? { subject: lastCampaignRow.subject, sent_at: lastCampaignRow.sent_at, sent_count: lastCampaignRow.sent_count }
        : null,
      last_import:     lastImportRow?.last_import ?? null,
    }, { headers: cors });

  } catch (err) {
    console.error('[campaigns-stats]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}
