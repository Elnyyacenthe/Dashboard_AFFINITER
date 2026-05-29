"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function toggleFavoriteAction(adId: string): Promise<
  { ok: true; favorited: boolean } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Connectez-vous pour ajouter aux favoris" };

  const existing = await prisma.favorite.findUnique({
    where: { userId_adId: { userId: session.user.id, adId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/client/favoris");
    revalidatePath("/escort/favoris");
    return { ok: true, favorited: false };
  }

  await prisma.favorite.create({
    data: { userId: session.user.id, adId },
  });
  revalidatePath("/favoris");
  return { ok: true, favorited: true };
}

export async function isFavoritedAction(adId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  const fav = await prisma.favorite.findUnique({
    where: { userId_adId: { userId: session.user.id, adId } },
  });
  return Boolean(fav);
}
