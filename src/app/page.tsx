import { redirect } from "next/navigation";

import { auth } from "@/auth";

/**
 * yamo-dashboard.cm — back-office Affiniter (admin + dev + service client).
 *
 * Pas d'espace public : tous les visiteurs sont redirigés
 *   - non connecté → /connexion
 *   - connecté admin → /admin
 *   - connecté non-admin → affiniter.cm
 */
export default async function DashboardRootPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/admin");

  const role = session.user.role;
  if (role === "ADMIN" || role === "MODERATOR") {
    redirect("/admin");
  }

  // ESCORT/CLIENT n'ont rien à faire ici → renvoyer sur affiniter.cm
  const yamoUrl = process.env.NEXT_PUBLIC_AFFINITER_URL ?? "https://affiniter.cm";
  redirect(yamoUrl);
}
