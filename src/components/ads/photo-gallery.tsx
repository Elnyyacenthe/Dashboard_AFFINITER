"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from "lucide-react";

interface Media {
  url: string;
  type?: "PHOTO" | "VIDEO" | string;
  isPrimary?: boolean;
}

export function PhotoGallery({ media, title }: { media: Media[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  if (media.length === 0) return null;

  const cover = media[0];
  const thumbs = media.slice(1, 5);
  const isCoverVideo = cover.type === "VIDEO";

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => { setActive(0); setOpen(true); }}
          className="relative col-span-4 aspect-[4/3] overflow-hidden rounded-xl bg-secondary md:col-span-3 md:aspect-[16/11]"
        >
          {isCoverVideo ? (
            <>
              <video
                src={cover.url}
                preload="metadata"
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:opacity-70">
                <div className="rounded-full bg-primary/90 p-5 shadow-2xl">
                  <Play className="h-10 w-10 fill-white text-white" />
                </div>
              </div>
            </>
          ) : (
            <Image
              src={cover.url}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover transition-transform hover:scale-105"
              priority
            />
          )}
        </button>

        {thumbs.length > 0 && (
          <div className="hidden grid-cols-1 gap-2 md:grid">
            {thumbs.map((m, idx) => {
              const isVideo = m.type === "VIDEO";
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setActive(idx + 1); setOpen(true); }}
                  className="relative aspect-square overflow-hidden rounded-lg bg-secondary"
                >
                  {isVideo ? (
                    <>
                      <video src={m.url} preload="metadata" playsInline muted className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-6 w-6 fill-white text-white" />
                      </div>
                    </>
                  ) : (
                    <Image src={m.url} alt={`${title} ${idx + 2}`} fill sizes="20vw" className="object-cover" />
                  )}
                  {idx === 3 && media.length > 5 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white">
                      +{media.length - 5}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <GalleryViewer media={media} active={active} setActive={setActive} title={title} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function GalleryViewer({
  media,
  active,
  setActive,
  title,
}: {
  media: Media[];
  active: number;
  setActive: (idx: number) => void;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const current = media[active];
  const isVideo = current.type === "VIDEO";

  // Auto-play vidéo quand on switche dessus (muted pour respecter autoplay policy)
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.muted = muted;
      videoRef.current.play().catch(() => null);
    }
  }, [active, isVideo, muted]);

  return (
    <div className="relative aspect-[3/4] w-full md:aspect-[16/10]">
      {isVideo ? (
        <video
          ref={videoRef}
          src={current.url}
          controls
          playsInline
          muted={muted}
          autoPlay
          loop
          className="h-full w-full rounded-lg bg-black object-contain"
        />
      ) : (
        <Image
          src={current.url}
          alt={`${title} ${active + 1}`}
          fill
          sizes="100vw"
          className="rounded-lg object-contain"
        />
      )}

      {/* Mute toggle pour vidéo */}
      {isVideo && (
        <button
          type="button"
          onClick={() => setMuted(!muted)}
          className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white hover:bg-black"
          aria-label={muted ? "Activer le son" : "Couper le son"}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setActive((active - 1 + media.length) % media.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white hover:bg-black"
            aria-label="Précédent"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => setActive((active + 1) % media.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white hover:bg-black"
            aria-label="Suivant"
          >
            <ChevronRight />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            {active + 1} / {media.length}
          </div>
        </>
      )}
    </div>
  );
}
