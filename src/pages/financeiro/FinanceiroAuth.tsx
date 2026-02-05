 import { useState } from "react";
 import { useNavigate, useLocation } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { rpcUntyped } from "@/lib/rpc";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { toast } from "@/hooks/use-toast";
 import invictusLogo from "@/assets/INVICTUS-GOLD_1.png";
 import { isLovableHost } from "@/lib/appOrigin";
 import "@/styles/invictus-auth.css";
 
 export default function FinanceiroAuth() {
   const navigate = useNavigate();
   const location = useLocation();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [loading, setLoading] = useState(false);
 
   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     try {
       const { data, error } = await supabase.auth.signInWithPassword({
         email,
         password,
       });
 
       if (error) throw error;
 
       // Verify financeiro role
       const { data: hasRole, error: roleError } = await rpcUntyped<boolean>(
         "has_role",
         {
           _user_id: data.user.id,
           _role: "financeiro",
         }
       );
 
       if (roleError || !hasRole) {
         await supabase.auth.signOut();
         toast({
           variant: "destructive",
           title: "Acesso negado",
           description: "Você não tem permissão para acessar o sistema financeiro.",
         });
         setLoading(false);
         return;
       }
 
       // Context-aware redirect: preview uses /financeiro/dashboard, subdomain uses /dashboard
       const from = (location.state as any)?.from;
       const defaultPath = isLovableHost(window.location.hostname)
         ? "/financeiro/dashboard"
         : "/dashboard";
       navigate(typeof from === "string" && from ? from : defaultPath, { replace: true });
     } catch (err: any) {
       toast({
         variant: "destructive",
         title: "Erro ao entrar",
         description: err.message || "Verifique suas credenciais.",
       });
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div
        className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-cover bg-center p-4"
       style={{ backgroundImage: "url('/images/invictus-auth-bg.jpg')" }}
     >
       <div className="absolute inset-0 bg-black/70" />
 
         <div className="invictus-auth-frame relative z-10 my-4 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-primary/40 bg-black/60 p-8 backdrop-blur-md">
         <div className="mb-8 flex flex-col items-center gap-3">
           <img src={invictusLogo} alt="Invictus" className="h-16" />
            <span className="text-sm uppercase tracking-[0.25em] text-primary">
             Acesso Financeiro
           </span>
         </div>
 
         <form onSubmit={handleLogin} className="space-y-5">
           <div className="space-y-2">
             <Label htmlFor="email" className="text-muted-foreground">
               E-mail
             </Label>
             <Input
               id="email"
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder="seu@email.com"
               required
               className="border-border bg-background/50"
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="password" className="text-muted-foreground">
               Senha
             </Label>
             <Input
               id="password"
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder="••••••••"
               required
               className="border-border bg-background/50"
             />
           </div>
 
           <div className="pb-2">
             <Button
               type="submit"
               disabled={loading}
                className="w-full"
             >
               {loading ? "Entrando..." : "Entrar"}
             </Button>
           </div>
         </form>
       </div>
     </div>
   );
 }