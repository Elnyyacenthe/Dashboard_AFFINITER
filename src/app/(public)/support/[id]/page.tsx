import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { ReplyForm } from "./_reply-form";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/support");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!ticket || ticket.userId !== session.user.id) notFound();

  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/support"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        </Button>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{ticket.category}</Badge>
            <Badge>{ticket.status}</Badge>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-xs text-muted-foreground">Ouvert {timeAgo(ticket.createdAt)}</p>
        </div>

        <div className="space-y-3">
          {ticket.messages.map((m) => (
            <Card
              key={m.id}
              className={m.isAdmin ? "border-primary/40 bg-primary/5" : "border-border/60"}
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <strong className={m.isAdmin ? "text-primary" : ""}>
                    {m.isAdmin ? "🛡️ Équipe Yamo" : m.author.name ?? "Vous"}
                  </strong>
                  <span>{timeAgo(m.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{m.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {!isClosed ? (
          <Card>
            <CardContent className="p-4">
              <ReplyForm ticketId={ticket.id} />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              Ce ticket est fermé. Ouvrez-en un nouveau si nécessaire.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
