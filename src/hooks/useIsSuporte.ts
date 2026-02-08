import { useState, useEffect } from "react";
import { rpcUntyped } from "@/lib/rpc";
import { supabase } from "@/integrations/supabase/client";

export function useIsSuporte() {
  const [isSuporte, setIsSuporte] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        if (mounted) { setIsSuporte(false); setLoading(false); }
        return;
      }

      const { data, error } = await rpcUntyped<boolean>("has_role", {
        _user_id: session.session.user.id,
        _role: "suporte",
      });

      if (mounted) {
        setIsSuporte(!error && data === true);
        setLoading(false);
      }
    }

    check();
    return () => { mounted = false; };
  }, []);

  return { isSuporte, loading };
}
