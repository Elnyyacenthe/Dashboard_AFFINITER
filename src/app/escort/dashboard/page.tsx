import Link from "next/link";
import { Eye, MessageCircle, ListChecks, Crown, Plus } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AdCard } from "@/components/ads/ad-card";

export default async function EscortDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const [ads, totalViews, totalClicks, activeCount, pendingCount] = await Promise.all([
    prisma.ad.findMany({
      where: { ownerId: userId },
      include: {
        city: { select: { name: true, slug: true } },
        media: { select: { url: true, isPrimary: true, type: true }, orderBy: { position: "asc" } },
        profile: { select: { isVerified: true, age: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.ad.aggregate({ where: { ownerId: userId }, _sum: { views: true } }),
    prisma.ad.aggregate({ where: { ownerId: userId }, _sum: { whatsappClicks: true } }),
    prisma.ad.count({ where: { ownerId: userId, status: "ACTIVE" } }),
    prisma.ad.count({ where: { ownerId: userId, status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Bonjour <span className="gradient-text">{session?.user.name ?? ""}</span> 👋
          </h1>
          <p className="text-muted-foreground">Voici un aperçu de votre activité</p>
        </div>
        <Button asChild>
          <Link href="/poster-une-annonce">
            <Plus /> Nouvelle annonce
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Annonces actives" value={activeCount} icon={ListChecks} />
        <StatCard label="En modération" value={pendingCount} icon={Crown} hint="Validation < 24h" />
        <StatCard label="Vues totales" value={totalViews._sum.views ?? 0} icon={Eye} />
        <StatCard
          label="Clics WhatsApp"
          value={totalClicks._sum.whatsappClicks ?? 0}
          icon={MessageCircle}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Mes dernières annonces</h2>
            <Button asChild variant="link">
              <Link href="/escort/annonces">Voir tout →</Link>
            </Button>
          </div>
          {ads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">Vous n'avez pas encore d'annonce</p>
              <Button asChild className="mt-4">
                <Link href="/poster-une-annonce">Créer ma première annonce</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
