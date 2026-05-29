import Link from "next/link";
import Image from "next/image";
import { Plus, Eye, MessageCircle, Edit, Pause, Play, Trash2, Crown } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatXAF, timeAgo } from "@/lib/utils";
import { ToggleAdButton, DeleteAdButton } from "./_components/ad-actions";

const STATUS_LABEL: Record<string, { label: string; variant: "secondary" | "success" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "outline" },
  PENDING: { label: "En modération", variant: "outline" },
  ACTIVE: { label: "Publiée", variant: "success" },
  PAUSED: { label: "En pause", variant: "secondary" },
  REJECTED: { label: "Refusée", variant: "destructive" },
  EXPIRED: { label: "Expirée", variant: "secondary" },
  BANNED: { label: "Bannie", variant: "destructive" },
};

export default async function MyAdsPage() {
  const session = await auth();
  const ads = await prisma.ad.findMany({
    where: { ownerId: session!.user.id },
    include: {
      city: true,
      media: { take: 1, orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Mes annonces</h1>
          <p className="text-muted-foreground">{ads.length} annonce{ads.length > 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/poster-une-annonce">
            <Plus /> Nouvelle annonce
          </Link>
        </Button>
      </div>

      {ads.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Aucune annonce publiée pour le moment.</p>
          <Button asChild className="mt-4">
            <Link href="/poster-une-annonce">Créer ma première annonce</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => {
            const status = STATUS_LABEL[ad.status];
            return (
              <Card key={ad.id} className="overflow-hidden">
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {ad.media[0] && (
                      <Image src={ad.media[0].url} alt={ad.title} fill sizes="96px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {ad.tier !== "STANDARD" && (
                        <Badge variant={ad.tier === "VIP" ? "vip" : "premium"} className="gap-1">
                          <Crown className="h-3 w-3" />
                          {ad.tier}
                        </Badge>
                      )}
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <h3 className="font-semibold">{ad.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {ad.city.name} · {formatXAF(ad.price)} · {timeAgo(ad.createdAt)}
                    </p>
                    {ad.rejectionReason && (
                      <p className="text-xs text-destructive">
                        Motif refus : {ad.rejectionReason}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {ad.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {ad.whatsappClicks}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:flex-nowrap">
                    {ad.status === "ACTIVE" && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/annonce/${ad.slug}`} target="_blank">
                          <Eye className="h-4 w-4" /> Voir
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/escort/annonces/${ad.id}`}>
                        <Edit className="h-4 w-4" /> Modifier
                      </Link>
                    </Button>
                    {(ad.status === "ACTIVE" || ad.status === "PAUSED") && (
                      <ToggleAdButton adId={ad.id} isActive={ad.status === "ACTIVE"} />
                    )}
                    <DeleteAdButton adId={ad.id} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
