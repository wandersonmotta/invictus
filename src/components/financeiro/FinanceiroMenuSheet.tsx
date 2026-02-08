import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ListChecks,
  FileText,
  BarChart3,
  CreditCard,
  Wallet,
  Users,
  ChevronRight,
  LogOut,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isLovableHost } from "@/lib/appOrigin";
import invictusLogo from "@/assets/INVICTUS-GOLD_1.png";
import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsFinanceiroGerente } from "@/hooks/useIsFinanceiroGerente";
 
 interface FinanceiroMenuSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 interface MenuItem {
   title: string;
   url: string;
   icon: typeof ListChecks;
 }
 
export function FinanceiroMenuSheet({ open, onOpenChange }: FinanceiroMenuSheetProps) {
   const navigate = useNavigate();
   const location = useLocation();
   const { theme, setTheme } = useTheme();
   const { user } = useAuth();
    const { data: isAdmin } = useIsAdmin(user?.id);
    const { data: isGerente } = useIsFinanceiroGerente(user?.id);
    const canManageTeam = isAdmin || isGerente;
  
    const basePath = isLovableHost(window.location.hostname) ? "/financeiro" : "";
 
   const menuItems: MenuItem[] = [
      { title: "Fila de Auditoria", url: `${basePath}/dashboard`, icon: ListChecks },
      { title: "Histórico", url: `${basePath}/historico`, icon: FileText },
       { title: "Relatórios", url: `${basePath}/relatorios`, icon: BarChart3 },
       { title: "Pagamentos", url: `${basePath}/pagamentos`, icon: CreditCard },
       { title: "Carteira", url: `${basePath}/carteira`, icon: Wallet },
    ];

   const adminItems: MenuItem[] = canManageTeam
      ? [{ title: "Equipe", url: `${basePath}/equipe`, icon: Users }]
      : [];
 
   const handleNavigate = (item: MenuItem) => {
     navigate(item.url);
     onOpenChange(false);
   };
 
   const handleLogout = async () => {
     await supabase.auth.signOut();
     navigate(`${basePath}/auth`);
     onOpenChange(false);
   };
 
   const isActive = (path: string) => {
     return location.pathname === path || location.pathname.startsWith(`${path}/`);
   };
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent
         side="bottom"
         className="invictus-mobile-menu-sheet h-[85vh] rounded-t-3xl p-0 border-t border-border/40"
       >
         <ScrollArea className="h-full">
           {/* Header with Logo */}
           <div className="flex flex-col items-center pt-10 pb-6 border-b border-border/30">
             <img src={invictusLogo} alt="Invictus" className="h-10 mb-2" />
             <h2 className="text-lg font-semibold text-foreground">Financeiro</h2>
             <p className="text-sm text-muted-foreground">Painel de Auditoria</p>
           </div>
 
           {/* Navigation Items */}
           <nav className="flex flex-col px-4 py-4">
             <p className="invictus-mobile-menu-sectionLabel text-xs font-semibold uppercase tracking-wider px-1 py-2">
               Navegação
             </p>
             {menuItems.map((item) => {
               const active = isActive(item.url);
               return (
                 <button
                   key={item.url}
                   onClick={() => handleNavigate(item)}
                   className={`
                     invictus-mobile-menu-item
                     flex items-center justify-between py-3 px-1 w-full
                     transition-colors hover:bg-muted/30
                     ${active ? "invictus-mobile-menu-item--active" : ""}
                   `}
                 >
                   <div className="flex items-center gap-3">
                     <item.icon
                       className={`h-5 w-5 ${
                         active ? "text-primary" : "text-muted-foreground"
                       }`}
                     />
                     <span
                       className={`text-base ${
                         active ? "text-foreground font-medium" : "text-foreground/80"
                       }`}
                     >
                       {item.title}
                     </span>
                   </div>
                   <ChevronRight className="h-4 w-4 text-muted-foreground" />
                 </button>
               );
             })}
            </nav>

            {adminItems.length > 0 && (
              <>
                <Separator className="mx-4" />
                <nav className="flex flex-col px-4 py-4">
                  <p className="invictus-mobile-menu-sectionLabel text-xs font-semibold uppercase tracking-wider px-1 py-2">
                    Administração
                  </p>
                  {adminItems.map((item) => {
                    const active = isActive(item.url);
                    return (
                      <button
                        key={item.url}
                        onClick={() => handleNavigate(item)}
                        className={`
                          invictus-mobile-menu-item
                          flex items-center justify-between py-3 px-1 w-full
                          transition-colors hover:bg-muted/30
                          ${active ? "invictus-mobile-menu-item--active" : ""}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-base ${active ? "text-foreground font-medium" : "text-foreground/80"}`}>{item.title}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </nav>
              </>
            )}
 
           <Separator className="mx-4" />
 
           {/* Theme Toggle */}
           <div className="px-4 py-4">
             <p className="invictus-mobile-menu-sectionLabel text-xs font-semibold uppercase tracking-wider px-1 py-2">
               Tema
             </p>
             <ToggleGroup
               type="single"
               value={theme}
               onValueChange={(value) => value && setTheme(value)}
               className="w-full justify-start gap-2 px-1"
             >
               <ToggleGroupItem
                 value="system"
                 aria-label="Padrão do sistema"
                 className="flex-1 gap-2 py-2.5 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
               >
                 <Monitor className="h-4 w-4" />
                 <span className="text-sm">Sistema</span>
               </ToggleGroupItem>
               <ToggleGroupItem
                 value="light"
                 aria-label="Modo claro"
                 className="flex-1 gap-2 py-2.5 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
               >
                 <Sun className="h-4 w-4" />
                 <span className="text-sm">Claro</span>
               </ToggleGroupItem>
               <ToggleGroupItem
                 value="dark"
                 aria-label="Modo escuro"
                 className="flex-1 gap-2 py-2.5 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
               >
                 <Moon className="h-4 w-4" />
                 <span className="text-sm">Escuro</span>
               </ToggleGroupItem>
             </ToggleGroup>
           </div>
 
           <Separator className="mx-4" />
 
           {/* Logout Button */}
           <div className="px-4 py-4 pb-8">
             <Button
               variant="ghost"
               size="lg"
               className="w-full justify-start text-muted-foreground hover:text-destructive"
               onClick={handleLogout}
             >
               <LogOut className="mr-3 h-5 w-5" />
               Sair
             </Button>
           </div>
         </ScrollArea>
       </SheetContent>
     </Sheet>
   );
 }