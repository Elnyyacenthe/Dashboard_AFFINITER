"use client";

import { useState, useTransition } from "react";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AdTier } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setAdTierAction, banAdAction } from "@/lib/actions/admin";

export function AdTierSelector({ adId, current }: { adId: string; current: AdTier }) {
  const [value, setValue] = useState<AdTier>(current);
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    setValue(next as AdTier);
    startTransition(async () => {
      try {
        await setAdTierAction(adId, next as AdTier);
        toast.success(`Tier mis à ${next}`);
      } catch {
        toast.error("Erreur");
      }
    });
  }

  return (
    <Select value={value} onValueChange={change} disabled={pending}>
      <SelectTrigger className="h-8 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="STANDARD">Standard</SelectItem>
        <SelectItem value="PREMIUM">Premium</SelectItem>
        <SelectItem value="VIP">VIP</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function AdBanButton({ adId }: { adId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive"
      disabled={pending}
      onClick={() => {
        const reason = prompt("Motif du bannissement ?");
        if (!reason) return;
        startTransition(async () => {
          try {
            await banAdAction(adId, reason);
            toast.success("Annonce bannie");
          } catch {
            toast.error("Erreur");
          }
        });
      }}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
    </Button>
  );
}
