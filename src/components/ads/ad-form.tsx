"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUploader } from "./photo-uploader";
import { VideoUploader } from "./video-uploader";
import { createAdAction, type AdActionState } from "@/lib/actions/ads";

const SERVICES = [
  "Massage",
  "GFE",
  "Striptease",
  "Couple",
  "Sortie",
  "Soirée",
  "Domination soft",
  "Tantra",
];

interface Props {
  cities: { id: string; name: string }[];
}

export function AdForm({ cities }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState<AdActionState | null, FormData>(
    createAdAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Annonce soumise à modération ✨");
      router.push("/escort/dashboard/annonces");
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, router]);

  function toggleService(s: string) {
    setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-xl font-bold">📸 Photos</h2>
          <p className="text-xs text-muted-foreground">
            Au moins une photo obligatoire. La première sera l'image principale. Les photos seront approuvées par notre équipe avant publication.
          </p>
          <PhotoUploader value={photos} onChange={setPhotos} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-xl font-bold">
            🎬 Vidéos <span className="text-sm font-normal text-muted-foreground">(optionnel — booste les contacts)</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Une courte vidéo de présentation augmente les contacts de <strong>+200%</strong> en moyenne.
            Format MP4 / MOV / WEBM, 50 Mo max par vidéo, 30 secondes recommandées.
            Pas de contenu explicite (modération).
          </p>
          <VideoUploader value={videos} onChange={setVideos} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-xl font-bold">✍️ Informations de l'annonce</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Titre de l'annonce *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Belle Camerounaise à Bonapriso, discrète et coquine"
              maxLength={120}
              required
            />
            {state && !state.ok && state.fieldErrors?.title && (
              <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Présentez-vous, décrivez l'ambiance, vos spécialités, votre lieu…"
              minLength={50}
              maxLength={3000}
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              50 caractères minimum. Évitez tout contenu illégal ou impliquant des mineurs.
            </p>
            {state && !state.ok && state.fieldErrors?.description && (
              <p className="text-xs text-destructive">{state.fieldErrors.description[0]}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cityId">Ville *</Label>
              <Select name="cityId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une ville" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Quartier</Label>
              <Input id="neighborhood" name="neighborhood" placeholder="Bonapriso, Bastos…" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-xl font-bold">💰 Tarifs</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Prix / heure (FCFA) *</Label>
              <Input id="price" name="price" type="number" min={1000} step={500} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceNight">Prix / nuit (FCFA)</Label>
              <Input id="priceNight" name="priceNight" type="number" min={0} step={500} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-xl font-bold">👤 Profil</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="age">Âge *</Label>
              <Input id="age" name="age" type="number" min={18} max={80} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gender">Genre *</Label>
              <Select name="gender" defaultValue="FEMALE">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FEMALE">Femme</SelectItem>
                  <SelectItem value="MALE">Homme</SelectItem>
                  <SelectItem value="TRANS">Trans</SelectItem>
                  <SelectItem value="COUPLE">Couple</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Services proposés</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    services.includes(s)
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {services.map((s) => (
              <input key={s} type="hidden" name="services" value={s} />
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <Checkbox name="incall" defaultChecked />
              <span className="text-sm">Je reçois (incall)</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox name="outcall" />
              <span className="text-sm">Je me déplace (outcall)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-xl font-bold">📞 Contact</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsappPhone">WhatsApp *</Label>
              <Input
                id="whatsappPhone"
                name="whatsappPhone"
                placeholder="+237 6XX XX XX XX"
                required
              />
              <p className="text-xs text-muted-foreground">
                Le numéro sera partiellement masqué sur l'annonce.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="callPhone">Appel direct (optionnel)</Label>
              <Input id="callPhone" name="callPhone" placeholder="+237 6XX XX XX XX" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="space-y-3 p-6">
          <label className="flex items-start gap-3">
            <Checkbox name="acceptAdult" required />
            <span className="text-sm">
              Je certifie sur l'honneur être <strong>majeur(e), consentant(e)</strong> et seul(e)
              auteur(e) des photos publiées. Je comprends que toute infraction (mineur, traite,
              extorsion) entraînera la suppression du compte et un signalement aux autorités.
            </span>
          </label>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        Publier mon annonce
      </Button>
    </form>
  );
}
