import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatXAF, timeAgo } from "@/lib/utils";

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab ?? "PENDING";

  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: { status: tab as never },
    include: {
      user: { select: { email: true, name: true, phone: true } },
      approvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalPending = await prisma.withdrawalRequest.aggregate({
    where: { status: "PENDING" },
    _sum: { amount: true },
    _count: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Retraits</h1>
        <p className="text-muted-foreground">
          {totalPending._count} demandes en attente — total{" "}
          <strong>{formatXAF(totalPending._sum.amount ?? 0)}</strong>
        </p>
      </div>

      <div className="flex gap-2">
        {["PENDING", "PAID", "FAILED"].map((s) => (
          <Button key={s} asChild variant={tab === s ? "default" : "outline"} size="sm">
            <Link href={`/admin/retraits?tab=${s}`}>{s}</Link>
          </Button>
        ))}
      </div>

      {withdrawals.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Aucun retrait dans ce statut</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Vers</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Réf K-Pay</th>
                  <th className="p-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border/30">
                    <td className="p-3 text-xs">{timeAgo(w.createdAt)}</td>
                    <td className="p-3 text-xs">
                      <div>{w.user.name ?? w.user.email}</div>
                      <div className="text-muted-foreground">{w.user.email}</div>
                    </td>
                    <td className="p-3 font-bold">{formatXAF(w.amount)}</td>
                    <td className="p-3 font-mono text-xs">{w.destinationPhone}</td>
                    <td className="p-3"><Badge variant="outline">{w.provider}</Badge></td>
                    <td className="p-3 font-mono text-xs">{w.providerRef ?? "—"}</td>
                    <td className="p-3">
                      <Badge variant={
                        w.status === "PAID" ? "success" :
                        w.status === "FAILED" ? "destructive" : "secondary"
                      }>{w.status}</Badge>
                      {w.failureReason && (
                        <p className="mt-1 text-[10px] text-destructive">{w.failureReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
