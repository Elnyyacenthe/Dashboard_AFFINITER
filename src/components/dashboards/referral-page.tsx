import { redirect } from "next/navigation";
import { Gift, Users } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatXAF, timeAgo, SITE_URL } from "@/lib/utils";
import { CopyReferralCode } from "./referral-actions";

/**
 * Page Parrainage — partagée entre /client/parrainage et /escort/parrainage.
 */
export default async function ReferralPage({ backUrl = "/parrainage" }: { backUrl?: string }) {
  const session = await auth();
  if (!session?.user) redirect(`/connexion?callbackUrl=${backUrl}`);

  const [user, referrals, signupBonus, paymentBonus] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true, referralBonusGiven: true },
    }),
    prisma.user.findMany({
      where: { referredById: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { payments: { where: { status: "PAID" } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.siteSetting.findUnique({ where: { key: "referral.bonus.signup" } }),
    prisma.siteSetting.findUnique({ where: { key: "referral.bonus.payment" } }),
  ]);

  if (!user) redirect("/connexion");
  const shareUrl = `${SITE_URL}/inscription?ref=${user.referralCode}`;
  const signupBonusAmount = Number(signupBonus?.value ?? 500);
  const paymentBonusAmount = Number(paymentBonus?.value ?? 2000);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          <Gift className="mr-2 inline h-7 w-7 text-primary" /> Parrainage
        </h1>
        <p className="text-muted-foreground">
          Gagnez de l'argent à chaque ami que vous parrainez sur Yamo.
        </p>
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-2xl font-display">
              1
            </div>
            <p className="font-semibold">Partagez votre code</p>
            <p className="text-xs text-muted-foreground">À vos amis, sur WhatsApp, Facebook…</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-2xl font-display">
              2
            </div>
            <p className="font-semibold">Inscription</p>
            <p className="text-xs text-muted-foreground">
              +{formatXAF(signupBonusAmount)} <strong>immédiatement</strong>
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-2xl font-display">
              3
            </div>
            <p className="font-semibold">Premier paiement</p>
            <p className="text-xs text-muted-foreground">
              +{formatXAF(paymentBonusAmount)} <strong>bonus</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-xl font-bold">Votre code unique</h2>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-primary/40 bg-primary/10 p-4 text-center font-mono text-2xl font-bold tracking-wider text-primary">
              {user.referralCode}
            </div>
            <CopyReferralCode code={user.referralCode!} url={shareUrl} />
          </div>
          <p className="text-xs text-muted-foreground">
            Lien à partager :{" "}
            <code className="select-all rounded bg-secondary px-2 py-0.5 text-[10px]">
              {shareUrl}
            </code>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 font-display text-3xl font-bold">{referrals.length}</p>
            <p className="text-xs text-muted-foreground">Filleuls inscrits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Gift className="mx-auto h-6 w-6 text-emerald-400" />
            <p className="mt-2 font-display text-3xl font-bold">
              {referrals.filter((r) => r._count.payments > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Ont payé au moins une fois</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mt-2 font-display text-3xl font-bold gradient-text">
              {formatXAF(user.referralBonusGiven)}
            </p>
            <p className="text-xs text-muted-foreground">Total bonus reçus</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-display text-xl font-bold">Mes filleuls</h2>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Pas encore de filleul — partagez votre code pour commencer à gagner !
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {referrals.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{r.name ?? r.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Inscrit {timeAgo(r.createdAt)} · <Badge variant="outline">{r.role}</Badge>
                    </p>
                  </div>
                  <Badge variant={r._count.payments > 0 ? "success" : "secondary"}>
                    {r._count.payments > 0 ? "✓ A payé" : "En attente"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
