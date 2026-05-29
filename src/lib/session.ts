import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Session courante — dédoublonnée pour la même requête HTTP.
 * Plusieurs Server Components peuvent l'appeler sans déclencher
 * de re-décodage du JWT.
 */
export const getSession = cache(async () => {
  return auth();
});

/**
 * Charge le user enrichi depuis la DB (wallet, role à jour, etc.).
 * Cache par session : si appelé 5x dans une page, 1 seule query.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.user) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      image: true,
      walletBalance: true,
      referralCode: true,
    },
  });
});
