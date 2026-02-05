 import { useState, useEffect } from "react";
 import { rpcUntyped } from "@/lib/rpc";
 import { supabase } from "@/integrations/supabase/client";
 
 /**
  * Hook to check if the current user has the 'financeiro' role.
  * Returns { isFinanceiro, loading }.
  */
 export function useIsFinanceiro() {
   const [isFinanceiro, setIsFinanceiro] = useState(false);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     let mounted = true;
 
     async function check() {
       const { data: session } = await supabase.auth.getSession();
       if (!session?.session?.user) {
         if (mounted) {
           setIsFinanceiro(false);
           setLoading(false);
         }
         return;
       }
 
       const { data, error } = await rpcUntyped<boolean>("has_role", {
         _user_id: session.session.user.id,
         _role: "financeiro",
       });
 
       if (mounted) {
         setIsFinanceiro(!error && data === true);
         setLoading(false);
       }
     }
 
     check();
 
     return () => {
       mounted = false;
     };
   }, []);
 
   return { isFinanceiro, loading };
 }