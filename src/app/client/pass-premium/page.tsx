import { redirect } from "next/navigation";
import Link from "next/link";
import { Crown, Eye, EyeOff, Bell, Zap, Heart, ShieldCheck, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatXAF } from "@/lib/utils";
import { getSettingNumber } from "@/lib/actions/wallet";
import { SubscribeForm } from "./_form";

export default async function ClientPassPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/client/pass-premium");

  const [user, monthlyPrice, days, freeCap, premiumCap] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true, clientPassUntil: true },
    }),
    getSettingNumber("pricing.clientpass.amount", 1000),
    getSettingNumber("pricing.clientpass.days", 30),
    getSettingNumber("clientpass.reveals.daily.free", 3),
    getSettingNumber("clientpass.reveals.daily.premium", 999),
  ]);

  const isActive = user?.clientPassUntil && user.clientPassUntil > new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
          <Crown className="h-3.5 w-3.5" />
          Pass Premium Client
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
          <span className="gradient-text">Pass Premium</span> — Navigation illimitée
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Révélez les numéros WhatsApp sans limite, naviguez incognito, accédez en priorité aux nouvelles annonces.
        </p>
      </header>

      {isActive ? (
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="flex items-center gap-3 p-6">
            <ShieldCheck className="h-10 w-10 text-emerald-400" />
            <div className="flex-1">
              <p className="font-display text-lg font-bold">
                Pass Premium actif 💎
              </p>
              <p className="text-sm text-muted-foreground">
                Valable jusqu'au{" "}
                <strong>{user!.clientPassUntil!.toLocaleDateString("fr-FR")}</strong>.
              </p>
            </div>
            <Badge variant="success">ACTIF</Badge>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-6">
            <Sparkles className="mt-0.5 h-5 w-5 text-amber-400" />
            <div>
              <p className="font-semibold">Vous n'avez pas encore le Pass Premium</p>
              <p className="text-sm text-muted-foreground">
                Actuellement limité à <strong>{freeCap} révélations / jour</strong>. Passez Premium
                pour {premiumCap} révélations / jour et bien plus.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avantages */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-primary/30">
          <CardContent className="flex gap-3 p-4">
            <div className="rounded-lg bg-primary/15 p-2"><Eye className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="font-semibold">Révélations illimitées</p>
              <p className="text-xs text-muted-foreground">
                Voyez tous les numéros WhatsApp sans limite quotidienne (vs {freeCap}/jour gratuit).
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="flex gap-3 p-4">
            <div className="rounded-lg bg-primary/15 p-2"><EyeOff className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="font-semibold">Navigation incognito</p>
              <p className="text-xs text-muted-foreground">
                Vos visites ne sont plus comptées dans les statistiques des escorts.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="flex gap-3 p-4">
            <div className="rounded-lg bg-primary/15 p-2"><Bell className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="font-semibold">Alertes nouvelles annonces</p>
              <p className="text-xs text-muted-foreground">
                Soyez prévenu(e) en priorité quand une nouvelle escort poste dans vos villes favorites.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="flex gap-3 p-4">
            <div className="rounded-lg bg-primary/15 p-2"><Heart className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="font-semibold">Favoris illimités</p>
              <p className="text-xs text-muted-foreground">
                Sauvegardez autant de profils que vous voulez (vs 10 max gratuit).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tarif + souscription */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/10 via-card to-accent/5">
        <CardContent className="space-y-4 p-8 text-center">
          <Zap className="mx-auto h-10 w-10 text-amber-400" />
          <p className="font-display text-4xl font-bold gradient-text">
            {formatXAF(monthlyPrice)} <span className="text-base font-normal text-muted-foreground">/ {days}j</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Sans engagement. Renouvelable à la demande.
          </p>
          <p className="text-xs text-muted-foreground">
            Solde wallet : <strong className="text-primary">{formatXAF(user!.walletBalance)}</strong>
            {" · "}
            <Link href="/client/portefeuille" className="text-primary hover:underline">Recharger</Link>
          </p>
          <SubscribeForm
            monthlyPrice={monthlyPrice}
            walletBalance={user!.walletBalance}
            alreadyActive={!!isActive}
          />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Voir les{" "}
        <Link href="/cgu" target="_blank" className="text-primary hover:underline">
          conditions générales
        </Link>{" "}
        et la{" "}
        <Link href="/confidentialite" target="_blank" className="text-primary hover:underline">
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}
