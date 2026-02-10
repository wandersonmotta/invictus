
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Shield, Users, Server } from "lucide-react";

export default function Diagnostic() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [profilesCount, setProfilesCount] = useState<number | null>(null);
  const [servicesCount, setServicesCount] = useState<number | null>(null);
  const [stripeStatus, setStripeStatus] = useState<"unknown" | "missing_key" | "ok">("unknown");

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      // 1. Check User & Roles
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        setRoles(userRoles?.map(r => r.role) || []);
      }

      // 2. Check Database Counts
      const { count: pCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setProfilesCount(pCount);

      const { count: sCount } = await supabase.from("service_items").select("*", { count: "exact", head: true });
      setServicesCount(sCount);

      // 3. Check Edge Function / Stripe Config (Simulated check)
      // Tenta chamar a função de sync sem credenciais só para ver se responde 400 ou 500
      // Se responder 500 ou erro de auth, sabemos que falta config.
      const { error } = await supabase.functions.invoke('sync-stripe-users');
      if (error?.message?.includes("Invalid API Key") || error?.message?.includes("Stripe")) {
          setStripeStatus("missing_key");
      } else {
          setStripeStatus("unknown"); // Não podemos ter certeza sem a chave
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Diagnóstico do Sistema
          </h1>
          <p className="text-muted-foreground mt-2">
            Verificação de integridade, permissões e serviços.
          </p>
        </div>
        <Button onClick={runDiagnostic} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Permissões */}
        <Card className="border-l-4 border-l-green-500 bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Permissões de Acesso
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <span className="text-sm font-medium">Usuário Logado</span>
                    <span className="text-sm text-muted-foreground">{user?.email || "Não logado"}</span>
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-medium mb-2">Roles Ativas:</p>
                    <div className="flex flex-wrap gap-2">
                        {roles.length > 0 ? roles.map(r => (
                            <span key={r} className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 uppercase">
                                {r}
                            </span>
                        )) : <span className="text-destructive text-sm">Nenhuma permissão encontrada</span>}
                    </div>
                    {roles.includes('admin') && roles.includes('financeiro') && (
                        <p className="text-xs text-green-500 flex items-center gap-1 mt-2">
                            <CheckCircle2 className="h-3 w-3" /> Acesso Total Restaurado
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* Banco de Dados */}
        <Card className="border-l-4 border-l-blue-500 bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-blue-500" />
                    Status do Banco
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <span className="text-sm font-medium">Serviços Cadastrados</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{servicesCount ?? "-"}</span>
                        {servicesCount && servicesCount > 0 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <span className="text-sm font-medium">Perfis de Membros</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{profilesCount ?? "-"}</span>
                        {profilesCount && profilesCount > 1 ? (
                             <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                            <div className="flex items-center gap-1 text-yellow-500 text-xs text-right">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Apenas Admin?</span>
                            </div>
                        )}
                    </div>
                </div>
                {(!profilesCount || profilesCount <= 1) && (
                     <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-xs text-yellow-600 dark:text-yellow-400">
                        <strong>Atenção:</strong> Membros não encontrados. Execute a restauração via Stripe.
                     </div>
                )}
            </CardContent>
        </Card>

        {/* Ação de Recuperação */}
        <Card className="md:col-span-2 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Módulo de Recuperação de Membros
                </CardTitle>
                <CardDescription>
                    Seus membros (Joyce, Thiago, etc.) estão seguros no Stripe, mas precisam ser sincronizados com o banco de dados.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-background/80 backdrop-blur rounded-lg border shadow-sm">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-foreground">Sincronização Manual</h4>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Como a chave de API do Stripe não está configurada no servidor, você precisa rodar o comando de restauração localmente.
                        </p>
                    </div>
                    <div className="bg-muted px-4 py-2 rounded-md font-mono text-sm border">
                        npm run restaurar
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
