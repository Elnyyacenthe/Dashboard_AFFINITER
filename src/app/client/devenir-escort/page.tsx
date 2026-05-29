import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, Crown, Star, BadgeCheck, Wallet, BarChart3 } from "lucide-react";

import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { BecomeEscortForm } from "./_form";

const PERKS = [
  { icon: Sparkles, title: "Publier des annonces", text: "Atteignez des milliers de clients dans votre ville." },
  { icon: BarChart3, title: "Dashboard & stats", text: "Vues, clics WhatsApp, taux de conversion en temps réel." },
  { icon: Star, title: "Boost Premium / VIP", text: "Mise en avant ville, badge doré, photos illimitées." },
  { icon: BadgeCheck, title: "Badge Vérifiée", text: "Renforcez la confiance des clients avec une vérification ID." },
  { icon: Wallet, title: "Wallet & retraits", text: "Gérez vos revenus, retirez en MoMo / Orange Money." },
  { icon: Crown, title: "Parrainage", text: "Gagnez des bonus en parrainant d'autres escorts." },
];

export default async function BecomeEscortPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/client/devenir-escort");

  // Si déjà escort, on l'envoie sur son dashboard
  if (session.user.role === "ESCORT") redirect("/escort/dashboard");
  // ADMIN/MODERATOR : renvoyés vers l'interface admin externe (yamo.cm/admin)
  if (session.user.role === "ADMIN" || session.user.role === "MODERATOR") {
    const url =
      process.env.NEXT_PUBLIC_YAMO_ADMIN_URL ??
      `${process.env.NEXT_PUBLIC_YAMO_URL ?? "https://yamo.cm"}/admin`;
    redirect(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Passez côté Escort
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
          Devenez <span className="gradient-text">Escort</span> sur Yamo
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Votre compte client va être converti en compte escort. Vous gardez vos données, votre solde
          wallet et votre code parrainage. Vous accédez en plus à toutes les fonctionnalités escort.
        </p>
      </header>

      {/* Avantages */}
      <div className="grid gap-3 md:grid-cols-2">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="border-border/60">
            <CardContent className="flex gap-3 p-4">
              <div className="rounded-lg bg-primary/15 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulaire d'engagement */}
      <BecomeEscortForm />

      <p className="text-center text-xs text-muted-foreground">
        En cas de problème, contactez{" "}
        <Link href="/contact" className="text-primary hover:underline">
          le support
        </Link>
        .
      </p>
    </div>
  );
}
