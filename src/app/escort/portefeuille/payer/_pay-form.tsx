"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatXAF } from "@/lib/utils";
import {
  initiateDepositAction,
  checkAndApplyDepositAction,
  payTierFromWalletAction,
} from "@/lib/actions/wallet";

interface Props {
  tier: "PREMIUM" | "VIP";
  amount: number;
  defaultPhone: string;
  walletBalance: number;
}

export function PayTierForm({ tier, amount, defaultPhone, walletBalance }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"wallet" | "momo">(walletBalance >= amount ? "wallet" : "momo");
  const [phone, setPhone] = useState(defaultPhone);
  const [pending, startTransition] = useTransition();
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingPaymentId) return;
    const interval = setInterval(async () => {
      const res = await checkAndApplyDepositAction(pendingPaymentId);
      if (res.ok && res.status === "SUCCESS") {
        clearInterval(interval);
        const buyRes = await payTierFromWalletAction({ tier });
        if (buyRes.ok) {
          toast.success(buyRes.message);
          router.push("/escort/dashboard");
        } else {
          toast.error(buyRes.error);
        }
        setPendingPaymentId(null);
      } else if (res.ok && res.status === "FAILED") {
        clearInterval(interval);
        toast.error("Paiement échoué");
        setPendingPaymentId(null);
      }
    }, 5000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPendingPaymentId(null);
    }, 180_000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pendingPaymentId, tier, router]);

  function payWithWallet() {
    startTransition(async () => {
      const res = await payTierFromWalletAction({ tier });
      if (res.ok) {
        toast.success(res.message);
        router.push("/escort/dashboard");
      } else {
        toast.error(res.error);
      }
    });
  }

  function payWithMomo() {
    startTransition(async () => {
      const res = await initiateDepositAction({ amount, phone });
      if (res.ok) {
        toast.success(res.message);
        setPendingPaymentId(res.paymentId);
      } else {
        toast.error(res.error);
      }
    });
  }

  if (pendingPaymentId) {
    return (
      <div className="space-y-2 py-4">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
        <p className="font-semibold">Validez sur votre téléphone…</p>
        <p className="text-xs text-muted-foreground">
          Cette fenêtre se rafraîchit toutes les 5s. Ne fermez pas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("wallet")}
          disabled={walletBalance < amount}
          className={`rounded-lg border p-3 text-left text-sm transition ${
            mode === "wallet"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/40 disabled:opacity-50"
          }`}
        >
          <Wallet className="h-5 w-5 text-primary" />
          <p className="mt-1 font-bold">Portefeuille</p>
          <p className="text-xs text-muted-foreground">Solde : {formatXAF(walletBalance)}</p>
        </button>
        <button
          type="button"
          onClick={() => setMode("momo")}
          className={`rounded-lg border p-3 text-left text-sm transition ${
            mode === "momo"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/40"
          }`}
        >
          <Smartphone className="h-5 w-5 text-primary" />
          <p className="mt-1 font-bold">MoMo / Orange</p>
          <p className="text-xs text-muted-foreground">Paiement direct</p>
        </button>
      </div>

      {mode === "momo" && (
        <div>
          <Label>Téléphone MoMo / Orange</Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+237 6XX XX XX XX"
          />
        </div>
      )}

      <Button
        onClick={mode === "wallet" ? payWithWallet : payWithMomo}
        disabled={pending}
        size="lg"
        className="w-full"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Payer {formatXAF(amount)}
      </Button>
    </div>
  );
}
