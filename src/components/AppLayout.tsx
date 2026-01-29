import * as React from "react";

import { AppSidebar } from "@/components/AppSidebar";
import { GoldHoverText } from "@/components/GoldHoverText";
import { UserMenu } from "@/components/UserMenu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import logo from "@/assets/invictus-logo.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider toggleable={false} mobileMode="fixed">
      <div className="min-h-svh flex w-full">
        <AppSidebar />

        <SidebarInset>
          <header
            className={
              "sticky top-0 z-20 flex h-14 items-center gap-2 px-3 sm:px-4 backdrop-blur-xl " +
              "invictus-surface " +
              // barra clara SUTIL para separar do topo (sem ficar branca/estourada)
              "relative after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px " +
              "after:bg-gradient-to-r after:from-transparent after:via-[hsl(var(--foreground)_/_0.10)] after:to-transparent"
            }
          >
            <div className="flex flex-1 items-center gap-3">
                <img
                  src={logo}
                  alt="Logo da Fraternidade Invictus"
                  className="h-9 w-auto select-none"
                  draggable={false}
                  style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.25))" }}
                />
                <GoldHoverText className="text-[10px] font-semibold tracking-[0.35em]">FRATERNIDADE</GoldHoverText>
            </div>

            <div className="ml-auto">
              <UserMenu />
            </div>
          </header>

          <div className="flex-1 p-4 sm:p-5 md:p-6 animate-fade-in">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
