import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { FeedImageCropDialog } from "@/components/feed/FeedImageCropDialog";
import { SelectedMediaItemCard, type SelectedMedia } from "@/components/feed/SelectedMediaItemCard";

const MAX_FILES = 10;
const MAX_BYTES = 20 * 1024 * 1024;

function isAllowedType(t: string) {
  if (t.startsWith("image/")) return true;
  return t === "video/mp4" || t === "video/webm";
}

type MediaMeta = {
  storage_path: string;
  content_type: string;
  size_bytes: number;
  trim_start_seconds?: number | null;
  trim_end_seconds?: number | null;
};

function sanitizeFileName(name: string) {
  // remove acentos/diacríticos e caracteres estranhos que quebram o storage key
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return base || "arquivo";
}

export function NewFeedPostDialog() {
  const [open, setOpen] = React.useState(false);
  const [caption, setCaption] = React.useState("");
  const [items, setItems] = React.useState<SelectedMedia[]>([]);
  const [cropOpen, setCropOpen] = React.useState(false);
  const [cropTargetId, setCropTargetId] = React.useState<string | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const cropTarget = React.useMemo(() => items.find((i) => i.id === cropTargetId) ?? null, [items, cropTargetId]);

  const hasUncroppedImages = React.useMemo(
    () => items.some((it) => !it.isVideo && it.isCropped !== true),
    [items],
  );

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id;
      if (!me) throw new Error("Not authenticated");

      if (items.length === 0) throw new Error("Selecione pelo menos 1 arquivo");
      if (items.length > MAX_FILES) throw new Error(`Máximo de ${MAX_FILES} arquivos`);

      for (const it of items) {
        const f = it.file;
        if (f.size > MAX_BYTES) throw new Error("Arquivo maior que 20MB");
        if (!isAllowedType(f.type)) throw new Error("Tipo de arquivo não suportado");
        if (it.isVideo) {
          if (typeof it.trimStart === "number" && it.trimStart < 0) throw new Error("Início do vídeo inválido");
          if (typeof it.trimEnd === "number" && it.trimEnd < 0) throw new Error("Fim do vídeo inválido");
          if (typeof it.trimStart === "number" && typeof it.trimEnd === "number" && it.trimEnd <= it.trimStart)
            throw new Error("Fim precisa ser maior que o início");
        }
      }

      if (hasUncroppedImages) {
        throw new Error("Recorte obrigatório: recorte todas as fotos antes de publicar.");
      }

      const postId = crypto.randomUUID();
      const uploaded: MediaMeta[] = [];

      for (const it of items) {
        const f = it.file;
        const safeName = sanitizeFileName(f.name);
        const path = `${me}/${postId}/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("feed-media")
          .upload(path, f, { contentType: f.type, upsert: false });
        if (uploadError) throw uploadError;

        uploaded.push({
          storage_path: path,
          content_type: f.type,
          size_bytes: f.size,
          trim_start_seconds: it.isVideo ? (it.trimStart ?? null) : null,
          trim_end_seconds: it.isVideo ? (it.trimEnd ?? null) : null,
        });
      }

      const { data, error } = await supabase.rpc("create_feed_post", {
        p_post_id: postId,
        p_caption: caption,
        p_media: uploaded,
      });
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["feed_posts"] });
      setCaption("");
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      setItems([]);
      setOpen(false);
      toast({ title: "Publicado!" });
    },
    onError: (e: any) => {
      toast({ title: "Não foi possível publicar", description: e?.message ?? "Tente novamente", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Nova publicação</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl invictus-surface invictus-frame border-border/70">
        <DialogHeader>
          <DialogTitle>Nova publicação</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Escreva uma legenda…"
          />

          <div className="space-y-2">
            <Input
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                // limpa previews anteriores
                items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
                const next: SelectedMedia[] = list.map((f) => {
                  const previewUrl = URL.createObjectURL(f);
                  const isVideo = f.type.startsWith("video/");
                  return { id: crypto.randomUUID(), file: f, previewUrl, isVideo, isCropped: isVideo ? true : false };
                });
                setItems(next);
              }}
            />
            <div className="text-xs text-muted-foreground">
              Até {MAX_FILES} arquivos. Máximo 20MB por arquivo. (Fotos e vídeos mp4/webm)
            </div>
          </div>

          {items.length ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">Prévia / Ajustes</div>
              <div className="space-y-3">
                {items.map((it) => (
                  <SelectedMediaItemCard
                    key={it.id}
                    item={it}
                    onCropClick={() => {
                      setCropTargetId(it.id);
                      setCropOpen(true);
                    }}
                    onTrimChange={(next) => {
                      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, ...next } : x)));
                    }}
                  />
                ))}
              </div>

              {hasUncroppedImages ? (
                <div className="text-sm text-destructive">
                  Recorte obrigatório: recorte todas as fotos antes de publicar.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending || hasUncroppedImages}
          >
            {publishMutation.isPending ? "Publicando…" : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <FeedImageCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropTarget?.previewUrl ?? null}
        onCancel={() => {
          setCropTargetId(null);
        }}
        onSave={async (blob) => {
          if (!cropTarget) return;
          const nextFile = new File([blob], "imagem.jpg", { type: "image/jpeg" });
          const nextUrl = URL.createObjectURL(nextFile);
          setItems((prev) =>
            prev.map((x) => {
              if (x.id !== cropTarget.id) return x;
              URL.revokeObjectURL(x.previewUrl);
              return { ...x, file: nextFile, previewUrl: nextUrl, isVideo: false, isCropped: true };
            }),
          );
        }}
      />
    </Dialog>
  );
}
