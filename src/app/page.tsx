import { redirect } from "next/navigation";

import { auth } from "@/auth";

/**
 * yamo-dashboard.cm — back-office Yamo (admin + dev + service client).
 *
 * Pas d'espace public : tous les visiteurs sont redirigés
 *   - non connecté → /connexion
 *   - connecté admin → /admin
 *   - connecté non-admin → yamo.cm
 */
export default async function DashboardRootPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/admin");

  const role = session.user.role;
  if (role === "ADMIN" || role === "MODERATOR") {
    redirect("/admin");
  }

  // ESCORT/CLIENT n'ont rien à faire ici → renvoyer sur yamo.cm
  const yamoUrl = process.env.NEXT_PUBLIC_YAMO_URL ?? "https://yamo.cm";
  redirect(yamoUrl);
}
