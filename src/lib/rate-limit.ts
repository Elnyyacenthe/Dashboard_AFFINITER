/**
 * Rate limit hybride :
 *   - Production : Upstash Redis (distribué, multi-instance)
 *   - Dev / sans config : token bucket en mémoire (fallback)
 *
 * Si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN sont définis,
 * on utilise Upstash. Sinon, fallback in-memory (NON sûr en multi-instance).
 *
 * ⚠️ En production multi-instance (Vercel scale), il EST OBLIGATOIRE de
 * configurer Upstash, sinon le rate limit est contournable.
 */

// =====================================================================
// FALLBACK IN-MEMORY (dev / single-instance)
// =====================================================================
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(
  key: string,
  opts: RateLimitOptions,
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + opts.windowMs;
    memoryBuckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: opts.limit - 1, resetAt };
  }
  if (bucket.count >= opts.limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return { success: true, remaining: opts.limit - bucket.count, resetAt: bucket.resetAt };
}

// =====================================================================
// UPSTASH REST CLIENT (sans dépendance lourde : juste fetch)
// =====================================================================

interface UpstashConfig {
  url: string;
  token: string;
}

function getUpstashConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

/**
 * Atomique : incrémente une clé Redis et renvoie la nouvelle valeur.
 * Pose un TTL la 1ère fois (donc fenêtre glissante simple).
 */
async function upstashIncrWithTTL(
  cfg: UpstashConfig,
  key: string,
  ttlSec: number,
): Promise<number> {
  // INCR
  const resInc = await fetch(`${cfg.url}/INCR/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  const data = (await resInc.json()) as { result?: number };
  const count = data.result ?? 0;
  if (count === 1) {
    // Première hit dans cette fenêtre → pose TTL
    await fetch(`${cfg.url}/EXPIRE/${encodeURIComponent(key)}/${ttlSec}`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
  }
  return count;
}

async function upstashRateLimit(
  cfg: UpstashConfig,
  key: string,
  opts: RateLimitOptions,
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const ttlSec = Math.ceil(opts.windowMs / 1000);
  try {
    const count = await upstashIncrWithTTL(cfg, `rl:${key}`, ttlSec);
    const remaining = Math.max(0, opts.limit - count);
    const resetAt = Date.now() + opts.windowMs;
    return { success: count <= opts.limit, remaining, resetAt };
  } catch (e) {
    // En cas de panne Redis, on tombe sur le fallback mémoire pour ne pas bloquer le service.
    console.warn("[rate-limit] Upstash unreachable, fallback memory:", e);
    return memoryRateLimit(key, opts);
  }
}

// =====================================================================
// API publique
// =====================================================================

export interface RateLimitOptions {
  /** Nombre maximum de requêtes dans la fenêtre. */
  limit: number;
  /** Durée de la fenêtre en ms. */
  windowMs: number;
}

/**
 * Renvoie la décision de rate limit pour `key`.
 *
 * **ATTENTION** : Upstash étant async, cette fonction est async désormais
 * (signature changée vs version mémoire). Tous les callers doivent l'awaiter.
 */
export async function rateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const cfg = getUpstashConfig();
  if (cfg) return upstashRateLimit(cfg, key, opts);
  return memoryRateLimit(key, opts);
}

/** Presets fréquents. */
export const RL = {
  auth: { limit: 5, windowMs: 60_000 },
  adCreate: { limit: 3, windowMs: 60 * 60_000 },
  report: { limit: 5, windowMs: 60_000 },
  upload: { limit: 20, windowMs: 60_000 },
  deposit: { limit: 10, windowMs: 60_000 },
  withdraw: { limit: 5, windowMs: 60_000 },
  otp: { limit: 3, windowMs: 60_000 }, // 3 OTP / min (anti-spam)
} as const;
