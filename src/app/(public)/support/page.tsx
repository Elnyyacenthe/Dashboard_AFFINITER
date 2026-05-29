import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; variant: "secondary" | "success" | "outline" }> = {
  OPEN: { label: "Ouvert", variant: "outline" },
  IN_PROGRESS: { label: "En cours", variant: "outline" },
  WAITING_USER: { label: "Réponse à fournir", variant: "outline" },
  CLOSED: { label: "Fermé", variant: "secondary" },
};

export default async function SupportListPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/support");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">
              <MessageSquare className="mr-2 inline h-7 w-7 text-primary" /> Mes tickets support
            </h1>
            <p className="text-sm text-muted-foreground">
              Posez vos questions à l'équipe Yamo, suivez vos demandes.
            </p>
          </div>
          <Button asChild>
            <Link href="/support/nouveau">
              <Plus /> Nouveau ticket
            </Link>
          </Button>
        </div>

        {tickets.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Vous n'avez pas encore de ticket support.</p>
            <Button asChild className="mt-4">
              <Link href="/support/nouveau">Créer mon premier ticket</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const status = STATUS_LABEL[t.status] ?? STATUS_LABEL.OPEN;
              return (
                <Link key={t.id} href={`/support/${t.id}`}>
                  <Card className="cursor-pointer transition hover:border-primary">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{t.category}</Badge>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <h3 className="mt-1 font-semibold">{t.subject}</h3>
                        <p className="text-xs text-muted-foreground">
                          {t._count.messages} message{t._count.messages > 1 ? "s" : ""} ·{" "}
                          {timeAgo(t.updatedAt)}
                        </p>
                      </div>
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
