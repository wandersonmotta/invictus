import * as React from "react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  contentType: string | null;
  alt: string;
  trimStartSeconds?: number | null;
  trimEndSeconds?: number | null;
  className?: string;
  muted?: boolean;
  controls?: boolean;
  onClick?: () => void;
};

export function ReelsMedia({
  url,
  contentType,
  alt,
  trimStartSeconds,
  trimEndSeconds,
  className,
  muted,
  controls = true,
  onClick,
}: Props) {
  const isVideo = Boolean(contentType?.startsWith("video/"));
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (!isVideo) return;
    const el = videoRef.current;
    if (!el) return;

    const start = typeof trimStartSeconds === "number" ? trimStartSeconds : null;
    const end = typeof trimEndSeconds === "number" ? trimEndSeconds : null;

    const onLoaded = () => {
      if (start != null && Number.isFinite(start)) {
        try {
          el.currentTime = Math.max(0, start);
        } catch {
          // ignore
        }
      }
    };

    const onTimeUpdate = () => {
      if (end != null && Number.isFinite(end) && el.currentTime >= end) {
        el.pause();
      }
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [isVideo, trimStartSeconds, trimEndSeconds, url]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full overflow-hidden rounded-xl border border-border/60 invictus-surface",
        onClick ? "cursor-pointer" : "cursor-default",
        className,
      )}
    >
      <AspectRatio ratio={9 / 16}>
        <div className="h-full w-full bg-muted">
          {isVideo ? (
            <video
              src={url}
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              controls={controls}
              muted={muted}
              preload="metadata"
            />
          ) : (
            <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
          )}
        </div>
      </AspectRatio>
    </button>
  );
}
