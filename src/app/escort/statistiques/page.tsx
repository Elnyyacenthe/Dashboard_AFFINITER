import { Eye, MessageCircle, ListChecks, TrendingUp } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function StatsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [agg, weekViews, topAds, recentViews] = await Promise.all([
    prisma.ad.aggregate({
      where: { ownerId: userId },
      _sum: { views: true, whatsappClicks: true },
      _count: true,
    }),
    prisma.adView.count({
      where: { ad: { ownerId: userId }, createdAt: { gte: weekAgo } },
    }),
    prisma.ad.findMany({
      where: { ownerId: userId },
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, title: true, views: true, whatsappClicks: true },
    }),
    prisma.adView.groupBy({
      by: ["adId"],
      where: { ad: { ownerId: userId }, createdAt: { gte: weekAgo } },
      _count: true,
      orderBy: { _count: { adId: "desc" } },
      take: 7,
    }),
  ]);

  const ctr =
    agg._sum.views && agg._sum.views > 0
      ? Math.round(((agg._sum.whatsappClicks ?? 0) / agg._sum.views) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground">Performance de vos annonces sur les 7 derniers jours</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Vues totales" value={agg._sum.views ?? 0} icon={Eye} />
        <StatCard label="Vues / 7j" value={weekViews} icon={TrendingUp} />
        <StatCard label="Clics WhatsApp" value={agg._sum.whatsappClicks ?? 0} icon={MessageCircle} />
        <StatCard label="Taux de conversion" value={`${ctr}%`} icon={ListChecks} hint="WhatsApp / vues" />
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-display text-xl font-bold">🏆 Top annonces</h2>
          <div className="space-y-3">
            {topAds.map((ad, idx) => (
              <div
                key={ad.id}
                className="flex items-center justify-between rounded-lg border border-border/40 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl text-primary">#{idx + 1}</span>
                  <span className="line-clamp-1 text-sm">{ad.title}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {ad.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" /> {ad.whatsappClicks}
                  </span>
                </div>
              </div>
            ))}
            {topAds.length === 0 && (
              <p className="text-sm text-muted-foreground">Pas encore de données</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
