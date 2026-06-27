// POST /api/passes/create-checkout
// Body : { first_name, last_name, email, phone? }
// Crée (ou met à jour) un contact, ouvre une session Stripe Checkout pour
// l'achat d'un Pass Gaming Trimestre (20 €), et enregistre un paiement pending.
// Retourne { url } vers laquelle rediriger l'utilisateur.

import Stripe from 'stripe';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const PASS_AMOUNT_CENTS = 2000; // 20 €

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corps de requête invalide' }, { status: 400, headers: cors });
  }

  const first_name = (body.first_name ?? '').trim();
  const last_name = (body.last_name ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const phone = (body.phone ?? '').trim() || null;

  if (!first_name || !last_name || !email) {
    return Response.json({ error: 'Prénom, nom et email sont requis' }, { status: 400, headers: cors });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Adresse email invalide' }, { status: 400, headers: cors });
  }

  // ── 1. Upsert contact par email ────────────────────────────────────────────
  let contact;
  try {
    await env.DB.prepare(`
      INSERT INTO contacts (email, first_name, last_name, phone, source)
      VALUES (?, ?, ?, ?, 'pass_gaming')
      ON CONFLICT(email) DO UPDATE SET
        first_name = COALESCE(excluded.first_name, first_name),
        last_name  = COALESCE(excluded.last_name,  last_name),
        phone      = COALESCE(excluded.phone,       phone),
        updated_at = datetime('now')
    `).bind(email, first_name, last_name, phone).run();

    contact = await env.DB.prepare('SELECT id FROM contacts WHERE email = ?').bind(email).first();
  } catch (err) {
    console.error('[passes/create-checkout] upsert contact:', err);
    return Response.json({ error: 'Erreur lors de la création du contact' }, { status: 500, headers: cors });
  }

  if (!contact) {
    return Response.json({ error: 'Erreur lors de la création du contact' }, { status: 500, headers: cors });
  }

  // ── 2. Créer la session Stripe Checkout ────────────────────────────────────
  const siteUrl = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');

  let session;
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });

    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: PASS_AMOUNT_CENTS,
          product_data: {
            name: 'Pass Gaming Trimestre — Espace Ködörö',
            description: 'Accès aux soirées gaming pendant 3 mois (réservation requise à chaque soirée)',
          },
        },
        quantity: 1,
      }],
      metadata: {
        project:        'kodoro',
        product_type:   'gaming_pass',
        pass_type:      'quarterly',
        duration_months: '3',
        customer_email: email,
        contact_id:     String(contact.id),
      },
      success_url: `${siteUrl}/pass-gaming/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/pass-gaming`,
    });
  } catch (err) {
    console.error('[passes/create-checkout] Stripe session create:', err);
    return Response.json(
      { error: 'Impossible de créer la session de paiement. Réessayez dans quelques instants.' },
      { status: 502, headers: cors }
    );
  }

  // ── 3. Enregistrer un paiement pending ─────────────────────────────────────
  try {
    await env.DB.prepare(`
      INSERT INTO payments (contact_id, payment_provider, provider_payment_id, amount, currency, status)
      VALUES (?, 'stripe', ?, ?, 'eur', 'pending')
    `).bind(contact.id, session.id, PASS_AMOUNT_CENTS).run();
  } catch (err) {
    console.error('[passes/create-checkout] insert payment:', err);
    // Non bloquant : le webhook recréera/mettra à jour le paiement si besoin.
  }

  return Response.json({ url: session.url }, { headers: cors });
}
