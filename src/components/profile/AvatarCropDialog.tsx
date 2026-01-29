import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";

import { getCroppedImageBlob } from "@/lib/cropImage";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type AvatarCropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCancel: () => void;
  onSave: (blob: Blob) => Promise<void> | void;
};

export function AvatarCropDialog({ open, onOpenChange, imageSrc, onCancel, onSave }: AvatarCropDialogProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [cropPixels, setCropPixels] = React.useState<Area | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropPixels(null);
      setSaving(false);
    }
  }, [open]);

  const handleSave = async () => {
    if (!imageSrc || !cropPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImageBlob({ imageSrc, cropPixels, size: 512, mimeType: "image/jpeg", quality: 0.9 });
      await onSave(blob);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none">
        <div className="invictus-surface invictus-frame border-border/70 rounded-xl p-4 sm:p-5">
          <DialogHeader className="mb-3">
            <DialogTitle>Recortar foto</DialogTitle>
            <DialogDescription>Arraste para posicionar e use o zoom para ajustar.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-background">
              <div className="relative h-[320px] w-full">
                {imageSrc ? (
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, pixels) => setCropPixels(pixels)}
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.01}
                onValueChange={(v) => setZoom(v[0] ?? 1)}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onCancel();
                  onOpenChange(false);
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handleSave()} disabled={!imageSrc || saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
