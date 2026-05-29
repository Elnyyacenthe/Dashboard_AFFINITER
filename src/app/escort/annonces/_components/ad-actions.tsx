"use client";

import { useTransition } from "react";
import { Pause, Play, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleAdStatusAction, deleteAdAction } from "@/lib/actions/ads";

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
          } catch (e) {
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
