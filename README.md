# Espace Ködörö — Site & Tunnel de réservation

Site vitrine + tunnel de réservation gaming avec paiement Stripe.

## Stack

- **Frontend** : React + Vite + TypeScript
- **Backend** : Cloudflare Pages Functions (`functions/api/`)
- **Base de données** : Cloudflare D1 (SQLite)
- **Paiement** : Stripe Checkout API
- **Emails** : Resend
- **Déploiement** : Cloudflare Pages (auto sur push `main`)

## Développement local

```bash
npm install
cp .dev.vars.example .dev.vars   # puis remplir les clés
npx wrangler pages dev dist --d1 DB=kodoro-db
```

Lancer le tunnel Stripe en parallèle :
```bash
stripe listen --forward-to localhost:8788/api/stripe-webhook
```

## Variables d'environnement

À configurer dans `.dev.vars` (local) et dans Cloudflare Pages → Settings → Environment variables (production) :

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe (`whsec_...`) |
| `RESEND_API_KEY` | Clé API Resend (`re_...`) |
| `EMAIL_FROM` | Expéditeur email (`Espace Ködörö <reservations@espace-kodoro.fr>`) |
| `SITE_URL` | URL du site (`https://www.espace-kodoro.fr`) |
| `JWT_SECRET` | Secret JWT pour le dashboard organisateur |

## Base de données

Appliquer les migrations dans l'ordre :

```bash
# Local
sqlite3 <chemin-db-locale> < schema.sql
sqlite3 <chemin-db-locale> < schema-reservations.sql
sqlite3 <chemin-db-locale> < schema-utm-extended.sql

# Production (remote)
npx wrangler d1 execute kodoro-db --remote --file=schema.sql
npx wrangler d1 execute kodoro-db --remote --file=schema-reservations.sql
npx wrangler d1 execute kodoro-db --remote --file=schema-utm-extended.sql
```

## Tunnel de réservation gaming

| Page | Description |
|---|---|
| `/gaming` | Page événement avec boutons de réservation |
| `/reservation-gaming` | Formulaire de réservation multi-étapes |
| `/merci-reservation-gaming` | Page de confirmation post-paiement |

**Liens UTM courts** (redirigent vers `/gaming` avec tracking source) :

| Canal | URL |
|---|---|
| Meta Ads | `espace-kodoro.fr/gaming-m` |
| WhatsApp | `espace-kodoro.fr/gaming-wa` |
| Email | `espace-kodoro.fr/gaming-e` |
| QR code / affiche | `espace-kodoro.fr/gaming-qr` |

## Dashboard organisateur

URL : `/organizer/dashboard`

Onglets : Événements · Inscriptions · Réservations Stripe · Équipe · Site · Organisateurs

## API

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/event-availability?slug=...` | — | Disponibilité événement |
| POST | `/api/create-checkout-session` | — | Créer session Stripe |
| POST | `/api/stripe-webhook` | Stripe | Confirmer paiement |
| GET | `/api/organizer/reservations` | JWT | Liste réservations |
| POST | `/api/organizer/reservations` | JWT | Ajout manuel + email |
| PATCH | `/api/organizer/reservations/:id` | JWT | Modifier réservation |
| DELETE | `/api/organizer/reservations/:id` | JWT | Supprimer réservation |
