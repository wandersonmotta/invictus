import { Navigate } from "react-router-dom";
import { useFinanceiroRole } from "@/hooks/useFinanceiroRole";
import { isLovableHost } from "@/lib/appOrigin";

/**
 * Route guard that only allows financeiro_gerente and admin users through.
 * Auditors are redirected to the financeiro dashboard (audit queue).
 */
export function RequireFinanceiroManager({ children }: { children: React.ReactNode }) {
  const { isManager, loading } = useFinanceiroRole();
  const basePath = isLovableHost(window.location.hostname) ? "/financeiro" : "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!isManager) {
    return <Navigate to={`${basePath}/dashboard`} replace />;
  }

  return <>{children}</>;
}
