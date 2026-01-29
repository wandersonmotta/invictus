import * as React from "react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  contentType: string | null;
  alt: string;
  className?: string;
  muted?: boolean;
  controls?: boolean;
  onClick?: () => void;
};

export function ReelsMedia({ url, contentType, alt, className, muted, controls = true, onClick }: Props) {
  const isVideo = Boolean(contentType?.startsWith("video/"));

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
