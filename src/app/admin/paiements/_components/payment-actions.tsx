"use client";

import { useTransition } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { markPaymentPaidAction } from "@/lib/actions/admin";

export function ValidatePaymentButton({ paymentId }: { paymentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      onClick={() =>
        startTransition(async () => {
          await markPaymentPaidAction(paymentId);
          toast.success("Paiement validé");
        })
      }
      disabled={pending}
      size="sm"
      className="bg-emerald-600 hover:bg-emerald-700"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
      Valider
    </Button>
  );
}
