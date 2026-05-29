"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Réservé aux admins");
  }
  return session.user;
}

const upsertSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(2).max(80),
  region: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isPopular: z.coerce.boolean().default(false),
  order: z.coerce.number().int().default(0),
});

export type CityActionState =
  | { ok: true; cityId: string }
  | { ok: false; error: string };

/** Création ou édition d'une ville. */
export async function upsertCityAction(input: unknown): Promise<CityActionState> {
  const admin = await requireAdmin();
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides" };

  const data = parsed.data;
  const slug = slugify(data.name);

  // Vérif anti-doublon
  const existingByName = await prisma.city.findFirst({
    where: {
      OR: [{ name: data.name }, { slug }],
      ...(data.id && { NOT: { id: data.id } }),
    },
  });
  if (existingByName) {
    return { ok: false, error: "Une ville avec ce nom existe déjà" };
  }

  const city = data.id
    ? await prisma.city.update({
        where: { id: data.id },
        data: {
          name: data.name,
          region: data.region || null,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          isPopular: data.isPopular,
          order: data.order,
        },
      })
    : await prisma.city.create({
        data: {
          name: data.name,
          slug,
          region: data.region || null,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          isPopular: data.isPopular,
          order: data.order,
        },
      });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: data.id ? "CITY_UPDATED" : "CITY_CREATED",
      entity: "City",
      entityId: city.id,
    },
  });

  revalidatePath("/admin/villes");
  revalidatePath("/villes");
  revalidatePath("/");
  return { ok: true, cityId: city.id };
}

/** Mise à jour rapide d'une image de ville (depuis l'upload). */
export async function updateCityImageAction(cityId: string, imageUrl: string) {
  await requireAdmin();
  await prisma.city.update({
    where: { id: cityId },
    data: { imageUrl },
  });
  revalidatePath("/admin/villes");
  revalidatePath("/villes");
  revalidatePath("/");
}

/** Suppression d'une ville. Refusée si des annonces actives existent. */
export async function deleteCityAction(cityId: string) {
  const admin = await requireAdmin();
  const adCount = await prisma.ad.count({
    where: { cityId, status: { in: ["ACTIVE", "PENDING", "PAUSED"] } },
  });
  if (adCount > 0) {
    throw new Error(`Impossible : ${adCount} annonce(s) active(s) dans cette ville`);
  }
  await prisma.city.delete({ where: { id: cityId } });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "CITY_DELETED", entity: "City", entityId: cityId },
  });
  revalidatePath("/admin/villes");
}

/** Bascule rapidement le statut "ville populaire" (affichage en home). */
export async function toggleCityPopularAction(cityId: string) {
  await requireAdmin();
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) throw new Error("Ville introuvable");
  await prisma.city.update({
    where: { id: cityId },
    data: { isPopular: !city.isPopular },
  });
  revalidatePath("/admin/villes");
  revalidatePath("/");
}
