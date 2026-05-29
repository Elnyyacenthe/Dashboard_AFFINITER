"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit, RL } from "@/lib/rate-limit";

const reportSchema = z.object({
  adId: z.string().cuid(),
  reason: z.enum(["FAKE", "SCAM", "UNDERAGE", "ILLEGAL", "SPAM", "HARASSMENT", "OTHER"]),
  details: z.string().max(500).optional(),
});

export async function reportAdAction(input: z.infer<typeof reportSchema>) {
  const session = await auth();
  const ip = (await headers()).get("x-forwarded-for") ?? session?.user?.id ?? "anon";
  const rl = await rateLimit(`report:${ip}`, RL.report);
  if (!rl.success) return { ok: false as const, error: "Trop de signalements. Réessayez plus tard." };

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Données invalides" };

  const ad = await prisma.ad.findUnique({ where: { id: parsed.data.adId }, select: { ownerId: true } });
  if (!ad) return { ok: false as const, error: "Annonce introuvable" };

  await prisma.report.create({
    data: {
      adId: parsed.data.adId,
      reporterId: session?.user?.id,
      reportedUserId: ad.ownerId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });
  return { ok: true as const };
}
