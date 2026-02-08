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

      const userId = session.session.user.id;

      // Accept both "suporte" and "suporte_gerente" roles
      const [supRes, gerRes] = await Promise.all([
        rpcUntyped<boolean>("has_role", { _user_id: userId, _role: "suporte" }),
        rpcUntyped<boolean>("has_role", { _user_id: userId, _role: "suporte_gerente" }),
      ]);

      if (mounted) {
        const hasSuporte = !supRes.error && supRes.data === true;
        const hasGerente = !gerRes.error && gerRes.data === true;
        setIsSuporte(hasSuporte || hasGerente);
        setLoading(false);
      }
    }

    check();
    return () => { mounted = false; };
  }, []);

  return { isSuporte, loading };
}
