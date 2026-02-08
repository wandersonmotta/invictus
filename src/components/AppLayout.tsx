import * as React from "react";
import { useLocation } from "react-router-dom";

import { AppSidebar } from "@/components/AppSidebar";
import { GoldHoverText } from "@/components/GoldHoverText";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SupportChatBubble } from "@/components/suporte/SupportChatBubble";
import { UserMenu } from "@/components/UserMenu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

import logo from "@/assets/invictus-logo.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobileOrTablet = useIsMobileOrTablet();
  const { pathname } = useLocation();

  // Rotas que devem ocupar 100% da altura sem scroll vertical no desktop
  const isFullHeightRoute = pathname === "/reconhecimento";

  return (
    <SidebarProvider toggleable={true} mobileMode="sheet">
      <div className="h-svh flex w-full overflow-hidden">
        <AppSidebar />

        <SidebarInset className="overflow-hidden flex flex-col">
          <header
            className={
              "sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 px-2 sm:px-2 md:px-3 lg:px-4 backdrop-blur-xl " +
              "invictus-surface " +
              // barra clara SUTIL para separar do topo (sem ficar branca/estourada)
              "relative after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px " +
              "after:bg-gradient-to-r after:from-transparent after:via-[hsl(var(--foreground)_/_0.10)] after:to-transparent"
            }
          >
            <div className="flex flex-1 items-center gap-2 sm:gap-1.5 lg:gap-3 min-w-0">
              <img
                src={logo}
                alt="Logo da Fraternidade Invictus"
                className="h-4 sm:h-5 md:h-6 lg:h-9 w-auto select-none shrink-0"
                draggable={false}
                style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.25))" }}
              />
              <div className="min-w-0 flex-1">
                <GoldHoverText className="text-[8px] sm:text-[10px] font-semibold tracking-[0.25em] sm:tracking-[0.35em] whitespace-nowrap">
                  FRATERNIDADE
                </GoldHoverText>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-0.5 md:gap-1 pl-1 sm:pl-2">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          {/* Main content area */}
          <div
            className={`flex-1 overflow-x-hidden animate-fade-in ${
              isMobileOrTablet
                ? "overflow-y-scroll p-4 sm:p-5 pb-24"
                : isFullHeightRoute
                  ? "overflow-y-hidden p-4 lg:p-5"
                  : "overflow-y-scroll p-4 sm:p-5 lg:p-6"
            }`}
          >
            {children}
          </div>
        </SidebarInset>

        {/* Mobile bottom navigation */}
        <MobileBottomNav />

        {/* Floating support chat bubble */}
        <SupportChatBubble />
      </div>
    </SidebarProvider>
  );
}
