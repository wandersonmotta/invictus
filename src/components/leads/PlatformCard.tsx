import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Link2, Unlink, RefreshCw } from "lucide-react";

export type PlatformType = "meta_ads" | "google_ads" | "google_analytics";

interface PlatformCardProps {
  platform: PlatformType;
  isConnected: boolean;
  accountName?: string;
  lastSync?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  className?: string;
}

const platformInfo: Record<
  PlatformType,
  { name: string; color: string; icon: string; description: string }
> = {
  meta_ads: {
    name: "Meta Ads",
    color: "from-blue-600 to-blue-400",
    icon: "📘",
    description: "Conecte sua conta de anúncios do Meta (Facebook/Instagram)",
  },
  google_ads: {
    name: "Google Ads",
    color: "from-green-600 to-green-400",
    icon: "📗",
    description: "Conecte sua conta do Google Ads",
  },
  google_analytics: {
    name: "Google Analytics",
    color: "from-orange-600 to-orange-400",
    icon: "📊",
    description: "Conecte sua propriedade do Google Analytics (GA4)",
  },
};

export function PlatformCard({
  platform,
  isConnected,
  accountName,
  lastSync,
  onConnect,
  onDisconnect,
  onSync,
  isSyncing,
  className,
}: PlatformCardProps) {
  const info = platformInfo[platform];

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        "bg-card/80 backdrop-blur-sm border-border/50",
        isConnected && "ring-1 ring-primary/30",
        className
      )}
    >
      {/* Header gradient */}
      <div className={cn("h-2 bg-gradient-to-r", info.color)} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{info.icon}</span>
            <div>
              <h3 className="font-semibold text-foreground">{info.name}</h3>
              <p className="text-xs text-muted-foreground">{info.description}</p>
            </div>
          </div>

          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              isConnected
                ? "text-green-600 bg-green-500/10"
                : "text-muted-foreground bg-muted"
            )}
          >
            {isConnected ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Conectado
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Desconectado
              </>
            )}
          </div>
        </div>

        {isConnected && accountName && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-foreground font-medium">{accountName}</p>
            {lastSync && (
              <p className="text-xs text-muted-foreground mt-1">
                Última sincronização: {lastSync}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {isConnected ? (
            <>
              {onSync && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSync}
                  disabled={isSyncing}
                  className="flex-1"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
                  Sincronizar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onDisconnect}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            </>
          ) : (
            <Button onClick={onConnect} className="w-full">
              <Link2 className="h-4 w-4 mr-2" />
              Conectar {info.name}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
