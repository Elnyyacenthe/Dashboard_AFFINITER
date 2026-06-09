import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { ReportActions } from "./_components/report-actions";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const tab = sp.tab ?? "OPEN";

  const reports = await prisma.report.findMany({
    where: { status: tab as never },
    include: {
      ad: { select: { id: true, title: true, slug: true } },
      reporter: { select: { email: true } },
      reportedUser: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Signalements</h1>
        <p className="text-muted-foreground">Modération communautaire</p>
      </div>

      <div className="flex gap-2">
        {["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"].map((s) => (
          <Button
            key={s}
            asChild
            variant={tab === s ? "default" : "outline"}
            size="sm"
          >
            <Link href={`/admin/signalements?tab=${s}`}>{s}</Link>
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {reports.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Aucun signalement dans ce statut</p>
          </Card>
        )}
        {reports.map((r) => (
          <Card key={r.id}>
            <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="destructive">{r.reason}</Badge>
                  <Badge variant="outline">{r.status}</Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                </div>
                {r.ad && (
                  <p>
                    Annonce visée :{" "}
                    <Link
                      href={`/annonce/${r.ad.slug}`}
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      {r.ad.title}
                    </Link>
                  </p>
                )}
                {r.reportedUser && (
                  <p className="text-xs text-muted-foreground">
                    Utilisateur visé : {r.reportedUser.email ?? r.reportedUser.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Signalé par : {r.reporter?.email ?? "anonyme"}
                </p>
                {r.details && (
                  <p className="rounded bg-secondary/40 p-3 text-sm">{r.details}</p>
                )}
                {r.resolution && (
                  <p className="rounded bg-emerald-500/10 p-3 text-sm text-emerald-300">
                    Résolution : {r.resolution}
                  </p>
                )}
              </div>
              {r.status === "OPEN" && <ReportActions reportId={r.id} adId={r.ad?.id ?? null} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
