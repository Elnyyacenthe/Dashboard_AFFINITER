import { CreditCard, TrendingUp, TrendingDown, MapPin } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatXAF } from "@/lib/utils";
import { RevenueCharts } from "./_charts";

/** Aggregate des revenus par jour sur N derniers jours. */
async function getDailyRevenue(daysBack: number) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const rows = await prisma.$queryRaw<Array<{ day: string; total: bigint; count: bigint }>>`
    SELECT
      to_char("paidAt", 'YYYY-MM-DD') as day,
      SUM("amount")::bigint as total,
      COUNT(*)::bigint as count
    FROM "Payment"
    WHERE "status" = 'PAID' AND "paidAt" >= ${since}
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({
    day: r.day,
    total: Number(r.total),
    count: Number(r.count),
  }));
}

/** Aggregate par tier (tier nullable pour Bumps/Stickies). */
async function getRevenueByType() {
  const rows = await prisma.$queryRaw<
    Array<{ type: string; total: bigint }>
  >`
    SELECT
      COALESCE("metadata"->>'type', COALESCE("tier"::text, 'OTHER')) as type,
      SUM("amount")::bigint as total
    FROM "Payment"
    WHERE "status" = 'PAID'
    GROUP BY type
    ORDER BY total DESC
  `;
  return rows.map((r) => ({ type: r.type, total: Number(r.total) }));
}

/** Top villes par revenus. */
async function getRevenueByCity(limit = 10) {
  const rows = await prisma.$queryRaw<
    Array<{ name: string; total: bigint }>
  >`
    SELECT
      c."name" as name,
      SUM(p."amount")::bigint as total
    FROM "Payment" p
    JOIN "Ad" a ON p."adId" = a."id"
    JOIN "City" c ON a."cityId" = c."id"
    WHERE p."status" = 'PAID'
    GROUP BY c."name"
    ORDER BY total DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ name: r.name, total: Number(r.total) }));
}

export default async function AdminRevenuesPage() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000);
  const monthAgo = new Date(today.getTime() - 30 * 86_400_000);
  const prevMonth = new Date(today.getTime() - 60 * 86_400_000);

  const [
    revenueTotal,
    revenueToday,
    revenueWeek,
    revenueMonth,
    revenuePrevMonth,
    daily30,
    byType,
    byCity,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: today } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: weekAgo } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: monthAgo } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: prevMonth, lt: monthAgo } },
      _sum: { amount: true },
    }),
    getDailyRevenue(30),
    getRevenueByType(),
    getRevenueByCity(8),
  ]);

  const monthValue = revenueMonth._sum.amount ?? 0;
  const prevValue = revenuePrevMonth._sum.amount ?? 0;
  const growth = prevValue > 0 ? Math.round(((monthValue - prevValue) / prevValue) * 100) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">
          <CreditCard className="mr-2 inline h-7 w-7 text-primary" /> Revenus
        </h1>
        <p className="text-muted-foreground">
          Vue détaillée des paiements payés — Premium, VIP, Diamond, Bumps, Sticky, photos service, vérifications, retraits.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Aujourd'hui" value={formatXAF(revenueToday._sum.amount ?? 0)} icon={CreditCard} />
        <StatCard label="7 derniers jours" value={formatXAF(revenueWeek._sum.amount ?? 0)} icon={CreditCard} />
        <StatCard
          label="30 derniers jours"
          value={formatXAF(monthValue)}
          icon={CreditCard}
          trend={growth !== null ? { value: Math.abs(growth), isPositive: growth >= 0 } : undefined}
        />
        <StatCard
          label="Total tout temps"
          value={formatXAF(revenueTotal._sum.amount ?? 0)}
          icon={revenueTotal._count > 0 ? TrendingUp : TrendingDown}
          hint={`${revenueTotal._count} transactions`}
        />
      </div>

      {/* Graphiques côté client */}
      <RevenueCharts daily30={daily30} byType={byType} byCity={byCity} />

      {/* Tableau top villes */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <MapPin className="h-5 w-5 text-primary" /> Top villes
          </h2>
          <div className="space-y-2">
            {byCity.map((c, idx) => (
              <div
                key={c.name}
                className="flex items-center justify-between rounded-lg border border-border/40 p-3"
              >
                <span>
                  <span className="font-display text-lg text-primary">#{idx + 1}</span> {c.name}
                </span>
                <span className="font-semibold">{formatXAF(c.total)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
