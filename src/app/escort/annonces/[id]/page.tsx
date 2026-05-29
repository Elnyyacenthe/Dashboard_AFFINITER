import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Flame, Star } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatXAF } from "@/lib/utils";
import { getSettingNumber } from "@/lib/actions/wallet";
import { ToggleAdButton, DeleteAdButton } from "../_components/ad-actions";
import { ServicePhotoUploader } from "./_service-photo-uploader";

export default async function AdDetailEscortPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [ad, user, servicePhotoPrice] = await Promise.all([
    prisma.ad.findUnique({
      where: { id },
      include: { city: true, media: { orderBy: { position: "asc" } } },
    }),
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { walletBalance: true },
    }),
    getSettingNumber("pricing.servicePhoto.amount", 300),
  ]);
  if (!ad) notFound();
  if (ad.ownerId !== session!.user.id && session!.user.role !== "ADMIN") notFound();

  const profilePhotos = ad.media.filter((m) => !m.isServicePhoto);
  const servicePhotos = ad.media.filter((m) => m.isServicePhoto);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/escort/annonces">← Retour</Link>
      </Button>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{ad.status}</Badge>
            <Badge variant="secondary">{ad.tier}</Badge>
            <Badge variant="outline">{ad.city.name}</Badge>
          </div>
          <h1 className="font-display text-2xl font-bold">{ad.title}</h1>
          <p className="text-muted-foreground">{ad.description}</p>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Prix / heure</dt>
              <dd className="font-semibold">{formatXAF(ad.price)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vues</dt>
              <dd className="font-semibold">{ad.views}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Clics WhatsApp</dt>
              <dd className="font-semibold">{ad.whatsappClicks}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Quartier</dt>
              <dd className="font-semibold">{ad.neighborhood ?? "—"}</dd>
            </div>
          </dl>

          {ad.rejectionReason && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <strong>Motif de refus :</strong> {ad.rejectionReason}
            </div>
          )}

          {/* Photos profil (incluses dans l'abonnement) */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Star className="h-4 w-4 text-primary" /> Photos profil
              <Badge variant="outline">{profilePhotos.length}</Badge>
            </h3>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
              {profilePhotos.map((m) => (
                <div key={m.id} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={m.url} alt="" fill sizes="120px" className="object-cover" />
                  {!m.isApproved && (
                    <div className="absolute inset-0 flex items-center justify-center bg-amber-500/70 text-xs font-bold text-black">
                      En attente
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Photos service (payantes par publication) */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Flame className="h-4 w-4 text-amber-400" /> Photos service
              <Badge variant="vip">{formatXAF(servicePhotoPrice)} / photo</Badge>
              <Badge variant="outline">{servicePhotos.length} publiées</Badge>
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Contenus suggestifs facturés à la publication. Chaque photo est validée par la modération sous 24h.
            </p>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
              {servicePhotos.map((m) => (
                <div key={m.id} className="relative aspect-square overflow-hidden rounded-lg ring-2 ring-amber-500/40">
                  <Image src={m.url} alt="" fill sizes="120px" className="object-cover" />
                  {!m.isApproved && (
                    <div className="absolute inset-0 flex items-center justify-center bg-amber-500/70 text-xs font-bold text-black">
                      En attente
                    </div>
                  )}
                  <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                    Service
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <ServicePhotoUploader
                adId={ad.id}
                price={servicePhotoPrice}
                walletBalance={user?.walletBalance ?? 0}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            {ad.status === "ACTIVE" && (
              <Button asChild variant="outline">
                <Link href={`/annonce/${ad.slug}`} target="_blank">
                  Voir publique →
                </Link>
              </Button>
            )}
            {(ad.status === "ACTIVE" || ad.status === "PAUSED") && (
              <ToggleAdButton adId={ad.id} isActive={ad.status === "ACTIVE"} />
            )}
            <DeleteAdButton adId={ad.id} />
          </div>

          <p className="text-xs text-muted-foreground">
            Pour modifier le contenu (titre, description, photos), supprimez cette annonce et créez-en une nouvelle.
            Une UI d'édition complète sera bientôt disponible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
