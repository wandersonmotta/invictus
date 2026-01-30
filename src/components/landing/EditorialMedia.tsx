import * as React from "react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

type EditorialMediaProps = {
  src: string;
  /** Se omitido, tratamos como decorativo (alt="") */
  alt?: string;
  className?: string;
  ratio?: number;
  loading?: "eager" | "lazy";
  onError?: React.ReactEventHandler<HTMLImageElement>;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
};

/**
 * Mídia editorial estática (substitui os loops de vídeo), mantendo o “frame premium”.
 */
export function EditorialMedia({
  src,
  alt,
  className,
  ratio = 16 / 9,
  loading = "lazy",
  onError,
  onLoad,
}: EditorialMediaProps) {
  const decorative = !alt;
  const fetchPriority = loading === "eager" ? "high" : "auto";

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/60 bg-background/20", className)}>
      <AspectRatio ratio={ratio}>
        <img
          src={src}
          alt={decorative ? "" : alt}
          className="h-full w-full object-cover"
          loading={loading}
          fetchPriority={fetchPriority as any}
          decoding="async"
          onError={onError}
          onLoad={onLoad}
        />
      </AspectRatio>
    </div>
  );
}
