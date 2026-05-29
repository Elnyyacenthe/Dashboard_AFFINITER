import Image from "next/image";
import Link from "next/link";
import { Eye, CheckCircle, XCircle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatXAF, timeAgo } from "@/lib/utils";
import { ModerationActions } from "./_components/moderation-actions";

export default async function ModerationPage() {
  const pending = await prisma.ad.findMany({
    where: { status: "PENDING" },
    include: {
      owner: { select: { name: true, email: true, phone: true } },
      city: { select: { name: true } },
      media: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Modération des annonces</h1>
        <p className="text-muted-foreground">
          {pending.length} annonce{pending.length > 1 ? "s" : ""} en attente — traitement par ordre d'arrivée
        </p>
      </div>

      {pending.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Aucune annonce à modérer 🎉</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-[200px_1fr_auto]">
                  <div className="grid grid-cols-2 gap-1">
                    {ad.media.slice(0, 4).map((m) => (
                      <div key={m.id} className="relative aspect-square overflow-hidden rounded-md bg-black">
                        {m.type === "VIDEO" ? (
                          <>
                            <video
                              src={m.url}
                              preload="metadata"
                              playsInline
                              muted
                              controls
                              className="h-full w-full object-cover"
                            />
                            <span className="pointer-events-none absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                              Vidéo
                            </span>
                          </>
                        ) : (
                          <Image src={m.url} alt="" fill sizes="100px" className="object-cover" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{ad.city.name}</Badge>
                      <Badge variant="secondary">{formatXAF(ad.price)}/h</Badge>
                      <span className="text-xs text-muted-foreground">
                        Posté {timeAgo(ad.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-semibold">{ad.title}</h3>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{ad.description}</p>
                    <div className="text-xs text-muted-foreground">
                      Par {ad.owner.name ?? ad.owner.email} ({ad.owner.email})
                    </div>
                  </div>

                  <ModerationActions adId={ad.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
