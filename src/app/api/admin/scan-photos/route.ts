import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeImageHash, hammingDistance, DUPLICATE_THRESHOLD } from "@/lib/image-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — scan complet peut être long

/**
 * Scan rétroactif des photos sans imageHash.
 *
 * Mode :
 *   - GET ?action=hash → calcule les hashes manquants par batch de 50.
 *     Retourne le nombre restant (pour relance jusqu'à 0).
 *   - GET ?action=detect → ne hash pas, mais regroupe les médias par
 *     similarité (Hamming distance) et retourne les clusters de doublons.
 *
 * Auth : ADMIN uniquement.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "hash";

  if (action === "hash") {
    return await hashBatch();
  }
  if (action === "detect") {
    return await detectDuplicates();
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function hashBatch() {
  const BATCH = 50;
  const items = await prisma.media.findMany({
    where: { type: "PHOTO", imageHash: null },
    select: { id: true, url: true },
    take: BATCH,
    orderBy: { createdAt: "desc" },
  });

  let hashed = 0;
  let failed = 0;
  for (const m of items) {
    try {
      const hash = await computeImageHash(m.url);
      await prisma.media.update({
        where: { id: m.id },
        data: { imageHash: hash },
      });
      hashed++;
    } catch (e) {
      console.error(`hash failed for media ${m.id}:`, e);
      failed++;
    }
  }

  const remaining = await prisma.media.count({
    where: { type: "PHOTO", imageHash: null },
  });

  return NextResponse.json({ ok: true, hashed, failed, remaining, batchSize: BATCH });
}

interface Cluster {
  representative: { mediaId: string; adId: string; url: string };
  duplicates: Array<{ mediaId: string; adId: string; url: string; distance: number }>;
}

async function detectDuplicates() {
  const all = await prisma.media.findMany({
    where: { type: "PHOTO", imageHash: { not: null } },
    select: {
      id: true,
      url: true,
      imageHash: true,
      adId: true,
      ad: { select: { ownerId: true, title: true } },
    },
    take: 10_000,
    orderBy: { createdAt: "desc" },
  });

  const clusters: Cluster[] = [];
  const grouped = new Set<string>();

  for (let i = 0; i < all.length; i++) {
    const m = all[i];
    if (grouped.has(m.id) || !m.imageHash) continue;
    const cluster: Cluster = {
      representative: { mediaId: m.id, adId: m.adId, url: m.url },
      duplicates: [],
    };
    for (let j = i + 1; j < all.length; j++) {
      const n = all[j];
      if (grouped.has(n.id) || !n.imageHash) continue;
      // Owners différents → potentielle fraude
      if (n.ad.ownerId === m.ad.ownerId) continue;
      const d = hammingDistance(m.imageHash, n.imageHash);
      if (d <= DUPLICATE_THRESHOLD) {
        cluster.duplicates.push({ mediaId: n.id, adId: n.adId, url: n.url, distance: d });
        grouped.add(n.id);
      }
    }
    if (cluster.duplicates.length > 0) {
      clusters.push(cluster);
      grouped.add(m.id);
    }
  }

  return NextResponse.json({
    ok: true,
    totalPhotosScanned: all.length,
    clustersFound: clusters.length,
    clusters,
  });
}
