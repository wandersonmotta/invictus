import { useLocation, useNavigate } from "react-router-dom";
import { ListChecks, LogOut, Users, Star, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { isLovableHost } from "@/lib/appOrigin";
import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function SuporteBottomNav() {
  const isMobile = useIsMobileOrTablet();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);

  if (!isMobile) return null;

  const basePath = isLovableHost(window.location.hostname) ? "/suporte-backoffice" : "";

  const items = [
    { id: "dashboard", label: "Tickets", icon: ListChecks, url: `${basePath}/dashboard` },
    ...(isAdmin ? [
      { id: "equipe", label: "Equipe", icon: Users, url: `${basePath}/equipe` },
      { id: "avaliacoes", label: "Avaliações", icon: Star, url: `${basePath}/avaliacoes` },
      { id: "ia", label: "IA", icon: Brain, url: `${basePath}/ia` },
    ] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const active = location.pathname.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.url)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              aria-label={item.label}
            >
              <item.icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate(`${basePath}/auth`);
          }}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">Sair</span>
        </button>
      </div>
    </nav>
  );
}
