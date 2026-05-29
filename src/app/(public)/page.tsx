import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDashboardNamespace, isExternalUrl } from "@/lib/dashboard-namespace";

/**
 * Racine du dashboard — redirige automatiquement vers l'espace du rôle
 * connecté, ou vers la page de connexion si non authentifié.
 *
 * Pour les ADMIN/MODERATOR, on redirige vers l'interface admin du projet
 * Yamo principal (yamo.cm/admin) car ce dashboard ne contient pas l'admin.
 */
export default async function DashboardRoot() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/");

  const target = getDashboardNamespace(session.user.role);

  // Si URL externe (cas ADMIN/MODERATOR), on redirige hors du dashboard.
  if (isExternalUrl(target)) redirect(target);

  if (target === "/escort") redirect("/escort/dashboard");
  redirect("/client");
}
