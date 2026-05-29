"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction, type AuthState } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState | null, FormData>(loginAction, null);
  // Une fois la connexion confirmée, on bloque la UI et on fait une nav "dure"
  // (window.location) qui propage le cookie de session côté serveur. Plus rapide
  // et plus fiable que router.push + router.refresh.
  const redirecting = state?.ok === true;

  useEffect(() => {
    if (state?.ok) {
      toast.success("Connexion réussie 👋");
      // Hard navigation immédiate — le cookie de session est dans la réponse
      // du server action, le browser le rejoue donc sur la prochaine requête.
      window.location.assign("/");
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Connexion</CardTitle>
        <CardDescription>Connectez-vous avec votre email ou téléphone</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email ou téléphone</Label>
            <Input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="vous@example.com ou +237 6XX XX XX XX"
              required
              autoComplete="username"
            />
            {state && !state.ok && state.fieldErrors?.identifier && (
              <p className="text-xs text-destructive">{state.fieldErrors.identifier[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            {state && !state.ok && state.fieldErrors?.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
            )}
          </div>
          <Button type="submit" disabled={pending || redirecting} className="w-full" size="lg">
            {(pending || redirecting) && <Loader2 className="h-4 w-4 animate-spin" />}
            {redirecting ? "Redirection…" : pending ? "Connexion…" : "Se connecter"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-primary hover:underline">
              Créer un compte
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
