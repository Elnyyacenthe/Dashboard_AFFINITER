import Link from "next/link";
import Image from "next/image";
import { MapPin, Eye, Crown, BadgeCheck, Star, Play } from "lucide-react";
import type { Ad, City, Media } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { formatXAF, cn } from "@/lib/utils";

export type AdCardData = Ad & {
  city: Pick<City, "name" | "slug">;
  media: Pick<Media, "url" | "isPrimary" | "type">[];
  profile?: { isVerified: boolean; age: number } | null;
};

export function AdCard({ ad, priority = false }: { ad: AdCardData; priority?: boolean }) {
  // On affiche en cover la photo principale (jamais une vidéo en thumbnail).
  // Si aucune photo, on tombe en fallback sur la 1ère vidéo (rendue en <video preload="metadata">).
  const photoCover = ad.media.find((m) => m.type === "PHOTO" && m.isPrimary)
    ?? ad.media.find((m) => m.type === "PHOTO");
  const videoCover = !photoCover ? ad.media.find((m) => m.type === "VIDEO") : null;
  const cover = photoCover?.url;
  const hasVideo = ad.media.some((m) => m.type === "VIDEO");
  const isVip = ad.tier === "VIP";
  const isPremium = ad.tier === "PREMIUM";

  return (
    <Link
      href={`/annonce/${ad.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-1 hover:shadow-2xl",
        isVip
          ? "border-amber-500/50 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/30"
          : isPremium
            ? "border-primary/40 shadow-lg shadow-primary/10 hover:shadow-primary/30"
            : "border-border/60 hover:border-primary/50",
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
        {cover ? (
          <Image
            src={cover}
            alt={ad.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : videoCover ? (
          // Fallback : annonce sans photo → vidéo en preview muette
          <>
            <video
              src={videoCover.url}
              preload="metadata"
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="rounded-full bg-primary/90 p-3">
                <Play className="h-6 w-6 fill-white text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            Pas d'image
          </div>
        )}

        {/* Badges top */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isVip && (
            <Badge variant="vip" className="gap-1">
              <Crown className="h-3 w-3" /> VIP
            </Badge>
          )}
          {isPremium && (
            <Badge variant="premium" className="gap-1">
              <Star className="h-3 w-3" /> Premium
            </Badge>
          )}
          {ad.profile?.isVerified && (
            <Badge variant="verified" className="gap-1">
              <BadgeCheck className="h-3 w-3" /> Vérifié
            </Badge>
          )}
        </div>

        {/* Badge vidéo (top right) */}
        {hasVideo && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary/95 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
            <Play className="h-3 w-3 fill-white" /> Vidéo
          </div>
        )}

        {/* Stats bottom */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white backdrop-blur">
          <Eye className="h-3 w-3" />
          {ad.views}
        </div>

        {/* Gradient bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <h3 className="line-clamp-2 text-sm font-semibold">{ad.title}</h3>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {ad.city.name}
              {ad.neighborhood ? `, ${ad.neighborhood}` : ""}
            </span>
            {ad.profile?.age && <span>{ad.profile.age} ans</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-3">
        <span className="text-lg font-bold text-primary">{formatXAF(ad.price)}</span>
        <span className="text-xs text-muted-foreground">/ heure</span>
      </div>
    </Link>
  );
}
