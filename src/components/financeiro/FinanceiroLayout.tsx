 import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { LogOut, FileText, ListChecks, BarChart3 } from "lucide-react";
 import invictusLogo from "@/assets/INVICTUS-GOLD_1.png";
import { cn } from "@/lib/utils";
 
 interface FinanceiroLayoutProps {
   children: ReactNode;
 }
 
 export function FinanceiroLayout({ children }: FinanceiroLayoutProps) {
   const navigate = useNavigate();
  const location = useLocation();

  // Detect if we're on preview (lovable) or production
  const isPreview = window.location.hostname.endsWith(".lovable.app") || window.location.hostname.endsWith(".lovableproject.com");
  const basePath = isPreview ? "/financeiro" : "";
 
   const handleLogout = async () => {
     await supabase.auth.signOut();
    navigate(`${basePath}/auth`);
   };
 
   return (
     <div className="flex min-h-screen bg-background">
       {/* Sidebar */}
       <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
         <div className="flex h-16 items-center justify-center border-b border-border px-4">
           <img src={invictusLogo} alt="Invictus" className="h-8" />
           <span className="ml-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
 
         <div className="border-t border-border p-4">
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
         <header className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden">
           <div className="flex items-center gap-2">
             <img src={invictusLogo} alt="Invictus" className="h-6" />
             <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
               Financeiro
             </span>
           </div>
           <Button variant="ghost" size="icon" onClick={handleLogout}>
             <LogOut className="h-4 w-4" />
           </Button>
         </header>
 
         <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
       </div>
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