"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/utils";

const STORAGE_KEY = "yamo:age-confirmed";

/**
 * Mur d'âge légal — bloque l'affichage tant que l'utilisateur n'a pas
 * confirmé être majeur (18+). État stocké dans localStorage.
 */
export function AgeGate() {
  const [mounted, setMounted] = useState(false);
  const [confirmed, setConfirmed] = useState(true);

  useEffect(() => {
    setMounted(true);
    setConfirmed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (!mounted || confirmed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card p-8 shadow-2xl shadow-primary/20">
        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-full bg-primary/20 p-4">
            <ShieldAlert className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="mb-2 text-center font-display text-3xl font-bold gradient-text">
          Contenu réservé aux adultes
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {SITE_NAME} contient du contenu destiné exclusivement à un public majeur.
          En continuant, vous certifiez avoir <strong>18 ans ou plus</strong> et
          accepter de visualiser ce type de contenu.
        </p>
        <div className="grid gap-3">
          <Button
            size="lg"
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, "1");
              setConfirmed(true);
            }}
          >
            J'ai 18 ans ou plus — Entrer
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              window.location.href = "https://www.google.com";
            }}
          >
            J'ai moins de 18 ans — Sortir
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Tout accès non autorisé par un mineur est strictement interdit et passible de poursuites.
        </p>
      </div>
    </div>
  );
}
