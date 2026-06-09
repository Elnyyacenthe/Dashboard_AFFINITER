"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Hash, Scan, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Cluster {
  representative: { mediaId: string; adId: string; url: string };
  duplicates: Array<{ mediaId: string; adId: string; url: string; distance: number }>;
}

export function ScanControls({ remaining: initialRemaining }: { remaining: number }) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [hashing, setHashing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [clusters, setClusters] = useState<Cluster[] | null>(null);
  const [scanned, setScanned] = useState<number | null>(null);

  async function hashAll() {
    setHashing(true);
    let totalHashed = 0;
    let totalFailed = 0;
    try {
      let rem = remaining;
      while (rem > 0) {
        const r = await fetch("/api/admin/scan-photos?action=hash");
        if (!r.ok) throw new Error("API error");
        const data = (await r.json()) as {
          hashed: number;
          failed: number;
          remaining: number;
        };
        totalHashed += data.hashed;
        totalFailed += data.failed;
        rem = data.remaining;
        setRemaining(rem);
      }
      toast.success(`✅ ${totalHashed} photos hashées (${totalFailed} échecs)`);
    } catch {
      toast.error("Erreur durant le hash");
    } finally {
      setHashing(false);
    }
  }

  async function detectDuplicates() {
    setDetecting(true);
    setClusters(null);
    try {
      const r = await fetch("/api/admin/scan-photos?action=detect");
      if (!r.ok) throw new Error("API error");
      const data = (await r.json()) as {
        totalPhotosScanned: number;
        clustersFound: number;
        clusters: Cluster[];
      };
      setClusters(data.clusters);
      setScanned(data.totalPhotosScanned);
      if (data.clustersFound === 0) {
        toast.success(`Aucun doublon détecté sur ${data.totalPhotosScanned} photos 🎉`);
      } else {
        toast.warning(`${data.clustersFound} cluster(s) de doublons détecté(s)`);
      }
    } catch {
      toast.error("Erreur durant la détection");
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button onClick={hashAll} disabled={hashing || remaining === 0}>
          {hashing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hash className="h-4 w-4" />}
          {hashing
            ? `Hash en cours… (${remaining} restantes)`
            : remaining === 0
            ? "Toutes hashées ✓"
            : `Hasher ${remaining} photos legacy`}
        </Button>
        <Button variant="accent" onClick={detectDuplicates} disabled={detecting}>
          {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
          {detecting ? "Scan en cours…" : "Détecter les doublons"}
        </Button>
      </div>

      {scanned !== null && clusters !== null && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm">
              <strong>{scanned}</strong> photos scannées · <strong>{clusters.length}</strong>{" "}
              cluster{clusters.length > 1 ? "s" : ""} de doublons trouvé
              {clusters.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {clusters && clusters.length > 0 && (
        <div className="space-y-4">
          {clusters.map((c, idx) => (
            <Card key={c.representative.mediaId} className="border-amber-500/40">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <p className="font-semibold">Cluster #{idx + 1}</p>
                  <Badge variant="outline">
                    {c.duplicates.length + 1} photos similaires
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                  <PhotoTile
                    url={c.representative.url}
                    adId={c.representative.adId}
                    label="Original"
                    isOriginal
                  />
                  {c.duplicates.map((d) => (
                    <PhotoTile
                      key={d.mediaId}
                      url={d.url}
                      adId={d.adId}
                      label={`Sim. ${Math.round(((64 - d.distance) / 64) * 100)}%`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoTile({
  url,
  adId,
  label,
  isOriginal,
}: {
  url: string;
  adId: string;
  label: string;
  isOriginal?: boolean;
}) {
  return (
    <a
      href={`/admin/annonces?q=${adId}`}
      className="group relative block aspect-square overflow-hidden rounded-lg border border-border/60 hover:border-primary"
    >
      <Image src={url} alt={label} fill sizes="200px" className="object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-center text-[10px] text-white">
        {isOriginal ? "✨ " : ""}{label}
      </div>
    </a>
  );
}
