import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/kpay";
import { checkAndApplyIntent } from "@/lib/kpay-direct";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook K-Pay v2 — adapté au modèle "paiement direct one-shot".
 *
 * Stratégie :
 *   1. Vérif HMAC si KPAY_WEBHOOK_SECRET configuré
 *   2. Retrouve le Payment dans NOTRE base via paymentId/externalId
 *   3. Délègue à checkAndApplyIntent() qui re-query K-Pay avec NOS clés
 *      puis applique l'intent (Bump, Sticky, Premium, Pass, etc.)
 *
 * Les retraits admin (platform payout) restent gérés via WithdrawalRequest
 * mais NE SONT PAS dans ce webhook : ils sont confirmés manuellement par admin.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig =
    req.headers.get("x-kpay-signature") ??
    req.headers.get("x-signature") ??
    req.headers.get("signature");

  const sigCheck = verifyWebhookSignature(rawBody, sig);
  if (sigCheck === false) {
    await prisma.auditLog
      .create({
        data: {
          action: "KPAY_WEBHOOK_BAD_SIGNATURE",
          entity: "Webhook",
          metadata: { ip: req.headers.get("x-forwarded-for") },
        },
      })
      .catch(() => null);
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  let payload: {
    paymentId?: string;
    id?: string;
    externalId?: string;
    external_id?: string;
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const paymentId = String(payload.paymentId ?? payload.id ?? "");
  const externalId = String(payload.externalId ?? payload.external_id ?? "");
  if (!paymentId && !externalId) {
    return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        ...(paymentId ? [{ providerRef: paymentId }] : []),
        ...(externalId ? [{ providerRef: externalId }] : []),
      ],
    },
    select: { id: true },
  });

  if (!payment) {
    // Race : webhook avant que le placeholder ne soit committé → 404, K-Pay re-essaie
    return NextResponse.json({ error: "PAYMENT_NOT_FOUND" }, { status: 404 });
  }

  const result = await checkAndApplyIntent(payment.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ received: true, status: result.status, applied: result.applied });
}
