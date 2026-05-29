# Yamo Dashboard

Espace utilisateur (**escort** + **client**) de la plateforme [Yamo](https://github.com/Elnyyacenthe/YAMO).

> ⚠️ Cette appli partage la **même base de données Supabase** et la **même config Auth.js** que le site public `yamo.cm`. Les trois projets (yamo public / yamo-dashboard / admin) sont déployables séparément.

## 🎯 Ce que cette appli contient

| Espace | Routes | Pour qui |
|--------|--------|----------|
| **Escort** | `/escort/*` | ESCORT — dashboard, annonces, profil, vérification KYC, statistiques, portefeuille, parrainage |
| **Client** | `/client/*` | CLIENT — favoris, portefeuille, parrainage, compte, **devenir escort** |
| **Auth** | `/connexion`, `/inscription` | Tous |
| **Légal** | `/cgu`, `/mentions-legales`, `/confidentialite`, `/rgpd` | Tous |

## 🚫 Ce que cette appli ne contient PAS

- **Pages marketing** (home, recherche, annonce, ville, poster, tarifs, contact) → restent dans [Yamo principal](https://github.com/Elnyyacenthe/YAMO)
- **Interface ADMIN** (modération, utilisateurs, paiements, tarifs, KYC validation, signalements, villes, retraits, statistiques globales) → externe (`yamo.cm/admin` ou app admin dédiée). Si un ADMIN/MODERATOR se connecte ici, il est automatiquement redirigé vers `NEXT_PUBLIC_YAMO_ADMIN_URL`.

## 🛠️ Stack technique

Identique à Yamo :
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + Shadcn/ui + Radix UI
- PostgreSQL + Prisma 6 (adapter pg)
- Auth.js v5 (NextAuth) + bcrypt
- UploadThing pour les uploads
- K-Pay pour les paiements MoMo / Orange Money
- Zod pour la validation

## 🚀 Installation

```powershell
git clone https://github.com/Elnyyacenthe/Dashboard_YAMO.git
cd Dashboard_YAMO
npm install
```

## ⚙️ Configuration `.env`

Crée un fichier `.env` à la racine avec **les mêmes credentials** que le projet Yamo principal (même DB, même Auth secret) :

```env
# Supabase Database (partagée avec Yamo)
DATABASE_URL="postgresql://postgres.PROJECT-REF:PASSWORD@aws-X-region.pooler.supabase.com:5432/postgres"

# Auth.js — MÊME secret que Yamo pour partager les sessions
AUTH_SECRET="your-auth-secret"
AUTH_URL="https://dashboard.yamo.cm"   # En prod, l'URL de ce dashboard
AUTH_TRUST_HOST=true

# UploadThing
UPLOADTHING_TOKEN=""
UPLOADTHING_SECRET=""

# K-Pay
KPAY_BASE_URL="https://admin.kpay.site"
KPAY_API_KEY=""
KPAY_SECRET_KEY=""
KPAY_WEBHOOK_SECRET=""
KPAY_CALLBACK_URL="https://dashboard.yamo.cm/api/webhooks/kpay"

# App
NEXT_PUBLIC_APP_URL="https://dashboard.yamo.cm"
NEXT_PUBLIC_APP_NAME="Yamo"

# URL du site public (utilisée pour les liens "Voir sur yamo.cm")
NEXT_PUBLIC_YAMO_URL="https://yamo.cm"

# URL de l'interface admin externe (si vide → NEXT_PUBLIC_YAMO_URL + "/admin")
NEXT_PUBLIC_YAMO_ADMIN_URL=""
```

## 🗄️ Base de données

La base est **partagée** avec Yamo public. **Ne pas relancer `prisma:push` depuis ce repo** — toute migration du schéma doit être faite depuis le projet Yamo principal pour éviter les conflits.

Pour générer juste le client Prisma localement :

```powershell
npm run prisma:generate
```

## 🏃 Lancer le dashboard

```powershell
npm run dev
```

Par défaut sur <http://localhost:3000>. Si tu lances en parallèle avec le projet Yamo principal, change le port :

```powershell
npm run dev -- -p 3001
```

## 🔐 Comptes de test

(Présents dans la DB partagée, créés par le seed du projet Yamo principal)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@yamo.cm` | `ChangeMe123!` |
| Escort | `escort@yamo.cm` | `Demo1234!` |

## 🚢 Déploiement

Recommandation : déploiement séparé sur Vercel avec un sous-domaine dédié.

| Projet | Domaine | Rôle |
|--------|---------|------|
| Yamo (public) | `yamo.cm` | Marketing, annonces, recherche, inscription |
| Yamo Dashboard | `dashboard.yamo.cm` | Espace logué (admin/escort/client) |

Les sessions Auth.js sont partagées si :
- Le même `AUTH_SECRET` est utilisé
- Le cookie est configuré pour le domaine racine (`.yamo.cm`)

## 📁 Architecture

```
src/app/
├── (auth)/           Connexion, inscription
├── (public)/         Pages légales + redirects (vers /client ou /escort)
├── escort/           Dashboard ESCORT (annonces, KYC, premium, wallet…)
├── client/           Dashboard CLIENT (favoris, wallet, devenir escort…)
└── api/              Webhooks K-Pay, uploadthing, auth
```

> Les ADMIN/MODERATOR sont automatiquement redirigés vers `NEXT_PUBLIC_YAMO_ADMIN_URL` (par défaut : `https://yamo.cm/admin`).

## 🔗 Liens utiles

- [Yamo (site public)](https://github.com/Elnyyacenthe/YAMO)
- [K-Pay Dashboard](https://admin.kpay.site)
- [Supabase Dashboard](https://supabase.com/dashboard)

## 📜 Licence

Code propriétaire. Tous droits réservés.
