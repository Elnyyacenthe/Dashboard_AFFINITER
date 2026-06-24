import { prisma } from "@/lib/prisma";
import { getSettingNumber } from "@/lib/settings";
import type { EscortSubscriptionTier } from "@prisma/client";

export interface EscortSubStatus {
  tier: EscortSubscriptionTier;
  isActive: boolean;
  until: Date | null;
  daysLeft: number;
  caps: { ads: number; photos: number };
  autoRenew: boolean;
}

/** Lit l'état d'abonnement d'un user (escort). */
export async function getEscortSubscriptionStatus(userId: string): Promise<EscortSubStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      escortSubscriptionTier: true,
      escortSubscriptionUntil: true,
      escortSubscriptionAutoRenew: true,
    },
  });

  const now = new Date();
  const tier = user?.escortSubscriptionTier ?? "NONE";
  const until = user?.escortSubscriptionUntil ?? null;
  const isActive = !!until && until > now && tier !== "NONE";
  const daysLeft = until ? Math.max(0, Math.ceil((until.getTime() - now.getTime()) / 86_400_000)) : 0;

  const caps = isActive ? await getCapsForTier(tier) : { ads: 0, photos: 0 };

  return {
    tier,
    isActive,
    until,
    daysLeft,
    caps,
    autoRenew: user?.escortSubscriptionAutoRenew ?? false,
  };
}

/** Caps photos + annonces pour un tier d'abonnement. */
export async function getCapsForTier(
  tier: EscortSubscriptionTier,
): Promise<{ ads: number; photos: number }> {
  if (tier === "NONE") return { ads: 0, photos: 0 };
  const tierKey = tier.toLowerCase();
  const [ads, photos] = await Promise.all([
    getSettingNumber(`escortSubscription.cap.${tierKey}.ads`, tier === "VIP" ? 999 : tier === "PREMIUM" ? 3 : 1),
    getSettingNumber(`escortSubscription.cap.${tierKey}.photos`, tier === "VIP" ? 50 : tier === "PREMIUM" ? 10 : 3),
  ]);
  return { ads, photos };
}

/**
 * Guard à appeler AVANT la publication d'une annonce.
 * Refuse si pas d'abonnement actif OU si le quota d'annonces actives est atteint.
 */
export async function canEscortPublish(
  userId: string,
): Promise<{ ok: true; status: EscortSubStatus } | { ok: false; reason: string }> {
  const status = await getEscortSubscriptionStatus(userId);
  if (!status.isActive) {
    return {
      ok: false,
      reason: "Vous devez avoir un abonnement actif pour publier une annonce. Souscrivez à un plan (Standard, Premium ou VIP) sur /escort/abonnement.",
    };
  }
  const activeCount = await prisma.ad.count({
    where: {
      ownerId: userId,
      status: { in: ["ACTIVE", "PENDING", "DRAFT", "PAUSED"] },
    },
  });
  if (activeCount >= status.caps.ads) {
    return {
      ok: false,
      reason: `Vous avez atteint la limite de ${status.caps.ads} annonce${status.caps.ads > 1 ? "s" : ""} pour votre abonnement ${status.tier}. Upgradez vers un tier supérieur pour publier plus.`,
    };
  }
  return { ok: true, status };
}
