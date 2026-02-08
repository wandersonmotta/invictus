import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SupportAIChatPopup } from "./SupportAIChatPopup";

export function SupportChatBubble() {
  const { user } = useAuth();
  const isMobile = useIsMobileOrTablet();
  const [unread, setUnread] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("support-bubble")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_type !== "user") {
            setUnread((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const handleClick = () => {
    setUnread(0);
    setChatOpen(true);
  };

  // Don't show on support pages
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/suporte")) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "fixed z-40 flex items-center justify-center rounded-full shadow-lg transition-all",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "h-12 w-12",
          isMobile ? "bottom-20 right-4" : "bottom-6 right-6",
          chatOpen && !isMobile && "hidden"
        )}
        aria-label="Suporte"
      >
        <MessageCircle className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <SupportAIChatPopup open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}
