import { redirect } from "next/navigation";
import { Heart } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdGrid } from "@/components/ads/ad-grid";

/** Page Favoris — partagée. Affiche les annonces actives uniquement. */
export default async function FavoritesPage({ backUrl = "/favoris" }: { backUrl?: string }) {
  const session = await auth();
  if (!session?.user) redirect(`/connexion?callbackUrl=${backUrl}`);

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      ad: {
        include: {
          city: { select: { name: true, slug: true } },
          media: {
            select: { url: true, isPrimary: true, type: true },
            orderBy: { position: "asc" },
          },
          profile: { select: { isVerified: true, age: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const ads = favorites.map((f) => f.ad).filter((ad) => ad.status === "ACTIVE");

  return (
    <div className="space-y-4">
      <h1 className="mb-2 flex items-center gap-2 font-display text-3xl font-bold">
        <Heart className="h-7 w-7 fill-pink-500 text-pink-500" /> Mes favoris
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {ads.length} annonce{ads.length > 1 ? "s" : ""} dans vos favoris
      </p>
      <AdGrid ads={ads} />
    </div>
  );
}
