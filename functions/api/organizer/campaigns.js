// GET  /api/organizer/campaigns          → liste des campagnes
// POST /api/organizer/campaigns          → créer et envoyer une campagne

import { requireAuth } from '../_auth.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const LIST_SENDERS = {
  gaming:          { email: 'gaming@espace-kodoro.fr',       name: 'Espace Ködörö Gaming' },
  evenements:      { email: 'evenements@espace-kodoro.fr',   name: 'Espace Ködörö' },
  yoga:            { email: 'evenements@espace-kodoro.fr',   name: 'Espace Ködörö' },
  kodoro_general:  { email: 'evenements@espace-kodoro.fr',   name: 'Espace Ködörö' },
};

const UNSUB_LABELS = {
  gaming:     'soirées gaming',
  evenements: 'événements Espace Ködörö',
  yoga:       'cours de yoga',
  kodoro_general: 'actualités Espace Ködörö',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  try {
    const { results } = await env.DB.prepare(`
      SELECT ec.*, o.name AS created_by_name,
        (SELECT COUNT(*) FROM email_logs el WHERE el.campaign_id = ec.id AND el.status = 'sent') AS sent_count,
        (SELECT COUNT(*) FROM email_logs el WHERE el.campaign_id = ec.id AND el.status = 'failed') AS failed_count
      FROM email_campaigns ec
      LEFT JOIN organizers o ON o.id = ec.created_by
      ORDER BY ec.created_at DESC
    `).all();
    return Response.json({ campaigns: results }, { headers: cors });
  } catch (err) {
    console.error('[campaigns GET]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

export async function onRequestPost({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  const { list_name, subject, html_content, preview_only } = await request.json();

  if (!list_name || !subject || !html_content) {
    return Response.json({ error: 'list_name, subject et html_content sont requis' }, { status: 400, headers: cors });
  }

  if (!env.RESEND_API_KEY) {
    return Response.json({ error: 'RESEND_API_KEY non configurée' }, { status: 500, headers: cors });
  }

  const sender = LIST_SENDERS[list_name] ?? LIST_SENDERS.gaming;
  const siteUrl = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');

  // Récupérer les contacts abonnés
  const { results: contacts } = await env.DB.prepare(`
    SELECT c.id, c.email, c.first_name, cs.unsubscribe_token
    FROM contacts c
    JOIN contact_subscriptions cs ON cs.contact_id = c.id
    WHERE cs.list_name = ? AND cs.status = 'subscribed'
  `).bind(list_name).all();

  if (contacts.length === 0) {
    return Response.json({ error: 'Aucun contact abonné à cette liste' }, { status: 400, headers: cors });
  }

  // Mode preview : retourner le nombre de destinataires sans envoyer
  if (preview_only) {
    return Response.json({ preview: true, recipient_count: contacts.length, sender }, { headers: cors });
  }

  // Créer la campagne en base
  const { meta } = await env.DB.prepare(`
    INSERT INTO email_campaigns (list_name, subject, html_content, sender_email, sender_name, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(list_name, subject, html_content, sender.email, sender.name, payload.id).run();

  const campaignId = meta.last_row_id;

  // Envoyer les emails un par un
  let sentCount = 0;
  let failedCount = 0;

  for (const contact of contacts) {
    const unsubLabel = UNSUB_LABELS[list_name] ?? 'nos communications';
    const unsubLink  = `${siteUrl}/api/unsubscribe?t=${encodeURIComponent(contact.unsubscribe_token)}&l=${encodeURIComponent(list_name)}`;

    // Injecter le footer de désinscription dans le HTML
    const footer = `
      <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #eee;font-size:0.75rem;color:#999;font-family:Arial,sans-serif;text-align:center;">
        Vous recevez cet email car vous êtes inscrit(e) aux ${unsubLabel} de l'Espace Ködörö.<br>
        <a href="${unsubLink}" style="color:#999;">Se désinscrire</a>
      </div>`;

    const finalHtml = html_content.includes('</body>')
      ? html_content.replace('</body>', `${footer}</body>`)
      : html_content + footer;

    const firstName = contact.first_name ? ` ${contact.first_name}` : '';

    let resendId = null;
    let status   = 'sent';
    let error    = null;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    `${sender.name} <${sender.email}>`,
          to:      [contact.email],
          subject,
          html:    finalHtml,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        resendId = data.id ?? null;
        sentCount++;
      } else {
        const errText = await res.text();
        status  = 'failed';
        error   = errText.slice(0, 500);
        failedCount++;
        console.error(`[campaigns] Resend error for ${contact.email}:`, errText);
      }
    } catch (err) {
      status  = 'failed';
      error   = err.message;
      failedCount++;
    }

    // Logger l'envoi
    await env.DB.prepare(`
      INSERT INTO email_logs (campaign_id, contact_id, email, status, resend_email_id, error)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(campaignId, contact.id, contact.email, status, resendId, error).run();
  }

  // Marquer la campagne comme envoyée
  await env.DB.prepare(
    `UPDATE email_campaigns SET sent_at = datetime('now') WHERE id = ?`
  ).bind(campaignId).run();

  return Response.json({
    success: true,
    campaign_id: campaignId,
    sent: sentCount,
    failed: failedCount,
    total: contacts.length,
  }, { headers: cors });
}
