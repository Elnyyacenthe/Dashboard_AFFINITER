"use client";

import { useTransition, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Trash2, X, ArrowDownAZ } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  toggleFavoriteAction,
  clearInactiveFavoritesAction,
} from "@/lib/actions/favorites";

const STATUS_LABEL: Record<string, string> = {
  PAUSED: "En pause",
  EXPIRED: "Expirée",
  REJECTED: "Refusée",
  BANNED: "Bannie",
  DRAFT: "Brouillon",
  PENDING: "En attente",
};

export function FavoritesFilters({
  cities,
  currentCity,
  currentSort,
  backUrl,
}: {
  cities: { slug: string; name: string }[];
  currentCity?: string;
  currentSort: "recent" | "price_asc" | "price_desc";
  backUrl: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function applyFilters(city: string | undefined, sort: string) {
    const params = new URLSearchParams();
    if (city && city !== "all") params.set("city", city);
    if (sort && sort !== "recent") params.set("sort", sort);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-card/40 p-3">
      <span className="text-xs font-semibold text-muted-foreground">Filtrer :</span>
      <Select
        value={currentCity ?? "all"}
        onValueChange={(v) => applyFilters(v === "all" ? undefined : v, currentSort)}
      >
        <SelectTrigger className="w-44">
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

      <Select value={currentSort} onValueChange={(v) => applyFilters(currentCity, v)}>
        <SelectTrigger className="w-48">
          <ArrowDownAZ className="h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Récents en premier</SelectItem>
          <SelectItem value="price_asc">Prix croissant</SelectItem>
          <SelectItem value="price_desc">Prix décroissant</SelectItem>
        </SelectContent>
      </Select>

      {(currentCity || currentSort !== "recent") && (
        <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
          <X className="h-4 w-4" /> Reset
        </Button>
      )}
    </div>
  );
}

export function ClearInactiveButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();

  function clear(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Retirer ${count} favori${count > 1 ? "s" : ""} indisponible${count > 1 ? "s" : ""} ?`)) return;
    startTransition(async () => {
      const res = await clearInactiveFavoritesAction();
      if (res.ok) toast.success(`${res.removed} favori${res.removed > 1 ? "s" : ""} retiré${res.removed > 1 ? "s" : ""}`);
      else toast.error(res.error);
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={clear} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Nettoyer
    </Button>
  );
}

export function RemoveFavoriteCard({
  adId,
  title,
  cityName,
  status,
}: {
  adId: string;
  title: string;
  cityName: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  function remove() {
    startTransition(async () => {
      const res = await toggleFavoriteAction(adId);
      if (res.ok) {
        setRemoved(true);
        toast.success("Favori retiré");
      } else toast.error(res.error);
    });
  }

  if (removed) return null;

  return (
    <Card className="opacity-70">
      <CardContent className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{cityName}</span>
            <Badge variant="secondary" className="text-[10px]">
              {STATUS_LABEL[status] ?? status}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={pending}
          title="Retirer des favoris"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
}
