import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAndApplyIntent } from "@/lib/kpay-direct";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Polling client : vérifie l'état d'un paiement et applique l'intent si succès.
 * Appelé par le composant KpayPayModal toutes les 3-5 secondes.
 *
 * Réponses :
 *   200 { status: "PENDING" | "SUCCESS" | "FAILED", applied: boolean }
 *   404 paiement introuvable
 *   403 paiement n'appartient pas à l'user
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { userId: true, status: true, intentApplied: true },
  });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Si déjà finalisé en DB, on évite un round-trip K-Pay
  if (payment.status === "PAID" && payment.intentApplied) {
    return NextResponse.json({ status: "SUCCESS", applied: true });
  }
  if (payment.status === "FAILED") {
    return NextResponse.json({ status: "FAILED", applied: false });
  }

  const result = await checkAndApplyIntent(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ status: result.status, applied: result.applied });
}
