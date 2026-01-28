import * as React from "react";

import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-svh flex w-full">
        <AppSidebar />

        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background/35 px-3 backdrop-blur-xl">
            <SidebarTrigger />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="invictus-monogram grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold text-primary-foreground">
                  I
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-semibold tracking-wide">Invictus</div>
                  <div className="text-[10px] tracking-[0.25em] text-muted-foreground">FRATERNIDADE</div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-6 animate-fade-in">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
