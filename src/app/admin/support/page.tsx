import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status ?? "OPEN") as "OPEN" | "IN_PROGRESS" | "WAITING_USER" | "CLOSED";

  const tickets = await prisma.supportTicket.findMany({
    where: { status },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          <MessageSquare className="mr-2 inline h-7 w-7" /> Service client
        </h1>
        <p className="text-muted-foreground">{tickets.length} tickets en statut {status}</p>
      </div>

      <div className="flex gap-2">
        {["OPEN", "IN_PROGRESS", "WAITING_USER", "CLOSED"].map((s) => (
          <Button key={s} asChild size="sm" variant={s === status ? "default" : "outline"}>
            <Link href={`/admin/support?status=${s}`}>{s}</Link>
          </Button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Aucun ticket {status}</Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/admin/support/${t.id}`}>
              <Card className="cursor-pointer p-4 transition hover:border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{t.category}</Badge>
                      <Badge>{t.status}</Badge>
                    </div>
                    <h3 className="mt-1 font-semibold">{t.subject}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t.user.name ?? t.user.email} · {t._count.messages} msg · {timeAgo(t.updatedAt)}
                    </p>
                  </div>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
