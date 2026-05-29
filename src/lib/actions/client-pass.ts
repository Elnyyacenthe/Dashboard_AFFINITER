"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { applyWalletDelta, getSettingNumber } from "@/lib/actions/wallet";
import { hashString } from "@/lib/utils";

// =====================================================================
// I9 — PASS PREMIUM CLIENT (1000 FCFA / mois)
// =====================================================================

/**
 * Souscrit (ou prolonge) le Pass Premium Client.
 * Cumulable : si déjà abonné, ajoute X jours à la durée restante.
 */
export async function subscribeClientPassAction(input: {
  months?: number; // 1 par défaut
}): Promise<{ ok: true; until: Date; charged: number } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non authentifié" };

  const months = Math.max(1, Math.min(12, input.months ?? 1));
  const monthlyPrice = await getSettingNumber("pricing.clientpass.amount", 1000);
  const daysPerMonth = await getSettingNumber("pricing.clientpass.days", 30);
  const total = monthlyPrice * months;
  const days = daysPerMonth * months;

  try {
    await applyWalletDelta({
      userId: session.user.id,
      amount: -total,
      type: "BOOST_PAYMENT",
      description: `Pass Premium Client ${months} mois`,
      reference: `clientpass_${session.user.id}_${Date.now()}`,
      metadata: { type: "CLIENT_PASS", months, days },
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Solde insuffisant. Rechargez votre wallet.",
    };
  }

  // Étend l'expiration (cumul si déjà actif)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clientPassUntil: true },
  });
  const now = new Date();
  const base = user?.clientPassUntil && user.clientPassUntil > now ? user.clientPassUntil : now;
  const newUntil = new Date(base.getTime() + days * 86_400_000);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { clientPassUntil: newUntil },
  });

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      amount: total,
      provider: "WALLET",
      status: "PAID",
      durationDays: days,
      paidAt: now,
      metadata: { type: "CLIENT_PASS", months },
    },
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "Pass Premium activé 💎",
      body: `Vous êtes Pass Premium jusqu'au ${newUntil.toLocaleDateString("fr-FR")}. Révélations WhatsApp illimitées, navigation incognito, accès prioritaire.`,
      link: "/client/pass-premium",
    },
  });

  revalidatePath("/client");
  revalidatePath("/client/pass-premium");
  return { ok: true, until: newUntil, charged: total };
}

// =====================================================================
// REVELATION NUMÉRO — gated par Pass ou par cap quotidien
// =====================================================================

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
 *   - Pass Premium actif → illimité (cap énorme)
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

  // Pour un visiteur non connecté : check par IP
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

  // Pour un user connecté : check Pass Premium puis cap quotidien
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clientPassUntil: true, dailyRevealsCount: true, dailyRevealsResetAt: true },
  });
  if (!user) return { ok: false, error: "Utilisateur introuvable" };

  const isPremium = user.clientPassUntil ? user.clientPassUntil > now : false;
  const cap = isPremium
    ? await getSettingNumber("clientpass.reveals.daily.premium", 999)
    : await getSettingNumber("clientpass.reveals.daily.free", 3);

  // Reset compteur si nouveau jour
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

  // Update compteur + log
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

/**
 * Helper : indique si l'user courant a un Pass Premium Client actif.
 */
export async function isClientPassActive(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clientPassUntil: true },
  });
  return !!user?.clientPassUntil && user.clientPassUntil > new Date();
}
