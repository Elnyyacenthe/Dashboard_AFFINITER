"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { chargeVerificationFee } from "@/lib/actions/wallet";

const submitSchema = z.object({
  documentType: z.enum(["CNI", "PASSPORT", "DRIVING_LICENSE"]),
  documentNumber: z.string().trim().min(5).max(40),
  documentFrontUrl: z.string().url(),
  documentBackUrl: z.string().url().optional(),
  selfieUrl: z.string().url(),
});

/** Hash SHA-256 du n° de doc — anti-réinscription post-suppression. */
function hashIdentity(documentType: string, documentNumber: string): string {
  return crypto
    .createHash("sha256")
    .update(`${documentType}::${documentNumber.toUpperCase().replace(/\s/g, "")}`)
    .digest("hex");
}

export type VerificationState =
  | { ok: true; verificationId: string }
  | { ok: false; error: string };

/** Soumission par l'escort de ses documents. */
export async function submitVerificationAction(input: unknown): Promise<VerificationState> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non authentifié" };

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides" };

  const identityHash = hashIdentity(parsed.data.documentType, parsed.data.documentNumber);

  // Anti-réinscription : si l'identité est dans la blacklist → refus
  const blocked = await prisma.blockedIdentity.findUnique({ where: { identityHash } });
  if (blocked) {
    // Bannir aussi le compte courant — quelqu'un essaie de revenir
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isBanned: true, banReason: `Identité bannie : ${blocked.reason}` },
    });
    return {
      ok: false,
      error: "Cette identité a été bannie définitivement de Yamo.",
    };
  }

  // Vérifier si cette identité appartient déjà à un autre user
  const otherUser = await prisma.user.findFirst({
    where: { identityHash, id: { not: session.user.id } },
  });
  if (otherUser) {
    return {
      ok: false,
      error: "Cette pièce d'identité est déjà utilisée par un autre compte.",
    };
  }

  // Vérifier qu'il n'y a pas déjà une vérification en cours
  const pending = await prisma.idVerification.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
  });
  if (pending) {
    return { ok: false, error: "Une vérification est déjà en cours d'examen." };
  }

  // I8 — Vérification payante (3000 FCFA par défaut, configurable)
  // On débite AVANT de créer la row pour éviter les fraudes par refresh.
  // Si le user a déjà payé pour une vérification précédente refusée, on ne re-facture pas.
  const previousPaid = await prisma.idVerification.findFirst({
    where: { userId: session.user.id, status: "REJECTED" },
    select: { id: true },
  });
  if (!previousPaid) {
    const fee = await chargeVerificationFee(session.user.id);
    if (!fee.ok) {
      return {
        ok: false,
        error: `${fee.error}. Rechargez votre wallet pour soumettre une vérification.`,
      };
    }
  }

  const verification = await prisma.idVerification.create({
    data: {
      userId: session.user.id,
      documentType: parsed.data.documentType,
      documentNumber: identityHash,
      documentFrontUrl: parsed.data.documentFrontUrl,
      documentBackUrl: parsed.data.documentBackUrl,
      selfieUrl: parsed.data.selfieUrl,
      status: "PENDING",
    },
  });

  // Stocke le hash sur le user pour le retrouver si besoin
  await prisma.user.update({
    where: { id: session.user.id },
    data: { identityHash },
  });

  revalidatePath("/escort/verification");
  return { ok: true, verificationId: verification.id };
}

/** Admin : approuve une vérification. */
export async function approveVerificationAction(verificationId: string): Promise<void> {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    throw new Error("Non autorisé");
  }

  const v = await prisma.idVerification.findUnique({ where: { id: verificationId } });
  if (!v) throw new Error("Introuvable");

  await prisma.$transaction([
    prisma.idVerification.update({
      where: { id: verificationId },
      data: {
        status: "VERIFIED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    }),
    prisma.escortProfile.updateMany({
      where: { userId: v.userId },
      data: { isVerified: true, verification: "VERIFIED", verifiedAt: new Date() },
    }),
    prisma.notification.create({
      data: {
        userId: v.userId,
        title: "Profil vérifié ✅",
        body: "Vos documents ont été validés. Le badge Vérifié s'affiche désormais sur vos annonces.",
        link: "/escort/profil",
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "VERIFICATION_APPROVED",
        entity: "IdVerification",
        entityId: verificationId,
      },
    }),
  ]);

  revalidatePath("/admin/verifications");
}

/** Admin : rejette une vérification. */
export async function rejectVerificationAction(
  verificationId: string,
  reason: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    throw new Error("Non autorisé");
  }

  const v = await prisma.idVerification.findUnique({ where: { id: verificationId } });
  if (!v) throw new Error("Introuvable");

  await prisma.$transaction([
    prisma.idVerification.update({
      where: { id: verificationId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.notification.create({
      data: {
        userId: v.userId,
        title: "Vérification refusée",
        body: `Vos documents n'ont pas été validés : ${reason}. Vous pouvez réessayer.`,
        link: "/escort/verification",
      },
    }),
  ]);

  revalidatePath("/admin/verifications");
}

/** Admin : bannit l'identité (définitif, bloque toute future réinscription). */
export async function blockIdentityAction(userId: string, reason: string): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Réservé aux admins");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { identityHash: true },
  });
  if (!user?.identityHash) throw new Error("Cet utilisateur n'a pas d'identité vérifiée");

  await prisma.$transaction([
    prisma.blockedIdentity.upsert({
      where: { identityHash: user.identityHash },
      update: { reason },
      create: {
        identityHash: user.identityHash,
        reason,
        bannedById: session.user.id,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, banReason: reason },
    }),
    prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "IDENTITY_BLOCKED",
        entity: "User",
        entityId: userId,
        metadata: { reason },
      },
    }),
  ]);

  revalidatePath("/admin/utilisateurs");
}
