"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyTicketAction } from "@/lib/actions/support";

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (body.trim().length < 1) return;
    startTransition(async () => {
      const res = await replyTicketAction({ ticketId, body });
      if (res.ok) {
        toast.success("Message envoyé");
        setBody("");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Votre réponse…"
        rows={4}
        maxLength={3000}
      />
      <Button onClick={submit} disabled={pending || body.trim().length === 0} className="w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Envoyer
      </Button>
    </div>
  );
}
