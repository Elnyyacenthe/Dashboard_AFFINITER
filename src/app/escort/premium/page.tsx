import Link from "next/link";
import { Crown, Star, BadgeCheck, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatXAF } from "@/lib/utils";
import { getSettingNumber } from "@/lib/actions/wallet";

export default async function PremiumPage() {
  const session = await auth();

  // Lecture des prix dynamiques depuis SiteSetting (modifiables par admin)
  const [premiumPrice, vipPrice, premiumDays, vipDays, user] = await Promise.all([
    getSettingNumber("pricing.premium.amount", 5000),
    getSettingNumber("pricing.vip.amount", 15000),
    getSettingNumber("pricing.premium.days", 30),
    getSettingNumber("pricing.vip.days", 30),
    session?.user
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { walletBalance: true },
        })
      : null,
  ]);

  type Plan = {
    tier: "STANDARD" | "PREMIUM" | "VIP";
    name: string;
    price: number;
    days: number;
    icon: typeof Check;
    color: string;
    badge?: string;
    features: string[];
  };

  const PLANS: Plan[] = [
    {
      tier: "STANDARD",
      name: "Standard",
      price: 0,
      days: 0,
      icon: Check,
      color: "border-border",
      features: [
        "Publication gratuite",
        "Modération sous 24h",
        "Contact WhatsApp masqué",
        "5 photos max",
      ],
    },
    {
      tier: "PREMIUM",
      name: "Premium",
      price: premiumPrice,
      days: premiumDays,
      icon: Star,
      color: "border-primary/50",
      badge: "Le plus choisi",
      features: [
        "Tout du Standard",
        "Mise en avant sur ville",
        "Badge Premium visible",
        "10 photos max",
        `${premiumDays} jours de boost`,
      ],
    },
    {
      tier: "VIP",
      name: "VIP",
      price: vipPrice,
      days: vipDays,
      icon: Crown,
      color: "border-amber-500/50",
      badge: "Visibilité max",
      features: [
        "Tout du Premium",
        "Top de la page d'accueil",
        "Badge VIP doré",
        "Photos illimitées",
        `Boost prioritaire ${vipDays}j`,
        "Support dédié",
      ],
    },
  ];

  const walletBalance = user?.walletBalance ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Boostez votre <span className="gradient-text">visibilité</span>
        </h1>
        <p className="text-muted-foreground">
          Passez en Premium ou VIP pour décupler le nombre de contacts.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Solde wallet : <strong className="text-primary">{formatXAF(walletBalance)}</strong> ·{" "}
          <Link href="/escort/portefeuille" className="text-primary hover:underline">
            Déposer
          </Link>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isStandard = plan.tier === "STANDARD";
          const canPayWithWallet = !isStandard && walletBalance >= plan.price;
          const payUrl = isStandard
            ? "#"
            : `/escort/portefeuille/payer?tier=${plan.tier}&amount=${plan.price}`;

          return (
            <Card key={plan.tier} className={`relative ${plan.color}`}>
              {plan.badge && (
                <Badge variant="vip" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {plan.badge}
                </Badge>
              )}
              <CardContent className="space-y-4 p-6">
                <Icon className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                  <p className="text-3xl font-bold">
                    {plan.price === 0 ? "Gratuit" : formatXAF(plan.price)}
                    {plan.price > 0 && (
                      <span className="text-sm text-muted-foreground"> / {plan.days}j</span>
                    )}
                  </p>
                </div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isStandard ? (
                  <Button disabled className="w-full">
                    Plan actuel
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="w-full"
                    variant={plan.tier === "VIP" ? "accent" : "default"}
                  >
                    <Link href={payUrl}>
                      Passer en {plan.name}
                      {!canPayWithWallet && (
                        <span className="ml-1 text-xs opacity-70">(dépôt requis)</span>
                      )}
                    </Link>
                  </Button>
                )}

                {!isStandard && canPayWithWallet && (
                  <p className="text-center text-xs text-emerald-300">
                    ✓ Payable instantanément depuis ton wallet
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-sky-500/30 bg-sky-500/5">
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-6 w-6 text-sky-400" />
            <h3 className="font-display text-xl font-bold">Vérification d'identité</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Soumettez une pièce d'identité (CNI/passeport) + selfie avec une note datée du jour. Une
            fois vérifiée, vos annonces affichent le badge <strong>Vérifiée</strong>, ce qui augmente
            significativement la confiance des clients.
          </p>
          <Button asChild variant="outline">
            <Link href="/escort/verification">Soumettre une vérification</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Paiement par MTN Mobile Money / Orange Money via K-Pay, ou directement depuis votre
        portefeuille. Aucun remboursement en cas de violation des{" "}
        <Link href="/cgu" target="_blank" className="text-primary hover:underline">
          CGU
        </Link>
        .
      </p>
    </div>
  );
}
