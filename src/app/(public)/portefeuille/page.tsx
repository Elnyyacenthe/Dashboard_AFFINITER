import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDashboardNamespace } from "@/lib/dashboard-namespace";

/**
 * Route de compatibilité : redirige vers le bon namespace selon le rôle.
 * Utile pour les liens externes (notifications, emails) qui ne connaissent
 * pas le rôle de l'utilisateur cible au moment de leur création.
 */
export default async function PortefeuilleRedirect() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/portefeuille");
  const ns = getDashboardNamespace(session.user.role);
  redirect(`${ns}/portefeuille`);
}
