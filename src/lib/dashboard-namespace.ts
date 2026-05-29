import type { Role } from "@prisma/client";

/**
 * URL externe vers l'interface admin (hébergée dans le projet Yamo principal).
 * Configurable via NEXT_PUBLIC_YAMO_ADMIN_URL ; à défaut, dérivée de NEXT_PUBLIC_YAMO_URL.
 */
function getAdminExternalUrl(): string {
  const adminUrl = process.env.NEXT_PUBLIC_YAMO_ADMIN_URL;
  if (adminUrl) return adminUrl;
  const yamoUrl = process.env.NEXT_PUBLIC_YAMO_URL ?? "https://yamo.cm";
  return `${yamoUrl}/admin`;
}

/**
 * Retourne le namespace de dashboard selon le rôle :
 *   - ADMIN/MODERATOR → URL externe vers yamo.cm/admin
 *   - ESCORT          → "/escort"
 *   - CLIENT          → "/client"
 *
 * Note : ce dashboard ne contient pas l'interface admin (déplacée dans le projet Yamo principal).
 */
export function getDashboardNamespace(role: Role): string {
  if (role === "ADMIN" || role === "MODERATOR") return getAdminExternalUrl();
  if (role === "ESCORT") return "/escort";
  return "/client";
}

/** Indique si une chaîne est une URL absolue (commence par http[s]://). */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
