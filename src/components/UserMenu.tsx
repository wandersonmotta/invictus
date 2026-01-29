import { LogOut } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { useMyProfile } from "@/hooks/useMyProfile";
import { GoldHoverText } from "@/components/GoldHoverText";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  const label = fullName || profile?.display_name || "Perfil";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt="Sua foto de perfil" />
            <AvatarFallback>{initials(profile?.first_name, profile?.last_name)}</AvatarFallback>
          </Avatar>
          <GoldHoverText className="hidden max-w-[16rem] truncate text-xs font-semibold tracking-wide sm:block">
            {label}
          </GoldHoverText>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="invictus-surface invictus-frame border-border/70 z-50 min-w-48"
      >
        <DropdownMenuItem
          onClick={() => void signOut()}
          className="gap-2"
        >
          <LogOut />
          <GoldHoverText className="text-sm font-medium">Sair</GoldHoverText>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
