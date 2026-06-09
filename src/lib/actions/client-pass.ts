"use server";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSettingNumber } from "@/lib/settings";
import { hashString } from "@/lib/utils";

// =====================================================================
// I10 — REVELATION NUMÉRO (gated par Pass Premium ou cap quotidien)
// =====================================================================
//
// Note v2 : la souscription au Pass Premium se fait maintenant via
// `initiateClientPassAction` (paiement K-Pay direct one-shot, dans payments.ts).
// Ce fichier ne garde QUE la logique de révélation.

interface RevealResult {
  ok: true;
  phone: string;
  isPremium: boolean;
  remaining: number;
}

interface RevealError {
  ok: false;
  error: string;
  upsell?: { freeUsed: number; freeCap: number };
}

/**
 * Révèle le numéro WhatsApp d'une annonce.
 *
 * Règles :
 *   - Pass Premium actif → cap énorme (illimité de facto)
 *   - Sans Pass : 3 révélations / jour (configurable)
 *   - Reset quotidien à minuit (par user)
 *   - Visiteur non connecté : 1 révélation / jour par IP
 */
export async function revealNumberAction(
  adId: string,
): Promise<RevealResult | RevealError> {
  const session = await auth();
  const ip = (await headers()).get("x-forwarded-for") ?? "anon";
  const ipHash = await hashString(ip);

  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    select: { id: true, whatsappPhone: true, status: true },
  });
  if (!ad || ad.status !== "ACTIVE") {
    return { ok: false, error: "Annonce introuvable" };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Visiteur non connecté : check par IP
  if (!session?.user) {
    const revealsToday = await prisma.numberReveal.count({
      where: { ipHash, createdAt: { gte: todayStart } },
    });
    const freeCapAnon = await getSettingNumber("clientpass.reveals.daily.anon", 1);
    if (revealsToday >= freeCapAnon) {
      return {
        ok: false,
        error: "Limite quotidienne atteinte. Créez un compte pour révéler plus de numéros.",
        upsell: { freeUsed: revealsToday, freeCap: freeCapAnon },
      };
    }
    await prisma.numberReveal.create({ data: { adId, ipHash } });
    await prisma.ad.update({ where: { id: adId }, data: { whatsappClicks: { increment: 1 } } });
    return {
      ok: true,
      phone: ad.whatsappPhone,
      isPremium: false,
      remaining: freeCapAnon - revealsToday - 1,
    };
  }

  // User connecté : check Pass Premium puis cap quotidien
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clientPassUntil: true, dailyRevealsCount: true, dailyRevealsResetAt: true },
  });
  if (!user) return { ok: false, error: "Utilisateur introuvable" };

  const isPremium = user.clientPassUntil ? user.clientPassUntil > now : false;
  const cap = isPremium
    ? await getSettingNumber("clientpass.reveals.daily.premium", 999)
    : await getSettingNumber("clientpass.reveals.daily.free", 3);

  let count = user.dailyRevealsCount;
  if (!user.dailyRevealsResetAt || user.dailyRevealsResetAt < todayStart) {
    count = 0;
  }

  if (count >= cap) {
    return {
      ok: false,
      error: isPremium
        ? "Limite quotidienne atteinte (cap technique)."
        : `Limite gratuite atteinte (${cap}/jour). Passez en Pass Premium pour révéler sans limite.`,
      upsell: { freeUsed: count, freeCap: cap },
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { dailyRevealsCount: count + 1, dailyRevealsResetAt: now },
    }),
    prisma.numberReveal.create({
      data: { userId: session.user.id, adId, ipHash },
    }),
    prisma.ad.update({
      where: { id: adId },
      data: { whatsappClicks: { increment: 1 } },
    }),
  ]);

  return {
    ok: true,
    phone: ad.whatsappPhone,
    isPremium,
    remaining: cap - count - 1,
  };
}

/** Helper : indique si l'user courant a un Pass Premium Client actif. */
export async function isClientPassActive(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clientPassUntil: true },
  });
  return !!user?.clientPassUntil && user.clientPassUntil > new Date();
}
