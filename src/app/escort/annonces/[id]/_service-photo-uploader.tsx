"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import { Upload, Flame, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatXAF } from "@/lib/utils";
import type { OurFileRouter } from "@/lib/uploadthing";
import { addServicePhotoAction } from "@/lib/actions/wallet";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface Props {
  adId: string;
  price: number;
  walletBalance: number;
}

export function ServicePhotoUploader({ adId, price, walletBalance }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const enoughBalance = walletBalance >= price;

  const { startUpload } = useUploadThing("adPhotos", {
    onClientUploadComplete: async (res) => {
      setUploading(false);
      if (!res?.[0]) return;
      const url = res[0].url;

      // Débit + create Media
      startTransition(async () => {
        const r = await addServicePhotoAction({ adId, url });
        if (r.ok) {
          toast.success(`Photo service ajoutée — ${formatXAF(r.charged)} débité du wallet`);
          router.refresh();
        } else {
          toast.error(r.error);
        }
      });
    },
    onUploadError: (err) => {
      setUploading(false);
      toast.error(err.message);
    },
  });

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!enoughBalance) {
      toast.error(`Solde insuffisant. Il faut au moins ${formatXAF(price)}.`);
      return;
    }
    if (!confirm(`Publier cette photo service coûte ${formatXAF(price)}. Confirmer ?`)) return;
    setUploading(true);
    await startUpload([file]);
  }

  return (
    <label
      htmlFor={`svc-${adId}`}
      className={`flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition ${
        enoughBalance
          ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500"
          : "border-border bg-secondary/20 opacity-60"
      }`}
    >
      {uploading || pending ? (
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-400" />
            <Upload className="h-5 w-5 text-amber-400" />
          </div>
          <span className="text-sm font-semibold">
            Ajouter une photo service ({formatXAF(price)})
          </span>
          <span className="text-xs text-muted-foreground">
            {enoughBalance ? "JPG/PNG, 5 Mo max" : "Solde insuffisant — recharger d'abord"}
          </span>
        </>
      )}
      <input
        id={`svc-${adId}`}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={!enoughBalance || uploading || pending}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
