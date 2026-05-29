"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

// Note : approveVerificationAction, rejectVerificationAction et blockIdentityAction
// vivent dans le projet Yamo principal (yamo.cm/admin). Ce dashboard ne sert qu'aux
// soumissions par les escorts, jamais à la modération.
