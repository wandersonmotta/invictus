import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Category = { id: string; name: string; description: string | null; sort_order: number };
type Training = {
  id: string;
  category_id: string | null;
  title: string;
  youtube_url: string;
  cover_url: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: isAdmin } = useQuery({
    queryKey: ["is_admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["training_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_categories")
        .select("id,name,description,sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const { data: trainings } = useQuery({
    queryKey: ["trainings_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select("id,category_id,title,youtube_url,cover_url,published,sort_order,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Training[];
    },
  });

  // --- Category form ---
  const [catName, setCatName] = React.useState("");
  const [catDesc, setCatDesc] = React.useState("");

  const createCategory = async () => {
    if (!catName.trim()) return;
    const { error } = await supabase.from("training_categories").insert({
      name: catName.trim(),
      description: catDesc.trim() || null,
    });
    if (error) {
      toast({ title: "Erro ao criar categoria", description: error.message, variant: "destructive" });
      return;
    }
    setCatName("");
    setCatDesc("");
    toast({ title: "Categoria criada" });
    await qc.invalidateQueries({ queryKey: ["training_categories"] });
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("training_categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover categoria", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Categoria removida" });
    await qc.invalidateQueries({ queryKey: ["training_categories"] });
  };

  // --- Training form ---
  const [trainingTitle, setTrainingTitle] = React.useState("");
  const [trainingUrl, setTrainingUrl] = React.useState("");
  const [trainingDesc, setTrainingDesc] = React.useState("");
  const [trainingCategoryId, setTrainingCategoryId] = React.useState<string | undefined>(undefined);
  const [trainingPublished, setTrainingPublished] = React.useState(true);
  const [trainingCover, setTrainingCover] = React.useState<File | null>(null);
  const [savingTraining, setSavingTraining] = React.useState(false);

  const uploadCoverIfNeeded = async () => {
    if (!trainingCover || !user?.id) return { cover_url: null as string | null, cover_path: null as string | null };

    const ext = trainingCover.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `${user.id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("training-covers")
      .upload(path, trainingCover, { upsert: false, contentType: trainingCover.type });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("training-covers").getPublicUrl(path);
    return { cover_url: data.publicUrl, cover_path: path };
  };

  const createTraining = async () => {
    if (!trainingTitle.trim() || !trainingUrl.trim()) return;
    setSavingTraining(true);
    try {
      const cover = await uploadCoverIfNeeded();

      const { error } = await supabase.from("trainings").insert({
        title: trainingTitle.trim(),
        youtube_url: trainingUrl.trim(),
        description: trainingDesc.trim() || null,
        category_id: trainingCategoryId ?? null,
        published: trainingPublished,
        cover_url: cover.cover_url,
        cover_path: cover.cover_path,
      });
      if (error) throw error;

      setTrainingTitle("");
      setTrainingUrl("");
      setTrainingDesc("");
      setTrainingCategoryId(undefined);
      setTrainingPublished(true);
      setTrainingCover(null);

      toast({ title: "Treinamento criado" });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["trainings_admin"] }),
        qc.invalidateQueries({ queryKey: ["trainings"] }),
      ]);
    } catch (e: any) {
      toast({ title: "Erro ao criar treinamento", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSavingTraining(false);
    }
  };

  const deleteTraining = async (id: string) => {
    const { error } = await supabase.from("trainings").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover treinamento", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Treinamento removido" });
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["trainings_admin"] }),
      qc.invalidateQueries({ queryKey: ["trainings"] }),
    ]);
  };

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Admin</h1>
        <p className="invictus-lead">Gerenciar categorias e treinamentos da aba Class.</p>
      </header>

      {!isAdmin ? (
        <Card className="invictus-surface invictus-frame border-border/70">
          <CardHeader>
            <CardTitle>Sem permissão</CardTitle>
            <CardDescription>
              Você precisa da role <span className="font-medium text-foreground">admin</span> para gerenciar a aba Class.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Para habilitar, adicione uma linha em <span className="font-medium text-foreground">user_roles</span> com:
            </p>
            <ul className="list-disc pl-5">
              <li>
                <span className="font-medium text-foreground">user_id</span>: {user?.id}
              </li>
              <li>
                <span className="font-medium text-foreground">role</span>: admin
              </li>
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid h-11 w-full grid-cols-2">
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="trainings">Treinamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-4 space-y-4">
            <Card className="invictus-surface invictus-frame border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Nova categoria</CardTitle>
                <CardDescription>Ex.: Liderança, Vendas, Design, Growth…</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="cat-name">Nome</Label>
                  <Input id="cat-name" value={catName} onChange={(e) => setCatName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cat-desc">Descrição (opcional)</Label>
                  <Textarea id="cat-desc" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
                </div>
                <Button className="h-11" onClick={() => void createCategory()} disabled={!catName.trim()}>
                  Criar categoria
                </Button>
              </CardContent>
            </Card>

            <Card className="invictus-surface invictus-frame border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Categorias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(categories ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {categories?.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => void deleteCategory(c.id)}>
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainings" className="mt-4 space-y-4">
            <Card className="invictus-surface invictus-frame border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Novo treinamento</CardTitle>
                <CardDescription>Link do YouTube + capa (padrão Netflix).</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="t-title">Título</Label>
                  <Input id="t-title" value={trainingTitle} onChange={(e) => setTrainingTitle(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="t-url">URL do YouTube</Label>
                  <Input id="t-url" value={trainingUrl} onChange={(e) => setTrainingUrl(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={trainingCategoryId} onValueChange={(v) => setTrainingCategoryId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="t-cover">Capa (imagem)</Label>
                  <Input
                    id="t-cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setTrainingCover(e.target.files?.[0] ?? null)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="t-desc">Descrição (opcional)</Label>
                  <Textarea id="t-desc" value={trainingDesc} onChange={(e) => setTrainingDesc(e.target.value)} />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium">Publicado</p>
                    <p className="text-xs text-muted-foreground">Desative para esconder na aba Class.</p>
                  </div>
                  <Switch checked={trainingPublished} onCheckedChange={setTrainingPublished} />
                </div>

                <Button
                  className="h-11"
                  onClick={() => void createTraining()}
                  disabled={savingTraining || !trainingTitle.trim() || !trainingUrl.trim()}
                >
                  {savingTraining ? "Salvando…" : "Criar treinamento"}
                </Button>
              </CardContent>
            </Card>

            <Card className="invictus-surface invictus-frame border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Treinamentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(trainings ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum treinamento cadastrado ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {trainings?.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{t.youtube_url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{t.published ? "publicado" : "oculto"}</span>
                          <Button variant="destructive" size="sm" onClick={() => void deleteTraining(t.id)}>
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
