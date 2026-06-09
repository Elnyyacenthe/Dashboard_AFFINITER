"use client";

import { Crown, Star, Gem } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpayPayModal } from "@/components/kpay/kpay-pay-modal";
import { initiateTierUpgradeAction } from "@/lib/actions/payments";

interface Props {
  adId: string;
  currentTier: "STANDARD" | "PREMIUM" | "VIP" | "DIAMOND";
  prices: { premium: number; vip: number; diamond: number };
  days: { premium: number; vip: number; diamond: number };
  defaultPhone?: string;
  size?: "default" | "sm";
}

const TIERS = [
  { tier: "PREMIUM" as const, label: "Premium", icon: Star, color: "default" as const },
  { tier: "VIP" as const, label: "VIP", icon: Crown, color: "accent" as const },
  { tier: "DIAMOND" as const, label: "Diamond", icon: Gem, color: "default" as const },
];

const RANK = { STANDARD: 0, PREMIUM: 1, VIP: 2, DIAMOND: 3 };

export function TierUpgradeButtons({
  adId,
  currentTier,
  prices,
  days,
  defaultPhone,
  size = "sm",
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIERS.map(({ tier, label, icon: Icon, color }) => {
        if (RANK[tier] <= RANK[currentTier]) return null;
        const price = tier === "DIAMOND" ? prices.diamond : tier === "VIP" ? prices.vip : prices.premium;
        const dur = tier === "DIAMOND" ? days.diamond : tier === "VIP" ? days.vip : days.premium;
        return (
          <KpayPayModal
            key={tier}
            trigger={
              <Button variant={color} size={size}>
                <Icon className="h-4 w-4" /> {label}
              </Button>
            }
            title={`Passer en ${label}`}
            description={`Votre annonce passe en tier ${label} pendant ${dur} jours. ${tier === "DIAMOND" ? "1 SEUL slot Diamond par ville." : ""}`}
            amount={price}
            defaultPhone={defaultPhone}
            initiate={(phone) => initiateTierUpgradeAction({ adId, tier, phone })}
          />
        );
      })}
    </div>
  );
}
