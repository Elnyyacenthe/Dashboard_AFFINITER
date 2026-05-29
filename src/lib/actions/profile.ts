"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { slugify } from "@/lib/utils";

const profileSchema = z.object({
  displayName: z.string().min(2).max(60),
  bio: z.string().max(1500).optional(),
  age: z.coerce.number().int().min(18).max(80),
  gender: z.enum(["FEMALE", "MALE", "TRANS", "COUPLE"]),
  height: z.coerce.number().int().min(140).max(220).optional(),
  weight: z.coerce.number().int().min(40).max(200).optional(),
  ethnicity: z.string().max(60).optional(),
  languages: z.array(z.string()).default([]),
});

export type ProfileState = { ok: true } | { ok: false; error: string };

export async function updateProfileAction(_prev: ProfileState | null, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non autorisé" };

  const raw = {
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || undefined,
    age: formData.get("age"),
    gender: formData.get("gender") || "FEMALE",
    height: formData.get("height") || undefined,
    weight: formData.get("weight") || undefined,
    ethnicity: formData.get("ethnicity") || undefined,
    languages: formData.getAll("languages").map(String).filter(Boolean),
  };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Données invalides" };

  const data = parsed.data;
  const slug = `${slugify(data.displayName)}-${session.user.id.slice(0, 6)}`;

  await prisma.escortProfile.upsert({
    where: { userId: session.user.id },
    update: { ...data, slug },
    create: { userId: session.user.id, ...data, slug },
  });

  // Promouvoir CLIENT → ESCORT si besoin
  if (session.user.role === "CLIENT") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "ESCORT" },
    });
  }

  revalidatePath("/escort/profil");
  return { ok: true };
}
