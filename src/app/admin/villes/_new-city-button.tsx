"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { upsertCityAction } from "@/lib/actions/cities";

export function NewCityButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await upsertCityAction({
        name,
        region: region || undefined,
        description: description || undefined,
        isPopular,
        order: 100,
      });
      if (res.ok) {
        toast.success("Ville créée");
        setOpen(false);
        setName(""); setRegion(""); setDescription(""); setIsPopular(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus /> Nouvelle ville</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une ville</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nom *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Edéa" />
          </div>
          <div>
            <Label>Région</Label>
            <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Littoral" />
          </div>
          <div>
            <Label>Description courte</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} className="accent-primary" />
            <span className="text-sm">Affichée en page d'accueil</span>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={pending || !name.trim()}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
