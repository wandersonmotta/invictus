import * as React from "react";

import { AppSidebar } from "@/components/AppSidebar";
import { GoldHoverText } from "@/components/GoldHoverText";
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
              // volta ao padrão glass (sem a barra clara do border-b)
              "invictus-surface " +
              // separador sutil usando tokens (evita linha branca forte)
              "shadow-[0_1px_0_0_hsl(var(--border)_/_0.45)]"
            }
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Logo da Fraternidade Invictus"
                  className="h-9 w-auto select-none"
                  draggable={false}
                  style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.25))" }}
                />
                <GoldHoverText className="text-[10px] font-semibold tracking-[0.35em]">FRATERNIDADE</GoldHoverText>
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 sm:p-5 md:p-6 animate-fade-in">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
