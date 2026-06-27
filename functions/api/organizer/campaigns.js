// GET  /api/organizer/campaigns  → liste des campagnes
// POST /api/organizer/campaigns  → créer et envoyer une campagne (batch Resend)

import { requireAuth } from '../_auth.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const LIST_SENDERS = {
  gaming:         { email: 'gaming@espace-kodoro.fr',     name: 'Espace Ködörö Gaming' },
  evenements:     { email: 'evenements@espace-kodoro.fr', name: 'Espace Ködörö' },
  yoga:           { email: 'evenements@espace-kodoro.fr', name: 'Espace Ködörö' },
  kodoro_general: { email: 'evenements@espace-kodoro.fr', name: 'Espace Ködörö' },
  reservations:   { email: 'gaming@espace-kodoro.fr',     name: 'Espace Ködörö Gaming' },
};

const UNSUB_LABELS = {
  gaming:         'soirées gaming',
  evenements:     'événements Espace Ködörö',
  yoga:           'cours de yoga',
  kodoro_general: 'actualités Espace Ködörö',
  reservations:   'soirées gaming',
};

// ── Template email branded ────────────────────────────────────────────────────
function wrapInTemplate({ content, subject, siteUrl, unsubHtml }) {
  // Convertit le texte brut (sauts de ligne) en paragraphes HTML si nécessaire
  const body = content.includes('<') ? content
    : content.split(/\n{2,}/).map(p => `<p style="margin:0 0 1rem;color:#6B5D52;font-size:0.95rem;line-height:1.75;">${p.replace(/\n/g, '<br>')}</p>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F4EFE4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE4;padding:2rem 1rem;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid rgba(95,54,54,0.12);">

        <tr>
          <td style="background:#5F3636;padding:1.5rem 2rem;text-align:center;">
            <p style="margin:0 0 0.2rem;font-size:0.65rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(244,239,228,0.55);">Espace Ködörö · Caussade</p>
            <p style="margin:0;font-size:1.1rem;font-weight:700;color:#F4EFE4;letter-spacing:-0.01em;">${subject}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:2rem;">
            ${body}
          </td>
        </tr>

        <tr>
          <td style="background:#F4EFE4;padding:1.25rem 2rem;text-align:center;border-top:1px solid rgba(95,54,54,0.08);">
            <p style="margin:0 0 0.5rem;font-size:0.7rem;color:#9B8F89;">
              Espace Ködörö · 25 boulevard Didier Rey · 82300 Caussade
            </p>
            <p style="margin:0;font-size:0.7rem;color:#9B8F89;">
              <a href="${siteUrl}" style="color:#9B8F89;text-decoration:none;">espace-kodoro.fr</a>
            </p>
            ${unsubHtml}
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  try {
    const { results } = await env.DB.prepare(`
      SELECT ec.*, o.name AS created_by_name,
        (SELECT COUNT(*) FROM email_logs el WHERE el.campaign_id = ec.id AND el.status = 'sent')   AS sent_count,
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

  const sender  = LIST_SENDERS[list_name] ?? LIST_SENDERS.gaming;
  const siteUrl = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');

  // Récupérer les destinataires selon la liste
  let contacts;
  if (list_name === 'reservations') {
    // Directement depuis la table reservations (tous les payés, sans opt-in requis)
    const { results } = await env.DB.prepare(`
      SELECT id, email, customer_name AS first_name, NULL AS unsubscribe_token
      FROM reservations
      WHERE status = 'paid'
      GROUP BY email
    `).all();
    contacts = results;
  } else {
    const { results } = await env.DB.prepare(`
      SELECT c.id, c.email, c.first_name, cs.unsubscribe_token
      FROM contacts c
      JOIN contact_subscriptions cs ON cs.contact_id = c.id
      WHERE cs.list_name = ? AND cs.status = 'subscribed'
    `).bind(list_name).all();
    contacts = results;
  }

  if (contacts.length === 0) {
    return Response.json({ error: 'Aucun destinataire trouvé pour cette liste' }, { status: 400, headers: cors });
  }

  // Mode preview — retourner le nombre de destinataires sans envoyer
  if (preview_only) {
    return Response.json({ preview: true, recipient_count: contacts.length, sender }, { headers: cors });
  }

  // Créer la campagne en base
  const { meta } = await env.DB.prepare(`
    INSERT INTO email_campaigns (list_name, subject, html_content, sender_email, sender_name, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(list_name, subject, html_content, sender.email, sender.name, payload.id).run();

  const campaignId = meta.last_row_id;
  const unsubLabel = UNSUB_LABELS[list_name] ?? 'nos communications';

  // Construire le HTML final avec template branded + footer désinscription
  function buildHtml(contact) {
    let unsubHtml = '';
    if (list_name !== 'reservations' && contact.unsubscribe_token) {
      const unsubLink = `${siteUrl}/api/unsubscribe?t=${encodeURIComponent(contact.unsubscribe_token)}&l=${encodeURIComponent(list_name)}`;
      unsubHtml = `<p style="margin:0.5rem 0 0;font-size:0.7rem;color:#9B8F89;">
        Vous recevez cet email car vous êtes inscrit(e) aux ${unsubLabel} de l'Espace Ködörö. ·
        <a href="${unsubLink}" style="color:#9B8F89;">Se désinscrire</a>
      </p>`;
    }
    return wrapInTemplate({ content: html_content, subject, siteUrl, unsubHtml });
  }

  // ── Envoi en batch (100 max par appel Resend) ─────────────────────────────
  const BATCH_SIZE = 90; // marge de sécurité sous la limite Resend
  let sentCount   = 0;
  let failedCount = 0;
  const logs = []; // { contact_id, email, status, resend_email_id, error }

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);

    const payload_batch = batch.map(c => ({
      from:    `${sender.name} <${sender.email}>`,
      to:      [c.email],
      subject,
      html:    buildHtml(c),
    }));

    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(payload_batch),
      });

      if (res.ok) {
        const data = await res.json(); // { data: [{ id }, ...] }
        const ids  = data.data ?? [];
        batch.forEach((c, idx) => {
          logs.push({ contact_id: c.id, email: c.email, status: 'sent', resend_email_id: ids[idx]?.id ?? null, error: null });
          sentCount++;
        });
      } else {
        const errText = await res.text();
        console.error('[campaigns] Resend batch error:', res.status, errText);
        batch.forEach(c => {
          logs.push({ contact_id: c.id, email: c.email, status: 'failed', resend_email_id: null, error: errText.slice(0, 500) });
          failedCount++;
        });
      }
    } catch (err) {
      console.error('[campaigns] Batch fetch error:', err);
      batch.forEach(c => {
        logs.push({ contact_id: c.id, email: c.email, status: 'failed', resend_email_id: null, error: err.message });
        failedCount++;
      });
    }
  }

  // Insérer tous les logs en une seule fois (batch D1)
  const logStmt = env.DB.prepare(
    `INSERT INTO email_logs (campaign_id, contact_id, email, status, resend_email_id, error) VALUES (?, ?, ?, ?, ?, ?)`
  );
  await env.DB.batch(logs.map(l => logStmt.bind(campaignId, l.contact_id, l.email, l.status, l.resend_email_id, l.error)));

  // Marquer la campagne comme envoyée
  await env.DB.prepare(`UPDATE email_campaigns SET sent_at = datetime('now') WHERE id = ?`).bind(campaignId).run();

  return Response.json({
    success: true,
    campaign_id: campaignId,
    sent:   sentCount,
    failed: failedCount,
    total:  contacts.length,
  }, { headers: cors });
}
