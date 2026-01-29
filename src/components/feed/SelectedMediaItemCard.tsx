import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SelectedMedia = {
  id: string;
  file: File;
  previewUrl: string;
  isVideo: boolean;
  isCropped?: boolean;
  trimStart?: number;
  trimEnd?: number;
};

type Props = {
  item: SelectedMedia;
  onCropClick: () => void;
  onTrimChange: (next: { trimStart?: number; trimEnd?: number }) => void;
};

export function SelectedMediaItemCard({ item, onCropClick, onTrimChange }: Props) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="w-full sm:w-40">
          {item.isVideo ? (
            <video src={item.previewUrl} className="w-full rounded-md border border-border/60" controls />
          ) : (
            <img
              src={item.previewUrl}
              alt="Prévia"
              className="w-full rounded-md border border-border/60 object-cover"
              loading="lazy"
            />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="text-xs text-muted-foreground break-all">{item.file.name}</div>

          {!item.isVideo ? (
            <div className="flex flex-col gap-2">
              <Button type="button" variant="secondary" onClick={onCropClick}>
                Recortar imagem
              </Button>
              {!item.isCropped ? (
                <div className="text-xs text-destructive">Recorte obrigatório antes de publicar.</div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">Início (s)</div>
                <Input
                  inputMode="decimal"
                  placeholder="0"
                  value={item.trimStart ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    onTrimChange({ trimStart: v === "" ? undefined : Number(v) });
                  }}
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Fim (s)</div>
                <Input
                  inputMode="decimal"
                  placeholder="(opcional)"
                  value={item.trimEnd ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    onTrimChange({ trimEnd: v === "" ? undefined : Number(v) });
                  }}
                />
              </div>
              <div className="sm:col-span-2 text-xs text-muted-foreground">
                Recorte de vídeo é aplicado na reprodução (Reels) — o arquivo enviado continua inteiro.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
