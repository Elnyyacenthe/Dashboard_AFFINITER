"use client";

import { useState } from "react";
import { generateReactHelpers } from "@uploadthing/react";
import { Upload, X, Loader2, Video as VideoIcon, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { OurFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function VideoUploader({ value, onChange, max = 3 }: Props) {
  const [loading, setLoading] = useState(false);

  const { startUpload } = useUploadThing("adVideos", {
    onClientUploadComplete: (res) => {
      setLoading(false);
      if (res) onChange([...value, ...res.map((r) => r.url)]);
      toast.success(`${res?.length ?? 0} vidéo(s) ajoutée(s)`);
    },
    onUploadError: (err) => {
      setLoading(false);
      toast.error(err.message);
    },
  });

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (value.length + files.length > max) {
      toast.error(`Maximum ${max} vidéos`);
      return;
    }
    // Vérification durée client-side (best-effort)
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) {
        return toast.error(`${file.name} dépasse 50 Mo`);
      }
    }
    setLoading(true);
    await startUpload(Array.from(files));
  }

  return (
    <div>
      <label
        htmlFor="ad-video-input"
        className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/40 transition hover:border-primary"
      >
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <>
            <VideoIcon className="h-7 w-7 text-muted-foreground" />
            <span className="mt-1 text-sm text-muted-foreground">
              Ajouter des vidéos ({value.length}/{max})
            </span>
            <span className="mt-0.5 text-xs text-muted-foreground">
              MP4, MOV, WEBM · 50 Mo max · courte vidéo recommandée
            </span>
          </>
        )}
        <input
          id="ad-video-input"
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={loading}
        />
      </label>

      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {value.map((url, idx) => (
            <div key={url} className="relative aspect-video overflow-hidden rounded-lg bg-black">
              <video
                src={url}
                preload="metadata"
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {/* Play overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-8 w-8 fill-white text-white drop-shadow-lg" />
              </div>
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                Vidéo
              </span>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute right-1 top-1 h-6 w-6"
                onClick={() => remove(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
              <input type="hidden" name="videoUrls" value={url} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
