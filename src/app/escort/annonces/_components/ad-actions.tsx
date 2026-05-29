"use client";

import { useTransition } from "react";
import { Pause, Play, Trash2, Loader2, ArrowUp, Pin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleAdStatusAction, deleteAdAction } from "@/lib/actions/ads";
import { bumpAdAction, stickyAdAction } from "@/lib/actions/wallet";

export function ToggleAdButton({ adId, isActive }: { adId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await toggleAdStatusAction(adId);
            toast.success(isActive ? "Annonce mise en pause" : "Annonce réactivée");
          } catch {
            toast.error("Erreur");
          }
        })
      }
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isActive ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      {isActive ? "Pause" : "Activer"}
    </Button>
  );
}

export function DeleteAdButton({ adId }: { adId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Supprimer définitivement cette annonce ?")) return;
        startTransition(async () => {
          try {
            await deleteAdAction(adId);
            toast.success("Annonce supprimée");
          } catch {
            toast.error("Impossible de supprimer");
          }
        });
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}

/**
 * Bouton Bump : remonte l'annonce en tête de liste (~24h).
 * Débit instant du wallet. Pas de confirmation modale → flow rapide.
 */
export function BumpAdButton({ adId, price = 500 }: { adId: string; price?: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="accent"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Bump cette annonce pour ${price} FCFA ? (Remontée 24h)`)) return;
        startTransition(async () => {
          const res = await bumpAdAction(adId);
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
        });
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
      Bump
    </Button>
  );
}

/**
 * Bouton Sticky 24h : épingle l'annonce au top de sa ville pendant 24h.
 * Plus cher qu'un Bump.
 */
export function StickyAdButton({ adId, price = 2000 }: { adId: string; price?: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="default"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Épingler 24h pour ${price} FCFA ? (Top de la ville)`)) return;
        startTransition(async () => {
          const res = await stickyAdAction(adId);
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
        });
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pin className="h-4 w-4" />}
      Sticky 24h
    </Button>
  );
}
