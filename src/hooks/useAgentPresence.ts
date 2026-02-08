import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

export function useAgentPresence(userId: string | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const sendHeartbeat = async () => {
      await supabase.from("support_agent_presence" as any).upsert(
        {
          user_id: userId,
          status: "online",
          last_heartbeat: new Date().toISOString(),
        } as any,
        { onConflict: "user_id" }
      );
    };

    // Send immediately
    sendHeartbeat();

    // Then every 30s
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // On unmount / tab close, mark offline
    const markOffline = () => {
      // Use navigator.sendBeacon for reliability on page close
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/support_agent_presence?user_id=eq.${userId}`;
      const body = JSON.stringify({ status: "offline" });
      const headers = {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${supabase.auth.getSession().then(() => "").catch(() => "")}`,
        Prefer: "return=minimal",
      };

      // Try sendBeacon first (works on page close)
      try {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } catch {
        // Fallback
        supabase
          .from("support_agent_presence" as any)
          .update({ status: "offline" } as any)
          .eq("user_id", userId);
      }
    };

    window.addEventListener("beforeunload", markOffline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", markOffline);
      // Mark offline on unmount
      supabase
        .from("support_agent_presence" as any)
        .update({ status: "offline" } as any)
        .eq("user_id", userId);
    };
  }, [userId]);
}
