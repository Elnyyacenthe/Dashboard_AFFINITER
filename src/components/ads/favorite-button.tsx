"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { cn } from "@/lib/utils";

interface Props {
  adId: string;
  initialFavorited?: boolean;
  variant?: "icon" | "default";
}

export function FavoriteButton({ adId, initialFavorited = false, variant = "icon" }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await toggleFavoriteAction(adId);
      if (res.ok) {
        setFavorited(res.favorited);
        toast.success(res.favorited ? "Ajouté aux favoris ❤️" : "Retiré des favoris");
      } else {
        toast.error(res.error);
      }
    });
  }

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={pending}
        onClick={toggle}
        className={cn(
          "rounded-full",
          favorited ? "text-pink-500" : "text-muted-foreground hover:text-pink-500",
        )}
      >
        <Heart className={cn("h-5 w-5", favorited && "fill-current")} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={favorited ? "default" : "outline"}
      onClick={toggle}
      disabled={pending}
    >
      <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
      {favorited ? "Dans mes favoris" : "Ajouter aux favoris"}
    </Button>
  );
}
