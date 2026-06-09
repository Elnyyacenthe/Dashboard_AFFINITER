"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1).max(500),
});

/** Met à jour un réglage. Réservé ADMIN. */
export async function updateSettingAction(input: z.infer<typeof updateSchema>) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Réservé aux admins");
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Données invalides" };

  await prisma.siteSetting.update({
    where: { key: parsed.data.key },
    data: { value: parsed.data.value },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "SETTING_UPDATED",
      entity: "SiteSetting",
      entityId: parsed.data.key,
      metadata: { value: parsed.data.value },
    },
  });

  revalidatePath("/admin/tarifs");
  return { ok: true as const };
}
