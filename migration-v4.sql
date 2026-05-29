-- ============================================================
-- Migration v4 — Phase 2 monétisation (Bump, Sticky, photos gating, vérif payante)
-- À exécuter dans Supabase SQL Editor APRÈS migration-v3.sql
-- ============================================================

-- ============================================================
-- 1. Ad : champs Bump / Sticky 24h
-- ============================================================
ALTER TABLE "Ad"
  ADD COLUMN IF NOT EXISTS "lastBumpedAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "stickyUntil"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "bumpCount"     INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Ad_stickyUntil_idx" ON "Ad"("stickyUntil");
CREATE INDEX IF NOT EXISTS "Ad_lastBumpedAt_idx" ON "Ad"("lastBumpedAt");

-- ============================================================
-- 2. Réglages tarifaires — nouveaux mécanismes
-- ============================================================
INSERT INTO "SiteSetting" ("key", "value", "category", "label", "updatedAt") VALUES
  ('pricing.bump.amount',        '500',   'pricing', 'Prix d''un Bump (remontée 24h)',          CURRENT_TIMESTAMP),
  ('pricing.sticky.amount',      '2000',  'pricing', 'Prix Sticky 24h (top de la ville)',       CURRENT_TIMESTAMP),
  ('pricing.sticky.hours',       '24',    'pricing', 'Durée Sticky en heures',                  CURRENT_TIMESTAMP),
  ('pricing.verification.amount', '3000', 'pricing', 'Prix vérification d''identité (one-shot)', CURRENT_TIMESTAMP),
  ('photos.cap.standard',        '3',     'limits',  'Photos max — Standard',                   CURRENT_TIMESTAMP),
  ('photos.cap.premium',         '5',     'limits',  'Photos max — Premium',                    CURRENT_TIMESTAMP),
  ('photos.cap.vip',             '15',    'limits',  'Photos max — VIP',                        CURRENT_TIMESTAMP),
  ('bump.min.interval.hours',    '6',     'limits',  'Délai minimum entre 2 Bumps (h)',         CURRENT_TIMESTAMP),
  ('expiry.notify.daysBefore',   '3',     'limits',  'Notif renouvellement J-X avant expiration', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
