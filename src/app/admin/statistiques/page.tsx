import { Users, Eye, MessageCircle, CreditCard, ListChecks, Crown } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatXAF } from "@/lib/utils";

export default async function AdminStatsPage() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [
    users,
    escorts,
    activeAds,
    vipAds,
    premiumAds,
    views7d,
    clicks7d,
    revenue,
    byCity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ESCORT" } }),
    prisma.ad.count({ where: { status: "ACTIVE" } }),
    prisma.ad.count({ where: { status: "ACTIVE", tier: "VIP" } }),
    prisma.ad.count({ where: { status: "ACTIVE", tier: "PREMIUM" } }),
    prisma.adView.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.ad.aggregate({ _sum: { whatsappClicks: true } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.ad.groupBy({
      by: ["cityId"],
      where: { status: "ACTIVE" },
      _count: true,
      orderBy: { _count: { cityId: "desc" } },
      take: 10,
    }),
  ]);

  const cities = await prisma.city.findMany({
    where: { id: { in: byCity.map((b) => b.cityId) } },
    select: { id: true, name: true },
  });
  const cityName = (id: string) => cities.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Statistiques globales</h1>
        <p className="text-muted-foreground">Vue détaillée de l'activité</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Utilisateurs" value={users} icon={Users} hint={`${escorts} escorts`} />
        <StatCard label="Annonces actives" value={activeAds} icon={ListChecks} />
        <StatCard label="VIP / Premium" value={`${vipAds} / ${premiumAds}`} icon={Crown} />
        <StatCard label="Revenus" value={formatXAF(revenue._sum.amount ?? 0)} icon={CreditCard} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Vues / 7 jours" value={views7d} icon={Eye} />
        <StatCard label="Clics WhatsApp" value={clicks7d._sum.whatsappClicks ?? 0} icon={MessageCircle} />
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-display text-xl font-bold">Top villes</h2>
          <div className="space-y-2">
            {byCity.map((b, idx) => (
              <div key={b.cityId} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <span>
                  <span className="font-display text-lg text-primary">#{idx + 1}</span> {cityName(b.cityId)}
                </span>
                <span className="text-sm font-semibold">{b._count} annonces</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
