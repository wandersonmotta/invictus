import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useAuth } from "@/auth/AuthProvider";
import { useMyProfile } from "@/hooks/useMyProfile";
import { GoldHoverText } from "@/components/GoldHoverText";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(first?: string | null, last?: string | null) {
  const a = (first ?? "").trim()[0] ?? "";
  const b = (last ?? "").trim()[0] ?? "";
  return (a + b || "U").toUpperCase();
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { data: profile } = useMyProfile(user?.id ?? null);
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  // Nunca mostrar "Perfil". Se estiver carregando/incompleto, fica neutro.
  const label = fullName || "—";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            "group invictus-topbar-user-trigger " +
            // override do ghost (hover:bg-accent) -> glass sutil, sem amarelo
            "hover:bg-[hsl(var(--foreground)_/_0.04)] hover:text-foreground " +
            // estado aberto (data-state=open no trigger)
            "data-[state=open]:bg-[hsl(var(--foreground)_/_0.05)] " +
            "focus-visible:ring-1 focus-visible:ring-ring/40"
          }
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={profile?.avatar_url ?? undefined}
              alt="Sua foto de perfil"
              className="transition duration-200 group-hover:opacity-85 group-hover:saturate-125 group-hover:brightness-110 group-data-[state=open]:opacity-100"
            />
            <AvatarFallback>{initials(profile?.first_name, profile?.last_name)}</AvatarFallback>
          </Avatar>

          {/* Base clean + overlay metálico (aparece no hover e quando estiver aberto) */}
          <span className="relative hidden max-w-[16rem] truncate text-xs font-semibold tracking-wide sm:block">
            <span className="text-muted-foreground transition-opacity duration-200 group-hover:opacity-80 group-data-[state=open]:opacity-70">
              {label}
            </span>
            {/* Efeito "segue o mouse" igual ao FRATERNIDADE, porém mais sutil/legível */}
            <GoldHoverText
              intensity={0.62}
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-data-[state=open]:opacity-100"
            >
              {label}
            </GoldHoverText>
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="invictus-topbar-menu-glass z-50 min-w-52 p-1"
      >
        {/* Toggle de tema */}
        <DropdownMenuItem
          onClick={toggleTheme}
          className="group gap-2 cursor-pointer rounded-md focus:bg-[hsl(var(--foreground)_/_0.06)] focus:text-foreground data-[highlighted]:bg-[hsl(var(--foreground)_/_0.05)] data-[highlighted]:text-foreground"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 text-[hsl(var(--gold-hot)_/_0.92)] transition group-hover:[filter:drop-shadow(0_0_12px_hsl(var(--gold-hot)_/_0.28))]" />
          ) : (
            <Moon className="h-4 w-4 text-[hsl(var(--gold-hot)_/_0.92)] transition group-hover:[filter:drop-shadow(0_0_12px_hsl(var(--gold-hot)_/_0.28))]" />
          )}
          <GoldHoverText className="text-sm font-medium">
            {resolvedTheme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </GoldHoverText>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/50" />

        {/* Sair */}
        <DropdownMenuItem
          onClick={() => void signOut()}
          className="group gap-2 cursor-pointer rounded-md focus:bg-[hsl(var(--foreground)_/_0.06)] focus:text-foreground data-[highlighted]:bg-[hsl(var(--foreground)_/_0.05)] data-[highlighted]:text-foreground"
        >
          <LogOut className="h-4 w-4 text-[hsl(var(--gold-hot)_/_0.92)] transition group-hover:[filter:drop-shadow(0_0_12px_hsl(var(--gold-hot)_/_0.28))]" />
          <GoldHoverText className="text-sm font-medium">Sair</GoldHoverText>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
