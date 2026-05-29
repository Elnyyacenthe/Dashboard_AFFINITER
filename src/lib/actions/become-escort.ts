"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { slugify } from "@/lib/utils";

export type BecomeEscortState =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Convertit un compte CLIENT en ESCORT après confirmations explicites.
 * Crée également un EscortProfile minimal si absent.
 *
 * Garde-fous :
 *  - Doit être connecté
 *  - Doit être CLIENT (pas ADMIN/MODERATOR, pas déjà ESCORT)
 *  - Doit avoir accepté les CGU + l'âge 18+
 */
export async function becomeEscortAction(
  _prev: BecomeEscortState | null,
  formData: FormData,
): Promise<BecomeEscortState> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Vous devez être connecté(e)" };

  const acceptAdult = formData.get("acceptAdult") === "on";
  const acceptTerms = formData.get("acceptTerms") === "on";
  const acceptConditions = formData.get("acceptConditions") === "on";

  if (!acceptAdult || !acceptTerms || !acceptConditions) {
    return {
      ok: false,
      error: "Vous devez confirmer les 3 engagements pour devenir escort",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { escortProfile: true },
  });
  if (!user) return { ok: false, error: "Utilisateur introuvable" };

  if (user.role === "ADMIN" || user.role === "MODERATOR") {
    return { ok: false, error: "Les comptes administrateur ne peuvent pas devenir escort" };
  }
  if (user.role === "ESCORT") {
    return { ok: false, error: "Vous êtes déjà escort" };
  }
  if (user.isBanned) {
    return { ok: false, error: "Compte banni" };
  }

  // Promotion + création du profil si absent
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { role: "ESCORT" },
    });

    if (!user.escortProfile) {
      await tx.escortProfile.create({
        data: {
          userId: user.id,
          displayName: user.name ?? "Escort",
          slug: `${slugify(user.name ?? "escort")}-${user.id.slice(0, 6)}`,
          age: 18, // pourra être édité par l'escort
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "ROLE_UPGRADED_TO_ESCORT",
        entity: "User",
        entityId: user.id,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        title: "Bienvenue côté Escort 💃",
        body: "Votre compte a été converti. Vous pouvez maintenant publier des annonces et accéder au dashboard.",
        link: "/escort/dashboard",
      },
    });
  });

  revalidatePath("/client");
  revalidatePath("/escort");
  return { ok: true };
}
