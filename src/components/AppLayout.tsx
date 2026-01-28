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
              <span className="text-sm font-semibold tracking-wide">Invictus</span>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-6 animate-fade-in">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
