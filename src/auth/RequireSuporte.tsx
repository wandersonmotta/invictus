import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useIsSuporte } from "@/hooks/useIsSuporte";
import { isLovableHost } from "@/lib/appOrigin";

interface Props { children: ReactNode; }

export function RequireSuporte({ children }: Props) {
  const { isSuporte, loading } = useIsSuporte();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verificando acesso...</div>
      </div>
    );
  }

  if (!isSuporte) {
    const loginPath = isLovableHost(window.location.hostname)
      ? "/suporte-backoffice/auth"
      : "/auth";
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
}
