// POST /api/stripe-webhook
// Reçoit les événements Stripe, confirme les paiements en base, et envoie
// un email de confirmation au client via Resend.
//
// Variables d'environnement nécessaires :
//   STRIPE_SECRET_KEY      → clé secrète Stripe (sk_test_... ou sk_live_...)
//   STRIPE_WEBHOOK_SECRET  → secret webhook Stripe (whsec_...)
//   RESEND_API_KEY         → clé API Resend (re_...)
//   EMAIL_FROM             → adresse d'expéditeur vérifiée (ex: reservations@espace-kodoro.fr)
//   SITE_URL               → https://www.espace-kodoro.fr
//
// Configuration webhook Stripe :
//   Developers → Webhooks → Add endpoint
//   URL    : https://www.espace-kodoro.fr/api/stripe-webhook
//   Events : checkout.session.completed + checkout.session.expired
//
// Pour tester en local :
//   stripe listen --forward-to localhost:8788/api/stripe-webhook

import Stripe from 'stripe';

// ── Upsert contact + abonnement ───────────────────────────────────────────────
async function upsertContact(env, { email, first_name, last_name, phone, list_name }) {
  try {
    // Créer ou ignorer le contact
    await env.DB.prepare(`
      INSERT INTO contacts (email, first_name, last_name, phone, source)
      VALUES (?, ?, ?, ?, 'reservation')
      ON CONFLICT(email) DO UPDATE SET
        first_name = COALESCE(excluded.first_name, first_name),
        last_name  = COALESCE(excluded.last_name,  last_name),
        phone      = COALESCE(excluded.phone,       phone),
        updated_at = datetime('now')
    `).bind(email, first_name, last_name, phone).run();

    const contact = await env.DB.prepare('SELECT id FROM contacts WHERE email = ?').bind(email).first();
    if (!contact) return;

    // Générer un token de désinscription unique
    const token = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO contact_subscriptions (contact_id, list_name, status, unsubscribe_token)
      VALUES (?, ?, 'subscribed', ?)
      ON CONFLICT(contact_id, list_name) DO UPDATE SET
        status           = CASE WHEN status = 'unsubscribed' THEN status ELSE 'subscribed' END,
        unsubscribe_token = CASE WHEN unsubscribe_token IS NULL THEN excluded.unsubscribe_token ELSE unsubscribe_token END
    `).bind(contact.id, list_name, token).run();

    console.log(`[webhook] Contact ${email} abonné à la liste "${list_name}"`);
  } catch (err) {
    console.error('[webhook] upsertContact error:', err);
  }
}

// ── Formatage date FR ─────────────────────────────────────────────────────────
function formatEventDateFr(isoDate) {
  if (!isoDate) return '';
  const MOIS  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  const d     = new Date(isoDate + 'T12:00:00');
  const jour  = JOURS[d.getDay()];
  return `${jour.charAt(0).toUpperCase() + jour.slice(1)} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTimeFr(time) {
  if (!time) return '';
  return time.replace(':00', 'h').replace(':', 'h');
}

// ── Email HTML de confirmation ────────────────────────────────────────────────
function buildConfirmationEmail({ customerName, quantity, participants, eventTitle, eventDate, startTime, endTime, location, amountEuros, siteUrl }) {
  const participantList = participants.length > 0
    ? `<ul style="margin:0.5rem 0 0;padding-left:1.25rem;color:#5F3636;">${participants.map(p => `<li>${p.full_name}${p.is_minor ? ` <span style="color:#E65100;font-size:0.85em;">(mineur)</span>` : ''}</li>`).join('')}</ul>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4EFE4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE4;padding:2rem 1rem;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid rgba(95,54,54,0.12);">

        <!-- Header -->
        <tr>
          <td style="background:#5F3636;padding:2rem;text-align:center;">
            <p style="margin:0 0 0.25rem;font-size:0.7rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(244,239,228,0.6);">Espace Ködörö — Caussade</p>
            <h1 style="margin:0;font-size:1.6rem;font-weight:700;color:#F4EFE4;">Votre réservation est <em style="color:#C9A700;font-style:italic;">confirmée</em></h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:2rem;">
            <p style="margin:0 0 1.25rem;color:#5F3636;font-size:1rem;">Bonjour ${customerName},</p>
            <p style="margin:0 0 1.5rem;color:#6B5D52;line-height:1.75;">
              Votre paiement a bien été reçu et votre réservation est confirmée.
              Nous avons hâte de vous accueillir !
            </p>

            <!-- Récap événement -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7EF;border:1px solid rgba(95,54,54,0.1);margin-bottom:1.5rem;">
              <tr><td style="padding:1.25rem;">
                <p style="margin:0 0 0.75rem;font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#C9A700;">Détails de votre réservation</p>
                <table cellpadding="0" cellspacing="0">
                  ${[
                    ['Événement', `${eventTitle ?? 'Le Lobby'} — Espace Ködörö`],
                    ['Date',      eventDate],
                    ['Horaire',   `${startTime} – ${endTime}`],
                    ['Lieu',      location],
                    ['Places',    `${quantity} place${quantity > 1 ? 's' : ''}`],
                    ['Montant',   `${amountEuros} €`],
                  ].map(([label, value]) => `
                  <tr>
                    <td style="padding:0.3rem 1rem 0.3rem 0;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#9B8F89;white-space:nowrap;vertical-align:top;">${label}</td>
                    <td style="padding:0.3rem 0;font-size:0.9rem;color:#5F3636;font-weight:500;">${value}</td>
                  </tr>`).join('')}
                </table>
                ${participantList ? `<p style="margin:1rem 0 0.25rem;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#9B8F89;">Participants</p>${participantList}` : ''}
              </td></tr>
            </table>

            <!-- Infos pratiques -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border:1px solid rgba(201,167,0,0.25);margin-bottom:1.5rem;">
              <tr><td style="padding:1rem 1.25rem;">
                <p style="margin:0 0 0.5rem;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:#C9A700;">Informations pratiques</p>
                <ul style="margin:0;padding-left:1.25rem;color:#7A6200;font-size:0.875rem;line-height:1.75;">
                  <li>Présentez-vous à l'accueil dès 20h</li>
                  <li>Si vous apportez du matériel, merci de le signaler à l'entrée</li>
                  <li>Les mineurs de moins de 15 ans doivent être accompagnés d'un adulte</li>
                </ul>
              </td></tr>
            </table>

            <p style="margin:0 0 1.5rem;color:#6B5D52;font-size:0.875rem;line-height:1.75;">
              Une question ? Contactez-nous à
              <a href="mailto:gaming.kodoro@gmail.com" style="color:#5F3636;">gaming.kodoro@gmail.com</a>
            </p>

            <p style="margin:0;color:#6B5D52;font-size:0.875rem;">
              À très bientôt,<br>
              <strong style="color:#5F3636;">L'équipe de l'Espace Ködörö</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F4EFE4;padding:1.25rem;text-align:center;border-top:1px solid rgba(95,54,54,0.08);">
            <p style="margin:0;font-size:0.7rem;color:#9B8F89;">
              Espace Ködörö · 25 boulevard Didier Rey · 82300 Caussade<br>
              <a href="${siteUrl}" style="color:#9B8F89;">espace-kodoro.fr</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Envoi via Resend ──────────────────────────────────────────────────────────
async function sendConfirmationEmail({ env, to, customerName, reservation, participants, event }) {
  if (!env.RESEND_API_KEY) {
    console.warn('[stripe-webhook] RESEND_API_KEY non configurée — email non envoyé.');
    return;
  }

  const siteUrl     = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');
  const from        = env.EMAIL_FROM ?? 'Espace Ködörö <onboarding@resend.dev>';
  const amountEuros = reservation.amount_cents ? (reservation.amount_cents / 100).toFixed(2) : '?';
  const eventTitle  = event?.title ?? 'Le Lobby';
  const eventDate   = event?.event_date ? formatEventDateFr(event.event_date) : 'Prochaine soirée';
  const startTime   = event?.start_time ? formatTimeFr(event.start_time) : '20h';
  const endTime     = event?.end_time   ? formatTimeFr(event.end_time)   : '23h';
  const location    = event?.location   ?? 'Espace Ködörö — Caussade';

  const html = buildConfirmationEmail({
    customerName,
    quantity: reservation.quantity,
    participants,
    eventTitle,
    eventDate,
    startTime,
    endTime,
    location,
    amountEuros,
    siteUrl,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from,
      reply_to: env.EMAIL_REPLY_TO ?? 'gaming.kodoro@gmail.com',
      to:      [to],
      subject: `Réservation confirmée — ${eventTitle} · Espace Ködörö`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[stripe-webhook] Resend error:', res.status, err);
  } else {
    console.log('[stripe-webhook] Email de confirmation envoyé à', to);
  }
}

// ── Email de confirmation Pass Gaming ─────────────────────────────────────────
async function sendPassConfirmationEmail(env, { to, customerName, expiresAt }) {
  if (!env.RESEND_API_KEY) return;
  const siteUrl = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');
  const from = env.EMAIL_FROM ?? 'Espace Ködörö <reservations@espace-kodoro.fr>';
  const expiresFormatted = new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#f0ebe3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe3;padding:32px 16px;">
    <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;">
      <tr><td style="background:#3d1f1f;padding:28px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Espace Ködörö · Caussade</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Votre Pass Gaming est actif 🎮</p>
      </td></tr>
      <tr><td style="background:#c9a700;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:36px 40px;">
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Bonjour ${customerName},</p>
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Votre <strong>Pass Gaming Trimestre</strong> est maintenant actif. Il vous permet de participer aux soirées gaming classiques de l'Espace Ködörö pendant 3 mois.</p>
        <table style="background:#fbf7ef;border:1px solid #e8e0d5;width:100%;margin-bottom:20px;" cellpadding="0" cellspacing="0">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c9a700;">Détails du pass</p>
            <p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Type :</strong> Pass Gaming Trimestre</p>
            <p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Valable jusqu'au :</strong> ${expiresFormatted}</p>
            <p style="margin:0;font-size:14px;color:#5f3636;"><strong>Montant payé :</strong> 20 €</p>
          </td></tr>
        </table>
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Pensez simplement à <strong>réserver votre place</strong> pour chaque soirée afin que nous puissions organiser la salle et le matériel.</p>
        <p style="margin:0;color:#333;font-size:15px;line-height:1.75;">À bientôt,<br><strong style="color:#5f3636;">Lucas — Espace Ködörö</strong></p>
      </td></tr>
      <tr><td style="background:#f7f3ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d5;">
        <p style="margin:0;font-size:12px;color:#999;">Espace Ködörö · 25 boulevard Didier Rey · 82300 Caussade</p>
        <p style="margin:4px 0 0;font-size:12px;color:#999;"><a href="${siteUrl}" style="color:#999;">espace-kodoro.fr</a></p>
      </td></tr>
    </table></td></tr>
  </table></body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, reply_to: env.EMAIL_REPLY_TO ?? 'gaming.kodoro@gmail.com', to: [to], subject: 'Votre Pass Gaming est actif 🎮', html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[stripe-webhook] Resend pass error:', res.status, err);
    }
  } catch (err) {
    console.error('[stripe-webhook] sendPassConfirmationEmail:', err);
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  // 1. Corps brut obligatoire pour la vérification de signature Stripe
  const rawBody   = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Signature Stripe manquante', { status: 400 });
  }

  // 2. Vérifier la signature
  let stripeEvent;
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
    stripeEvent  = await stripe.webhooks.constructEventAsync(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] Signature invalide:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 3. Traiter les événements
  try {
    switch (stripeEvent.type) {

      case 'checkout.session.completed': {
        const session       = stripeEvent.data.object;

        // ── Pass Gaming Trimestre ────────────────────────────────────────────
        if (session.metadata?.product_type === 'gaming_pass') {
          const contactId = parseInt(session.metadata.contact_id);
          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + 3);
          const expiresAtSql = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

          // Idempotence : ne pas recréer un pass si la session a déjà été traitée
          const existing = await env.DB.prepare(
            'SELECT id FROM gaming_passes WHERE stripe_session_id = ?'
          ).bind(session.id).first();

          if (existing) {
            console.log(`[stripe-webhook] Pass déjà créé pour la session ${session.id}.`);
            break;
          }

          // Créer le pass
          const passResult = await env.DB.prepare(`
            INSERT INTO gaming_passes (contact_id, pass_type, status, starts_at, expires_at, stripe_session_id)
            VALUES (?, 'quarterly', 'active', datetime('now'), ?, ?)
          `).bind(contactId, expiresAtSql, session.id).run();

          const passId = passResult.meta.last_row_id;

          // Mettre à jour le paiement (créé en pending lors du checkout)
          const updated = await env.DB.prepare(`
            UPDATE payments SET status='paid', paid_at=datetime('now'), pass_id=?, contact_id=?
            WHERE provider_payment_id=? AND payment_provider='stripe'
          `).bind(passId, contactId, session.id).run();

          // Si aucun paiement pending n'existait (cas limite), en créer un payé
          if (!updated.meta.changes) {
            await env.DB.prepare(`
              INSERT INTO payments (contact_id, pass_id, payment_provider, provider_payment_id, amount, currency, status, paid_at)
              VALUES (?, ?, 'stripe', ?, ?, 'eur', 'paid', datetime('now'))
            `).bind(contactId, passId, session.id, session.amount_total ?? 2000).run();
          }

          console.log(`[stripe-webhook] Pass Gaming ${passId} activé pour le contact ${contactId}.`);

          // Email de confirmation du pass
          const contact = await env.DB.prepare(
            'SELECT email, first_name, last_name FROM contacts WHERE id = ?'
          ).bind(contactId).first();

          if (contact?.email) {
            const customerName = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
              || session.metadata.customer_email || 'à toi';
            await sendPassConfirmationEmail(env, {
              to: contact.email,
              customerName,
              expiresAt: expiresAt.toISOString(),
            });
          }
          break;
        }

        // ── Réservation à l'unité ────────────────────────────────────────────
        const reservationId = session.metadata?.reservation_id;

        if (!reservationId) {
          console.error('[stripe-webhook] Pas de reservation_id dans metadata:', session.id);
          break;
        }

        // Marquer la réservation comme payée — idempotent via WHERE status='pending'
        const updateResult = await env.DB.prepare(`
          UPDATE reservations
          SET status = 'paid', stripe_payment_intent = ?, amount_cents = ?, updated_at = datetime('now')
          WHERE id = ? AND status = 'pending'
        `).bind(session.payment_intent ?? null, session.amount_total ?? null, reservationId).run();

        // Webhook relivré : réservation déjà traitée → on s'arrête ici
        if (!updateResult.meta.changes) {
          console.log(`[stripe-webhook] Réservation ${reservationId} déjà traitée — webhook ignoré.`);
          break;
        }

        console.log(`[stripe-webhook] Réservation ${reservationId} marquée paid.`);

        // Récupérer la réservation et ses participants pour l'email
        const reservation = await env.DB.prepare(
          'SELECT * FROM reservations WHERE id = ?'
        ).bind(reservationId).first();

        if (reservation) {
          const { results: participants } = await env.DB.prepare(
            'SELECT full_name, is_minor, age FROM participants WHERE reservation_id = ?'
          ).bind(reservationId).all();

          const event = await env.DB.prepare(
            'SELECT * FROM events WHERE id = ?'
          ).bind(reservation.event_id).first();

          const firstName = reservation.customer_name?.split(' ')[0] ?? null;
          const lastName  = reservation.customer_name?.split(' ').slice(1).join(' ') || null;

          // Abonnement "reservations" systématique (opt-out disponible pour les campagnes)
          await upsertContact(env, {
            email:      reservation.email,
            first_name: firstName,
            last_name:  lastName,
            phone:      reservation.phone ?? null,
            list_name:  'reservations',
          });

          // Abonnement "gaming" en plus si consentement newsletter
          if (reservation.newsletter_consent) {
            await upsertContact(env, {
              email:      reservation.email,
              first_name: firstName,
              last_name:  lastName,
              phone:      reservation.phone ?? null,
              list_name:  'gaming',
            });
          }

          await sendConfirmationEmail({
            env,
            to:           reservation.email,
            customerName: reservation.customer_name,
            reservation,
            participants: participants ?? [],
            event,
          });
        }
        break;
      }

      case 'checkout.session.expired': {
        const session       = stripeEvent.data.object;
        const reservationId = session.metadata?.reservation_id;
        if (reservationId) {
          await env.DB.prepare(`
            UPDATE reservations SET status = 'cancelled', updated_at = datetime('now')
            WHERE id = ? AND status = 'pending'
          `).bind(reservationId).run();
          console.log(`[stripe-webhook] Réservation ${reservationId} annulée (session expirée).`);
        }
        break;
      }

      case 'charge.refunded':
        console.log('[stripe-webhook] Remboursement reçu — traitement manuel requis.');
        break;

      default:
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook] Erreur:', err);
    return new Response('Erreur serveur', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status:  200,
    headers: { 'Content-Type': 'application/json' },
  });
}
