-- ============================================================
-- Migration v3 — Phase 1 audit monétisation
-- À exécuter dans Supabase SQL Editor APRÈS migration-v2.sql
-- ============================================================

-- ============================================================
-- 1. OtpCode (préparation C5 — validation téléphone SMS)
-- ============================================================
CREATE TABLE IF NOT EXISTS "OtpCode" (
  "id"         TEXT PRIMARY KEY,
  "userId"     TEXT,
  "phone"      TEXT NOT NULL,
  "codeHash"   TEXT NOT NULL,         -- SHA-256 du code, jamais en clair
  "purpose"    TEXT NOT NULL,         -- SIGNUP_PHONE_VERIFY | WITHDRAWAL_CONFIRM | LOGIN_2FA
  "attempts"   INTEGER NOT NULL DEFAULT 0,
  "consumed"   BOOLEAN NOT NULL DEFAULT FALSE,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "OtpCode_phone_purpose_idx" ON "OtpCode"("phone", "purpose");
CREATE INDEX IF NOT EXISTS "OtpCode_expiresAt_idx" ON "OtpCode"("expiresAt");

-- ============================================================
-- 2. Nouveaux réglages tarifaires (configurables admin)
-- ============================================================
INSERT INTO "SiteSetting" ("key", "value", "category", "label", "updatedAt") VALUES
  ('kpay.fee.percent',              '2',     'limits',   'Frais K-Pay refacturés au user (%)',    CURRENT_TIMESTAMP),
  ('withdrawal.daily.cap.unverified', '25000', 'limits',  'Plafond retrait 24h sans KYC (FCFA)',     CURRENT_TIMESTAMP),
  ('withdrawal.daily.cap.verified',  '500000', 'limits',  'Plafond retrait 24h avec KYC (FCFA)',     CURRENT_TIMESTAMP),
  ('signup.otp.required',            'false', 'limits',   'OTP SMS obligatoire à l''inscription',  CURRENT_TIMESTAMP),
  ('withdrawal.otp.required',        'false', 'limits',   'OTP SMS obligatoire pour retrait',         CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- ============================================================
-- 3. Mise à 0 du bonus signup (n'est plus crédité automatiquement)
-- ============================================================
UPDATE "SiteSetting" SET "value" = '0' WHERE "key" = 'referral.bonus.signup';
