"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { generateReactHelpers } from "@uploadthing/react";
import { Pencil, Trash2, Upload, Loader2, Star, StarOff, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OurFileRouter } from "@/lib/uploadthing";
import {
  upsertCityAction,
  updateCityImageAction,
  deleteCityAction,
  toggleCityPopularAction,
} from "@/lib/actions/cities";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export interface CityRowData {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  description: string | null;
  imageUrl: string | null;
  isPopular: boolean;
  order: number;
  adCount: number;
}

export function CityRow({ city }: { city: CityRowData }) {
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(city.name);
  const [region, setRegion] = useState(city.region ?? "");
  const [description, setDescription] = useState(city.description ?? "");
  const [imageUrl, setImageUrl] = useState(city.imageUrl ?? "");
  const [isPopular, setIsPopular] = useState(city.isPopular);
  const [order, setOrder] = useState(city.order);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const { startUpload } = useUploadThing("cityImage", {
    onClientUploadComplete: async (res) => {
      if (!res?.[0]) return;
      setImageUrl(res[0].url);
      // Sauvegarde immédiate
      try {
        await updateCityImageAction(city.id, res[0].url);
        toast.success("Image mise à jour");
      } catch {
        toast.error("Erreur de sauvegarde");
      }
      setUploading(false);
    },
    onUploadError: (err) => {
      setUploading(false);
      toast.error(err.message);
    },
  });

  async function handleQuickImageUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    await startUpload([file]);
  }

  function save() {
    startTransition(async () => {
      const res = await upsertCityAction({
        id: city.id,
        name,
        region: region || undefined,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        isPopular,
        order,
      });
      if (res.ok) {
        toast.success("Ville mise à jour");
        setEditOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  function togglePopular() {
    startTransition(async () => {
      try {
        await toggleCityPopularAction(city.id);
        setIsPopular(!isPopular);
      } catch {
        toast.error("Erreur");
      }
    });
  }

  function remove() {
    if (!confirm(`Supprimer "${city.name}" ?`)) return;
    startTransition(async () => {
      try {
        await deleteCityAction(city.id);
        toast.success("Ville supprimée");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-4 rounded-lg border border-border/40 p-3 hover:bg-secondary/30">
        {/* Image thumbnail avec upload au survol */}
        <label className="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md bg-secondary">
          {imageUrl ? (
            <Image src={imageUrl} alt={city.name} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500/30 to-amber-500/30 text-xs font-bold">
              {city.name[0]}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Upload className="h-5 w-5 text-white" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading || pending}
            onChange={(e) => handleQuickImageUpload(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{city.name}</span>
            {city.region && <Badge variant="outline">{city.region}</Badge>}
            {city.isPopular && <Badge variant="vip" className="gap-1"><Star className="h-3 w-3" /> Populaire</Badge>}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {city.description ?? "Pas de description"}
          </p>
          <p className="text-xs text-muted-foreground">
            <code className="font-mono">{city.slug}</code> · {city.adCount} annonces · ordre #{city.order}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={togglePopular} disabled={pending} title={isPopular ? "Retirer de la home" : "Mettre en avant"}>
            {isPopular ? <Star className="h-4 w-4 text-amber-400" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={remove} disabled={pending} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialog édition complète */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Éditer {city.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Région</Label>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Littoral, Centre…" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
            <div>
              <Label>URL d'image (ou upload depuis la liste)</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
              {imageUrl && (
                <div className="relative mt-2 aspect-video w-full overflow-hidden rounded">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ordre</Label>
                <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
              </div>
              <label className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-sm">Affichée en page d'accueil</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              <X className="h-4 w-4" /> Annuler
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
