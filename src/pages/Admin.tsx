import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, Search } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
type Category = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
};
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
type InviteCode = {
  id: string;
  code: string;
  active: boolean;
  archived_at: string | null;
  archived_by: string | null;
  expires_at: string | null;
  max_uses: number;
  uses_count: number;
  note: string | null;
  created_at: string;
};
type PendingProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  access_status: "pending" | "approved" | "rejected";
};

type WaitlistLead = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  source: string | null;
  created_at: string;
};
export default function Admin() {
  const { user } = useAuth();
  const {
    toast
  } = useToast();
  const qc = useQueryClient();

  const { data: isAdmin, isLoading: isAdminLoading, isError: isAdminError } = useIsAdmin(user?.id);

  // Defense in depth: even if someone reaches this component, never render admin UI unless admin.
  if (isAdminLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  if (isAdminError || !isAdmin) {
    return <Navigate to="/app" replace />;
  }
  const {
    data: categories
  } = useQuery({
    queryKey: ["training_categories"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("training_categories").select("id,name,description,sort_order").order("sort_order", {
        ascending: true
      }).order("name", {
        ascending: true
      });
      if (error) throw error;
      return (data ?? []) as Category[];
    }
  });
  const {
    data: trainings
  } = useQuery({
    queryKey: ["trainings_admin"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("trainings").select("id,category_id,title,youtube_url,cover_url,published,sort_order,created_at").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return (data ?? []) as Training[];
    }
  });
  const {
    data: invites
  } = useQuery({
    queryKey: ["invite_codes"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("invite_codes").select("id,code,active,archived_at,archived_by,expires_at,max_uses,uses_count,note,created_at").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return (data ?? []) as InviteCode[];
    }
  });
  const {
    data: pendingProfiles,
    isLoading: pendingProfilesLoading,
    isError: pendingProfilesIsError,
    error: pendingProfilesError,
    refetch: refetchPendingProfiles,
  } = useQuery({
    queryKey: ["pending_profiles"],
    enabled: !!isAdmin,
    // Keep this list fresh so admins see new signups without hard refresh.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
    queryFn: async () => {
      // Use a higher limit to avoid "missing" users when the queue grows.
      const { data, error } = await supabase.rpc("admin_list_pending_profiles_logged", { p_limit: 1000 });
      if (error) throw error;
      const list = (data ?? []) as PendingProfile[];
      // Defensive: ensure newest first even if RPC ordering changes.
      return list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
  });

  // --- Waitlist Leads ---
  const { data: waitlistLeads } = useQuery({
    queryKey: ["waitlist_leads"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist_leads")
        .select("id, email, full_name, phone, source, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WaitlistLead[];
    }
  });

  const [leadsSearch, setLeadsSearch] = React.useState("");

  const filteredLeads = React.useMemo(() => {
    const list = waitlistLeads ?? [];
    if (!leadsSearch.trim()) return list;
    const q = leadsSearch.toLowerCase();
    return list.filter(
      (l) =>
        (l.full_name?.toLowerCase().includes(q)) ||
        l.email.toLowerCase().includes(q)
    );
  }, [waitlistLeads, leadsSearch]);

  const formatPhone = (phone: string | null) => {
    if (!phone) return "—";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const exportLeadsToCSV = () => {
    const list = filteredLeads;
    if (list.length === 0) {
      toast({ title: "Nenhum lead para exportar" });
      return;
    }
    const headers = ["Nome", "WhatsApp", "Email", "Origem", "Data"];
    const rows = list.map((lead) => [
      lead.full_name || "",
      formatPhone(lead.phone),
      lead.email,
      lead.source || "",
      new Date(lead.created_at).toLocaleString("pt-BR")
    ]);
    const bom = "\uFEFF";
    const csv = bom + [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-waitlist-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${list.length} lead(s) exportado(s)` });
  };

  // --- Category form ---
  const [catName, setCatName] = React.useState("");
  const [catDesc, setCatDesc] = React.useState("");
  const createCategory = async () => {
    if (!catName.trim()) return;
    const {
      error
    } = await supabase.from("training_categories").insert({
      name: catName.trim(),
      description: catDesc.trim() || null
    });
    if (error) {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    setCatName("");
    setCatDesc("");
    toast({
      title: "Categoria criada"
    });
    await qc.invalidateQueries({
      queryKey: ["training_categories"]
    });
  };
  const deleteCategory = async (id: string) => {
    const {
      error
    } = await supabase.from("training_categories").delete().eq("id", id);
    if (error) {
      toast({
        title: "Erro ao remover categoria",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Categoria removida"
    });
    await qc.invalidateQueries({
      queryKey: ["training_categories"]
    });
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
    if (!trainingCover || !user?.id) return {
      cover_url: null as string | null,
      cover_path: null as string | null
    };
    const ext = trainingCover.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `${user.id}/${filename}`;
    const {
      error: uploadError
    } = await supabase.storage.from("training-covers").upload(path, trainingCover, {
      upsert: false,
      contentType: trainingCover.type
    });
    if (uploadError) throw uploadError;
    const {
      data
    } = supabase.storage.from("training-covers").getPublicUrl(path);
    return {
      cover_url: data.publicUrl,
      cover_path: path
    };
  };
  const createTraining = async () => {
    if (!trainingTitle.trim() || !trainingUrl.trim()) return;
    setSavingTraining(true);
    try {
      const cover = await uploadCoverIfNeeded();
      const {
        error
      } = await supabase.from("trainings").insert({
        title: trainingTitle.trim(),
        youtube_url: trainingUrl.trim(),
        description: trainingDesc.trim() || null,
        category_id: trainingCategoryId ?? null,
        published: trainingPublished,
        cover_url: cover.cover_url,
        cover_path: cover.cover_path
      });
      if (error) throw error;
      setTrainingTitle("");
      setTrainingUrl("");
      setTrainingDesc("");
      setTrainingCategoryId(undefined);
      setTrainingPublished(true);
      setTrainingCover(null);
      toast({
        title: "Treinamento criado"
      });
      await Promise.all([qc.invalidateQueries({
        queryKey: ["trainings_admin"]
      }), qc.invalidateQueries({
        queryKey: ["trainings"]
      })]);
    } catch (e: any) {
      toast({
        title: "Erro ao criar treinamento",
        description: e?.message ?? String(e),
        variant: "destructive"
      });
    } finally {
      setSavingTraining(false);
    }
  };
  const deleteTraining = async (id: string) => {
    const {
      error
    } = await supabase.from("trainings").delete().eq("id", id);
    if (error) {
      toast({
        title: "Erro ao remover treinamento",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Treinamento removido"
    });
    await Promise.all([qc.invalidateQueries({
      queryKey: ["trainings_admin"]
    }), qc.invalidateQueries({
      queryKey: ["trainings"]
    })]);
  };

  // --- Invites ---
  const [inviteNote, setInviteNote] = React.useState("");
  const [inviteMaxUses, setInviteMaxUses] = React.useState(1);
  const [inviteExpiresAt, setInviteExpiresAt] = React.useState<string>("");
  const [creatingInvite, setCreatingInvite] = React.useState(false);
  const genInviteCode = () => {
    // Simple, readable format. Admin can regenerate if needed.
    const raw = crypto.getRandomValues(new Uint32Array(2));
    const part = (n: number) => n.toString(16).toUpperCase().padStart(8, "0");
    return `INV-${part(raw[0]).slice(0, 4)}${part(raw[1]).slice(0, 4)}`;
  };
  const createInvite = async () => {
    if (creatingInvite) return;
    setCreatingInvite(true);
    try {
      const code = genInviteCode();
      const max_uses = Math.max(1, Math.min(999, Number(inviteMaxUses) || 1));
      const expires_at = inviteExpiresAt ? new Date(inviteExpiresAt).toISOString() : null;
      const {
        error
      } = await supabase.from("invite_codes").insert({
        code,
        max_uses,
        expires_at,
        note: inviteNote.trim() || null,
        created_by: user?.id ?? null
      });
      if (error) throw error;
      toast({
        title: "Convite criado",
        description: code
      });
      setInviteNote("");
      setInviteMaxUses(1);
      setInviteExpiresAt("");
      await qc.invalidateQueries({
        queryKey: ["invite_codes"]
      });
    } catch (e: any) {
      toast({
        title: "Erro ao criar convite",
        description: e?.message ?? String(e),
        variant: "destructive"
      });
    } finally {
      setCreatingInvite(false);
    }
  };
  const setInviteActive = async (id: string, active: boolean) => {
    const {
      error
    } = await supabase.from("invite_codes").update({
      active
    }).eq("id", id);
    if (error) {
      toast({
        title: "Erro ao atualizar convite",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    await qc.invalidateQueries({
      queryKey: ["invite_codes"]
    });
  };

  type ArchiveDialogState =
    | {
        open: true;
        mode: "single" | "selected" | "all";
        ids: string[];
      }
    | { open: false };

  const [showArchived, setShowArchived] = React.useState(false);
  const [selectedInviteIds, setSelectedInviteIds] = React.useState<Set<string>>(() => new Set());
  const [archiveDialog, setArchiveDialog] = React.useState<ArchiveDialogState>({ open: false });

  const visibleInvites = React.useMemo(() => {
    const list = invites ?? [];
    return showArchived ? list : list.filter((i) => i.archived_at == null);
  }, [invites, showArchived]);

  const archivableInvites = React.useMemo(
    () => visibleInvites.filter((i) => i.archived_at == null && i.uses_count === 0),
    [visibleInvites],
  );

  const archivableIds = React.useMemo(() => new Set(archivableInvites.map((i) => i.id)), [archivableInvites]);

  const selectedArchivableIds = React.useMemo(() => {
    const ids: string[] = [];
    selectedInviteIds.forEach((id) => {
      if (archivableIds.has(id)) ids.push(id);
    });
    return ids;
  }, [selectedInviteIds, archivableIds]);

  const allArchivableSelected = archivableInvites.length > 0 && selectedArchivableIds.length === archivableInvites.length;

  const toggleSelectAllArchivable = () => {
    setSelectedInviteIds((prev) => {
      const next = new Set(prev);
      if (allArchivableSelected) {
        archivableInvites.forEach((i) => next.delete(i.id));
      } else {
        archivableInvites.forEach((i) => next.add(i.id));
      }
      return next;
    });
  };

  const toggleRowSelected = (id: string, checked: boolean) => {
    setSelectedInviteIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const archiveInvites = async (ids: string[], successTitle: string) => {
    if (ids.length === 0) return;
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("invite_codes")
      .update({ archived_at: nowIso })
      .in("id", ids)
      .is("archived_at", null)
      .eq("uses_count", 0)
      .select("id");
    if (error) {
      toast({
        title: "Erro ao arquivar convites",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const archivedCount = (data ?? []).length;
    const skippedCount = Math.max(0, ids.length - archivedCount);

    toast({
      title: successTitle,
      description: skippedCount > 0 ? `${skippedCount} ignorado(s) (já usado(s) ou já arquivado(s)).` : undefined,
    });
    setSelectedInviteIds(new Set());
    await qc.invalidateQueries({ queryKey: ["invite_codes"] });
  };

  // --- Approvals ---
  const approveUser = async (profileId: string) => {
    if (!user?.id) return;
    const {
      error
    } = await supabase.from("profiles").update({
      access_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id
    }).eq("id", profileId);
    if (error) {
      toast({
        title: "Erro ao aprovar",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Usuário aprovado"
    });
    await qc.invalidateQueries({
      queryKey: ["pending_profiles"]
    });
  };
  return <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Admin</h1>
        <p className="invictus-lead">Painel administrativo</p>
      </header>

      {!isAdmin ? <Card className="invictus-surface invictus-frame border-border/70">
          <CardHeader>
            <CardTitle>Sem permissão</CardTitle>
            <CardDescription>
              Você precisa da role <span className="font-medium text-foreground">admin</span> para acessar esta área.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Se você deveria ser admin, peça para um administrador validar sua conta e permissões.</p>
          </CardContent>
        </Card> : <Tabs defaultValue="approvals" className="w-full">
          <TabsList className="grid h-11 w-full grid-cols-5">
            <TabsTrigger value="approvals">Aprovações</TabsTrigger>
            <TabsTrigger value="invites">Convites</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="trainings">Treinamentos</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="mt-4 space-y-4">
            <Card className="invictus-surface invictus-frame border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Fila de aprovação</CardTitle>
                <CardDescription>Usuários criados com convite ficam com acesso limitado até aprovação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingProfilesLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando fila…</p>
                ) : pendingProfilesIsError ? (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive">Não foi possível carregar a fila de aprovação.</p>
                    <p className="text-xs text-muted-foreground">
                      {(pendingProfilesError as any)?.message ? String((pendingProfilesError as any).message) : "Tente novamente."}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => void refetchPendingProfiles()}>
                      Recarregar
                    </Button>
                  </div>
                ) : (pendingProfiles ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário pendente no momento.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingProfiles?.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{p.display_name || "Sem nome"}</p>
                          <p className="break-all text-xs text-muted-foreground">{p.user_id}</p>
                        </div>
                        <Button className="h-9" onClick={() => void approveUser(p.id)}>
                          Aprovar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="mt-4 space-y-4">
            <Card className="invictus-surface invictus-frame border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Novo convite</CardTitle>
                <CardDescription>Crie códigos para liberar cadastro.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="inv-note">Nota (opcional)</Label>
                  <Input id="inv-note" value={inviteNote} onChange={e => setInviteNote(e.target.value)} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="inv-uses">Máx. usos</Label>
                    <Input id="inv-uses" type="number" min={1} max={999} value={inviteMaxUses} onChange={e => setInviteMaxUses(Number(e.target.value))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="inv-exp">Expira em (opcional)</Label>
                    <Input id="inv-exp" type="datetime-local" value={inviteExpiresAt} onChange={e => setInviteExpiresAt(e.target.value)} />
                  </div>
                </div>

                <Button className="h-11" onClick={() => void createInvite()} disabled={creatingInvite}>
                  {creatingInvite ? "Criando…" : "Gerar convite"}
                </Button>
              </CardContent>
            </Card>

            <Card className="invictus-surface invictus-frame border-border/70">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">Convites</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={showArchived} onCheckedChange={setShowArchived} />
                      <span className="text-sm text-muted-foreground">Mostrar arquivados</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedArchivableIds.length === 0}
                      onClick={() => setArchiveDialog({ open: true, mode: "selected", ids: selectedArchivableIds })}
                    >
                      Arquivar selecionados
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={archivableInvites.length === 0}
                      onClick={() => setArchiveDialog({ open: true, mode: "all", ids: archivableInvites.map((i) => i.id) })}
                    >
                      Arquivar todos
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {visibleInvites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum convite para exibir.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[44px]">
                          <Checkbox
                            checked={allArchivableSelected}
                            onCheckedChange={() => toggleSelectAllArchivable()}
                            aria-label="Selecionar todos os arquiváveis"
                          />
                        </TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usos</TableHead>
                        <TableHead>Expira</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {visibleInvites.map((inv) => {
                        const isArchived = inv.archived_at != null;
                        const isUsed = inv.uses_count > 0;
                        const canArchive = !isArchived && !isUsed;
                        const selected = selectedInviteIds.has(inv.id);

                        const status = isArchived
                          ? "Arquivado"
                          : inv.active
                            ? "Ativo"
                            : "Inativo";

                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="w-[44px]">
                              <Checkbox
                                checked={selected}
                                disabled={!canArchive}
                                onCheckedChange={(v) => toggleRowSelected(inv.id, v === true)}
                                aria-label={`Selecionar convite ${inv.code}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{inv.code}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{status}</span>
                                {isUsed && <span className="text-xs text-muted-foreground">Já usado</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {inv.uses_count}/{inv.max_uses}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {inv.expires_at ? new Date(inv.expires_at).toLocaleString() : "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{inv.note ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isArchived}
                                  onClick={() => void setInviteActive(inv.id, !inv.active)}
                                >
                                  {inv.active ? "Desativar" : "Ativar"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!canArchive}
                                  onClick={() => setArchiveDialog({ open: true, mode: "single", ids: [inv.id] })}
                                >
                                  Arquivar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <AlertDialog open={archiveDialog.open} onOpenChange={(open) => setArchiveDialog(open ? archiveDialog : { open: false })}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Arquivar convites</AlertDialogTitle>
                  <AlertDialogDescription>
                    {archiveDialog.open && archiveDialog.mode === "single"
                      ? "Este arquivamento é definitivo. O convite ficará inativo e não poderá ser reativado."
                      : "Este arquivamento é definitivo. Convites arquivados ficarão inativos e não poderão ser reativados."}
                    <br />
                    Convites já usados não podem ser arquivados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setArchiveDialog({ open: false })}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (!archiveDialog.open) return;
                      const ids = archiveDialog.ids;
                      const title =
                        ids.length === 1
                          ? "Convite arquivado"
                          : `${ids.length} convites arquivados`;
                      setArchiveDialog({ open: false });
                      void archiveInvites(ids, title);
                    }}
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="categories" className="mt-4 space-y-4">
            <Card className="invictus-surface invictus-frame border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Nova categoria</CardTitle>
                <CardDescription>Ex.: Liderança, Vendas, Design, Growth…</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="cat-name">Nome</Label>
                  <Input id="cat-name" value={catName} onChange={e => setCatName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cat-desc">Descrição (opcional)</Label>
                  <Textarea id="cat-desc" value={catDesc} onChange={e => setCatDesc(e.target.value)} />
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
                {(categories ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p> : <div className="space-y-2">
                    {categories?.map(c => <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => void deleteCategory(c.id)}>
                          Remover
                        </Button>
                      </div>)}
                  </div>}
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
                  <Input id="t-title" value={trainingTitle} onChange={e => setTrainingTitle(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="t-url">URL do YouTube</Label>
                  <Input id="t-url" value={trainingUrl} onChange={e => setTrainingUrl(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={trainingCategoryId} onValueChange={v => setTrainingCategoryId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).map(c => <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="t-cover">Capa (imagem)</Label>
                  <Input id="t-cover" type="file" accept="image/*" onChange={e => setTrainingCover(e.target.files?.[0] ?? null)} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="t-desc">Descrição (opcional)</Label>
                  <Textarea id="t-desc" value={trainingDesc} onChange={e => setTrainingDesc(e.target.value)} />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium">Publicado</p>
                    <p className="text-xs text-muted-foreground">Desative para esconder na aba Class.</p>
                  </div>
                  <Switch checked={trainingPublished} onCheckedChange={setTrainingPublished} />
                </div>

                <Button className="h-11" onClick={() => void createTraining()} disabled={savingTraining || !trainingTitle.trim() || !trainingUrl.trim()}>
                  {savingTraining ? "Salvando…" : "Criar treinamento"}
                </Button>
              </CardContent>
            </Card>

            <Card className="invictus-surface invictus-frame border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Treinamentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(trainings ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum treinamento cadastrado ainda.</p> : <div className="space-y-2">
                    {trainings?.map(t => <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
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
                      </div>)}
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="mt-4 space-y-4">
            <Card className="invictus-surface invictus-frame border-border/70">
              <CardHeader>
                <CardTitle className="text-base">Leads da Lista de Espera</CardTitle>
                <CardDescription>Pessoas interessadas que preencheram o formulário na landing page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={leadsSearch}
                      onChange={(e) => setLeadsSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" onClick={exportLeadsToCSV} disabled={(waitlistLeads ?? []).length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>

                {filteredLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {leadsSearch.trim() ? "Nenhum lead encontrado com esse filtro." : "Nenhum lead cadastrado ainda."}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.full_name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{formatPhone(lead.phone)}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.source || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(lead.created_at).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <p className="text-xs text-muted-foreground">
                  Total: {filteredLeads.length} lead(s)
                  {leadsSearch.trim() && waitlistLeads && filteredLeads.length !== waitlistLeads.length && 
                    ` (de ${waitlistLeads.length} total)`
                  }
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>}
    </main>;
}