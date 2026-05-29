import { redirect } from "next/navigation";
import { Crown, Star } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { formatXAF } from "@/lib/utils";
import { PayTierForm } from "./_pay-form";

export default async function PayTierPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; amount?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const sp = await searchParams;
  const tier = (sp.tier as "PREMIUM" | "VIP" | undefined) ?? "PREMIUM";
  const amount = Number(sp.amount ?? 5000);
  const Icon = tier === "VIP" ? Crown : Star;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, walletBalance: true },
  });

  return (
    <div className="mx-auto max-w-md py-8">
      <Card className={tier === "VIP" ? "border-amber-500/50" : "border-primary/50"}>
        <CardContent className="space-y-4 p-8 text-center">
          <Icon
            className={`mx-auto h-12 w-12 ${tier === "VIP" ? "text-amber-400" : "text-primary"}`}
          />
          <CardTitle className="font-display text-3xl">Activer {tier}</CardTitle>
          <CardDescription>
            {tier === "VIP"
              ? "Top de la page d'accueil, badge VIP doré, photos illimitées"
              : "Mise en avant ville, badge Premium, 10 photos"}
          </CardDescription>
          <p className="font-display text-4xl font-bold gradient-text">{formatXAF(amount)}</p>
          <p className="text-xs text-muted-foreground">pour 30 jours</p>

          <PayTierForm
            tier={tier}
            amount={amount}
            defaultPhone={user?.phone ?? ""}
            walletBalance={user?.walletBalance ?? 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
