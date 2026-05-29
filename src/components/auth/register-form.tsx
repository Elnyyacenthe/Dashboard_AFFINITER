"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Crown, Star, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatXAF } from "@/lib/utils";
import { registerAction, type AuthState } from "@/lib/actions/auth";

const TIERS = [
  {
    id: "STANDARD" as const,
    name: "Standard",
    price: 0,
    icon: Check,
    features: ["Annonce gratuite", "Modération 24h", "5 photos"],
  },
  {
    id: "PREMIUM" as const,
    name: "Premium",
    price: 5000,
    badge: "Recommandé",
    icon: Star,
    features: ["Badge Premium", "Mise en avant ville", "10 photos", "+300% vues"],
  },
  {
    id: "VIP" as const,
    name: "VIP",
    price: 15000,
    badge: "Visibilité max",
    icon: Crown,
    features: ["Badge VIP doré", "Top page d'accueil", "Photos illimitées", "+700% vues"],
  },
];

export function RegisterForm() {
  const params = useSearchParams();
  const defaultRole = params.get("role") === "ESCORT" ? "ESCORT" : "CLIENT";
  const refParam = params.get("ref") ?? "";

  const [role, setRole] = useState<"CLIENT" | "ESCORT">(defaultRole);
  const [tier, setTier] = useState<"STANDARD" | "PREMIUM" | "VIP">("STANDARD");
  const [state, formAction, pending] = useActionState<AuthState | null, FormData>(
    registerAction,
    null,
  );

  const redirecting = state?.ok === true;

  useEffect(() => {
    if (state?.ok) {
      toast.success("Compte créé 🎉");
      // Hard nav pour propager le cookie de session immédiatement
      const target =
        state.nextStep?.type === "PAYMENT"
          ? `/escort/portefeuille/payer?tier=${state.nextStep.tier}&amount=${state.nextStep.amount}`
          : role === "ESCORT"
            ? "/escort/dashboard"
            : "/client";
      window.location.assign(target);
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, role]);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Créer un compte</CardTitle>
        <CardDescription>Rejoignez la communauté en quelques secondes</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={role} onValueChange={(v) => setRole(v as "CLIENT" | "ESCORT")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="CLIENT">Je suis client</TabsTrigger>
            <TabsTrigger value="ESCORT">Je suis escort</TabsTrigger>
          </TabsList>
        </Tabs>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="tier" value={tier} />

          {/* Sélecteur de tier (escort uniquement) */}
          {role === "ESCORT" && (
            <div className="space-y-2">
              <Label>Choisissez votre formule</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {TIERS.map((t) => {
                  const Icon = t.icon;
                  const selected = tier === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTier(t.id)}
                      className={cn(
                        "relative rounded-lg border p-3 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/30"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {t.badge && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                          {t.badge}
                        </span>
                      )}
                      <Icon className="h-5 w-5 text-primary" />
                      <p className="mt-1 font-display font-bold">{t.name}</p>
                      <p className="text-xs font-bold text-primary">
                        {t.price === 0 ? "Gratuit" : formatXAF(t.price)}
                      </p>
                      <ul className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                        {t.features.slice(0, 2).map((f) => (
                          <li key={f} className="flex gap-1">
                            <Check className="h-2.5 w-2.5 mt-0.5 shrink-0 text-emerald-400" /> {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              {tier !== "STANDARD" && (
                <p className="rounded bg-amber-500/10 p-2 text-xs text-amber-300">
                  💳 Après l'inscription, vous serez redirigé(e) pour payer{" "}
                  <strong>{formatXAF(TIERS.find((t) => t.id === tier)!.price)}</strong> par MoMo/Orange.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Pseudo / Nom</Label>
            <Input id="name" name="name" placeholder="Sandra" required minLength={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="vous@example.com" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone Cameroun</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+237 6XX XX XX XX" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referralCode">Code parrainage (optionnel)</Label>
            <Input
              id="referralCode"
              name="referralCode"
              defaultValue={refParam}
              placeholder="YAMO-XXXXXX"
              className="uppercase"
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
            <div className="flex items-start gap-2">
              <Checkbox id="acceptAdult" name="acceptAdult" required />
              <Label htmlFor="acceptAdult" className="text-xs leading-tight">
                Je certifie avoir <strong>18 ans ou plus</strong> et accepter les contenus pour adultes.
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="acceptTerms" name="acceptTerms" required />
              <Label htmlFor="acceptTerms" className="text-xs leading-tight">
                J'accepte les{" "}
                <a
                  href="/cgu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  CGU ↗
                </a>{" "}
                et la{" "}
                <a
                  href="/confidentialite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  politique de confidentialité ↗
                </a>.
              </Label>
            </div>
          </div>

          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {role === "ESCORT" && tier !== "STANDARD"
              ? `Continuer vers le paiement (${formatXAF(TIERS.find((t) => t.id === tier)!.price)})`
              : "Créer mon compte"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
