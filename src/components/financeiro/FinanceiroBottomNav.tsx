 import { useState, memo } from "react";
 import { useLocation, useNavigate } from "react-router-dom";
 import { ListChecks, FileText, BarChart3, Wallet, Menu } from "lucide-react";
 
 import { useIsMobileOrTablet } from "@/hooks/use-mobile";
 import { isLovableHost } from "@/lib/appOrigin";
 import { FinanceiroMenuSheet } from "./FinanceiroMenuSheet";
 
 interface NavItem {
   id: string;
   label: string;
   icon: typeof ListChecks;
   action: "navigate" | "menu";
   url?: string;
 }
 
 function FinanceiroBottomNavInner() {
   const isMobileOrTablet = useIsMobileOrTablet();
   const location = useLocation();
   const navigate = useNavigate();
   const [menuOpen, setMenuOpen] = useState(false);
 
   const basePath = isLovableHost(window.location.hostname) ? "/financeiro" : "";
 
   const navItems: NavItem[] = [
     { id: "auditoria", label: "Auditoria", icon: ListChecks, action: "navigate", url: `${basePath}/dashboard` },
     { id: "historico", label: "Histórico", icon: FileText, action: "navigate", url: `${basePath}/historico` },
      { id: "relatorios", label: "Relatórios", icon: BarChart3, action: "navigate", url: `${basePath}/relatorios` },
      { id: "carteira", label: "Carteira", icon: Wallet, action: "navigate", url: `${basePath}/carteira` },
      { id: "menu", label: "Menu", icon: Menu, action: "menu" },
   ];
 
   // Render only on mobile AND tablets (< 1024px)
   if (!isMobileOrTablet) return null;
 
   const isActive = (item: NavItem) => {
     if (item.action !== "navigate" || !item.url) return false;
     return location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);
   };
 
   const handleItemClick = (item: NavItem) => {
     if (item.action === "navigate" && item.url) {
       navigate(item.url);
     } else if (item.action === "menu") {
       setMenuOpen(true);
     }
   };
 
   return (
     <>
       <nav className="invictus-mobile-nav fixed bottom-0 left-4 right-4 z-50 lg:hidden">
         <div className="flex items-center justify-around h-14 px-2">
           {navItems.map((item) => {
             const active = isActive(item);
             return (
               <button
                 key={item.id}
                 onClick={() => handleItemClick(item)}
                 className={`invictus-mobile-nav-item flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 ${
                   active ? "invictus-mobile-nav-item--active" : ""
                 }`}
                 data-active={active}
                 aria-label={item.label}
               >
                 <item.icon
                   className={`h-5 w-5 transition-all duration-200 ${
                     active ? "text-primary" : "text-muted-foreground"
                   }`}
                 />
                 <span
                   className={`text-[10px] font-medium tracking-wide transition-all duration-200 ${
                     active ? "text-primary" : "text-muted-foreground"
                   }`}
                 >
                   {item.label}
                 </span>
               </button>
             );
           })}
         </div>
       </nav>
 
       <FinanceiroMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
     </>
   );
 }
 
 export const FinanceiroBottomNav = memo(FinanceiroBottomNavInner);