"use client";

import { useTransition } from "react";
import { CheckCircle, XCircle, Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  approveVerificationAction,
  rejectVerificationAction,
  blockIdentityAction,
} from "@/lib/actions/verification";

export function VerificationActions({
  verificationId,
  userId,
}: {
  verificationId: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      try {
        await approveVerificationAction(verificationId);
        toast.success("Vérification approuvée — escort vérifiée ✓");
      } catch {
        toast.error("Erreur");
      }
    });
  }

  function reject() {
    const reason = prompt("Motif du refus ?");
    if (!reason) return;
    startTransition(async () => {
      try {
        await rejectVerificationAction(verificationId, reason);
        toast.success("Vérification refusée");
      } catch {
        toast.error("Erreur");
      }
    });
  }

  function blockIdentity() {
    const reason = prompt(
      "Bannir cette identité DÉFINITIVEMENT (toute réinscription sera bloquée). Motif ?",
    );
    if (!reason) return;
    if (!confirm("Confirmer le bannissement définitif de cette identité ?")) return;
    startTransition(async () => {
      try {
        await blockIdentityAction(userId, reason);
        toast.success("Identité bannie. Impossible de revenir.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={approve} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        Valider
      </Button>
      <Button onClick={reject} disabled={pending} variant="outline">
        <XCircle className="h-4 w-4" /> Refuser
      </Button>
      <Button onClick={blockIdentity} disabled={pending} variant="destructive" size="sm">
        <Ban className="h-3 w-3" /> Bannir identité
      </Button>
    </div>
  );
}
