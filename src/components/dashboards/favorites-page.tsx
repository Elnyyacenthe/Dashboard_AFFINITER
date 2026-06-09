import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, Search, BadgeCheck, Crown, MapPin } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdGrid } from "@/components/ads/ad-grid";
import {
  FavoritesFilters,
  ClearInactiveButton,
  RemoveFavoriteCard,
} from "./favorites-controls";
import { formatXAF } from "@/lib/utils";

interface Props {
  backUrl?: string;
  searchParams?: Record<string, string | undefined>;
}

/**
 * Page Favoris — server.
 * Sépare les favoris en ACTIFS (affichage normal) et INDISPONIBLES
 * (annonces supprimées/expirées/bannies) avec nettoyage en 1 clic.
 * Filtres URL : ?city=slug&sort=recent|price_asc|price_desc
 */
export default async function FavoritesPage({ backUrl = "/favoris", searchParams = {} }: Props) {
  const session = await auth();
  if (!session?.user) redirect(`/connexion?callbackUrl=${backUrl}`);

  const citySlug = searchParams.city;
  const sort = (searchParams.sort ?? "recent") as "recent" | "price_asc" | "price_desc";

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      ad: {
        include: {
          city: { select: { id: true, name: true, slug: true } },
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

  // Séparation actifs / indisponibles
  const allActive = favorites.filter((f) => f.ad.status === "ACTIVE").map((f) => f.ad);
  const inactive = favorites.filter((f) => f.ad.status !== "ACTIVE").map((f) => f.ad);

  // Liste des villes présentes dans les favoris (pour le filtre)
  const citiesInFavs = Array.from(
    new Map(allActive.map((ad) => [ad.city.slug, ad.city])).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Filtre par ville
  let active = citySlug ? allActive.filter((ad) => ad.city.slug === citySlug) : allActive;

  // Tri
  active = [...active].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Stats
  const stats = {
    total: favorites.length,
    activeCount: allActive.length,
    boosted: allActive.filter((ad) => ad.tier !== "STANDARD").length,
    verified: allActive.filter((ad) => ad.profile?.isVerified).length,
    cities: citiesInFavs.length,
    avgPrice: allActive.length
      ? Math.round(allActive.reduce((s, ad) => s + ad.price, 0) / allActive.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <Heart className="h-7 w-7 fill-pink-500 text-pink-500" /> Mes favoris
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {stats.activeCount} annonce{stats.activeCount > 1 ? "s" : ""} active
          {stats.activeCount > 1 ? "s" : ""}
          {stats.total > stats.activeCount && ` · ${stats.total - stats.activeCount} indisponible${stats.total - stats.activeCount > 1 ? "s" : ""}`}
        </p>
      </header>

      {favorites.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Actives" value={stats.activeCount} icon={<Heart className="h-4 w-4" />} />
            <StatCard
              label="Premium/VIP"
              value={stats.boosted}
              icon={<Crown className="h-4 w-4 text-amber-500" />}
            />
            <StatCard
              label="Vérifiées"
              value={stats.verified}
              icon={<BadgeCheck className="h-4 w-4 text-emerald-500" />}
            />
            <StatCard
              label="Prix moyen"
              value={stats.avgPrice ? formatXAF(stats.avgPrice) : "—"}
              icon={<MapPin className="h-4 w-4" />}
            />
          </div>

          {/* Filtres */}
          {allActive.length > 0 && (
            <FavoritesFilters
              cities={citiesInFavs}
              currentCity={citySlug}
              currentSort={sort}
              backUrl={backUrl}
            />
          )}

          {/* Grille actives */}
          {active.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune annonce favorite ne correspond à ce filtre.
                </p>
                <Button asChild variant="link" className="mt-2">
                  <Link href={backUrl}>Réinitialiser les filtres</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {active.length} annonce{active.length > 1 ? "s" : ""}
                {citySlug && ` à ${citiesInFavs.find((c) => c.slug === citySlug)?.name}`}
              </h2>
              <AdGrid ads={active} />
            </div>
          )}

          {/* Section indisponibles */}
          {inactive.length > 0 && (
            <details className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Badge variant="secondary">{inactive.length}</Badge>
                  Annonces favorites devenues indisponibles
                </span>
                <ClearInactiveButton count={inactive.length} />
              </summary>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {inactive.map((ad) => (
                  <RemoveFavoriteCard
                    key={ad.id}
                    adId={ad.id}
                    title={ad.title}
                    cityName={ad.city.name}
                    status={ad.status}
                  />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="space-y-4 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/10">
          <Heart className="h-8 w-8 text-pink-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Aucun favori pour le moment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Parcourez les annonces et cliquez sur le cœur pour les retrouver ici.
          </p>
        </div>
        <Button asChild>
          <Link href={process.env.NEXT_PUBLIC_YAMO_URL ?? "/"} target={process.env.NEXT_PUBLIC_YAMO_URL ? "_blank" : undefined}>
            <Search className="h-4 w-4" /> Parcourir les annonces
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
