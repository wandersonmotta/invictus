import { useLocation } from "react-router-dom";
import { MapPin, Search, MessageCircle, User, Shield } from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { GoldHoverText } from "@/components/GoldHoverText";
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

import logo from "@/assets/invictus-logo.png";

const navItems = [
  { title: "Mapa", url: "/", icon: MapPin },
  { title: "Buscar", url: "/buscar", icon: Search },
  { title: "Mensagens", url: "/mensagens", icon: MessageCircle },
  { title: "Perfil", url: "/perfil", icon: User },
  { title: "Admin", url: "/admin", icon: Shield },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon" variant="inset">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "py-3" : "py-3"}>
            <div className={collapsed ? "flex items-center justify-center" : "flex items-center gap-3"}>
              <img
                src={logo}
                alt="Logo da Fraternidade Invictus"
                className={collapsed ? "h-7 w-auto" : "h-8 w-auto"}
                draggable={false}
                style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.22))" }}
              />
              {!collapsed && (
                <GoldHoverText className="text-[10px] font-semibold tracking-[0.35em]">FRATERNIDADE</GoldHoverText>
              )}
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent/80 text-primary ring-1 ring-primary/25"
                      aria-current={isActive(item.url) ? "page" : undefined}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
