import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDashboardNamespace } from "@/lib/dashboard-namespace";

/**
 * Racine du dashboard — redirige automatiquement vers l'espace du rôle
 * connecté, ou vers la page de connexion si non authentifié.
 *
 * Cette appli (Dashboard_YAMO) est l'interface back-office. Le marketing
 * public est servi par l'appli `yamo` séparée (yamo.cm).
 */
export default async function DashboardRoot() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/");

  const ns = getDashboardNamespace(session.user.role);
  if (ns === "/admin") redirect("/admin");
  if (ns === "/escort") redirect("/escort/dashboard");
  redirect("/client");
}
