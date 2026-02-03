import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PlatformCard, PlatformType } from "@/components/leads/PlatformCard";
import { useToast } from "@/hooks/use-toast";

// Mock connections state (will be replaced with real data)
const initialConnections: Record<PlatformType, { connected: boolean; name?: string; lastSync?: string }> = {
  meta_ads: { connected: false },
  google_ads: { connected: false },
  google_analytics: { connected: false },
};

export default function LeadsConexoes() {
  const { toast } = useToast();
  const [connections, setConnections] = React.useState(initialConnections);
  const [syncing, setSyncing] = React.useState<PlatformType | null>(null);

  const handleConnect = (platform: PlatformType) => {
    // TODO: Implement OAuth flow
    toast({
      title: "Em breve",
      description: `A integração com ${platform === "meta_ads" ? "Meta Ads" : platform === "google_ads" ? "Google Ads" : "Google Analytics"} será implementada em breve.`,
    });
  };

  const handleDisconnect = (platform: PlatformType) => {
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
    // Simulate sync
    await new Promise((r) => setTimeout(r, 2000));
    setSyncing(null);
    toast({
      title: "Sincronizado",
      description: "Os dados foram atualizados com sucesso.",
    });
  };

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
