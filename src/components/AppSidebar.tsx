import { useLocation } from "react-router-dom";
import { Home as HomeIcon, MapPin, Search, MessageCircle, User, Shield, Clapperboard } from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import invictusLogo from "@/assets/invictus-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";


const navItems = [
  { title: "Home", url: "/", icon: HomeIcon },
  { title: "Mapa", url: "/mapa", icon: MapPin },
  { title: "Buscar", url: "/buscar", icon: Search },
  { title: "Mensagens", url: "/mensagens", icon: MessageCircle },
  { title: "Perfil", url: "/perfil", icon: User },
  { title: "Class", url: "/class", icon: Clapperboard },
  { title: "Admin", url: "/admin", icon: Shield },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar
      className={cn("invictus-sidebar", collapsed ? "w-14" : "w-64")}
      style={{
        // used by invictus-sidebar.css for the watermark (unique brand signature)
        ["--invictus-mark" as any]: `url(${invictusLogo})`,
      }}
      collapsible="icon"
      variant="inset"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={{
                      children: item.title,
                      className: "invictus-tooltip",
                      sideOffset: 10,
                    }}
                    className="invictus-sidebar-item"
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="invictus-sidebar-link"
                      aria-current={isActive(item.url) ? "page" : undefined}
                    >
                      <span className="invictus-sidebar-iconWrap" aria-hidden="true">
                        <item.icon className="invictus-sidebar-icon" aria-hidden="true" />
                      </span>
                      {!collapsed && <span className="invictus-sidebar-label">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            {!collapsed && <div className="invictus-gold-line mt-3 h-px w-full opacity-70" />}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
