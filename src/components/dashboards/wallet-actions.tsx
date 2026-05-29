"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatXAF } from "@/lib/utils";
import {
  initiateDepositAction,
  initiateWithdrawalAction,
  checkAndApplyDepositAction,
} from "@/lib/actions/wallet";

// =====================================================================
// DÉPÔT
// =====================================================================

export function DepositDialog({ defaultPhone }: { defaultPhone: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("5000");
  const [phone, setPhone] = useState(defaultPhone);
  const [pending, startTransition] = useTransition();
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [pollMsg, setPollMsg] = useState("");

  useEffect(() => {
    if (!pendingPaymentId) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      const res = await checkAndApplyDepositAction(pendingPaymentId);
      if (cancelled) return;
      if (res.ok && res.status === "SUCCESS") {
        toast.success("Dépôt confirmé ✅");
        clearInterval(interval);
        setPendingPaymentId(null);
        setOpen(false);
        router.refresh();
      } else if (res.ok && res.status === "FAILED") {
        toast.error("Dépôt échoué");
        clearInterval(interval);
        setPendingPaymentId(null);
      }
    }, 5000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPendingPaymentId(null);
      setPollMsg("Délai dépassé. Vérifiez votre historique.");
    }, 180_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pendingPaymentId, router]);

  function submit() {
    const amt = Number(amount);
    if (!amt || amt < 500) return toast.error("Montant minimum : 500 FCFA");

    startTransition(async () => {
      const res = await initiateDepositAction({ amount: amt, phone });
      if (res.ok) {
        toast.success(res.message);
        setPendingPaymentId(res.paymentId);
        setPollMsg("Validez le paiement sur votre téléphone Mobile Money…");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <ArrowDownLeft /> Déposer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Déposer de l'argent</DialogTitle>
          <DialogDescription>
            Via MTN Mobile Money ou Orange Money. Vous recevrez une notif sur votre téléphone.
          </DialogDescription>
        </DialogHeader>

        {pendingPaymentId ? (
          <div className="space-y-3 py-4 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="font-semibold">{pollMsg}</p>
            <p className="text-sm text-muted-foreground">
              Ouvrez l'app MoMo/Orange et confirmez. Cette fenêtre se mettra à jour automatiquement.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <Label>Montant (FCFA)</Label>
                <Input
                  type="number"
                  min={500}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1000, 5000, 10000, 25000].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(String(a))}
                      className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary"
                    >
                      {formatXAF(a)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Téléphone MoMo / Orange</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+237 6XX XX XX XX"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit} disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Déposer {formatXAF(Number(amount) || 0)}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =====================================================================
// RETRAIT
// =====================================================================

export function WithdrawDialog({
  defaultPhone,
  maxAmount,
}: {
  defaultPhone: string;
  maxAmount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("5000");
  const [phone, setPhone] = useState(defaultPhone);
  const [pending, startTransition] = useTransition();

  function submit() {
    const amt = Number(amount);
    if (!amt || amt < 5000) return toast.error("Retrait minimum : 5000 FCFA");
    if (amt > maxAmount) return toast.error(`Solde insuffisant (${formatXAF(maxAmount)} dispo)`);

    startTransition(async () => {
      const res = await initiateWithdrawalAction({ amount: amt, phone });
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" disabled={maxAmount < 5000}>
          <ArrowUpRight /> Retirer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirer mon argent</DialogTitle>
          <DialogDescription>
            Solde disponible : <strong>{formatXAF(maxAmount)}</strong>. Retrait minimum 5000 FCFA.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Montant (FCFA)</Label>
            <Input
              type="number"
              min={5000}
              max={maxAmount}
              step={500}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>Numéro destinataire MoMo / Orange</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 6XX XX XX XX"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={pending} variant="accent">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Retirer {formatXAF(Number(amount) || 0)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
