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
}: EditorialMediaProps) {
  const decorative = !alt;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/60 bg-background/20", className)}>
      <AspectRatio ratio={ratio}>
        <img
          src={src}
          alt={decorative ? "" : alt}
          className="h-full w-full object-cover"
          loading={loading}
          decoding="async"
        />
      </AspectRatio>
    </div>
  );
}
