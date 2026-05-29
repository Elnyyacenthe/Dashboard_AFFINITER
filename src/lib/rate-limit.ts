/**
 * Rate limit en mémoire (token bucket simple).
 * Pour la prod, remplacer par Upstash Redis + @upstash/ratelimit.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitOptions {
  /** Nombre maximum de requêtes dans la fenêtre. */
  limit: number;
  /** Durée de la fenêtre en ms. */
  windowMs: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: opts.limit - 1, resetAt };
  }

  if (bucket.count >= opts.limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { success: true, remaining: opts.limit - bucket.count, resetAt: bucket.resetAt };
}

/** Presets fréquents. */
export const RL = {
  auth: { limit: 5, windowMs: 60_000 },        // 5 tentatives / min
  adCreate: { limit: 3, windowMs: 60 * 60_000 }, // 3 annonces / h
  report: { limit: 5, windowMs: 60_000 },
  upload: { limit: 20, windowMs: 60_000 },
} as const;
