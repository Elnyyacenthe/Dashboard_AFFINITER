import Link from "next/link";
import { Flame, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Flame className="h-12 w-12 text-primary" />
      <h1 className="mt-4 font-display text-7xl font-bold gradient-text">404</h1>
      <p className="mt-2 text-xl">Cette page s'est volatilisée…</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        L'annonce ou la page que vous cherchez n'existe plus ou a été retirée.
      </p>
      <Button asChild className="mt-6" size="lg">
        <Link href="/">
          <Home /> Retour à l'accueil
        </Link>
      </Button>
    </div>
  );
}
