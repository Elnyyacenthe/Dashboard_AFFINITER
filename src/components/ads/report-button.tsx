"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportAdAction } from "@/lib/actions/reports";

const REASONS = [
  { value: "FAKE", label: "Fausse annonce / photos volées" },
  { value: "SCAM", label: "Arnaque / extorsion" },
  { value: "UNDERAGE", label: "Personne mineure suspectée" },
  { value: "ILLEGAL", label: "Contenu illégal" },
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harcèlement" },
  { value: "OTHER", label: "Autre" },
];

export function ReportButton({ adId }: { adId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("FAKE");
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await reportAdAction({ adId, reason: reason as never, details });
      if (res.ok) {
        toast.success("Signalement envoyé. Merci pour votre vigilance.");
        setOpen(false);
        setDetails("");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="h-4 w-4" /> Signaler
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler cette annonce</DialogTitle>
          <DialogDescription>
            Aidez-nous à garder Affinité sain. Vos signalements sont anonymes et examinés sous 24h.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Détails (optionnel)"
            maxLength={500}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={pending} variant="destructive">
            Envoyer le signalement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
