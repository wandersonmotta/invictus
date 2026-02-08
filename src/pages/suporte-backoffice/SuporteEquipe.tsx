import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsSuporteGerente } from "@/hooks/useIsSuporteGerente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SuporteEquipe() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(user?.id);
  const { data: isGerente, isLoading: gerenteLoading } = useIsSuporteGerente(user?.id);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState<"atendente" | "gerente">("atendente");

  const canManage = isAdmin || isGerente;

  const callManageAgents = async (body: any) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error("Not authenticated");
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-support-agents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Erro");
    return data;
  };

  const { data: agents, isLoading } = useQuery({
    queryKey: ["support-agents"],
    queryFn: () => callManageAgents({ action: "list" }),
    select: (d) => d.agents || [],
    enabled: !!canManage,
  });

  const createMutation = useMutation({
    mutationFn: () => callManageAgents({ action: "create", email, password, fullName, position }),
    onSuccess: () => {
      toast.success("Membro cadastrado!");
      queryClient.invalidateQueries({ queryKey: ["support-agents"] });
      setOpen(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setPosition("atendente");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (targetUserId: string) => callManageAgents({ action: "remove", targetUserId }),
    onSuccess: () => {
      toast.success("Membro removido!");
      queryClient.invalidateQueries({ queryKey: ["support-agents"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (adminLoading || gerenteLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!canManage) {
    return <Navigate to="/suporte-backoffice/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Equipe de Suporte</h1>
          <p className="text-sm text-muted-foreground">Gerencie os membros da equipe</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Membro</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Ex: João Silva" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="membro@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={position} onValueChange={(v) => setPosition(v as "atendente" | "gerente")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendente">Atendente</SelectItem>
                    <SelectItem value="gerente">Gerente de Suporte</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {position === "gerente"
                    ? "Gerentes podem ver todos os tickets, transferir, gerenciar equipe e ver avaliações."
                    : "Atendentes veem apenas sua própria fila de tickets."}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Cadastrar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !agents || agents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhum membro cadastrado.
        </div>
      ) : (
        <div className="grid gap-3">
          {agents.map((agent: any) => (
            <Card key={agent.user_id} className="bg-card/50">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={agent.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{agent.display_name || "Sem nome"}</p>
                    <Badge variant={agent.is_gerente ? "default" : "secondary"} className="text-[10px] shrink-0">
                      {agent.is_gerente ? "Gerente" : "Atendente"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Remover este membro da equipe?")) {
                      removeMutation.mutate(agent.user_id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
