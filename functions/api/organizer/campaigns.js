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
  // Convertit le texte brut en HTML propre si pas de balises
  const body = content.includes('<')
    ? content
    : content
        .split(/\n{2,}/)
        .map(block => {
          const trimmed = block.trim();
          if (!trimmed) return '';
          // Détecter les listes numérotées (1. texte)
          if (/^\d+\.\s/.test(trimmed)) {
            const items = trimmed.split(/\n/).filter(l => l.trim());
            return `<ol style="margin:0 0 1.25rem;padding-left:1.5rem;">${items.map(li => `<li style="margin-bottom:0.4rem;color:#333;font-size:15px;line-height:1.7;">${li.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ol>`;
          }
          // Détecter les listes à tirets
          if (/^[-•]\s/.test(trimmed)) {
            const items = trimmed.split(/\n/).filter(l => l.trim());
            return `<ul style="margin:0 0 1.25rem;padding-left:1.5rem;">${items.map(li => `<li style="margin-bottom:0.4rem;color:#333;font-size:15px;line-height:1.7;">${li.replace(/^[-•]\s*/, '')}</li>`).join('')}</ul>`;
          }
          return `<p style="margin:0 0 1.25rem;color:#333;font-size:15px;line-height:1.75;">${trimmed.replace(/\n/g, '<br>')}</p>`;
        })
        .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0ebe3;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#3d1f1f;padding:28px 40px;text-align:center;border-radius:4px 4px 0 0;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);font-weight:500;">Espace Ködörö · Caussade</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">${subject.replace(/^\[TEST\]\s*/, '')}</p>
          </td>
        </tr>

        <!-- Accent bar -->
        <tr><td style="background:#c9a700;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 28px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f7f3ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d5;border-radius:0 0 4px 4px;">
            <p style="margin:0 0 4px;font-size:12px;color:#999;line-height:1.5;">
              Espace Ködörö · 25 boulevard Didier Rey · 82300 Caussade
            </p>
            <p style="margin:0;font-size:12px;color:#999;">
              <a href="${siteUrl}" style="color:#999;text-decoration:underline;">espace-kodoro.fr</a>
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

  const { list_name, subject, html_content, preview_only, test_email } = await request.json();

  if (!list_name || !subject || !html_content) {
    return Response.json({ error: 'list_name, subject et html_content sont requis' }, { status: 400, headers: cors });
  }
  if (!env.RESEND_API_KEY) {
    return Response.json({ error: 'RESEND_API_KEY non configurée' }, { status: 500, headers: cors });
  }

  const sender  = LIST_SENDERS[list_name] ?? LIST_SENDERS.gaming;
  const siteUrl = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');

  // ── Mode test : envoyer à une seule adresse ───────────────────────────────
  if (test_email) {
    const html = wrapInTemplate({
      content: html_content,
      subject: `[TEST] ${subject}`,
      siteUrl,
      unsubHtml: `<p style="margin:12px 0 0;font-size:11px;color:#bbb;">— Ceci est un email de test —</p>`,
    });
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${sender.name} <${sender.email}>`, reply_to: env.EMAIL_REPLY_TO ?? 'espacekodoro@gmail.com', to: [test_email], subject: `[TEST] ${subject}`, html }),
    });
    if (res.ok) {
      return Response.json({ test: true, sent_to: test_email }, { headers: cors });
    }
    const err = await res.text();
    return Response.json({ error: `Resend error: ${err}` }, { status: 500, headers: cors });
  }

  // Récupérer les destinataires — toutes les listes passent par contact_subscriptions
  const { results: contacts } = await env.DB.prepare(`
    SELECT c.id, c.email, c.first_name, cs.unsubscribe_token
    FROM contacts c
    JOIN contact_subscriptions cs ON cs.contact_id = c.id
    WHERE cs.list_name = ? AND cs.status = 'subscribed' AND c.email IS NOT NULL
  `).bind(list_name).all();

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
    if (contact.unsubscribe_token) {
      const unsubLink = `${siteUrl}/api/unsubscribe?t=${encodeURIComponent(contact.unsubscribe_token)}&l=${encodeURIComponent(list_name)}`;
      unsubHtml = `<p style="margin:12px 0 0;font-size:11px;color:#bbb;line-height:1.5;">
        Vous recevez cet email car vous êtes inscrit(e) aux ${unsubLabel} de l'Espace Ködörö.<br>
        <a href="${unsubLink}" style="color:#bbb;text-decoration:underline;">Se désinscrire</a>
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

    const replyTo = env.EMAIL_REPLY_TO ?? 'espacekodoro@gmail.com';
    const payload_batch = batch.map(c => ({
      from:     `${sender.name} <${sender.email}>`,
      reply_to: replyTo,
      to:       [c.email],
      subject,
      html:     buildHtml(c),
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
