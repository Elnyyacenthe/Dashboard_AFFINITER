"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SearchFiltersProps {
  cities: { slug: string; name: string }[];
}

export function SearchFilters({ cities }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  function update(name: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(name, value);
    else p.delete(name);
    p.delete("page");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  function reset() {
    startTransition(() => router.push(pathname));
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <Filter className="h-4 w-4" /> Filtres
        </h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={reset} className="text-xs">
            <X className="h-3 w-3" /> Réinitialiser
          </Button>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-xs text-muted-foreground hover:text-foreground md:hidden"
          >
            {open ? "Masquer" : "Afficher"}
          </button>
        </div>
      </div>

      <div className={`space-y-4 ${open ? "" : "hidden md:block"}`}>
        <div className="space-y-1.5">
          <Label className="text-xs">Recherche</Label>
          <Input
            placeholder="Mot-clé…"
            defaultValue={params.get("q") ?? ""}
            onChange={(e) => update("q", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Ville</Label>
          <Select
            value={params.get("citySlug") ?? "all"}
            onValueChange={(v) => update("citySlug", v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les villes</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Genre</Label>
          <Select
            value={params.get("gender") ?? "all"}
            onValueChange={(v) => update("gender", v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="FEMALE">Femme</SelectItem>
              <SelectItem value="MALE">Homme</SelectItem>
              <SelectItem value="TRANS">Trans</SelectItem>
              <SelectItem value="COUPLE">Couple</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Prix min</Label>
            <Input
              type="number"
              placeholder="5000"
              defaultValue={params.get("minPrice") ?? ""}
              onChange={(e) => update("minPrice", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Prix max</Label>
            <Input
              type="number"
              placeholder="100000"
              defaultValue={params.get("maxPrice") ?? ""}
              onChange={(e) => update("maxPrice", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Âge min</Label>
            <Input
              type="number"
              placeholder="18"
              min={18}
              defaultValue={params.get("minAge") ?? ""}
              onChange={(e) => update("minAge", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Âge max</Label>
            <Input
              type="number"
              placeholder="45"
              defaultValue={params.get("maxAge") ?? ""}
              onChange={(e) => update("maxAge", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Trier par</Label>
          <Select
            value={params.get("sort") ?? "recent"}
            onValueChange={(v) => update("sort", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récentes</SelectItem>
              <SelectItem value="popular">Plus populaires</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-center gap-2">
          <Checkbox
            checked={params.get("verified") === "true"}
            onCheckedChange={(c) => update("verified", c ? "true" : "")}
          />
          <span className="text-sm">Profils vérifiés uniquement</span>
        </label>

        {isPending && <p className="text-xs text-muted-foreground">Mise à jour…</p>}
      </div>
    </div>
  );
}
