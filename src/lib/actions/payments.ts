"use server";

import { headers } from "next/headers";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { kpayOneShotPayment, type InitPaymentResult } from "@/lib/kpay-direct";
import { getSettingNumber } from "@/lib/settings";

// =====================================================================
// Helpers
// =====================================================================

async function rl(key: string) {
  const ip = (await headers()).get("x-forwarded-for") ?? "anon";
  return rateLimit(`pay:${key}:${ip}`, { limit: 10, windowMs: 60_000 });
}

function err(msg: string): InitPaymentResult {
  return { ok: false, error: msg };
}

// =====================================================================
// BUMP — 500 FCFA, 24h, cooldown 6h
// =====================================================================

export async function initiateBumpAction(input: {
  adId: string;
  phone: string;
}): Promise<InitPaymentResult> {
  const session = await auth();
  if (!session?.user) return err("Non authentifié");
  if (!(await rl(`bump:${session.user.id}`)).success) return err("Trop de tentatives");

  const ad = await prisma.ad.findUnique({
    where: { id: input.adId },
    select: { ownerId: true, status: true, lastBumpedAt: true, title: true },
  });
  if (!ad || ad.ownerId !== session.user.id) return err("Annonce introuvable");
  if (ad.status !== "ACTIVE") return err("L'annonce doit être ACTIVE");

  const minHours = await getSettingNumber("bump.min.interval.hours", 6);
  if (ad.lastBumpedAt) {
    const elapsed = Date.now() - ad.lastBumpedAt.getTime();
    const minMs = minHours * 3_600_000;
    if (elapsed < minMs) {
      const remaining = Math.ceil((minMs - elapsed) / 3_600_000);
      return err(`Rebump dans ${remaining}h (min ${minHours}h entre 2 Bumps)`);
    }
  }

  const amount = await getSettingNumber("pricing.bump.amount", 500);
  return kpayOneShotPayment({
    userId: session.user.id,
    amount,
    phone: input.phone,
    intent: { type: "BUMP", payload: { adId: input.adId } },
    description: `Bump "${ad.title}"`,
  });
}

// =====================================================================
// STICKY — 2000 FCFA, 24h (cumulable)
// =====================================================================

export async function initiateStickyAction(input: {
  adId: string;
  phone: string;
}): Promise<InitPaymentResult> {
  const session = await auth();
  if (!session?.user) return err("Non authentifié");
  if (!(await rl(`sticky:${session.user.id}`)).success) return err("Trop de tentatives");

  const ad = await prisma.ad.findUnique({
    where: { id: input.adId },
    select: { ownerId: true, status: true, title: true },
  });
  if (!ad || ad.ownerId !== session.user.id) return err("Annonce introuvable");
  if (ad.status !== "ACTIVE") return err("L'annonce doit être ACTIVE");

  const amount = await getSettingNumber("pricing.sticky.amount", 2000);
  const hours = await getSettingNumber("pricing.sticky.hours", 24);
  return kpayOneShotPayment({
    userId: session.user.id,
    amount,
    phone: input.phone,
    intent: { type: "STICKY", payload: { adId: input.adId, hours } },
    description: `Sticky ${hours}h "${ad.title}"`,
  });
}

// =====================================================================
// TIER UPGRADE — Premium / VIP / Diamond
// =====================================================================

export async function initiateTierUpgradeAction(input: {
  adId: string;
  tier: "PREMIUM" | "VIP" | "DIAMOND";
  autoRenew?: boolean;
  phone: string;
}): Promise<InitPaymentResult> {
  const session = await auth();
  if (!session?.user) return err("Non authentifié");
  if (!(await rl(`tier:${session.user.id}`)).success) return err("Trop de tentatives");

  const ad = await prisma.ad.findUnique({
    where: { id: input.adId },
    select: { ownerId: true, status: true, cityId: true, city: { select: { name: true } } },
  });
  if (!ad || ad.ownerId !== session.user.id) return err("Annonce introuvable");

  // I3 — Diamond : 1 slot par ville
  if (input.tier === "DIAMOND") {
    const occupied = await prisma.ad.findFirst({
      where: {
        cityId: ad.cityId,
        tier: "DIAMOND",
        promotedUntil: { gt: new Date() },
        NOT: { id: input.adId },
      },
      select: { id: true },
    });
    if (occupied) {
      return err(`Le slot DIAMOND de ${ad.city.name} est déjà pris. Réessayez plus tard.`);
    }
  }

  const priceKey =
    input.tier === "DIAMOND" ? "pricing.diamond.amount"
    : input.tier === "VIP" ? "pricing.vip.amount"
    : "pricing.premium.amount";
  const daysKey =
    input.tier === "DIAMOND" ? "pricing.diamond.days"
    : input.tier === "VIP" ? "pricing.vip.days"
    : "pricing.premium.days";
  const fallback = input.tier === "DIAMOND" ? 50000 : input.tier === "VIP" ? 15000 : 5000;
  const amount = await getSettingNumber(priceKey, fallback);
  const days = await getSettingNumber(daysKey, 30);

  return kpayOneShotPayment({
    userId: session.user.id,
    amount,
    phone: input.phone,
    intent: {
      type: "TIER_UPGRADE",
      payload: { adId: input.adId, tier: input.tier, days, autoRenew: input.autoRenew },
    },
    description: `${input.tier} ${days}j`,
  });
}

// =====================================================================
// SERVICE PHOTO — 300 FCFA (URL uploadée AVANT le paiement)
// =====================================================================

export async function initiateServicePhotoAction(input: {
  adId: string;
  url: string;
  phone: string;
}): Promise<InitPaymentResult> {
  const session = await auth();
  if (!session?.user) return err("Non authentifié");
  if (!input.url || !input.url.startsWith("http")) return err("URL photo invalide");
  if (!(await rl(`svcphoto:${session.user.id}`)).success) return err("Trop de tentatives");

  const ad = await prisma.ad.findUnique({
    where: { id: input.adId },
    select: { ownerId: true, title: true },
  });
  if (!ad || ad.ownerId !== session.user.id) return err("Annonce introuvable");

  // V10 — Check anti-doublon AVANT de demander le paiement (sinon l'user paie pour rien)
  const { checkPhotoDuplicate } = await import("@/lib/actions/photo-duplicate-check");
  const dup = await checkPhotoDuplicate(input.url, session.user.id);
  if (!dup.ok) return err(dup.reason);

  const amount = await getSettingNumber("pricing.servicePhoto.amount", 300);
  return kpayOneShotPayment({
    userId: session.user.id,
    amount,
    phone: input.phone,
    intent: {
      type: "SERVICE_PHOTO",
      payload: { adId: input.adId, url: input.url, imageHash: dup.imageHash },
    },
    description: `Photo service "${ad.title}"`,
  });
}

// =====================================================================
// VERIFICATION KYC — 3000 FCFA
// =====================================================================

export async function initiateVerificationAction(input: {
  phone: string;
}): Promise<InitPaymentResult> {
  const session = await auth();
  if (!session?.user) return err("Non authentifié");
  if (!(await rl(`verif:${session.user.id}`)).success) return err("Trop de tentatives");

  const amount = await getSettingNumber("pricing.verification.amount", 3000);
  return kpayOneShotPayment({
    userId: session.user.id,
    amount,
    phone: input.phone,
    intent: { type: "VERIFICATION", payload: { userId: session.user.id } },
    description: "Vérification d'identité",
  });
}

// =====================================================================
// REVEAL — 1000 FCFA pour débloquer 1 contact WhatsApp (pay-per-reveal)
// =====================================================================

export async function initiateRevealAction(input: {
  adId: string;
  phone: string;
}): Promise<InitPaymentResult> {
  const session = await auth();
  if (!session?.user) return err("Connectez-vous pour contacter une escort");
  if (!(await rl(`reveal:${session.user.id}`)).success) return err("Trop de tentatives");

  const ad = await prisma.ad.findUnique({
    where: { id: input.adId },
    select: { id: true, status: true },
  });
  if (!ad || ad.status !== "ACTIVE") return err("Annonce introuvable");

  const amount = await getSettingNumber("pricing.reveal.amount", 1000);
  return kpayOneShotPayment({
    userId: session.user.id,
    amount,
    phone: input.phone,
    intent: { type: "REVEAL", payload: { adId: input.adId, userId: session.user.id } },
    description: `Contact escort (${amount} FCFA)`,
  });
}

// =====================================================================
// CLIENT PASS — 1000 FCFA / mois (cumulable 1, 3, 12 mois)
// =====================================================================

export async function initiateClientPassAction(input: {
  months: 1 | 3 | 12;
  phone: string;
}): Promise<InitPaymentResult> {
  const session = await auth();
  if (!session?.user) return err("Non authentifié");
  if (!(await rl(`pass:${session.user.id}`)).success) return err("Trop de tentatives");

  const months = ([1, 3, 12].includes(input.months) ? input.months : 1) as 1 | 3 | 12;
  const monthly = await getSettingNumber("pricing.clientpass.amount", 1000);
  const daysPerMonth = await getSettingNumber("pricing.clientpass.days", 30);
  const amount = monthly * months;
  const days = daysPerMonth * months;

  return kpayOneShotPayment({
    userId: session.user.id,
    amount,
    phone: input.phone,
    intent: {
      type: "CLIENT_PASS",
      payload: { userId: session.user.id, months, days },
    },
    description: `Pass Premium ${months} mois`,
  });
}
