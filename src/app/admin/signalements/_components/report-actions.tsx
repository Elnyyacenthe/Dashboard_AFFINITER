"use client";

import { useTransition } from "react";
import { CheckCircle, XCircle, Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resolveReportAction, banAdAction } from "@/lib/actions/admin";

export function ReportActions({ reportId, adId }: { reportId: string; adId: string | null }) {
  const [pending, startTransition] = useTransition();

  function resolve(decision: "RESOLVED" | "DISMISSED") {
    const note = prompt(decision === "RESOLVED" ? "Note de résolution ?" : "Motif de rejet ?");
    startTransition(async () => {
      await resolveReportAction(reportId, decision, note ?? undefined);
      toast.success("Signalement traité");
    });
  }

  function banAd() {
    if (!adId) return;
    const reason = prompt("Motif du bannissement de l'annonce ?");
    if (!reason) return;
    startTransition(async () => {
      await banAdAction(adId, reason);
      await resolveReportAction(reportId, "RESOLVED", `Annonce bannie — ${reason}`);
      toast.success("Annonce bannie et signalement clos");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={() => resolve("RESOLVED")} disabled={pending} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
        Résoudre
      </Button>
      <Button onClick={() => resolve("DISMISSED")} disabled={pending} size="sm" variant="outline">
        <XCircle className="h-3 w-3" /> Rejeter
      </Button>
      {adId && (
        <Button onClick={banAd} disabled={pending} size="sm" variant="destructive">
          <Ban className="h-3 w-3" /> Bannir annonce
        </Button>
      )}
    </div>
  );
}
