/**
 * K-Pay — client API (https://admin.kpay.site)
 *
 * Stratégie de sécurité (inspirée de gost_app) :
 *   - L'init est un proxy server-side (jamais d'appel direct depuis le navigateur,
 *     CORS bloquerait + on ne veut pas exposer les clés API)
 *   - Le webhook K-Pay sert juste de "trigger" instantané — on ne fait JAMAIS
 *     confiance au body brut. On re-interroge l'API K-Pay (GET status) avec NOS
 *     clés pour confirmer le vrai statut. Cela rend les faux webhooks inoffensifs.
 *   - Idempotence wallet : chaque crédit utilise un `request_id` unique
 *     (kpay_dep_<txId>, kpay_wd_refund_<externalId>)
 *
 * Variables d'env (.env) :
 *   KPAY_BASE_URL=https://admin.kpay.site
 *   KPAY_API_KEY=kpay_live_xxx       (ou kpay_test_xxx en sandbox)
 *   KPAY_SECRET_KEY=...
 *   KPAY_WEBHOOK_SECRET=...          (optionnel, défense en profondeur)
 *   KPAY_CALLBACK_URL=https://yamo.cm/api/webhooks/kpay
 */

import crypto from "node:crypto";

const KPAY_BASE = process.env.KPAY_BASE_URL ?? "https://admin.kpay.site";

export class KpayError extends Error {
  constructor(public code: string, message: string, public httpStatus?: number) {
    super(message);
    this.name = "KpayError";
  }
}

function getCreds() {
  const apiKey = process.env.KPAY_API_KEY;
  const secretKey = process.env.KPAY_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new KpayError("KPAY_NOT_CONFIGURED", "Clés K-Pay manquantes dans .env");
  }
  return { apiKey, secretKey };
}

const HEADERS_BASE = () => {
  const { apiKey, secretKey } = getCreds();
  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
    "X-Secret-Key": secretKey,
  };
};

// =====================================================================
// Types
// =====================================================================

export type KpayStatus =
  | "PENDING"
  | "COMPLETED"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REJECTED"
  | "EXPIRED";

export interface KpayPayment {
  id: string;
  status: KpayStatus;
  amount: number;
  phoneNumber: string;
  externalId: string;
  description?: string;
  failureReason?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface InitDepositInput {
  amount: number;
  phoneNumber: string;     // 237XXXXXXXXX (sans +)
  externalId: string;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, unknown>;
  /** Si non fourni, détecté automatiquement depuis le numéro. */
  paymentMethod?: KpayPaymentMethod;
}

export interface InitWithdrawalInput {
  amount: number;
  phoneNumber: string;
  description?: string;
  paymentMethod?: KpayPaymentMethod;
}

// =====================================================================
// Helpers
// =====================================================================

/** Normalise un numéro Cameroun en format K-Pay : 237XXXXXXXXX (9 chiffres après 237). */
export function normalizePhoneForKpay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("237") && digits.length === 12) return digits;
  if (digits.startsWith("6") && digits.length === 9) return "237" + digits;
  if (digits.length === 9) return "237" + digits;
  return digits;
}

/**
 * Détecte l'opérateur (MTN ou Orange) à partir d'un numéro Cameroun normalisé.
 *
 * Plages actuelles (CRTC Cameroun) :
 *   - MTN Cameroon  : 67X, 68X, 650-654
 *   - Orange Cameroon : 69X, 655-659
 *
 * En cas d'ambiguïté ou de prefix inconnu → MTN par défaut (couverture la plus large).
 */
export type KpayPaymentMethod = "MTN_MONEY" | "ORANGE_MONEY";

export function detectPaymentMethod(phone: string): KpayPaymentMethod {
  const normalized = normalizePhoneForKpay(phone);
  // On s'attend à un numéro de 12 chiffres commençant par 237
  if (!normalized.startsWith("237") || normalized.length !== 12) return "MTN_MONEY";

  const prefix2 = normalized.slice(3, 5); // 2 chiffres après 237
  const prefix3 = normalized.slice(3, 6); // 3 chiffres après 237

  // MTN : 67X, 68X
  if (prefix2 === "67" || prefix2 === "68") return "MTN_MONEY";
  // Orange : 69X
  if (prefix2 === "69") return "ORANGE_MONEY";
  // 650-654 → MTN, 655-659 → Orange
  if (prefix3.startsWith("65")) {
    const last = Number(prefix3[2]);
    if (last >= 0 && last <= 4) return "MTN_MONEY";
    if (last >= 5 && last <= 9) return "ORANGE_MONEY";
  }
  // Fallback
  return "MTN_MONEY";
}

/** ID externe unique pour idempotence côté K-Pay et anti-double-paiement. */
export function makeExternalId(prefix: string, userId: string): string {
  const short = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${prefix}_${short}_${userId}`;
}

/** Indique si la config K-Pay est complète. */
export function isKpayConfigured(): boolean {
  return Boolean(process.env.KPAY_API_KEY && process.env.KPAY_SECRET_KEY);
}

// =====================================================================
// API : Dépôts (Payment Init)
// =====================================================================

/**
 * Initialise un dépôt : K-Pay envoie une notif push au téléphone du client
 * qui valide depuis son app MoMo/Orange. Retourne l'id K-Pay (pay_xxx).
 */
export async function initDeposit(input: InitDepositInput): Promise<KpayPayment> {
  // Auto-détection du paymentMethod si pas fourni explicitement
  const paymentMethod = input.paymentMethod ?? detectPaymentMethod(input.phoneNumber);

  const body = {
    amount: input.amount,
    phoneNumber: input.phoneNumber,
    externalId: input.externalId,
    paymentMethod,
    description: input.description ?? `Dépôt de ${input.amount} FCFA sur Yamo`,
    ...(input.customerEmail && { customerEmail: input.customerEmail }),
    ...(input.customerName && { customerName: input.customerName }),
    ...(input.metadata && { metadata: input.metadata }),
  };

  let resp: Response;
  try {
    resp = await fetch(`${KPAY_BASE}/api/v1/payments/init`, {
      method: "POST",
      headers: HEADERS_BASE(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    throw new KpayError(
      "KPAY_NETWORK_ERROR",
      `Réseau injoignable : ${String(e).slice(0, 80)}`,
    );
  }

  let data: Partial<KpayPayment> & { message?: string; error?: string } = {};
  try {
    data = (await resp.json()) as never;
  } catch {
    /* ignore JSON parse error */
  }

  if (!resp.ok || !data.id) {
    const msg = data.message ?? data.error ?? `K-Pay refuse l'init (HTTP ${resp.status})`;
    throw new KpayError("KPAY_INIT_REFUSED", msg, resp.status);
  }

  return data as KpayPayment;
}

/** Récupère le statut d'un dépôt par son id K-Pay (pay_xxx). */
export async function getDepositStatus(paymentId: string): Promise<KpayPayment> {
  const resp = await fetch(`${KPAY_BASE}/api/v1/payments/${paymentId}`, {
    method: "GET",
    headers: HEADERS_BASE(),
    signal: AbortSignal.timeout(15_000),
  });
  if (!resp.ok) throw new KpayError("KPAY_HTTP", `HTTP ${resp.status}`, resp.status);
  const body = (await resp.json()) as { data?: KpayPayment } & KpayPayment;
  return (body.data ?? body) as KpayPayment;
}

// =====================================================================
// API : Retraits (Disbursement)
// =====================================================================

export async function initWithdrawal(input: InitWithdrawalInput): Promise<KpayPayment> {
  const paymentMethod = input.paymentMethod ?? detectPaymentMethod(input.phoneNumber);

  const body = {
    amount: input.amount,
    phoneNumber: input.phoneNumber,
    paymentMethod,
    description: input.description ?? `Retrait Yamo de ${input.amount} FCFA`,
  };

  let resp: Response;
  try {
    resp = await fetch(`${KPAY_BASE}/api/v1/payments/withdraw`, {
      method: "POST",
      headers: HEADERS_BASE(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    throw new KpayError("KPAY_NETWORK_ERROR", `Réseau : ${String(e).slice(0, 80)}`);
  }

  let data: Partial<KpayPayment> & { message?: string; error?: string } = {};
  try {
    data = (await resp.json()) as never;
  } catch { /* */ }

  if (!resp.ok || !data.id) {
    const msg = data.message ?? data.error ?? `Retrait refusé (HTTP ${resp.status})`;
    throw new KpayError("KPAY_WITHDRAW_REFUSED", msg, resp.status);
  }

  return data as KpayPayment;
}

export async function getWithdrawalStatus(withdrawalId: string): Promise<KpayPayment> {
  const resp = await fetch(`${KPAY_BASE}/api/v1/payments/withdraw/${withdrawalId}`, {
    method: "GET",
    headers: HEADERS_BASE(),
    signal: AbortSignal.timeout(15_000),
  });
  if (!resp.ok) throw new KpayError("KPAY_HTTP", `HTTP ${resp.status}`, resp.status);
  const body = (await resp.json()) as { data?: KpayPayment } & KpayPayment;
  return (body.data ?? body) as KpayPayment;
}

// =====================================================================
// Webhook signature
// =====================================================================

/**
 * Vérifie la signature HMAC-SHA256 d'un webhook K-Pay.
 * Si `secret` n'est pas fourni → renvoie `null` (vérification désactivée).
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean | null {
  const secret = process.env.KPAY_WEBHOOK_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProd) {
      console.error(
        "[KPAY SECURITY] KPAY_WEBHOOK_SECRET manquant en production — webhook rejeté.",
      );
      return false;
    }
    return null; // En dev sans secret = tolérant
  }
  if (!signature) {
    if (isProd) return false;
    return null;
  }

  const cleaned = signature.toLowerCase().replace(/^sha256=/, "");
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (cleaned.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(cleaned), Buffer.from(expected));
}

/** Helper : qualifie un statut K-Pay en succès / échec / pending. */
export function classifyStatus(status: string): "SUCCESS" | "FAILED" | "PENDING" {
  const s = status.toUpperCase();
  if (s === "COMPLETED" || s === "SUCCESS") return "SUCCESS";
  if (["FAILED", "EXPIRED", "CANCELLED", "REJECTED"].includes(s)) return "FAILED";
  return "PENDING";
}
