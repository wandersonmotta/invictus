import { useLocation } from "react-router-dom";
import { Home as HomeIcon, MapPin, Search, Send, User, Shield, Clapperboard, MessagesSquare, Newspaper, BarChart3, Wallet, Gift, HelpCircle, Trophy, ShoppingBag, Receipt, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";


interface NavItem {
  title: string;
  url: string;
  icon: typeof HomeIcon;
  placeholder?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Início",
    items: [
      { title: "Início", url: "/app", icon: HomeIcon },
      { title: "Feed", url: "/feed", icon: Newspaper },
      { title: "Mapa", url: "/mapa", icon: MapPin },
      { title: "Buscar", url: "/buscar", icon: Search },
      { title: "Pagamentos", url: "/pagamentos", icon: CreditCard },
    ],
  },
  {
    label: "Serviços e Produtos",
    items: [
      { title: "Serviços", url: "/servicos", icon: ShoppingBag },
    ],
  },
  {
    label: "Treinamentos",
    items: [
      { title: "Class", url: "/class", icon: Clapperboard },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { title: "Mensagens", url: "/mensagens", icon: Send },
      { title: "Comunidade", url: "/comunidade", icon: MessagesSquare },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Leads", url: "/leads", icon: BarChart3 },
    ],
  },
  {
    label: "Saldo e Pontuações",
    items: [
      { title: "Carteira", url: "/carteira", icon: Wallet },
      { title: "Pontos", url: "/pontos", icon: Gift },
      { title: "Reconhecimento", url: "/reconhecimento", icon: Trophy },
    ],
  },
  {
    label: "Conta",
    items: [
      { title: "Minhas Faturas", url: "/faturas", icon: Receipt, placeholder: true },
      { title: "Perfil", url: "/perfil", icon: User },
      { title: "Suporte", url: "/suporte", icon: HelpCircle, placeholder: true },
    ],
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);

  const location = useLocation();
  const currentPath = location.pathname;
  const { isMobile, setOpenMobile } = useSidebar();

  // Fetch access_status to restrict navigation for pending users
  const { data: accessStatus } = useQuery({
    queryKey: ["sidebar-access", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("access_status")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.access_status ?? "pending";
    },
    staleTime: 10_000,
  });

  const isOnboarding = accessStatus !== "approved";

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const handleNavClick = (e: React.MouseEvent, isPlaceholder?: boolean) => {
    if (isPlaceholder) {
      e.preventDefault();
      toast.info("Em breve!", {
        description: "Esta funcionalidade está sendo desenvolvida.",
      });
      return;
    }
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      className={cn("invictus-sidebar")}
      collapsible="offcanvas"
      variant="inset"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {(isOnboarding
              ? [{ label: "Conta", items: [{ title: "Perfil", url: "/perfil", icon: User }] }]
              : [
                  ...navSections,
                  ...(isAdmin
                    ? ([
                        {
                          label: "Administração",
                          items: [{ title: "Admin", url: "/admin", icon: Shield }],
                        },
                      ] as const)
                    : []),
                ]
            ).map((section) => (
              <div key={section.label} className="invictus-sidebar-section">
                <SidebarGroupLabel className="invictus-sidebar-sectionLabel">{section.label}</SidebarGroupLabel>

                <SidebarMenu className="invictus-sidebar-menu">
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        className="invictus-sidebar-item"
                      >
                        <NavLink
                          to={item.placeholder ? "#" : item.url}
                          end={item.url === "/"}
                          className="invictus-sidebar-link"
                          aria-current={isActive(item.url) ? "page" : undefined}
                          onClick={(e) => handleNavClick(e, item.placeholder)}
                        >
                          <span className="invictus-sidebar-iconWrap" aria-hidden="true">
                            <item.icon className="invictus-sidebar-icon" aria-hidden="true" />
                          </span>
                          <span className="invictus-sidebar-label">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
