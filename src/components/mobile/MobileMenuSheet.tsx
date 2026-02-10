import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Newspaper,
  MapPin,
  Search,
  Send,
  MessagesSquare,
  BarChart3,
  User,
  Clapperboard,
  Shield,
  ChevronRight,
  Wallet,
  Gift,
  HelpCircle,
  Trophy,
  ShoppingBag,
  Receipt,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useMyProfile } from "@/hooks/useMyProfile";
import { supabase } from "@/integrations/supabase/client";

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MenuItem {
  title: string;
  url: string;
  icon: typeof Home;
  placeholder?: boolean;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "Início",
    items: [
      { title: "Início", url: "/app", icon: Home },
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
      { title: "Minhas Faturas", url: "/faturas", icon: Receipt },
      { title: "Perfil", url: "/perfil", icon: User },
      { title: "Suporte", url: "/suporte", icon: HelpCircle },
    ],
  },
];

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: profile } = useMyProfile(user?.id);

  // Fetch access status
  const { data: accessStatus } = useQuery({
    queryKey: ["mobile-menu-access", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("access_status, username")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    staleTime: 10_000,
  });

  const isOnboarding = accessStatus?.access_status !== "approved";

  // Build display name and initials
  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Usuário";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const username = accessStatus?.username;

  // Build sections based on access status
  const visibleSections: MenuSection[] = isOnboarding
    ? [{ label: "Conta", items: [{ title: "Perfil", url: "/perfil", icon: User }] }]
    : [
        ...menuSections,
        ...(isAdmin
          ? [{ label: "Administração", items: [{ title: "Admin", url: "/admin", icon: Shield }] }]
          : []),
      ];

  const handleNavigate = (item: MenuItem) => {
    if (item.placeholder) {
      toast.info(`${item.title} — Em breve!`, {
        description: "Esta funcionalidade está sendo desenvolvida.",
      });
      return;
    }
    navigate(item.url);
    onOpenChange(false);
  };

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app" || location.pathname === "/";
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="invictus-mobile-menu-sheet h-[85vh] rounded-t-3xl p-0 border-t border-border/40"
      >
        <ScrollArea className="h-full">
          {/* User Profile Header */}
          <div className="flex flex-col items-center pt-10 pb-6 border-b border-border/30">
            <Avatar className="h-20 w-20 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="text-xl bg-muted">{initials}</AvatarFallback>
            </Avatar>
            <h2 className="mt-3 text-lg font-semibold text-foreground">{displayName}</h2>
            {username && (
              <p className="text-sm text-muted-foreground">{username}</p>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col px-4 py-2">
            {visibleSections.map((section) => (
              <div key={section.label} className="mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 py-2">
                  {section.label}
                </p>
                {section.items.map((item) => {
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
              </div>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
