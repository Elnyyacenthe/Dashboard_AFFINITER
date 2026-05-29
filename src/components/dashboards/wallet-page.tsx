import { redirect } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowDownLeft, ArrowUpRight, History, Gift, Users } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatXAF, timeAgo } from "@/lib/utils";
import { DepositDialog, WithdrawDialog } from "./wallet-actions";

/**
 * Contenu de la page Portefeuille — partagé entre /client/portefeuille et /escort/portefeuille.
 * Les data sont chargées côté server, l'utilisateur est résolu via l'auth session.
 *
 * @param backUrl URL de retour si l'utilisateur n'est pas authentifié (callback de connexion)
 */
export default async function WalletPage({ backUrl = "/portefeuille" }: { backUrl?: string }) {
  const session = await auth();
  if (!session?.user) redirect(`/connexion?callbackUrl=${backUrl}`);

  const [user, txs, pendingDeposits, pendingWithdrawals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        walletBalance: true,
        phone: true,
        referralCode: true,
        referralBonusGiven: true,
        role: true,
        _count: { select: { referrals: true } },
      },
    }),
    prisma.walletTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.payment.count({ where: { userId: session.user.id, status: "PENDING" } }),
    prisma.withdrawalRequest.count({ where: { userId: session.user.id, status: "PENDING" } }),
  ]);

  if (!user) redirect("/connexion");

  // Lien parrainage : adapté au rôle pour rester dans le bon dashboard
  const referralLink = user.role === "ESCORT" ? "/escort/parrainage" : "/client/parrainage";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Mon portefeuille</h1>

      <Card className="border-primary/40 bg-gradient-to-br from-primary/20 via-card to-accent/10">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Wallet className="h-5 w-5" />
            <span className="text-sm uppercase">Solde disponible</span>
          </div>
          <p className="mt-2 font-display text-5xl font-bold gradient-text">
            {formatXAF(user.walletBalance)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <DepositDialog defaultPhone={user.phone ?? ""} />
            <WithdrawDialog defaultPhone={user.phone ?? ""} maxAmount={user.walletBalance} />
            {pendingDeposits + pendingWithdrawals > 0 && (
              <Badge variant="outline">
                {pendingDeposits + pendingWithdrawals} en attente
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                <Gift className="h-5 w-5 text-primary" /> Parrainage
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Votre code : <strong className="font-mono">{user.referralCode}</strong>
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={referralLink}>
                <Users className="h-4 w-4" /> Voir détails
              </Link>
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Filleuls</p>
              <p className="font-display text-2xl font-bold">{user._count.referrals}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bonus reçus</p>
              <p className="font-display text-2xl font-bold text-primary">
                {formatXAF(user.referralBonusGiven)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <History className="h-5 w-5" /> Historique
          </h2>
          {txs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune transaction pour le moment.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {txs.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <li key={tx.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          isCredit
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.description ?? tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(tx.createdAt)} ·{" "}
                          <Badge variant="outline" className="text-[10px]">
                            {tx.type}
                          </Badge>
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold ${
                        isCredit ? "text-emerald-400" : "text-foreground"
                      }`}
                    >
                      {isCredit ? "+" : ""}
                      {formatXAF(tx.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
