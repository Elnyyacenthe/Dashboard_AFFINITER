"use client";

import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyReferralCode({ code, url }: { code: string; url: string }) {
  function copy() {
    navigator.clipboard.writeText(code);
    toast.success("Code copié");
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins Yamo",
          text: `Inscris-toi sur Yamo avec mon code ${code} et reçois un bonus de bienvenue !`,
          url,
        });
      } catch {
        /* l'utilisateur a annulé */
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    }
  }

  return (
    <>
      <Button onClick={copy} variant="outline" size="icon">
        <Copy />
      </Button>
      <Button onClick={share} size="icon">
        <Share2 />
      </Button>
    </>
  );
}
