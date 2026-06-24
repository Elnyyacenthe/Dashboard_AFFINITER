import type { Role } from "@prisma/client";

/**
 * URL externe vers le back-office admin (yamo-dashboard).
 * Configurable via NEXT_PUBLIC_DASHBOARD_URL ; à défaut, https://dashboard.affinité.com.
 */
function getDashboardExternalUrl(): string {
  return process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "https://dashboard.affinité.com";
}

/**
 * Retourne la destination après login selon le rôle.
 *
 * Architecture v2 (depuis 2026) : escort/client sont intégrés à yamo (interne).
 * Seul l'admin est externe (yamo-dashboard / dashboard.affinité.com).
 *
 *   - ADMIN / MODERATOR → URL externe back-office
 *   - ESCORT            → /escort/dashboard (interne yamo)
 *   - CLIENT            → /client (interne yamo)
 */
export function getDashboardNamespace(role: Role): string {
  if (role === "ADMIN" || role === "MODERATOR") {
    return `${getDashboardExternalUrl()}/admin`;
  }
  if (role === "ESCORT") return "/escort/dashboard";
  return "/client";
}

/** Indique si une chaîne est une URL absolue (http[s]://…). */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
