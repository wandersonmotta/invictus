import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PlatformCard, PlatformType } from "@/components/leads/PlatformCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { getAppOrigin } from "@/lib/appOrigin";

type ConnectionState = {
  connected: boolean;
  name?: string;
  lastSync?: string;
};

export default function LeadsConexoes() {
  const { toast } = useToast();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [connections, setConnections] = React.useState<Record<PlatformType, ConnectionState>>({
    meta_ads: { connected: false },
    google_ads: { connected: false },
    google_analytics: { connected: false },
  });
  const [syncing, setSyncing] = React.useState<PlatformType | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Fetch existing connections on mount
  React.useEffect(() => {
    async function fetchConnections() {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("ad_platform_connections")
        .select("platform, account_name, last_sync_at, is_active")
        .eq("user_id", session.user.id)
        .eq("is_active", true);

      if (!error && data) {
        const newConnections: Record<PlatformType, ConnectionState> = {
          meta_ads: { connected: false },
          google_ads: { connected: false },
          google_analytics: { connected: false },
        };

        data.forEach((conn) => {
          const platform = conn.platform as PlatformType;
          if (newConnections[platform]) {
            newConnections[platform] = {
              connected: true,
              name: conn.account_name || undefined,
              lastSync: conn.last_sync_at
                ? new Date(conn.last_sync_at).toLocaleString("pt-BR")
                : undefined,
            };
          }
        });

        setConnections(newConnections);
      }
      setLoading(false);
    }

    fetchConnections();
  }, [session?.user?.id]);

  // Handle OAuth callback
  React.useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && session?.access_token) {
      // Determine which platform based on state
      if (state) {
        try {
          const parsedState = JSON.parse(state);
          if (parsedState.platform === "google_ads" || parsedState.platform === "google_analytics") {
            handleGoogleCallback(code, state);
            return;
          }
        } catch {
          // Not a Google callback, try Meta
        }
      }
      handleMetaCallback(code);
    }
  }, [searchParams, session?.access_token]);

  const handleMetaCallback = async (code: string) => {
    try {
      const redirectUri = `${getAppOrigin()}/leads/conexoes`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leads-meta-oauth?action=callback&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Falha ao conectar Meta Ads");
      }

      setConnections((prev) => ({
        ...prev,
        meta_ads: {
          connected: true,
          name: result.account_name,
          lastSync: new Date().toLocaleString("pt-BR"),
        },
      }));

      toast({
        title: "Conectado!",
        description: `Meta Ads (${result.account_name}) conectado com sucesso.`,
      });

      // Clean URL
      window.history.replaceState({}, document.title, "/leads/conexoes");
    } catch (error) {
      console.error("Meta callback error:", error);
      toast({
        title: "Erro na conexão",
        description: error instanceof Error ? error.message : "Falha ao conectar Meta Ads",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, "/leads/conexoes");
    }
  };

  const handleGoogleCallback = async (code: string, state: string) => {
    try {
      const redirectUri = `${getAppOrigin()}/leads/conexoes`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leads-google-oauth?action=callback&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Falha ao conectar Google");
      }

      const platform = result.platform as PlatformType;
      setConnections((prev) => ({
        ...prev,
        [platform]: {
          connected: true,
          name: result.account_name,
          lastSync: new Date().toLocaleString("pt-BR"),
        },
      }));

      toast({
        title: "Conectado!",
        description: `${platform === "google_ads" ? "Google Ads" : "Google Analytics"} conectado com sucesso.`,
      });

      // Clean URL
      window.history.replaceState({}, document.title, "/leads/conexoes");
    } catch (error) {
      console.error("Google callback error:", error);
      toast({
        title: "Erro na conexão",
        description: error instanceof Error ? error.message : "Falha ao conectar Google",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, "/leads/conexoes");
    }
  };

  const handleConnect = async (platform: PlatformType) => {
    if (platform === "meta_ads") {
      try {
        const redirectUri = `${getAppOrigin()}/leads/conexoes`;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leads-meta-oauth?action=get_auth_url&redirect_uri=${encodeURIComponent(redirectUri)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error || "Falha ao iniciar OAuth");
        }

        // Redirect to Meta OAuth
        window.location.href = result.auth_url;
      } catch (error) {
        console.error("Meta connect error:", error);
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Falha ao conectar",
          variant: "destructive",
        });
      }
    } else if (platform === "google_ads" || platform === "google_analytics") {
      try {
        const redirectUri = `${getAppOrigin()}/leads/conexoes`;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leads-google-oauth?action=get_auth_url&redirect_uri=${encodeURIComponent(redirectUri)}&platform=${platform}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error || "Falha ao iniciar OAuth");
        }

        // Redirect to Google OAuth
        window.location.href = result.auth_url;
      } catch (error) {
        console.error("Google connect error:", error);
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Falha ao conectar",
          variant: "destructive",
        });
      }
    }
  };

  const handleDisconnect = async (platform: PlatformType) => {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from("ad_platform_connections")
      .update({ is_active: false })
      .eq("user_id", session.user.id)
      .eq("platform", platform);

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao desconectar plataforma.",
        variant: "destructive",
      });
      return;
    }

    setConnections((prev) => ({
      ...prev,
      [platform]: { connected: false },
    }));

    toast({
      title: "Desconectado",
      description: "A plataforma foi desconectada com sucesso.",
    });
  };

  const handleSync = async (platform: PlatformType) => {
    setSyncing(platform);
    // TODO: Implement real sync
    await new Promise((r) => setTimeout(r, 2000));
    setSyncing(null);
    toast({
      title: "Sincronizado",
      description: "Os dados foram atualizados com sucesso.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/leads">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conexões</h1>
          <p className="text-sm text-muted-foreground">
            Conecte suas plataformas de anúncios e analytics
          </p>
        </div>
      </div>

      {/* Help banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <HelpCircle className="h-5 w-5 text-primary mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-foreground">Como funciona?</p>
          <p className="text-muted-foreground mt-1">
            Ao conectar suas contas, você autoriza a Invictus a acessar seus dados de campanha
            de forma segura. Seus tokens são criptografados e nunca compartilhados.
          </p>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-4">
        <PlatformCard
          platform="meta_ads"
          isConnected={connections.meta_ads.connected}
          accountName={connections.meta_ads.name}
          lastSync={connections.meta_ads.lastSync}
          onConnect={() => handleConnect("meta_ads")}
          onDisconnect={() => handleDisconnect("meta_ads")}
          onSync={() => handleSync("meta_ads")}
          isSyncing={syncing === "meta_ads"}
        />

        <PlatformCard
          platform="google_ads"
          isConnected={connections.google_ads.connected}
          accountName={connections.google_ads.name}
          lastSync={connections.google_ads.lastSync}
          onConnect={() => handleConnect("google_ads")}
          onDisconnect={() => handleDisconnect("google_ads")}
          onSync={() => handleSync("google_ads")}
          isSyncing={syncing === "google_ads"}
        />

        <PlatformCard
          platform="google_analytics"
          isConnected={connections.google_analytics.connected}
          accountName={connections.google_analytics.name}
          lastSync={connections.google_analytics.lastSync}
          onConnect={() => handleConnect("google_analytics")}
          onDisconnect={() => handleDisconnect("google_analytics")}
          onSync={() => handleSync("google_analytics")}
          isSyncing={syncing === "google_analytics"}
        />
      </div>

      {/* Requirements note */}
      <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t border-border/50">
        <p className="font-medium">Requisitos para conexão:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Meta Ads: Conta de anúncios ativa no Facebook/Instagram</li>
          <li>Google Ads: Conta de anúncios ativa no Google</li>
          <li>Google Analytics: Propriedade GA4 configurada</li>
        </ul>
      </div>
    </div>
  );
}
