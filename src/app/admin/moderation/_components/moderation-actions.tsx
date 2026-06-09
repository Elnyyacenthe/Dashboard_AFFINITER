"use client";

import { useState, useTransition } from "react";
import { CheckCircle, XCircle, Loader2, Ban } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { approveAdAction, rejectAdAction, banAdAction } from "@/lib/actions/admin";

export function ModerationActions({ adId }: { adId: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"reject" | "ban">("reject");

  function approve() {
    startTransition(async () => {
      try {
        await approveAdAction(adId);
        toast.success("Annonce approuvée et publiée");
      } catch {
        toast.error("Erreur");
      }
    });
  }

  function openDialog(m: "reject" | "ban") {
    setMode(m);
    setReason("");
    setOpen(true);
  }

  function submitReason() {
    if (!reason.trim()) return toast.error("Motif requis");
    startTransition(async () => {
      try {
        if (mode === "reject") await rejectAdAction(adId, reason);
        else await banAdAction(adId, reason);
        toast.success(mode === "reject" ? "Annonce refusée" : "Annonce bannie");
        setOpen(false);
      } catch {
        toast.error("Erreur");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={approve} disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        Approuver
      </Button>
      <Button variant="outline" disabled={pending} onClick={() => openDialog("reject")}>
        <XCircle className="h-4 w-4" /> Refuser
      </Button>
      <Button variant="destructive" disabled={pending} onClick={() => openDialog("ban")}>
        <Ban className="h-4 w-4" /> Bannir
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "reject" ? "Refuser l'annonce" : "Bannir l'annonce"}</DialogTitle>
            <DialogDescription>
              {mode === "reject"
                ? "L'annonceur recevra ce motif et pourra modifier son annonce."
                : "L'annonce sera bannie définitivement. Aucune modification possible."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif (ex : photos non conformes, contenu illégal, mineur suspecté…)"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={submitReason}
              disabled={pending}
              variant={mode === "ban" ? "destructive" : "default"}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
