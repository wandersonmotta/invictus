import { useLocation, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  MapPin,
  Search,
  Send,
  User,
  Shield,
  Clapperboard,
  MessagesSquare,
  Newspaper,
  BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const navSections = [
  {
    label: "Início",
    items: [
      { title: "Home", url: "/app", icon: HomeIcon },
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
    label: "Marketing",
    items: [{ title: "Leads", url: "/leads", icon: BarChart3 }],
  },
  {
    label: "Conta",
    items: [
      { title: "Perfil", url: "/perfil", icon: User },
      { title: "Class", url: "/class", icon: Clapperboard },
    ],
  },
] as const;

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch access_status to restrict navigation for pending users
  const { data: accessStatus } = useQuery({
    queryKey: ["mobile-menu-access", user?.id],
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
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleNavigate = (url: string) => {
    navigate(url);
    onOpenChange(false);
  };

  const sections = isOnboarding
    ? [{ label: "Conta", items: [{ title: "Perfil", url: "/perfil", icon: User }] }]
    : [
        ...navSections,
        ...(isAdmin
          ? [
              {
                label: "Administração",
                items: [{ title: "Admin", url: "/admin", icon: Shield }],
              },
            ]
          : []),
      ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="invictus-mobile-menu-sheet w-[280px] p-0">
        <SheetHeader className="p-4 pb-2 border-b border-primary/10">
          <SheetTitle className="text-sm font-semibold tracking-widest text-primary/80">
            MENU
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-2 p-4 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label} className="mb-2">
              <span className="invictus-mobile-menu-sectionLabel text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/60 uppercase mb-1 block px-2">
                {section.label}
              </span>

              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <button
                      key={item.url}
                      onClick={() => handleNavigate(item.url)}
                      className={`invictus-mobile-menu-item flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        active
                          ? "invictus-mobile-menu-item--active bg-primary/10 text-primary"
                          : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
