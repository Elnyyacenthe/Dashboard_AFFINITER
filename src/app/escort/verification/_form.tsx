"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import { Upload, X, Loader2, Camera } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OurFileRouter } from "@/lib/uploadthing";
import { submitVerificationAction } from "@/lib/actions/verification";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export function VerificationForm() {
  const router = useRouter();
  const [docType, setDocType] = useState<"CNI" | "PASSPORT" | "DRIVING_LICENSE">("CNI");
  const [docNumber, setDocNumber] = useState("");
  const [frontUrl, setFrontUrl] = useState("");
  const [backUrl, setBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [uploading, setUploading] = useState<"front" | "back" | "selfie" | null>(null);
  const [pending, startTransition] = useTransition();

  const { startUpload } = useUploadThing("verificationDocs", {
    onClientUploadComplete: (res) => {
      if (!res?.[0]) return;
      const u = res[0].url;
      if (uploading === "front") setFrontUrl(u);
      else if (uploading === "back") setBackUrl(u);
      else if (uploading === "selfie") setSelfieUrl(u);
      setUploading(null);
      toast.success("Photo uploadée");
    },
    onUploadError: (err) => {
      setUploading(null);
      toast.error(err.message);
    },
  });

  async function handleUpload(slot: "front" | "back" | "selfie", file: File | null) {
    if (!file) return;
    setUploading(slot);
    await startUpload([file]);
  }

  function submit() {
    if (!frontUrl || !selfieUrl) return toast.error("Photo recto + selfie obligatoires");
    if (docType === "CNI" && !backUrl) return toast.error("Photo verso obligatoire pour la CNI");
    if (docNumber.trim().length < 5) return toast.error("Numéro du document invalide");

    startTransition(async () => {
      const res = await submitVerificationAction({
        documentType: docType,
        documentNumber: docNumber.trim(),
        documentFrontUrl: frontUrl,
        documentBackUrl: backUrl || undefined,
        selfieUrl,
      });
      if (res.ok) {
        toast.success("Demande envoyée — examen sous 24-48h");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="font-display text-xl font-bold">Soumettre mes documents</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Type de document</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CNI">Carte Nationale d'Identité</SelectItem>
                <SelectItem value="PASSPORT">Passeport</SelectItem>
                <SelectItem value="DRIVING_LICENSE">Permis de conduire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Numéro du document</Label>
            <Input
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="Ex : 123456789"
              maxLength={40}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <UploadSlot label="Recto du document" url={frontUrl} onUpload={(f) => handleUpload("front", f)} loading={uploading === "front"} />
          {docType === "CNI" && (
            <UploadSlot label="Verso (CNI uniquement)" url={backUrl} onUpload={(f) => handleUpload("back", f)} loading={uploading === "back"} />
          )}
          <UploadSlot label="Selfie avec la pièce" url={selfieUrl} onUpload={(f) => handleUpload("selfie", f)} loading={uploading === "selfie"} />
        </div>

        <Button onClick={submit} disabled={pending} size="lg" className="w-full">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Envoyer pour vérification
        </Button>
      </CardContent>
    </Card>
  );
}

function UploadSlot({
  label,
  url,
  onUpload,
  loading,
}: {
  label: string;
  url: string;
  onUpload: (file: File | null) => void;
  loading: boolean;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <label className="mt-1 flex aspect-[3/4] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-secondary/40 hover:border-primary">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : url ? (
          <Image src={url} alt={label} fill className="object-cover" />
        ) : (
          <div className="text-center text-muted-foreground">
            <Camera className="mx-auto h-6 w-6" />
            <p className="mt-1 text-xs">Cliquez</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
