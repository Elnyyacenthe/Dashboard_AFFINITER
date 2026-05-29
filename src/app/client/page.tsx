import Link from "next/link";
import { Heart, Wallet, Gift, ListChecks, Search, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { AdGrid } from "@/components/ads/ad-grid";
import { formatXAF } from "@/lib/utils";

export default async function ClientDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, recentFavorites, popularAds] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletBalance: true,
        referralCode: true,
        referralBonusGiven: true,
        name: true,
        _count: { select: { favorites: true, referrals: true } },
      },
    }),
    prisma.favorite.findMany({
      where: { userId },
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
      take: 4,
    }),
    prisma.ad.findMany({
      where: { status: "ACTIVE", tier: { in: ["VIP", "PREMIUM"] } },
      include: {
        city: { select: { name: true, slug: true } },
        media: { select: { url: true, isPrimary: true, type: true }, orderBy: { position: "asc" } },
        profile: { select: { isVerified: true, age: true } },
      },
      orderBy: [{ tier: "desc" }, { promotedUntil: "desc" }],
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Bonjour <span className="gradient-text">{user?.name ?? ""}</span> 👋
        </h1>
        <p className="text-muted-foreground">Votre espace personnel</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Solde" value={formatXAF(user?.walletBalance ?? 0)} icon={Wallet} />
        <StatCard label="Favoris" value={user?._count.favorites ?? 0} icon={Heart} />
        <StatCard label="Filleuls" value={user?._count.referrals ?? 0} icon={Gift} />
        <StatCard
          label="Bonus reçus"
          value={formatXAF(user?.referralBonusGiven ?? 0)}
          icon={Sparkles}
        />
      </div>

      {/* Upgrade Escort — appel à l'action principal pour un CLIENT */}
      <Card className="border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-card to-primary/10">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center md:flex-row md:text-left">
          <Sparkles className="h-10 w-10 text-amber-400" />
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold">
              Vous voulez publier des annonces ?
            </h3>
            <p className="text-sm text-muted-foreground">
              Passez côté <span className="gradient-text font-bold">Escort</span> en quelques clics et accédez
              au dashboard, statistiques, options Premium, retraits MoMo…
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/client/devenir-escort">
              <Sparkles className="h-4 w-4" /> Devenir escort
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center md:flex-row md:text-left">
          <Gift className="h-10 w-10 text-primary" />
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold">Votre code parrainage</h3>
            <p className="text-sm text-muted-foreground">
              Partagez{" "}
              <strong className="font-mono text-primary">{user?.referralCode}</strong> et gagnez à
              chaque inscription.
            </p>
          </div>
          <Button asChild>
            <Link href="/client/parrainage">Partager</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <Heart className="h-5 w-5 fill-pink-500 text-pink-500" /> Mes favoris récents
            </h2>
            <Button asChild variant="link" size="sm">
              <Link href="/client/favoris">Tout voir →</Link>
            </Button>
          </div>
          {recentFavorites.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">Vous n'avez pas encore de favoris.</p>
              <Button asChild className="mt-4">
                <Link href="/recherche">
                  <Search /> Explorer les annonces
                </Link>
              </Button>
            </div>
          ) : (
            <AdGrid ads={recentFavorites.map((f) => f.ad)} priority={4} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-display text-xl font-bold">⭐ Sélection à découvrir</h2>
          <AdGrid ads={popularAds} priority={3} />
        </CardContent>
      </Card>
    </div>
  );
}
