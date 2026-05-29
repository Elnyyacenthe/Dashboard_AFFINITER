"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EscortProfile } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfileAction, type ProfileState } from "@/lib/actions/profile";

const LANGUAGES = ["Français", "Anglais", "Espagnol", "Arabe", "Portugais"];

interface Props {
  profile: EscortProfile | null;
  user: { email: string | null; phone: string | null; name: string | null };
}

export function ProfileForm({ profile, user }: Props) {
  const [state, formAction, pending] = useActionState<ProfileState | null, FormData>(
    updateProfileAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) toast.success("Profil mis à jour");
    else if (state && !state.ok) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-xl font-bold">Informations publiques</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom d'affichage *</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={profile?.displayName ?? user.name ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Âge *</Label>
              <Input id="age" name="age" type="number" min={18} max={80} defaultValue={profile?.age ?? ""} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optionnelle)</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={profile?.bio ?? ""}
              maxLength={1500}
              rows={5}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="gender">Genre *</Label>
              <Select name="gender" defaultValue={profile?.gender ?? "FEMALE"}>
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
            <div className="space-y-2">
              <Label htmlFor="height">Taille (cm)</Label>
              <Input id="height" name="height" type="number" min={140} max={220} defaultValue={profile?.height ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Poids (kg)</Label>
              <Input id="weight" name="weight" type="number" min={40} max={200} defaultValue={profile?.weight ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ethnicity">Ethnicité</Label>
            <Input id="ethnicity" name="ethnicity" defaultValue={profile?.ethnicity ?? ""} />
          </div>

          <div>
            <Label>Langues parlées</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => {
                const checked = profile?.languages?.includes(l);
                return (
                  <label key={l} className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
                    <input
                      type="checkbox"
                      name="languages"
                      value={l}
                      defaultChecked={checked}
                      className="accent-primary"
                    />
                    {l}
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-6">
          <h2 className="font-display text-xl font-bold">Compte</h2>
          <p className="text-sm text-muted-foreground">
            Email : <span className="font-mono">{user.email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Téléphone : <span className="font-mono">{user.phone}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Pour changer ces informations, contactez le support.
          </p>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending} size="lg">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Enregistrer
      </Button>
    </form>
  );
}
