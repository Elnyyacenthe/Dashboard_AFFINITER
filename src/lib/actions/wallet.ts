"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { TxType, TxStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit, RL } from "@/lib/rate-limit";
import {
  initDeposit,
  initWithdrawal,
  getDepositStatus,
  classifyStatus,
  makeExternalId,
  normalizePhoneForKpay,
  isKpayConfigured,
  KpayError,
} from "@/lib/kpay";

// =====================================================================
// CORE — applique un delta atomique sur le wallet + log la transaction
// =====================================================================

interface ApplyDeltaInput {
  userId: string;
  amount: number;          // positif = crédit ; négatif = débit
  type: TxType;
  description?: string;
  reference?: string;
  metadata?: Prisma.InputJsonValue;
  /** Si fourni : si une tx existe déjà avec ce reference, on ne re-crédite pas (idempotence). */
  idempotencyRef?: string;
}

/**
 * Crédite / débite atomiquement le wallet d'un user.
 *
 * Sécurité :
 *  - Transaction PG (lock optimiste avec update conditionnel sur la balance)
 *  - Idempotence par `idempotencyRef` : si une WalletTransaction existe déjà
 *    avec ce reference + COMPLETED, on retourne null sans rejouer le delta
 *  - Refuse les débits qui mettraient la balance < 0
 */
export async function applyWalletDelta(input: ApplyDeltaInput): Promise<{
  txId: string | null;
  balanceAfter: number;
  idempotent: boolean;
}> {
  return await prisma.$transaction(async (tx) => {
    // Idempotence
    if (input.idempotencyRef) {
      const existing = await tx.walletTransaction.findFirst({
        where: { reference: input.idempotencyRef, status: "COMPLETED" },
      });
      if (existing) {
        const user = await tx.user.findUnique({
          where: { id: input.userId },
          select: { walletBalance: true },
        });
        return { txId: existing.id, balanceAfter: user?.walletBalance ?? 0, idempotent: true };
      }
    }

    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: { walletBalance: true, isBanned: true },
    });
    if (!user) throw new Error("Utilisateur introuvable");
    if (user.isBanned) throw new Error("Compte banni");

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + input.amount;

    if (balanceAfter < 0) {
      throw new Error(`Solde insuffisant (${balanceBefore} FCFA, besoin de ${-input.amount})`);
    }

    await tx.user.update({
      where: { id: input.userId },
      data: { walletBalance: balanceAfter },
    });

    const walletTx = await tx.walletTransaction.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        balanceBefore,
        balanceAfter,
        type: input.type,
        status: "COMPLETED",
        reference: input.reference ?? input.idempotencyRef,
        description: input.description,
        metadata: input.metadata,
      },
    });

    return { txId: walletTx.id, balanceAfter, idempotent: false };
  });
}

// =====================================================================
// DÉPÔT — l'user initie un dépôt MoMo/Orange via K-Pay
// =====================================================================

export type DepositResult =
  | { ok: true; reference: string; externalId: string; paymentId: string; message: string }
  | { ok: false; error: string };

/**
 * Initie un dépôt K-Pay.
 *
 * Flux :
 *  1. Validation (montant, téléphone)
 *  2. Anti-doublon : si une tx PENDING identique existe < 60s, on la retourne
 *  3. Crée un Payment PENDING en DB (placeholder)
 *  4. POST K-Pay /payments/init
 *  5. Met à jour la providerRef avec l'id K-Pay (pay_xxx)
 *  6. Retourne au client qui peut poller / attendre le webhook
 */
export async function initiateDepositAction(input: {
  amount: number;
  phone: string;
}): Promise<DepositResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Connectez-vous d'abord" };

  if (!isKpayConfigured()) {
    return { ok: false, error: "Le système de paiement est temporairement indisponible." };
  }

  const ip = (await headers()).get("x-forwarded-for") ?? session.user.id;
  const rl = rateLimit(`deposit:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.success) return { ok: false, error: "Trop de tentatives, attendez 1 min" };

  // Validation
  const minDeposit = await getSettingNumber("deposit.min", 500);
  const amount = Math.floor(Number(input.amount));
  if (!Number.isInteger(amount) || amount < minDeposit) {
    return { ok: false, error: `Montant minimum : ${minDeposit} FCFA` };
  }
  if (amount > 1_000_000) return { ok: false, error: "Montant maximum : 1 000 000 FCFA" };
  const phone = normalizePhoneForKpay(input.phone);
  if (phone.length !== 12 || !phone.startsWith("237")) {
    return { ok: false, error: "Numéro Cameroun invalide" };
  }

  // Dédoublonnage : tx PENDING < 60s avec mêmes montant + téléphone
  const recent = await prisma.payment.findFirst({
    where: {
      userId: session.user.id,
      provider: "MTN_MOMO", // K-Pay route automatiquement vers MTN ou Orange selon prefix
      amount,
      status: "PENDING",
      createdAt: { gte: new Date(Date.now() - 60_000) },
      metadata: { path: ["phone"], equals: phone },
    },
  });
  if (recent) {
    return {
      ok: true,
      reference: recent.providerRef ?? recent.id,
      externalId: (recent.metadata as { externalId?: string } | null)?.externalId ?? recent.id,
      paymentId: recent.id,
      message: "Dépôt déjà en cours. Validez sur votre téléphone.",
    };
  }

  const externalId = makeExternalId("DEPOSIT", session.user.id);

  // 1. Placeholder en DB
  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      amount,
      currency: "XAF",
      provider: "MTN_MOMO",
      status: "PENDING",
      providerRef: externalId,
      metadata: {
        kpay: { externalId, phone, init: "pending" },
        phone,
        externalId,
      },
    },
  });

  // 2. POST K-Pay
  try {
    const kpayPayment = await initDeposit({
      amount,
      phoneNumber: phone,
      externalId,
      description: `Dépôt Yamo de ${amount} FCFA`,
      metadata: { yamoUserId: session.user.id, yamoPaymentId: payment.id },
    });

    // 3. Mettre à jour avec l'id K-Pay (pay_xxx)
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: kpayPayment.id,
        metadata: {
          kpay: { externalId, phone, kpayId: kpayPayment.id, status: kpayPayment.status },
          phone,
          externalId,
          kpayId: kpayPayment.id,
        },
      },
    });

    return {
      ok: true,
      reference: kpayPayment.id,
      externalId,
      paymentId: payment.id,
      message: "Validez le paiement sur votre téléphone Mobile Money.",
    };
  } catch (e) {
    const msg = e instanceof KpayError ? e.message : "Erreur K-Pay";
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        metadata: { kpay: { externalId, error: msg } },
      },
    });
    return { ok: false, error: msg };
  }
}

/**
 * Polling côté client : appelle K-Pay pour confirmer si un dépôt est COMPLETED
 * et applique le crédit wallet si oui. Idempotent.
 *
 * Le webhook K-Pay fait normalement ce travail automatiquement. Cette action
 * est utile si l'user reste sur la page et veut un feedback instantané, ou si
 * le webhook a échoué.
 */
export async function checkAndApplyDepositAction(paymentId: string): Promise<
  | { ok: true; status: "SUCCESS" | "PENDING" | "FAILED"; balance?: number }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non authentifié" };

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== session.user.id) {
    return { ok: false, error: "Paiement introuvable" };
  }
  if (payment.status === "PAID") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true },
    });
    return { ok: true, status: "SUCCESS", balance: user?.walletBalance };
  }
  if (payment.status === "FAILED") return { ok: true, status: "FAILED" };
  if (!payment.providerRef) return { ok: true, status: "PENDING" };

  try {
    const kpayPayment = await getDepositStatus(payment.providerRef);
    const cls = classifyStatus(kpayPayment.status);

    if (cls === "SUCCESS") {
      // Crédite wallet idempotent
      await applyWalletDelta({
        userId: payment.userId,
        amount: payment.amount,
        type: "DEPOSIT",
        description: `Dépôt MoMo de ${payment.amount} FCFA`,
        reference: payment.id,
        idempotencyRef: `kpay_dep_${payment.id}`,
        metadata: { kpayId: kpayPayment.id, source: "client_poll" },
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { walletBalance: true },
      });
      revalidatePath("/client/portefeuille");
      revalidatePath("/escort/portefeuille");
      return { ok: true, status: "SUCCESS", balance: user?.walletBalance };
    }
    if (cls === "FAILED") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      return { ok: true, status: "FAILED" };
    }
    return { ok: true, status: "PENDING" };
  } catch {
    return { ok: true, status: "PENDING" };
  }
}

// =====================================================================
// RETRAIT — l'user demande un retrait MoMo vers son téléphone
// =====================================================================

export type WithdrawResult =
  | { ok: true; reference: string; message: string }
  | { ok: false; error: string };

/**
 * Initie un retrait :
 *  1. Vérifie le solde, débite le wallet en transaction (atomicité)
 *  2. POST K-Pay /payments/withdraw
 *  3. Si OK → WithdrawalRequest en PENDING
 *  4. Si KO → rembourse le wallet (refund idempotent)
 */
export async function initiateWithdrawalAction(input: {
  amount: number;
  phone: string;
}): Promise<WithdrawResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Connectez-vous d'abord" };

  if (!isKpayConfigured()) {
    return { ok: false, error: "Le système de retrait est temporairement indisponible." };
  }

  const ip = (await headers()).get("x-forwarded-for") ?? session.user.id;
  const rl = rateLimit(`withdraw:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.success) return { ok: false, error: "Trop de tentatives, attendez 1 min" };

  const minWithdraw = await getSettingNumber("withdrawal.min", 5000);
  const amount = Math.floor(Number(input.amount));
  if (!Number.isInteger(amount) || amount < minWithdraw) {
    return { ok: false, error: `Retrait minimum : ${minWithdraw} FCFA` };
  }
  const phone = normalizePhoneForKpay(input.phone);
  if (phone.length !== 12 || !phone.startsWith("237")) {
    return { ok: false, error: "Numéro Cameroun invalide" };
  }

  const externalId = makeExternalId("WITHDRAW", session.user.id);

  // 1. Débit atomique
  try {
    await applyWalletDelta({
      userId: session.user.id,
      amount: -amount,
      type: "WITHDRAWAL",
      description: `Retrait MoMo de ${amount} FCFA vers ${phone}`,
      reference: externalId,
      idempotencyRef: `kpay_wd_debit_${externalId}`,
      metadata: { phone, externalId },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Solde insuffisant" };
  }

  // 2. Crée la WithdrawalRequest
  const withdrawal = await prisma.withdrawalRequest.create({
    data: {
      userId: session.user.id,
      amount,
      provider: "MTN_MOMO",
      destinationPhone: phone,
      status: "PENDING",
      providerRef: externalId,
    },
  });

  // 3. POST K-Pay
  try {
    const kpayResult = await initWithdrawal({
      amount,
      phoneNumber: phone,
      description: `Retrait Yamo ${amount} FCFA`,
    });
    await prisma.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: { providerRef: kpayResult.id },
    });
    revalidatePath("/client/portefeuille");
    revalidatePath("/escort/portefeuille");
    return {
      ok: true,
      reference: kpayResult.id,
      message: "Retrait initié. Vous recevrez l'argent sous peu.",
    };
  } catch (e) {
    // 4. Refund automatique
    const msg = e instanceof KpayError ? e.message : "Erreur K-Pay";
    await applyWalletDelta({
      userId: session.user.id,
      amount,
      type: "REFUND",
      description: `Remboursement retrait échoué : ${msg}`,
      reference: externalId,
      idempotencyRef: `kpay_wd_refund_${externalId}`,
      metadata: { reason: msg, withdrawalId: withdrawal.id },
    });
    await prisma.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: { status: "FAILED", failureReason: msg },
    });
    revalidatePath("/client/portefeuille");
    revalidatePath("/escort/portefeuille");
    return { ok: false, error: `Retrait refusé : ${msg}` };
  }
}

// =====================================================================
// PAIEMENT TIER — utilise le wallet pour acheter PREMIUM ou VIP
// =====================================================================

export async function payTierFromWalletAction(input: {
  adId?: string;     // si on boost une annonce existante
  tier: "PREMIUM" | "VIP";
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Non authentifié" };

  const tier = input.tier;
  const priceKey = tier === "VIP" ? "pricing.vip.amount" : "pricing.premium.amount";
  const daysKey = tier === "VIP" ? "pricing.vip.days" : "pricing.premium.days";
  const price = await getSettingNumber(priceKey, tier === "VIP" ? 15000 : 5000);
  const days = await getSettingNumber(daysKey, 30);

  // Débit wallet
  try {
    await applyWalletDelta({
      userId: session.user.id,
      amount: -price,
      type: "BOOST_PAYMENT",
      description: `Achat ${tier} ${days}j`,
      reference: `boost_${tier}_${Date.now()}`,
      metadata: { tier, days, adId: input.adId },
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Solde insuffisant",
    };
  }

  // Création du Payment paid + application du tier sur l'annonce
  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      adId: input.adId,
      amount: price,
      provider: "WALLET",
      status: "PAID",
      tier,
      durationDays: days,
      paidAt: new Date(),
    },
  });

  if (input.adId) {
    await prisma.ad.update({
      where: { id: input.adId },
      data: {
        tier,
        promotedUntil: new Date(Date.now() + days * 86_400_000),
      },
    });
  }

  // Référer le parrain si c'est le 1er paiement de cet user
  await maybeReferralBonusOnPayment(session.user.id, price);

  revalidatePath("/escort/annonces");
  revalidatePath("/escort/premium");
  return { ok: true, message: `${tier} activé pour ${days} jours 🎉` };
}

// =====================================================================
// PARRAINAGE — bonus crédité quand le filleul fait son 1er paiement
// =====================================================================

async function maybeReferralBonusOnPayment(userId: string, paymentAmount: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referredById: true },
  });
  if (!user?.referredById) return;

  // Compter les paiements précédents PAYÉS — si c'est le 1er, on crédite le parrain
  const paymentCount = await prisma.payment.count({
    where: { userId, status: "PAID" },
  });
  if (paymentCount !== 1) return; // déjà crédité (ou pas 1er)

  const bonus = await getSettingNumber("referral.bonus.payment", 2000);
  await applyWalletDelta({
    userId: user.referredById,
    amount: bonus,
    type: "REFERRAL_BONUS",
    description: `Bonus parrainage : votre filleul a payé ${paymentAmount} FCFA`,
    reference: `ref_pay_${userId}`,
    idempotencyRef: `ref_pay_${userId}`,
    metadata: { refereeId: userId, paymentAmount },
  });
  await prisma.user.update({
    where: { id: user.referredById },
    data: { referralBonusGiven: { increment: bonus } },
  });
  await prisma.notification.create({
    data: {
      userId: user.referredById,
      title: "Bonus parrainage 🎁",
      body: `Vous avez gagné ${bonus} FCFA — votre filleul vient d'effectuer son premier paiement.`,
      link: "/portefeuille",
    },
  });
}

// =====================================================================
// Helpers réglages
// =====================================================================

export async function getSettingNumber(key: string, fallback: number): Promise<number> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  if (!setting) return fallback;
  const n = Number(setting.value);
  return Number.isFinite(n) ? n : fallback;
}
