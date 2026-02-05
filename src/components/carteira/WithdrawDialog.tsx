 import { useState, useEffect, useMemo } from "react";
 import { Info } from "lucide-react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Slider } from "@/components/ui/slider";
 import { formatCPF, isValidCPF } from "@/lib/cpf";
 import { WITHDRAW_FEE_RATE, MIN_WITHDRAW, calculateNetAmount, calculateFee } from "./types";
 
 interface WithdrawDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   balance: number;
   pixKey: string | null;
   onSubmit: (grossAmount: number, netAmount: number, pixKey: string) => void;
 }
 
 export function WithdrawDialog({
   open,
   onOpenChange,
   balance,
   pixKey,
   onSubmit,
 }: WithdrawDialogProps) {
   const [amount, setAmount] = useState(MIN_WITHDRAW);
   const [localPixKey, setLocalPixKey] = useState(pixKey ?? "");
   const [pixError, setPixError] = useState<string | null>(null);
 
   // Reset state when dialog opens
   useEffect(() => {
     if (open) {
       setAmount(Math.max(MIN_WITHDRAW, Math.min(balance, MIN_WITHDRAW)));
       setLocalPixKey(pixKey ?? "");
       setPixError(null);
     }
   }, [open, pixKey, balance]);
 
   const fee = useMemo(() => calculateFee(amount), [amount]);
   const netAmount = useMemo(() => calculateNetAmount(amount), [amount]);
 
   const formatCurrency = (value: number) =>
     value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
 
   const handleAmountChange = (value: string) => {
     // Remove non-numeric characters except comma/period
     const cleaned = value.replace(/[^\d,\.]/g, "").replace(",", ".");
     const parsed = parseFloat(cleaned);
     if (!isNaN(parsed)) {
       setAmount(Math.min(Math.max(parsed, MIN_WITHDRAW), balance));
     }
   };
 
   const handleSliderChange = (values: number[]) => {
     setAmount(values[0]);
   };
 
   const handlePixKeyChange = (value: string) => {
     const formatted = formatCPF(value);
     setLocalPixKey(formatted);
     setPixError(null);
   };
 
   const handleSubmit = () => {
     // Validate PIX key
     if (!localPixKey.trim()) {
       setPixError("Informe sua chave PIX (CPF)");
       return;
     }
     if (!isValidCPF(localPixKey)) {
       setPixError("CPF inválido");
       return;
     }
     if (amount < MIN_WITHDRAW) {
       return;
     }
     if (amount > balance) {
       return;
     }
 
     onSubmit(amount, netAmount, localPixKey.replace(/\D/g, ""));
   };
 
   const canWithdraw = balance >= MIN_WITHDRAW;
   const isValid = amount >= MIN_WITHDRAW && amount <= balance && localPixKey.trim() && isValidCPF(localPixKey);
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="text-center text-xl">Solicitar Saque</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-6 py-4">
           {/* Available Balance */}
           <div className="text-center">
             <p className="text-sm text-muted-foreground">Saldo disponível</p>
             <p className="text-2xl font-bold text-foreground">{formatCurrency(balance)}</p>
           </div>
 
           {!canWithdraw ? (
             <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
               <p className="text-sm text-destructive">
                 Saldo insuficiente. O saque mínimo é de {formatCurrency(MIN_WITHDRAW)}.
               </p>
             </div>
           ) : (
             <>
               {/* Amount Input */}
               <div className="space-y-2">
                 <Label htmlFor="withdraw-amount">Valor do saque</Label>
                 <Input
                   id="withdraw-amount"
                   type="text"
                   inputMode="decimal"
                   value={formatCurrency(amount)}
                   onChange={(e) => handleAmountChange(e.target.value)}
                   className="text-lg font-semibold"
                 />
               </div>
 
               {/* Slider */}
               <div className="space-y-3">
                 <Slider
                   value={[amount]}
                   onValueChange={handleSliderChange}
                   min={MIN_WITHDRAW}
                   max={balance}
                   step={1}
                   className="touch-manipulation"
                 />
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>{formatCurrency(MIN_WITHDRAW)}</span>
                   <span>{formatCurrency(balance)}</span>
                 </div>
               </div>
 
               {/* Fee Info Box */}
               <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Saque mínimo:</span>
                   <span className="font-medium">{formatCurrency(MIN_WITHDRAW)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Taxa de saque:</span>
                   <span className="font-medium">{(WITHDRAW_FEE_RATE * 100).toFixed(2)}%</span>
                 </div>
                 <div className="flex justify-between text-sm border-t border-border pt-2">
                   <span className="text-muted-foreground">Valor líquido:</span>
                   <span className="font-bold text-primary">{formatCurrency(netAmount)}</span>
                 </div>
               </div>
 
               {/* PIX Key Input */}
               <div className="space-y-2">
                 <Label htmlFor="pix-key">Chave PIX (CPF)</Label>
                 <Input
                   id="pix-key"
                   type="text"
                   inputMode="numeric"
                   placeholder="000.000.000-00"
                   value={localPixKey}
                   onChange={(e) => handlePixKeyChange(e.target.value)}
                   className={pixError ? "border-destructive" : ""}
                 />
                 {pixError && (
                   <p className="text-xs text-destructive">{pixError}</p>
                 )}
                 <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                   <Info className="size-3.5 mt-0.5 shrink-0" />
                   <span>Usamos seu CPF como chave padrão</span>
                 </div>
               </div>
 
               {/* Submit Button */}
               <Button
                 variant="goldOutline"
                 className="w-full"
                 onClick={handleSubmit}
                 disabled={!isValid}
               >
                 Solicitar Saque
               </Button>
             </>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 }