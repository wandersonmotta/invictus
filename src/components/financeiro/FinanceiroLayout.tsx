 import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
import { LogOut, FileText, ListChecks, BarChart3, Monitor, Sun, Moon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
 import invictusLogo from "@/assets/INVICTUS-GOLD_1.png";
import { cn } from "@/lib/utils";
 import { isLovableHost } from "@/lib/appOrigin";
 import { FinanceiroBottomNav } from "./FinanceiroBottomNav";
 
 interface FinanceiroLayoutProps {
   children: ReactNode;
 }
 
 export function FinanceiroLayout({ children }: FinanceiroLayoutProps) {
   const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const basePath = isLovableHost(window.location.hostname) ? "/financeiro" : "";
 
   const handleLogout = async () => {
     await supabase.auth.signOut();
    navigate(`${basePath}/auth`);
   };
 
   return (
     <div className="flex min-h-screen bg-background">
       {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
          <div className="flex h-20 flex-col items-center justify-center gap-1.5 border-b border-border px-4">
            <img src={invictusLogo} alt="Invictus" className="h-6 w-auto shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Financeiro
            </span>
          </div>
 
         <nav className="flex flex-1 flex-col gap-1 p-4">
          <NavItem to={`${basePath}/dashboard`} active={location.pathname.includes("dashboard")} icon={<ListChecks className="h-4 w-4" />}>
             Fila de Auditoria
           </NavItem>
          <NavItem to={`${basePath}/historico`} active={location.pathname.includes("historico")} icon={<FileText className="h-4 w-4" />}>
             Histórico
           </NavItem>
          <NavItem to={`${basePath}/relatorios`} active={location.pathname.includes("relatorios")} icon={<BarChart3 className="h-4 w-4" />}>
             Relatórios
           </NavItem>
         </nav>
 
          <div className="border-t border-border p-4 space-y-4">
            {/* Theme Toggle */}
            <div className="px-1">
              <ToggleGroup
                type="single"
                value={theme}
                onValueChange={(value) => value && setTheme(value)}
                className="w-full justify-start gap-1"
              >
                <ToggleGroupItem
                  value="system"
                  aria-label="Padrão do sistema"
                  className="flex-1 gap-1 px-2 py-1.5 text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="light"
                  aria-label="Modo claro"
                  className="flex-1 gap-1 px-2 py-1.5 text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                >
                  <Sun className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="dark"
                  aria-label="Modo escuro"
                  className="flex-1 gap-1 px-2 py-1.5 text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                >
                  <Moon className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

           <Button
             variant="ghost"
             size="sm"
             className="w-full justify-start text-muted-foreground hover:text-destructive"
             onClick={handleLogout}
           >
             <LogOut className="mr-2 h-4 w-4" />
             Sair
           </Button>
         </div>
       </aside>
 
       {/* Main content */}
       <div className="flex flex-1 flex-col">
         {/* Mobile header */}
         <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:hidden">
           <div className="flex items-center gap-2">
             <img src={invictusLogo} alt="Invictus" className="h-5 shrink-0" />
             <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
               Financeiro
             </span>
           </div>
         </header>
 
         <main className="flex-1 overflow-auto p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
       </div>
 
       {/* Mobile Bottom Navigation */}
       <FinanceiroBottomNav />
     </div>
   );
 }
 
 function NavItem({
   to,
   icon,
   children,
  active,
 }: {
   to: string;
   icon: ReactNode;
   children: ReactNode;
  active?: boolean;
 }) {
   return (
     <Link
       to={to}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
     >
       {icon}
       {children}
     </Link>
   );
 }