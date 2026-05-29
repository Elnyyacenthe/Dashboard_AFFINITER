-- ============================================================
-- Migration v6 — Pass Premium Client (I9) + tracking reveals
-- À exécuter APRÈS migration-v5.sql
-- ============================================================

-- ============================================================
-- 1. User : abonnement Pass Premium Client
-- ============================================================
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "clientPassUntil"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dailyRevealsCount"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dailyRevealsResetAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_clientPassUntil_idx" ON "User"("clientPassUntil");

-- ============================================================
-- 2. NumberReveal : trace les révélations de WhatsApp (analytics + anti-spam)
-- ============================================================
CREATE TABLE IF NOT EXISTS "NumberReveal" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT,
  "adId"      TEXT NOT NULL,
  "ipHash"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "NumberReveal_userId_createdAt_idx"
  ON "NumberReveal"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "NumberReveal_adId_idx" ON "NumberReveal"("adId");

ALTER TABLE "NumberReveal"
  ADD CONSTRAINT "NumberReveal_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NumberReveal"
  ADD CONSTRAINT "NumberReveal_adId_fkey"
  FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 3. Réglages tarifaires Pass Client
-- ============================================================
INSERT INTO "SiteSetting" ("key", "value", "category", "label", "updatedAt") VALUES
  ('pricing.clientpass.amount',          '1000', 'pricing', 'Prix Pass Premium Client / mois (FCFA)',  CURRENT_TIMESTAMP),
  ('pricing.clientpass.days',            '30',   'pricing', 'Durée Pass Client (jours)',               CURRENT_TIMESTAMP),
  ('clientpass.reveals.daily.free',      '3',    'limits',  'Révélations WhatsApp gratuites / jour',   CURRENT_TIMESTAMP),
  ('clientpass.reveals.daily.premium',   '999',  'limits',  'Révélations WhatsApp Pass Premium / jour',CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
