"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatXAF } from "@/lib/utils";
import { subscribeClientPassAction } from "@/lib/actions/client-pass";

interface Props {
  monthlyPrice: number;
  walletBalance: number;
  alreadyActive: boolean;
}

const DURATIONS = [
  { months: 1, label: "1 mois", discount: 0 },
  { months: 3, label: "3 mois", discount: 5 },
  { months: 12, label: "12 mois", discount: 20 },
];

export function SubscribeForm({ monthlyPrice, walletBalance, alreadyActive }: Props) {
  const router = useRouter();
  const [months, setMonths] = useState(1);
  const [pending, startTransition] = useTransition();

  const selected = DURATIONS.find((d) => d.months === months)!;
  const total = monthlyPrice * months;
  const enoughBalance = walletBalance >= total;

  function submit() {
    startTransition(async () => {
      const res = await subscribeClientPassAction({ months });
      if (res.ok) {
        toast.success(`Pass actif jusqu'au ${res.until.toLocaleDateString("fr-FR")} 💎`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {DURATIONS.map((d) => (
          <button
            key={d.months}
            type="button"
            onClick={() => setMonths(d.months)}
            className={`rounded-lg border p-3 text-left text-sm transition ${
              months === d.months
                ? "border-primary bg-primary/15"
                : "border-border hover:border-primary/40"
            }`}
          >
            <p className="font-bold">{d.label}</p>
            <p className="text-xs text-muted-foreground">
              {formatXAF(monthlyPrice * d.months)}
            </p>
            {d.discount > 0 && (
              <p className="mt-1 text-[10px] font-bold text-emerald-400">
                à venir : -{d.discount}%
              </p>
            )}
          </button>
        ))}
      </div>

      {enoughBalance ? (
        <Button
          onClick={submit}
          disabled={pending}
          size="lg"
          className="w-full"
          variant="accent"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
          {alreadyActive ? `Prolonger : ${formatXAF(total)}` : `S'abonner : ${formatXAF(total)}`}
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="rounded-lg bg-amber-500/10 p-3 text-center text-xs text-amber-200">
            Solde insuffisant. Il vous faut <strong>{formatXAF(total - walletBalance)}</strong> supplémentaires.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/client/portefeuille">Recharger mon wallet</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
