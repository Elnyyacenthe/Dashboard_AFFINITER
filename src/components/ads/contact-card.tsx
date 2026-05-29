"use client";

import { useState } from "react";
import { MessageCircle, Phone, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { maskPhone } from "@/lib/utils";
import { trackWhatsAppClick } from "@/lib/actions/ads";

interface Props {
  adId: string;
  whatsappPhone: string;
  callPhone?: string | null;
  adTitle: string;
}

export function ContactCard({ adId, whatsappPhone, callPhone, adTitle }: Props) {
  const [revealed, setRevealed] = useState(false);

  const cleanWa = whatsappPhone.replace(/\s/g, "").replace(/^\+/, "");
  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(`Bonjour, je vous écris au sujet de votre annonce "${adTitle}" sur Yamo.`)}`;

  function openWhatsApp() {
    trackWhatsAppClick(adId).catch(() => null);
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="space-y-4 p-6">
        <div>
          <p className="mb-1 text-xs uppercase text-muted-foreground">WhatsApp</p>
          <div className="flex items-center gap-2 font-mono text-lg">
            <span className="select-all">{revealed ? whatsappPhone : maskPhone(whatsappPhone)}</span>
            <button
              type="button"
              onClick={() => setRevealed(!revealed)}
              className="text-xs text-primary hover:underline"
              title={revealed ? "Masquer" : "Afficher"}
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button onClick={openWhatsApp} size="lg" className="w-full bg-emerald-500 text-white hover:bg-emerald-600">
          <MessageCircle className="h-5 w-5" /> Contacter sur WhatsApp
        </Button>

        {callPhone && (
          <Button asChild variant="outline" size="lg" className="w-full">
            <a href={`tel:${callPhone}`}>
              <Phone className="h-5 w-5" /> Appeler
            </a>
          </Button>
        )}

        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200">
          <p className="flex items-start gap-2 font-semibold">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Sécurité : ne payez jamais d'avance avant de rencontrer la personne. Signalez tout comportement suspect.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
