"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerAction, type AuthState } from "@/lib/actions/auth";

/**
 * Inscription = uniquement pour les ESCORTES.
 * Les CLIENTS n'ont pas besoin de compte : ils consultent les annonces et
 * contactent les escortes directement sur WhatsApp (gratuit).
 */
export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthState | null, FormData>(
    registerAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Compte créé 🎉 — souscrivez maintenant à un plan pour publier vos annonces");
      window.location.assign(state.redirectTo ?? "/escort/abonnement");
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-2xl">
          <Sparkles className="h-6 w-6 text-primary" />
          Devenir escort sur Affiniter
        </CardTitle>
        <CardDescription>
          Publiez vos annonces auprès de milliers de clients camerounais. Inscription gratuite,
          abonnement mensuel à partir de <strong>2 000 FCFA / mois</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Le rôle est toujours ESCORT */}
          <input type="hidden" name="role" value="ESCORT" />
          <input type="hidden" name="tier" value="STANDARD" />

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
                <a href="/cgu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  CGU ↗
                </a>{" "}
                et la{" "}
                <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  politique de confidentialité ↗
                </a>.
              </Label>
            </div>
          </div>

          <p className="rounded bg-primary/10 p-3 text-xs text-primary">
            💡 Après l'inscription, vous serez redirigée vers la page d'abonnement pour activer
            votre compte (Standard 2 000, Premium 5 000 ou VIP 15 000 FCFA / mois).
          </p>

          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer mon compte escort
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Déjà inscrite ?{" "}
            <Link href="/connexion" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            <strong>Client</strong> ? Vous n'avez pas besoin de compte —{" "}
            <Link href="/recherche" className="text-primary hover:underline">
              parcourez les annonces directement
            </Link>.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
