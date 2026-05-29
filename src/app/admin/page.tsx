import { Users, ListChecks, Flag, CreditCard, Eye, BadgeCheck, Crown } from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatXAF, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  const [
    usersCount,
    escortCount,
    activeAds,
    pendingAds,
    openReports,
    revenue,
    totalViews,
    recentSignups,
    recentReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ESCORT" } }),
    prisma.ad.count({ where: { status: "ACTIVE" } }),
    prisma.ad.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.adView.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { ad: { select: { title: true, slug: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Vue <span className="gradient-text">d'ensemble</span>
        </h1>
        <p className="text-muted-foreground">État du site en temps réel</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Utilisateurs" value={usersCount} icon={Users} hint={`dont ${escortCount} escorts`} />
        <StatCard label="Annonces actives" value={activeAds} icon={ListChecks} />
        <StatCard label="En modération" value={pendingAds} icon={BadgeCheck} hint="À traiter" />
        <StatCard label="Signalements ouverts" value={openReports} icon={Flag} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Revenus totaux" value={formatXAF(revenue._sum.amount ?? 0)} icon={CreditCard} />
        <StatCard label="Vues totales" value={totalViews} icon={Eye} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Nouveaux utilisateurs</h2>
              <Button asChild variant="link">
                <Link href="/admin/utilisateurs">Tout voir →</Link>
              </Button>
            </div>
            <ul className="space-y-3">
              {recentSignups.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{u.name ?? u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.email} · <Badge variant="outline">{u.role}</Badge>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(u.createdAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Signalements récents</h2>
              <Button asChild variant="link">
                <Link href="/admin/signalements">Tout voir →</Link>
              </Button>
            </div>
            <ul className="space-y-3">
              {recentReports.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      <Badge variant="destructive" className="mr-2">{r.reason}</Badge>
                      {r.ad?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</p>
                  </div>
                  {r.ad && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/signalements`}>Examiner</Link>
                    </Button>
                  )}
                </li>
              ))}
              {recentReports.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun signalement ouvert 🎉</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
