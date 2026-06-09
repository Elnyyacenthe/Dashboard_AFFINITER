"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { adSchema, adFilterSchema, type AdFilter } from "@/lib/validations/ad";
import { rateLimit, RL } from "@/lib/rate-limit";
import { slugify, hashString } from "@/lib/utils";
import { getSettingNumber } from "@/lib/settings";

const PER_PAGE = 24;

/** Recherche paginée avec filtres. Server-only. */
export async function searchAds(filter: AdFilter) {
  const parsed = adFilterSchema.parse(filter);

  // Construction du filtre profile en une seule passe (évite l'écrasement)
  const profileFilter: Prisma.EscortProfileWhereInput = {};
  if (parsed.verified) profileFilter.isVerified = true;
  if (parsed.gender) profileFilter.gender = parsed.gender;
  if (parsed.minAge !== undefined || parsed.maxAge !== undefined) {
    profileFilter.age = {
      ...(parsed.minAge !== undefined && { gte: parsed.minAge }),
      ...(parsed.maxAge !== undefined && { lte: parsed.maxAge }),
    };
  }

  const priceFilter: Prisma.IntFilter = {};
  if (parsed.minPrice !== undefined) priceFilter.gte = parsed.minPrice;
  if (parsed.maxPrice !== undefined) priceFilter.lte = parsed.maxPrice;

  const where: Prisma.AdWhereInput = {
    status: "ACTIVE",
    ...(parsed.q && {
      OR: [
        { title: { contains: parsed.q, mode: "insensitive" } },
        { description: { contains: parsed.q, mode: "insensitive" } },
      ],
    }),
    ...(parsed.citySlug && { city: { slug: parsed.citySlug } }),
    ...(Object.keys(priceFilter).length > 0 && { price: priceFilter }),
    ...(parsed.service && { services: { has: parsed.service } }),
    ...(Object.keys(profileFilter).length > 0 && { profile: profileFilter }),
  };

  // Tri global Phase 2 :
  //   1. Sticky en cours en premier (stickyUntil > now)
  //   2. Tier (VIP > PREMIUM > STANDARD)
  //   3. Bump récent (lastBumpedAt récent prioritaire)
  //   4. Critère secondaire (popularité, prix, date)
  const orderBy: Prisma.AdOrderByWithRelationInput[] = (() => {
    const head: Prisma.AdOrderByWithRelationInput[] = [
      { stickyUntil: { sort: "desc", nulls: "last" } },
      { tier: "desc" },
      { lastBumpedAt: { sort: "desc", nulls: "last" } },
    ];
    switch (parsed.sort) {
      case "price_asc":  return [...head, { price: "asc" }];
      case "price_desc": return [...head, { price: "desc" }];
      case "popular":    return [...head, { views: "desc" }];
      default:           return [...head, { publishedAt: "desc" }];
    }
  })();

  const [items, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: {
        city: { select: { name: true, slug: true } },
        media: { select: { url: true, isPrimary: true, type: true }, orderBy: { position: "asc" } },
        profile: { select: { isVerified: true, age: true } },
      },
      orderBy,
      skip: (parsed.page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.ad.count({ where }),
  ]);

  return { items, total, page: parsed.page, perPage: PER_PAGE, pages: Math.ceil(total / PER_PAGE) };
}

// ─────────────────────────────────────────────────────────────────────
// CRUD annonces — server actions appelées depuis le formulaire
// ─────────────────────────────────────────────────────────────────────

export type AdActionState =
  | { ok: true; adId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Crée une annonce (status PENDING — passe en modération). */
export async function createAdAction(
  _prev: AdActionState | null,
  formData: FormData,
): Promise<AdActionState> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Vous devez être connecté(e)" };

  const ip = (await headers()).get("x-forwarded-for") ?? session.user.id;
  const rl = await rateLimit(`ad-create:${ip}`, RL.adCreate);
  if (!rl.success) return { ok: false, error: "Limite atteinte : 3 annonces par heure" };

  // Seuls les ESCORT (et ADMIN pour les tests) peuvent publier
  if (session.user.role !== "ESCORT" && session.user.role !== "ADMIN") {
    return {
      ok: false,
      error: "Seuls les comptes Escort peuvent publier des annonces. Convertissez votre compte d'abord.",
    };
  }

  // Construction de l'objet brut depuis FormData
  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    cityId: formData.get("cityId"),
    neighborhood: formData.get("neighborhood") || undefined,
    price: formData.get("price"),
    priceNight: formData.get("priceNight") || undefined,
    whatsappPhone: formData.get("whatsappPhone"),
    callPhone: formData.get("callPhone") || undefined,
    services: formData.getAll("services").map(String),
    incall: formData.get("incall") === "on",
    outcall: formData.get("outcall") === "on",
    age: formData.get("age"),
    gender: formData.get("gender") || "FEMALE",
    acceptAdult: formData.get("acceptAdult") === "on",
  };
  const parsed = adSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Formulaire invalide",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  // S'assurer qu'un EscortProfile existe pour cet user
  let profile = await prisma.escortProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    profile = await prisma.escortProfile.create({
      data: {
        userId: session.user.id,
        displayName: session.user.name ?? "Escort",
        slug: `${slugify(session.user.name ?? "escort")}-${Date.now().toString(36)}`,
        age: data.age,
        gender: data.gender,
      },
    });
  }

  // (Plus de promotion automatique CLIENT → ESCORT depuis le formulaire d'annonce :
  //  le passage doit désormais être fait explicitement via /client/devenir-escort)

  const baseSlug = slugify(data.title).slice(0, 60);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const photoUrls = formData.getAll("mediaUrls").map(String).filter(Boolean);
  const videoUrls = formData.getAll("videoUrls").map(String).filter(Boolean);

  // I6 — Cap photos selon le tier (annonce nouvelle = STANDARD au départ)
  const photoCap = await getSettingNumber("photos.cap.standard", 3);
  if (photoUrls.length > photoCap) {
    return {
      ok: false,
      error: `Limite photos atteinte : ${photoCap} max en plan Standard. Passez en Premium ou VIP pour en publier plus.`,
    };
  }

  // V10 — Anti-doublons photos : on calcule le pHash de chaque photo et on
  //       refuse si une autre annonce a déjà la même photo.
  const { checkPhotoDuplicate } = await import("@/lib/actions/photo-duplicate-check");
  const photoHashes: (string | null)[] = [];
  for (const url of photoUrls) {
    const check = await checkPhotoDuplicate(url, session.user.id);
    if (!check.ok) {
      return { ok: false, error: check.reason };
    }
    photoHashes.push(check.imageHash || null);
  }

  // On ordonne : photos d'abord (la 1ère sera isPrimary), vidéos ensuite
  const mediaCreates = [
    ...photoUrls.map((url, idx) => ({
      url,
      type: "PHOTO" as const,
      isPrimary: idx === 0,
      position: idx,
      imageHash: photoHashes[idx],
    })),
    ...videoUrls.map((url, idx) => ({
      url,
      type: "VIDEO" as const,
      isPrimary: false,
      position: photoUrls.length + idx,
    })),
  ];

  const ad = await prisma.ad.create({
    data: {
      ownerId: session.user.id,
      profileId: profile.id,
      cityId: data.cityId,
      title: data.title,
      slug,
      description: data.description,
      price: data.price,
      priceNight: data.priceNight,
      whatsappPhone: data.whatsappPhone,
      callPhone: data.callPhone,
      neighborhood: data.neighborhood,
      services: data.services,
      incall: data.incall,
      outcall: data.outcall,
      status: "PENDING",
      media: { create: mediaCreates },
    },
  });

  revalidatePath("/escort/dashboard");
  return { ok: true, adId: ad.id };
}

/** Met à jour ou bascule le statut d'une annonce (ACTIVE ⇄ PAUSED). */
export async function toggleAdStatusAction(adId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");

  const ad = await prisma.ad.findUnique({ where: { id: adId } });
  if (!ad) throw new Error("Annonce introuvable");
  if (ad.ownerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Non autorisé");
  }
  const next = ad.status === "ACTIVE" ? "PAUSED" : ad.status === "PAUSED" ? "ACTIVE" : ad.status;
  await prisma.ad.update({ where: { id: adId }, data: { status: next } });
  revalidatePath("/escort/dashboard/annonces");
  revalidatePath(`/annonce/${ad.slug}`);
}

/** Supprime une annonce. */
export async function deleteAdAction(adId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");

  const ad = await prisma.ad.findUnique({ where: { id: adId } });
  if (!ad) throw new Error("Annonce introuvable");
  if (ad.ownerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Non autorisé");
  }
  await prisma.ad.delete({ where: { id: adId } });
  revalidatePath("/escort/dashboard/annonces");
  redirect("/escort/dashboard/annonces");
}

/** Tracking vue d'annonce + clic WhatsApp (côté server, idempotent par IP). */
export async function trackAdView(adId: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "unknown";
  const ipHash = await hashString(ip);
  const ua = h.get("user-agent") ?? undefined;

  // Anti-double-comptage : pas plus d'1 vue par IP toutes les 30 min
  const recent = await prisma.adView.findFirst({
    where: {
      adId,
      ipHash,
      createdAt: { gte: new Date(Date.now() - 30 * 60_000) },
    },
  });
  if (recent) return;

  await prisma.$transaction([
    prisma.adView.create({ data: { adId, ipHash, userAgent: ua } }),
    prisma.ad.update({ where: { id: adId }, data: { views: { increment: 1 } } }),
  ]);
}

export async function trackWhatsAppClick(adId: string) {
  await prisma.ad.update({ where: { id: adId }, data: { whatsappClicks: { increment: 1 } } });
}


// =====================================================================
// AUTO-RENEW : toggle opt-in (renouvellement automatique par cron)
// =====================================================================
export async function setAutoRenewAction(input: {
  adId: string;
  enabled: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non authentifié" };

  const ad = await prisma.ad.findUnique({
    where: { id: input.adId },
    select: { ownerId: true },
  });
  if (!ad || ad.ownerId !== session.user.id) {
    return { ok: false, error: "Annonce introuvable" };
  }

  await prisma.ad.update({
    where: { id: input.adId },
    data: { autoRenew: input.enabled },
  });

  return { ok: true };
}
