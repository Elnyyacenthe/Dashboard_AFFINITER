"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, CheckCircle2, XCircle, Smartphone } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";

export type InitResult =
  | { ok: true; paymentId: string; kpayId: string; message: string }
  | { ok: false; error: string };

interface Props {
  /** Bouton qui ouvre le modal */
  trigger: React.ReactNode;
  /** Titre affiché dans le modal */
  title: string;
  /** Description courte de ce que l'user va payer */
  description: string;
  /** Montant en FCFA */
  amount: number;
  /** Téléphone par défaut (pré-rempli si on a déjà celui du user) */
  defaultPhone?: string;
  /** Server action qui initie le paiement K-Pay et retourne paymentId */
  initiate: (phone: string) => Promise<InitResult>;
  /** Callback après succès (refresh router, fermer page, etc.) */
  onSuccess?: () => void;
  /** Variante de onSuccess qui reçoit le paymentId — utile pour fetch des données spécifiques au payment (ex: numéro révélé). */
  onSuccessWithPaymentId?: (paymentId: string) => void | Promise<void>;
}

type Step = "form" | "polling" | "success" | "failed";

export function KpayPayModal({
  trigger,
  title,
  description,
  amount,
  defaultPhone,
  initiate,
  onSuccess,
  onSuccessWithPaymentId,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  function reset() {
    setStep("form");
    setPaymentId(null);
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (!o) setTimeout(reset, 300);
  }

  function submit() {
    if (!phone.trim()) {
      toast.error("Saisissez votre numéro Mobile Money");
      return;
    }
    startTransition(async () => {
      const res = await initiate(phone);
      if (!res.ok) {
        setError(res.error);
        setStep("failed");
        return;
      }
      setPaymentId(res.paymentId);
      setStep("polling");
      toast.success(res.message);
    });
  }

  // Polling côté client toutes les 3s, max 5 min
  useEffect(() => {
    if (step !== "polling" || !paymentId) return;
    let attempts = 0;
    const maxAttempts = 100; // 100 × 3s = 5 min
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollRef.current) clearInterval(pollRef.current);
        setStep("failed");
        setError("Délai dépassé. Vérifiez votre téléphone et réessayez.");
        return;
      }
      try {
        const r = await fetch(`/api/payments/${paymentId}/poll`, { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { status: string; applied: boolean };
        if (data.status === "SUCCESS" && data.applied) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep("success");
          onSuccess?.();
          if (onSuccessWithPaymentId) await onSuccessWithPaymentId(paymentId);
          router.refresh();
        } else if (data.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep("failed");
          setError("Le paiement n'a pas abouti.");
        }
      } catch {
        // ignore, retry next tick
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, paymentId, onSuccess, router]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
              <p className="text-xs uppercase text-muted-foreground">Montant</p>
              <p className="font-display text-3xl font-bold text-primary">
                {amount.toLocaleString("fr-FR")} <span className="text-lg">FCFA</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kpay-phone">Numéro Mobile Money</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="kpay-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="6XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  disabled={pending}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                MTN (67/68/65) ou Orange (69/655-659) — détection automatique
              </p>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={pending || !phone.trim()} className="w-full">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                Payer {amount.toLocaleString("fr-FR")} FCFA
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "polling" && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-8 w-8 animate-pulse text-primary" />
            </div>
            <div>
              <p className="font-semibold">Validez sur votre téléphone</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Un push Mobile Money a été envoyé sur le {phone}. Saisissez votre code PIN
                pour valider le paiement.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> En attente de confirmation…
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-emerald-500">Paiement confirmé 🎉</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Votre opération a été appliquée avec succès.
              </p>
            </div>
            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Fermer
            </Button>
          </div>
        )}

        {step === "failed" && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Paiement échoué</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error ?? "Une erreur s'est produite. Réessayez."}
              </p>
            </div>
            <Button onClick={reset} variant="outline" className="w-full">
              Réessayer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
