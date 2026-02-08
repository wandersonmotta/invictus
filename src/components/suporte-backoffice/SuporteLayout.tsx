import { ReactNode, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, ListChecks, Monitor, Sun, Moon, Users, Star } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import invictusLogo from "@/assets/INVICTUS-GOLD_1.png";
import { cn } from "@/lib/utils";
import { isLovableHost } from "@/lib/appOrigin";
import { SuporteBottomNav } from "./SuporteBottomNav";
import { SuporteProfileSetup } from "./SuporteProfileSetup";
import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface Props { children: ReactNode; }

export function SuporteLayout({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);

  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  const basePath = isLovableHost(window.location.hostname) ? "/suporte-backoffice" : "";

  // Check if agent profile is complete
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfileComplete(!!(data.first_name && data.last_name && data.avatar_url));
        } else {
          setProfileComplete(false);
        }
      });
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(`${basePath}/auth`);
  };

  // Loading state
  if (profileComplete === null) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="text-muted-foreground text-sm">Carregando...</div></div>;
  }

  // Profile setup required
  if (!profileComplete) {
    return <SuporteProfileSetup onComplete={() => setProfileComplete(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-20 flex-col items-center justify-center gap-1.5 border-b border-border px-4">
          <img src={invictusLogo} alt="Invictus" className="h-6 w-auto shrink-0" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Suporte
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          <Link
            to={`${basePath}/dashboard`}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
              location.pathname.includes("dashboard") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <ListChecks className="h-4 w-4" />
            Fila de Tickets
          </Link>
          {isAdmin && (
            <>
              <Link
                to={`${basePath}/equipe`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  location.pathname.includes("equipe") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Users className="h-4 w-4" />
                Equipe
              </Link>
              <Link
                to={`${basePath}/avaliacoes`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  location.pathname.includes("avaliacoes") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Star className="h-4 w-4" />
                Avaliações
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-border p-4 space-y-4">
          <div className="px-1">
            <ToggleGroup type="single" value={theme} onValueChange={(v) => v && setTheme(v)} className="w-full justify-start gap-1">
              <ToggleGroupItem value="system" aria-label="Sistema" className="flex-1 gap-1 px-2 py-1.5 text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"><Monitor className="h-3.5 w-3.5" /></ToggleGroupItem>
              <ToggleGroupItem value="light" aria-label="Claro" className="flex-1 gap-1 px-2 py-1.5 text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"><Sun className="h-3.5 w-3.5" /></ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Escuro" className="flex-1 gap-1 px-2 py-1.5 text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"><Moon className="h-3.5 w-3.5" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <img src={invictusLogo} alt="Invictus" className="h-5 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suporte</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
      </div>

      <SuporteBottomNav />
    </div>
  );
}
