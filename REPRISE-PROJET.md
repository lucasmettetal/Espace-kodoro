# 🔄 Fiche de reprise — Site « Espace Ködörö »

> Ce document résume tout le projet pour reprendre le travail dans le nouveau dossier
> (hors OneDrive) ou dans une nouvelle session Claude. Lis-le en premier.

---

## 🎯 Objectif

Site **vitrine one-page** pour **Espace Ködörö** (association loi 1901) : lieu de **coworking +
cabinet de soin partagé (thérapeutes) + événements** à Caussade (82).
**But final :** site en ligne + un **CMS** permettant au client (non-développeur) de gérer
lui-même **événements / photos / dates** sans toucher au code.

**Stack retenue :** React (Vite) + GitHub + **Sveltia CMS** + **Cloudflare Pages** (hébergement) + **OVH** (domaine).

---

## ⚠️ IMPORTANT — pourquoi on a déplacé le projet

Le projet était dans **OneDrive**, ce qui cassait Git (`fatal: mmap failed: Invalid argument`)
au moment du `git push`. **Ne JAMAIS remettre le projet dans OneDrive.** Le garder sur un
disque local normal (ex. `C:\dev\kodoro`).

👉 Un dossier temporaire `C:\Temp\kodoropush` a peut-être été créé pendant un essai : **inutile, à supprimer.**

---

## 🧰 Stack technique

- **React 18 + TypeScript**, **Vite 6** (`npm run dev` → http://localhost:5173)
- **react-router** (v7) pour les pages (accueil + pages légales)
- **Framer Motion** (`motion/react`) pour les animations
- Styles surtout **inline** (`style={{}}`) ; Tailwind v4 présent mais peu utilisé
- Build : `npm run build` → dossier **`dist`**

---

## 📌 Informations clés du projet (à réutiliser partout)

| Donnée | Valeur |
|---|---|
| Nom | **Espace Ködörö** |
| Forme juridique | **Association loi 1901** |
| SIREN | **848 786 265** |
| Responsable publication | **Christelle Mettetal** |
| Adresse | 25 boulevard Didier Rey, 82300 Caussade, France |
| Email | **espacekodoro@gmail.com** |
| Facebook | https://www.facebook.com/espacekodoro |
| Instagram | https://www.instagram.com/espace_kodoro/ |
| Formspree (formulaire) | ID **`xlgkeqzg`** (endpoint `https://formspree.io/f/xlgkeqzg`) |
| GitHub | https://github.com/lucasmettetal/Espace-kodoro.git |
| Domaine (OVH) | probable **espace-kodoro.fr** (à confirmer) |
| Logo | `public/logo.jpg` (et `public/favicon.jpg`) — affiché en rond |
| Photo accueil | `public/hero.jpg` |
| Photo cabinet zen | `public/espacezen.jpg` |

---

## ✅ Ce qui a été fait

- **Page d'accueil (Hero)** refaite : **grande image plein écran** (`/hero.jpg`) + voile sombre
  dégradé + titre blanc à gauche (fini l'écran coupé en deux).
- **Barre de navigation** toujours visible (fond crème opaque, plus de transparence).
- **Logo officiel** intégré (header, footer, favicon), affiché rond (`border-radius:50%`).
- **Email** `espacekodoro@gmail.com` partout. **Facebook + Instagram** à jour.
- **Cabinet Zen** : vraie photo (`/espacezen.jpg`) dans la section « Nos espaces ».
- **Formulaire de contact Formspree activé** (ID `xlgkeqzg`).
- **Pictogrammes** du bloc contact réalignés (centrés verticalement).
- **Routing** mis en place (`react-router`) :
  - `/` → page d'accueil
  - `/mentions-legales`
  - `/politique-de-confidentialite`
- **Pages légales** créées et remplies (association, SIREN, Christelle Mettetal, RGPD + mention Formspree).
- **`.gitignore`** créé (exclut `node_modules/` et `dist/`).
- **`public/_redirects`** créé (nécessaire pour que les pages marchent une fois en ligne).

### Fichiers principaux modifiés / créés
```
index.html                              (favicon jpg, email gmail)
.gitignore                              (nouveau)
public/logo.jpg, favicon.jpg            (logo officiel)
public/hero.jpg, espacezen.jpg          (vraies photos)
public/_redirects                       (nouveau)
src/main.tsx                            (BrowserRouter)
src/app/App.tsx                         (Routes)
src/app/components/Navigation.tsx       (logo 60px, nav opaque)
src/app/components/Hero.tsx             (image plein écran)
src/app/components/Footer.tsx           (logo, réseaux, liens légaux)
src/app/components/Contact.tsx          (Formspree, email, alignement)
src/app/components/Spaces.tsx           (photo cabinet zen)
src/app/pages/LegalLayout.tsx           (nouveau, gabarit pages légales)
src/app/pages/MentionsLegales.tsx       (nouveau)
src/app/pages/Confidentialite.tsx       (nouveau)
```

---

## 🔵 État Git (À VÉRIFIER dans le nouveau dossier)

- Remote `origin` = `https://github.com/lucasmettetal/Espace-kodoro.git`, branche **main**.
- Un commit local a été créé : **`f2bcec8` — "Refonte accueil, logo, photos, pages legales et formulaire"**
- ⚠️ **Ce commit n'a PAS encore été poussé** (le push échouait à cause de OneDrive).

**À faire en priorité dans le nouveau dossier :**
```bash
git log --oneline -1          # doit afficher f2bcec8 ... (sinon, voir ci-dessous)
git status                    # doit être propre
git push origin main          # devrait MAINTENANT fonctionner (hors OneDrive)
```
> Si `git log` ne montre pas le commit (le `.git` n'a pas été copié) :
> `git add -A` puis `git commit -m "Refonte accueil, logo, photos, pages legales et formulaire"` puis `git push origin main`.
> Si `node_modules/` n'a pas été copié : lancer **`npm install`** d'abord.

---

## 🚀 Prochaines étapes (dans l'ordre)

### Phase A — Mettre le site en ligne
1. **Pousser sur GitHub** (`git push origin main`).
2. **Cloudflare Pages** (compte déjà créé) → connecter le repo GitHub `Espace-kodoro`.
   Réglages de build :
   - **Framework preset :** Vite
   - **Build command :** `npm run build`
   - **Output directory :** `dist`
3. Cloudflare publie → adresse `…pages.dev` de test.
4. **Brancher le domaine OVH** (espace-kodoro.fr) sur Cloudflare Pages (config DNS — se faire guider).
5. Une fois l'hébergeur connu (Cloudflare), **compléter la mention « hébergeur »** dans
   `src/app/pages/MentionsLegales.tsx` (seul champ encore en orange).

### Phase B — Le CMS (Sveltia)
6. **Externaliser les événements** : sortir le tableau `events` de `src/app/components/Events.tsx`
   vers des fichiers de contenu (Markdown/JSON) que le code lira. *(fondation du CMS)*
7. Ajouter **Sveltia CMS** : page `/admin` (`public/admin/index.html` + `public/admin/config.yml`).
8. Mettre en place l'**authentification GitHub** via un **Cloudflare Worker** (`sveltia-cms-auth`)
   + une **GitHub OAuth App**. → le client pourra éditer les événements depuis `/admin`.

---

## 📝 Points encore en attente / à compléter

- [ ] **Mentions légales** : nom + adresse de l'**hébergeur** (sera Cloudflare) — seul `[à compléter]` restant.
- [ ] **Tester Formspree** : envoyer un 1er message depuis le site → confirmer le mail reçu de Formspree
      (active définitivement la réception sur espacekodoro@gmail.com).
- [ ] **Durée de conservation RGPD** fixée à **3 ans** par défaut (valeur CNIL) — à confirmer par le client.
- [ ] **Vraies photos** pour le coworking et les événements (remplacer les dernières images de banque
      éventuelles ; vérifier les `src` Unsplash restants dans `Spaces.tsx` / `Services.tsx`).
- [ ] **Instagram** : lien OK ; ajouter une vraie `og:image` dans `index.html` (partage réseaux sociaux).

---

## 🎨 Préférences design validées par le client

- Page d'accueil : **image plein écran** (pas l'écran coupé en deux).
- Barre du haut **toujours visible** (pas de transparence qui la fait disparaître).
- **Logo rond**, plus gros en haut.

---

## 💻 Commandes utiles
```bash
npm install        # installer les dépendances (si besoin)
npm run dev        # lancer en local → http://localhost:5173
npm run build      # build de production → dossier dist/
```
