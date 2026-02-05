import { useState, memo, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Wallet, Gift, HelpCircle, Menu } from "lucide-react";
import { toast } from "sonner";

import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { MobileMenuSheet } from "./MobileMenuSheet";

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  action: "navigate" | "placeholder" | "menu";
  url?: string;
}

const navItems: NavItem[] = [
  { id: "inicio", label: "Início", icon: Home, action: "navigate", url: "/app" },
   { id: "carteira", label: "Carteira", icon: Wallet, action: "navigate", url: "/carteira" },
  { id: "pontos", label: "Pontos", icon: Gift, action: "placeholder" },
  { id: "suporte", label: "Suporte", icon: HelpCircle, action: "placeholder" },
  { id: "menu", label: "Menu", icon: Menu, action: "menu" },
];

function MobileBottomNavInner() {
  const isMobileOrTablet = useIsMobileOrTablet();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Render on mobile AND tablets (< 1024px)
  if (!isMobileOrTablet) return null;

  const isActive = (item: NavItem) => {
    if (item.action !== "navigate" || !item.url) return false;
    if (item.url === "/app") {
      return location.pathname === "/app" || location.pathname === "/";
    }
    return location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);
  };

  const handleItemClick = (item: NavItem) => {
    switch (item.action) {
      case "navigate":
        if (item.url) navigate(item.url);
        break;
      case "placeholder":
        toast.info(`${item.label} — Em breve!`, {
          description: "Esta funcionalidade está sendo desenvolvida.",
          duration: 2000,
        });
        break;
      case "menu":
        setMenuOpen(true);
        break;
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

      <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}

// Memoizado para evitar re-renders desnecessários
export const MobileBottomNav = memo(MobileBottomNavInner);
