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

// ── Email HTML de confirmation ────────────────────────────────────────────────
function buildConfirmationEmail({ customerName, quantity, participants, eventDate, startTime, endTime, location, amountEuros, siteUrl }) {
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
                    ['Événement', 'Soirée Gaming — Espace Ködörö'],
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
              <a href="mailto:espacekodoro@gmail.com" style="color:#5F3636;">espacekodoro@gmail.com</a>
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
async function sendConfirmationEmail({ env, to, customerName, reservation, participants }) {
  if (!env.RESEND_API_KEY) {
    console.warn('[stripe-webhook] RESEND_API_KEY non configurée — email non envoyé.');
    return;
  }

  const siteUrl    = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');
  const from       = env.EMAIL_FROM ?? 'Espace Ködörö <onboarding@resend.dev>';
  const amountEuros = reservation.amount_cents ? (reservation.amount_cents / 100).toFixed(2) : '?';

  const html = buildConfirmationEmail({
    customerName,
    quantity:     reservation.quantity,
    participants,
    eventDate:    'Vendredi 26 juin 2026',
    startTime:    '20h',
    endTime:      '23h',
    location:     'Espace Ködörö — Caussade',
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
      to:      [to],
      subject: `Réservation confirmée — Soirée Gaming du 26 juin · Espace Ködörö`,
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
        const reservationId = session.metadata?.reservation_id;

        if (!reservationId) {
          console.error('[stripe-webhook] Pas de reservation_id dans metadata:', session.id);
          break;
        }

        // Marquer la réservation comme payée
        await env.DB.prepare(`
          UPDATE reservations
          SET status = 'paid', stripe_payment_intent = ?, amount_cents = ?, updated_at = datetime('now')
          WHERE id = ? AND status = 'pending'
        `).bind(session.payment_intent ?? null, session.amount_total ?? null, reservationId).run();

        console.log(`[stripe-webhook] Réservation ${reservationId} marquée paid.`);

        // Récupérer la réservation et ses participants pour l'email
        const reservation = await env.DB.prepare(
          'SELECT * FROM reservations WHERE id = ?'
        ).bind(reservationId).first();

        if (reservation) {
          const { results: participants } = await env.DB.prepare(
            'SELECT full_name, is_minor, age FROM participants WHERE reservation_id = ?'
          ).bind(reservationId).all();

          await sendConfirmationEmail({
            env,
            to:           reservation.email,
            customerName: reservation.customer_name,
            reservation,
            participants: participants ?? [],
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
