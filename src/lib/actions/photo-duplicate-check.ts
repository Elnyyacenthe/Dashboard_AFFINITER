"use server";

import { prisma } from "@/lib/prisma";
import { computeImageHash, hammingDistance, DUPLICATE_THRESHOLD } from "@/lib/image-hash";

export type DuplicateCheckResult =
  | { ok: true; imageHash: string }
  | { ok: false; reason: string; conflictAdId?: string; distance?: number };

/**
 * Vérifie qu'une nouvelle photo (URL ou Buffer) n'est pas un doublon visuel
 * d'une photo déjà publiée par un AUTRE utilisateur.
 *
 * Si match : renvoie { ok: false } avec la raison + l'adId en conflit.
 * Si OK : renvoie { ok: true, imageHash } à stocker sur le Media créé.
 *
 * Le `ownerUserId` est exclu du check (l'user a le droit de réutiliser ses propres
 * photos sur plusieurs annonces).
 */
export async function checkPhotoDuplicate(
  imageUrl: string,
  ownerUserId: string,
): Promise<DuplicateCheckResult> {
  let imageHash: string;
  try {
    imageHash = await computeImageHash(imageUrl);
  } catch (e) {
    // En cas d'erreur de hash, on autorise (anti-faux-positif)
    console.error("computeImageHash failed:", e);
    return { ok: true, imageHash: "" };
  }

  // 1. Match exact (lookup index, O(1))
  const exact = await prisma.media.findFirst({
    where: {
      imageHash,
      ad: { ownerId: { not: ownerUserId } },
    },
    select: { id: true, adId: true, ad: { select: { ownerId: true } } },
  });
  if (exact) {
    return {
      ok: false,
      reason: "Cette photo est déjà publiée sur Affinité par un autre annonceur.",
      conflictAdId: exact.adId,
      distance: 0,
    };
  }

  // 2. Match approximatif (Hamming distance) — pre-fetch des hash récents
  //    Limite à 5000 pour rester sub-seconde même sur une grosse base.
  if (imageHash) {
    const recent = await prisma.media.findMany({
      where: {
        imageHash: { not: null },
        ad: { ownerId: { not: ownerUserId } },
      },
      select: { id: true, adId: true, imageHash: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    for (const m of recent) {
      if (!m.imageHash) continue;
      const d = hammingDistance(imageHash, m.imageHash);
      if (d <= DUPLICATE_THRESHOLD) {
        return {
          ok: false,
          reason: `Cette photo ressemble fortement à une autre déjà publiée sur Affinité (similarité ${Math.round(((64 - d) / 64) * 100)}%).`,
          conflictAdId: m.adId,
          distance: d,
        };
      }
    }
  }

  return { ok: true, imageHash };
}
