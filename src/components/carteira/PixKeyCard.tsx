 import { useState } from "react";
 import { Save, Info } from "lucide-react";
 import { toast } from "sonner";
 
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { supabase } from "@/integrations/supabase/client";
 import { formatCPF, isValidCPF } from "@/lib/cpf";
 
 interface PixKeyCardProps {
   userId: string;
   currentPixKey: string | null;
   onUpdate: () => void;
 }
 
 export function PixKeyCard({ userId, currentPixKey, onUpdate }: PixKeyCardProps) {
   const [pixKey, setPixKey] = useState(currentPixKey ? formatCPF(currentPixKey) : "");
   const [error, setError] = useState<string | null>(null);
   const [saving, setSaving] = useState(false);
 
   const handleChange = (value: string) => {
     const formatted = formatCPF(value);
     setPixKey(formatted);
     setError(null);
   };
 
   const handleSave = async () => {
     if (!pixKey.trim()) {
       setError("Informe sua chave PIX (CPF)");
       return;
     }
     if (!isValidCPF(pixKey)) {
       setError("CPF inválido");
       return;
     }
 
     setSaving(true);
     try {
       const { error: updateError } = await supabase
         .from("profiles")
         .update({ pix_key: pixKey.replace(/\D/g, "") })
         .eq("user_id", userId);
 
       if (updateError) throw updateError;
 
       toast.success("Chave PIX salva com sucesso!");
       onUpdate();
     } catch (err) {
       console.error("Error saving PIX key:", err);
       toast.error("Erro ao salvar chave PIX");
     } finally {
       setSaving(false);
     }
   };
 
   return (
     <div className="invictus-surface invictus-frame rounded-2xl p-5 space-y-4">
       <div>
         <h3 className="font-semibold text-foreground">Chave PIX para saques</h3>
         <p className="text-sm text-muted-foreground mt-1">
           Sua chave PIX será usada para receber seus saques. Usamos CPF como padrão.
         </p>
       </div>
 
       <div className="space-y-2">
         <Label htmlFor="profile-pix-key">Chave PIX (CPF)</Label>
         <Input
           id="profile-pix-key"
           type="text"
           inputMode="numeric"
           placeholder="000.000.000-00"
           value={pixKey}
           onChange={(e) => handleChange(e.target.value)}
           className={error ? "border-destructive" : ""}
         />
         {error && <p className="text-xs text-destructive">{error}</p>}
         <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
           <Info className="size-3.5 mt-0.5 shrink-0" />
           <span>Usamos seu CPF como chave padrão para receber saques via PIX</span>
         </div>
       </div>
 
       <Button
         variant="goldOutline"
         className="w-full gap-2"
         onClick={handleSave}
         disabled={saving}
       >
         <Save className="size-4" />
         {saving ? "Salvando..." : "Salvar chave PIX"}
       </Button>
     </div>
   );
 }