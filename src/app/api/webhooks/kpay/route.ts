import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getDepositStatus,
  getWithdrawalStatus,
  verifyWebhookSignature,
  classifyStatus,
} from "@/lib/kpay";
import { applyWalletDelta } from "@/lib/actions/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook K-Pay — endpoint public, appelé par K-Pay quand le statut d'une tx change.
 *
 * STRATÉGIE DE SÉCURITÉ (inspirée gost_app) :
 *  1. (Optionnel) Vérification signature HMAC si KPAY_WEBHOOK_SECRET est défini
 *  2. On NE FAIT JAMAIS confiance au body : on retrouve la tx dans NOTRE base
 *     via paymentId/externalId, puis on RAPPELLE l'API K-Pay (GET status) avec
 *     NOS clés pour obtenir le vrai statut.
 *  3. Validation amount + externalId : si mismatch → alerte admin, 400
 *  4. Crédit / refund idempotent via WalletTransaction.reference
 *
 * Effet : un faux webhook ne peut RIEN créditer car le statut est revérifié
 * auprès de K-Pay.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig =
    req.headers.get("x-kpay-signature") ??
    req.headers.get("x-signature") ??
    req.headers.get("signature");

  // 1. Vérif HMAC (si secret configuré)
  const sigCheck = verifyWebhookSignature(rawBody, sig);
  if (sigCheck === false) {
    // Secret configuré + signature fournie mais invalide → rejet
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

  // 2. Parse body
  let payload: {
    event?: string;
    paymentId?: string;
    id?: string;
    externalId?: string;
    external_id?: string;
    status?: string;
    amount?: number;
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

  // 3. Retrouver d'abord dans Payment (dépôt) puis WithdrawalRequest (retrait)
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        ...(paymentId ? [{ providerRef: paymentId }] : []),
        ...(externalId ? [{ providerRef: externalId }] : []),
      ],
    },
  });

  if (payment) {
    return await handleDepositWebhook(payment, payload);
  }

  const withdrawal = await prisma.withdrawalRequest.findFirst({
    where: {
      OR: [
        ...(paymentId ? [{ providerRef: paymentId }] : []),
        ...(externalId ? [{ providerRef: externalId }] : []),
      ],
    },
  });

  if (withdrawal) {
    return await handleWithdrawalWebhook(withdrawal, payload);
  }

  // Race : webhook avant que le placeholder DB ne soit committé → 404, K-Pay re-essaiera
  return NextResponse.json({ error: "TX_NOT_FOUND", paymentId, externalId }, { status: 404 });
}

// =====================================================================
// DÉPÔT
// =====================================================================

async function handleDepositWebhook(
  payment: Awaited<ReturnType<typeof prisma.payment.findFirst>>,
  payload: { status?: string; amount?: number },
) {
  if (!payment) return NextResponse.json({ error: "NO_PAYMENT" }, { status: 404 });

  // Idempotence rapide
  if (payment.status === "PAID") {
    return NextResponse.json({ received: true, idempotent: true });
  }
  if (!payment.providerRef || payment.providerRef.startsWith("DEPOSIT_")) {
    // L'id K-Pay n'est pas encore en DB (race) → on attend
    return NextResponse.json({ received: true, note: "no_kpay_id_yet" });
  }

  // Source de vérité : re-query K-Pay
  let kpayData;
  try {
    kpayData = await getDepositStatus(payment.providerRef);
  } catch {
    return NextResponse.json({ received: true, note: "kpay_unreachable" });
  }

  // Anti-fraude : validation amount
  if (kpayData.amount && kpayData.amount !== payment.amount) {
    await prisma.auditLog.create({
      data: {
        action: "KPAY_AMOUNT_MISMATCH",
        entity: "Payment",
        entityId: payment.id,
        metadata: { ours: payment.amount, kpay: kpayData.amount } as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ error: "AMOUNT_MISMATCH" }, { status: 400 });
  }

  const cls = classifyStatus(kpayData.status);

  if (cls === "SUCCESS") {
    await applyWalletDelta({
      userId: payment.userId,
      amount: payment.amount,
      type: "DEPOSIT",
      description: `Dépôt MoMo de ${payment.amount} FCFA`,
      reference: payment.id,
      idempotencyRef: `kpay_dep_${payment.id}`,
      metadata: { kpayId: kpayData.id, source: "webhook" },
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        title: "Dépôt réussi ✅",
        body: `${payment.amount} FCFA crédités sur votre compte.`,
        link: "/portefeuille",
      },
    });
    return NextResponse.json({ received: true, credited: payment.amount });
  }

  if (cls === "FAILED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ received: true, status: "FAILED" });
  }

  return NextResponse.json({ received: true, status: "PENDING" });
}

// =====================================================================
// RETRAIT
// =====================================================================

async function handleWithdrawalWebhook(
  withdrawal: Awaited<ReturnType<typeof prisma.withdrawalRequest.findFirst>>,
  payload: { status?: string; amount?: number },
) {
  if (!withdrawal) return NextResponse.json({ error: "NO_WITHDRAWAL" }, { status: 404 });

  if (withdrawal.status !== "PENDING") {
    return NextResponse.json({ received: true, idempotent: true });
  }
  if (!withdrawal.providerRef) {
    return NextResponse.json({ received: true, note: "no_kpay_id_yet" });
  }

  let kpayData;
  try {
    kpayData = await getWithdrawalStatus(withdrawal.providerRef);
  } catch {
    return NextResponse.json({ received: true, note: "kpay_unreachable" });
  }

  const cls = classifyStatus(kpayData.status);

  if (cls === "SUCCESS") {
    await prisma.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: { status: "PAID", approvedAt: new Date() },
    });
    await prisma.notification.create({
      data: {
        userId: withdrawal.userId,
        title: "Retrait effectué ✅",
        body: `${withdrawal.amount} FCFA envoyés vers ${withdrawal.destinationPhone}.`,
        link: "/portefeuille",
      },
    });
    return NextResponse.json({ received: true, status: "SUCCESS" });
  }

  if (cls === "FAILED") {
    // Refund du wallet
    await applyWalletDelta({
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      type: "REFUND",
      description: `Remboursement retrait échoué`,
      reference: withdrawal.id,
      idempotencyRef: `kpay_wd_refund_${withdrawal.providerRef}`,
      metadata: { withdrawalId: withdrawal.id, reason: kpayData.failureReason },
    });
    await prisma.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: { status: "FAILED", failureReason: kpayData.failureReason ?? "K-Pay failed" },
    });
    await prisma.notification.create({
      data: {
        userId: withdrawal.userId,
        title: "Retrait échoué",
        body: `Votre retrait n'a pas abouti. Les ${withdrawal.amount} FCFA ont été remboursés.`,
        link: "/portefeuille",
      },
    });
    return NextResponse.json({ received: true, refunded: withdrawal.amount });
  }

  return NextResponse.json({ received: true, status: "PENDING" });
}
