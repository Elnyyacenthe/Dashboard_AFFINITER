import { redirect } from "next/navigation";
import { Search } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScanControls } from "./_controls";

export default async function DoublonsPhotosPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const [totalPhotos, photosHashed, photosUnhashed] = await Promise.all([
    prisma.media.count({ where: { type: "PHOTO" } }),
    prisma.media.count({ where: { type: "PHOTO", imageHash: { not: null } } }),
    prisma.media.count({ where: { type: "PHOTO", imageHash: null } }),
  ]);

  const coverage = totalPhotos > 0 ? Math.round((photosHashed / totalPhotos) * 100) : 100;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <Search className="h-7 w-7" /> Doublons photos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Détection des escorts qui réutilisent les photos d'autres annonceurs (anti-fraude).
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Photos totales</p>
            <p className="mt-1 text-2xl font-bold">{totalPhotos.toLocaleString("fr-FR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Hashées (couverture)</p>
            <p className="mt-1 text-2xl font-bold">{photosHashed.toLocaleString("fr-FR")}</p>
            <Badge variant={coverage === 100 ? "success" : "outline"} className="mt-1 text-[10px]">
              {coverage}%
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">À hasher (legacy)</p>
            <p className="mt-1 text-2xl font-bold">{photosUnhashed.toLocaleString("fr-FR")}</p>
          </CardContent>
        </Card>
      </div>

      <ScanControls remaining={photosUnhashed} />
    </div>
  );
}
