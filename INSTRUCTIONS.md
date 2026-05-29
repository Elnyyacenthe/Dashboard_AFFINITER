# 🚀 Yamo — Comment démarrer le projet

Le projet est complet sur les 6 phases. Voici la séquence exacte à exécuter dans
**PowerShell** depuis `d:\DEV\yamo` pour le lancer.

---

## ⚡ Démarrage rapide (5 étapes)

### 1️⃣ Installer les dépendances

```powershell
cd d:\DEV\yamo
npm install
```

> Cette étape installe Next.js 15, Prisma, Auth.js, Tailwind, Shadcn/ui, etc.
> Compter 2-3 minutes.

### 2️⃣ Configurer l'environnement

```powershell
Copy-Item .env.example .env
```

Puis ouvrir `.env` et remplir au minimum :

```env
DATABASE_URL="postgresql://postgres:VOTRE_MDP@localhost:5432/yamo"
AUTH_SECRET="<32 caractères aléatoires>"
```

**Générer AUTH_SECRET** (PowerShell) :
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Min 0 -Max 256 }))
```

**Pour PostgreSQL local** :
- Soit installer PostgreSQL.app / pgAdmin
- Soit utiliser Docker : `docker run --name yamo-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`
- Soit utiliser un service gratuit cloud : [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app)

**Pour UploadThing** (uploads de photos) :
1. Créer un compte sur <https://uploadthing.com>
2. Créer une app
3. Copier `UPLOADTHING_TOKEN` et `UPLOADTHING_SECRET` dans `.env`

> 💡 Vous pouvez démarrer sans UploadThing — le projet fonctionnera, mais les uploads de photos retourneront une erreur. Pour la démo, utilisez les URLs Unsplash du seed.

### 3️⃣ Créer la base de données

```powershell
npm run prisma:push      # Crée toutes les tables
npm run prisma:seed      # Insère villes + comptes démo
```

### 4️⃣ Lancer en mode développement

```powershell
npm run dev
```

→ Ouvrir <http://localhost:3000>

### 5️⃣ Se connecter avec les comptes de démo

| Rôle   | URL                                | Email             | Mot de passe    |
| ------ | ---------------------------------- | ----------------- | --------------- |
| Admin  | <http://localhost:3000/connexion>  | `admin@yamo.cm`   | `ChangeMe123!`  |
| Escort | <http://localhost:3000/connexion>  | `escort@yamo.cm`  | `Demo1234!`     |

---

## 🧪 Parcours de test recommandé

### Test 1 — Visiteur (non connecté)
1. <http://localhost:3000> → home avec dégradés, mur d'âge → "J'ai 18+"
2. Section "VIP" → cliquer sur l'annonce démo
3. <http://localhost:3000/ville/douala> → page ville avec SEO
4. <http://localhost:3000/annonce/sandra-massage-douala> → galerie + WhatsApp masqué → "👁" pour révéler
5. <http://localhost:3000/recherche?citySlug=douala&minPrice=10000> → filtres
6. Tenter <http://localhost:3000/escort/dashboard> → redirige `/connexion`
7. Tenter <http://localhost:3000/admin> → redirige `/`

### Test 2 — Escort
1. Login `escort@yamo.cm` / `Demo1234!`
2. <http://localhost:3000/escort/dashboard> → stats (2 annonces démo)
3. <http://localhost:3000/escort/annonces> → liste avec actions (pause / supprimer)
4. <http://localhost:3000/escort/profil> → édition profil
5. <http://localhost:3000/escort/statistiques> → top annonces
6. <http://localhost:3000/escort/premium> → 3 plans
7. Créer une nouvelle annonce via <http://localhost:3000/poster-une-annonce>

### Test 3 — Admin
1. Login `admin@yamo.cm` / `ChangeMe123!`
2. <http://localhost:3000/admin> → vue d'ensemble (utilisateurs, annonces, revenus)
3. <http://localhost:3000/admin/moderation> → approuver l'annonce que vous venez de créer en Test 2
4. <http://localhost:3000/admin/annonces> → toutes les annonces, changer tier en VIP
5. <http://localhost:3000/admin/utilisateurs> → bannir / vérifier
6. <http://localhost:3000/admin/signalements> → signaler une annonce puis la traiter
7. <http://localhost:3000/admin/paiements> → en attendant les paiements

### Test 4 — Signalement (client)
1. En tant que client connecté, visiter une annonce → bouton "Signaler" → choisir motif
2. Login admin → `/admin/signalements` → traiter

### Test 5 — SEO
- <http://localhost:3000/robots.txt>
- <http://localhost:3000/sitemap.xml>

---

## 🩺 Vérifications utiles

### Voir la base de données graphiquement

```powershell
npm run prisma:studio
```

→ <http://localhost:5555>

### Type-check & lint

```powershell
npx tsc --noEmit
npm run lint
```

### Build de production

```powershell
npm run build
npm start
```

---

## 🔧 Si quelque chose ne marche pas

### Erreur "DATABASE_URL not found"
→ `.env` manque. `Copy-Item .env.example .env` et remplir.

### Erreur "Can't reach database server"
→ PostgreSQL n'est pas lancé, ou `DATABASE_URL` incorrect. Tester :
```powershell
psql -U postgres -h localhost
```

### Erreur Prisma "@prisma/client did not initialize"
```powershell
npm run prisma:generate
```

### Erreur Auth "MissingSecret"
→ `AUTH_SECRET` manque dans `.env`.

### Photos d'upload ne s'affichent pas
→ Configurer UploadThing (étape 2). Pour démo seule, supprimer le formulaire d'upload de `ad-form.tsx`.

### Port 3000 occupé
```powershell
npm run dev -- -p 3001
```

---

## 📦 Déploiement (production)

### Recommandé : Vercel + Neon

1. Push le code sur GitHub
2. Importer le repo sur <https://vercel.com>
3. Créer une DB sur <https://neon.tech>
4. Variables Vercel :
   - `DATABASE_URL` (de Neon)
   - `AUTH_SECRET` (généré)
   - `AUTH_URL` (= URL Vercel)
   - `AUTH_TRUST_HOST=true`
   - `UPLOADTHING_TOKEN`
   - `UPLOADTHING_SECRET`
5. Deploy

### Migration en production

```powershell
npm run prisma:migrate -- --name init
git push
```

---

## ✅ Ce qui est livré

| Phase | Statut | Fichiers principaux |
| ----- | ------ | ------------------- |
| Phase 1 — Config | ✅ | `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts` |
| Phase 1 — Prisma | ✅ | `prisma/schema.prisma`, `prisma/seed.ts` |
| Phase 2 — Auth | ✅ | `src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`, `src/lib/actions/auth.ts` |
| Phase 2 — Layout | ✅ | `src/app/layout.tsx`, `Header`, `Footer`, `AgeGate` |
| Phase 3 — Public | ✅ | Home, `/ville/[slug]`, `/annonce/[slug]`, `/recherche`, `/poster-une-annonce`, `/villes` |
| Phase 4 — Escort | ✅ | `/escort/dashboard`, `/annonces`, `/profil`, `/statistiques`, `/premium` |
| Phase 5 — Admin | ✅ | `/admin`, `/moderation`, `/annonces`, `/utilisateurs`, `/signalements`, `/paiements`, `/statistiques`, `/reglages` |
| Phase 6 — Légal + Money | ✅ | `/tarifs`, `/mentions-legales`, `/cgu`, `/confidentialite`, `/rgpd`, `/contact`, paiements manuels |

---

## 🎯 Étapes suivantes (à votre demande)

1. **Édition d'annonce** : recyclage de `AdForm` avec données pré-remplies + action `updateAdAction`
2. **Intégration MTN MoMo / Orange Money** : webhook `/api/webhooks/momo` + appel `markPaymentPaidAction`
3. **Vérification d'identité** : nouvelle route UploadThing + workflow admin
4. **Notifications email** : Resend / Postmark pour transactionnel
5. **Rate limiting Redis** : remplacer `lib/rate-limit.ts` mémoire par Upstash

Demandez et j'implémente. 🚀
