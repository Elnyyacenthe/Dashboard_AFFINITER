"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { TicketCategory, TicketStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";

// =====================================================================
// SCHÉMAS
// =====================================================================

const createTicketSchema = z.object({
  subject: z.string().trim().min(5).max(120),
  category: z.enum(["GENERAL", "PAYMENT", "MODERATION", "KYC", "BUG", "OTHER"]),
  body: z.string().trim().min(10).max(3000),
});

const replyTicketSchema = z.object({
  ticketId: z.string().cuid(),
  body: z.string().trim().min(1).max(3000),
});

// =====================================================================
// USER actions
// =====================================================================

/**
 * Crée un ticket. Le user doit être authentifié (anti-spam : compte requis
 * pour écrire au service client — cf. besoin métier).
 */
export async function createTicketAction(input: unknown): Promise<
  { ok: true; ticketId: string } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Vous devez être connecté(e) pour écrire au support" };

  const rl = await rateLimit(`ticket:${session.user.id}`, { limit: 3, windowMs: 60 * 60_000 });
  if (!rl.success) return { ok: false, error: "Limite atteinte (3 tickets / heure)." };

  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Champs invalides" };

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      subject: parsed.data.subject,
      category: parsed.data.category as TicketCategory,
      status: "OPEN",
      messages: {
        create: {
          authorId: session.user.id,
          body: parsed.data.body,
          isAdmin: false,
        },
      },
    },
  });

  // Notif aux admins (1 seul ping pour ne pas spammer)
  const firstAdmin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "MODERATOR"] } },
    select: { id: true },
  });
  if (firstAdmin) {
    await prisma.notification.create({
      data: {
        userId: firstAdmin.id,
        title: "Nouveau ticket support",
        body: `[${parsed.data.category}] ${parsed.data.subject}`,
        link: `/admin/support/${ticket.id}`,
      },
    });
  }

  revalidatePath("/support");
  return { ok: true, ticketId: ticket.id };
}

/** Réponse de l'user sur un ticket existant. */
export async function replyTicketAction(input: unknown): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non authentifié" };

  const parsed = replyTicketSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Champs invalides" };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { userId: true, status: true },
  });
  if (!ticket) return { ok: false, error: "Ticket introuvable" };
  if (ticket.userId !== session.user.id) return { ok: false, error: "Non autorisé" };
  if (ticket.status === "CLOSED") return { ok: false, error: "Ticket fermé" };

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        ticketId: parsed.data.ticketId,
        authorId: session.user.id,
        body: parsed.data.body,
        isAdmin: false,
      },
    }),
    prisma.supportTicket.update({
      where: { id: parsed.data.ticketId },
      data: { status: "OPEN", updatedAt: new Date() },
    }),
  ]);

  revalidatePath(`/support/${parsed.data.ticketId}`);
  revalidatePath("/admin/support");
  return { ok: true };
}

// =====================================================================
// ADMIN actions
// =====================================================================

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    throw new Error("Non autorisé");
  }
  return session.user;
}

/** Réponse de l'admin/modo sur un ticket. */
export async function adminReplyTicketAction(input: unknown): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const admin = await requireAdmin();
  const parsed = replyTicketSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Champs invalides" };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true, userId: true, status: true, subject: true },
  });
  if (!ticket) return { ok: false, error: "Ticket introuvable" };

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: admin.id,
        body: parsed.data.body,
        isAdmin: true,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "WAITING_USER", updatedAt: new Date() },
    }),
    prisma.notification.create({
      data: {
        userId: ticket.userId,
        title: "Réponse du support",
        body: `Le support a répondu à votre ticket "${ticket.subject}". Cliquez pour lire.`,
        link: `/support/${ticket.id}`,
      },
    }),
  ]);

  revalidatePath(`/admin/support/${ticket.id}`);
  return { ok: true };
}

/** Modification du statut par l'admin. */
export async function setTicketStatusAction(
  ticketId: string,
  status: TicketStatus,
): Promise<void> {
  await requireAdmin();
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
}
