import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const MAX_FILES = 10;
const MAX_BYTES = 20 * 1024 * 1024;

function isAllowedType(t: string) {
  if (t.startsWith("image/")) return true;
  return t === "video/mp4" || t === "video/webm";
}

type MediaMeta = { storage_path: string; content_type: string; size_bytes: number };

export function NewFeedPostDialog() {
  const [open, setOpen] = React.useState(false);
  const [caption, setCaption] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const qc = useQueryClient();
  const { toast } = useToast();

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id;
      if (!me) throw new Error("Not authenticated");

      if (files.length === 0) throw new Error("Selecione pelo menos 1 arquivo");
      if (files.length > MAX_FILES) throw new Error(`Máximo de ${MAX_FILES} arquivos`);

      for (const f of files) {
        if (f.size > MAX_BYTES) throw new Error("Arquivo maior que 20MB");
        if (!isAllowedType(f.type)) throw new Error("Tipo de arquivo não suportado");
      }

      const postId = crypto.randomUUID();
      const uploaded: MediaMeta[] = [];

      for (const f of files) {
        const safeName = f.name.replace(/\s+/g, "-");
        const path = `${me}/${postId}/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("feed-media")
          .upload(path, f, { contentType: f.type, upsert: false });
        if (uploadError) throw uploadError;

        uploaded.push({ storage_path: path, content_type: f.type, size_bytes: f.size });
      }

      const { data, error } = await supabase.rpc("create_feed_post", {
        p_caption: caption,
        p_media: uploaded,
      });
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["feed_posts"] });
      setCaption("");
      setFiles([]);
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
                setFiles(list);
              }}
            />
            <div className="text-xs text-muted-foreground">
              Até {MAX_FILES} arquivos. Máximo 20MB por arquivo. (Fotos e vídeos mp4/webm)
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
            {publishMutation.isPending ? "Publicando…" : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
