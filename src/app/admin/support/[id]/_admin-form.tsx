"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import type { TicketStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminReplyTicketAction, setTicketStatusAction } from "@/lib/actions/support";

export function AdminReplyForm({ ticketId }: { ticketId: string }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (body.trim().length < 1) return;
    startTransition(async () => {
      const res = await adminReplyTicketAction({ ticketId, body });
      if (res.ok) {
        toast.success("Réponse envoyée");
        setBody("");
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Votre réponse à l'utilisateur…"
        rows={5}
      />
      <Button onClick={submit} disabled={pending || !body.trim()} className="w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Envoyer
      </Button>
    </div>
  );
}

export function StatusSwitcher({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(s: TicketStatus) {
    startTransition(async () => {
      try {
        await setTicketStatusAction(ticketId, s);
        toast.success(`Statut → ${s}`);
        router.refresh();
      } catch {
        toast.error("Erreur");
      }
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 p-3">
      <span className="text-sm font-medium">Statut :</span>
      <Select value={currentStatus} onValueChange={(v) => change(v as TicketStatus)} disabled={pending}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="OPEN">OPEN — à traiter</SelectItem>
          <SelectItem value="IN_PROGRESS">IN_PROGRESS — en cours</SelectItem>
          <SelectItem value="WAITING_USER">WAITING_USER — attend retour</SelectItem>
          <SelectItem value="CLOSED">CLOSED — terminé</SelectItem>
        </SelectContent>
      </Select>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
}
