"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTicketAction } from "@/lib/actions/support";

const CATEGORIES = [
  { v: "GENERAL", l: "Général" },
  { v: "PAYMENT", l: "Paiement / Wallet" },
  { v: "MODERATION", l: "Modération / Annonce refusée" },
  { v: "KYC", l: "Vérification d'identité" },
  { v: "BUG", l: "Bug technique" },
  { v: "OTHER", l: "Autre" },
];

export function NewTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (subject.trim().length < 5) return toast.error("Sujet trop court");
    if (body.trim().length < 10) return toast.error("Message trop court");

    startTransition(async () => {
      const res = await createTicketAction({ subject, category, body });
      if (res.ok) {
        toast.success("Ticket créé — un membre du support va vous répondre");
        router.push(`/support/${res.ticketId}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Catégorie</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Sujet</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex : Mon paiement Premium n'est pas activé"
            maxLength={120}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Décrivez le problème en détail : dates, montants, référence de paiement, captures…"
          rows={8}
          maxLength={3000}
        />
        <p className="text-right text-xs text-muted-foreground">{body.length} / 3000</p>
      </div>
      <Button onClick={submit} disabled={pending} size="lg" className="w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Envoyer le ticket
      </Button>
    </div>
  );
}
