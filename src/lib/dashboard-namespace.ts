import type { Role } from "@prisma/client";

/**
 * Retourne le namespace de dashboard selon le rôle :
 *   - ADMIN/MODERATOR → "/admin"
 *   - ESCORT          → "/escort"
 *   - CLIENT          → "/client"
 *
 * Utilisé pour construire les liens dans les notifications, le header, etc.
 */
export function getDashboardNamespace(role: Role): string {
  if (role === "ADMIN" || role === "MODERATOR") return "/admin";
  if (role === "ESCORT") return "/escort";
  return "/client";
}
