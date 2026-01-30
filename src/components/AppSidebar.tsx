import { useLocation } from "react-router-dom";
import { Home as HomeIcon, MapPin, Search, Send, User, Shield, Clapperboard, MessagesSquare, Newspaper } from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
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


const navSections = [
  {
    label: "Início",
    items: [
      { title: "Home", url: "/", icon: HomeIcon },
      { title: "Feed", url: "/feed", icon: Newspaper },
      { title: "Mapa", url: "/mapa", icon: MapPin },
      { title: "Buscar", url: "/buscar", icon: Search },
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
    label: "Conta",
    items: [
      { title: "Perfil", url: "/perfil", icon: User },
      { title: "Class", url: "/class", icon: Clapperboard },
    ],
  },
  {
    label: "Administração",
    items: [{ title: "Admin", url: "/admin", icon: Shield }],
  },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const handleNavClick = () => {
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
            {navSections.map((section) => (
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
                          to={item.url}
                          end={item.url === "/"}
                          className="invictus-sidebar-link"
                          aria-current={isActive(item.url) ? "page" : undefined}
                          onClick={handleNavClick}
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
