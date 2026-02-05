 import { useState, useEffect, useMemo } from "react";
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
 import { MIN_WITHDRAW, calculateNetAmount } from "./types";
 
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
   const [amount, setAmount] = useState(balance);
   const [step, setStep] = useState<"amount" | "pix">("amount");
   const [localPixKey, setLocalPixKey] = useState(pixKey ?? "");
   const [pixError, setPixError] = useState<string | null>(null);
 
   // Reset state when dialog opens
   useEffect(() => {
     if (open) {
       setAmount(Math.max(MIN_WITHDRAW, balance));
       setStep("amount");
       setLocalPixKey(pixKey ?? "");
       setPixError(null);
     }
   }, [open, pixKey, balance]);
 
   const netAmount = useMemo(() => calculateNetAmount(amount), [amount]);
 
   const formatCurrency = (value: number) =>
     value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
 
   const handleSliderChange = (values: number[]) => {
     setAmount(values[0]);
   };
 
   const handleNext = () => {
     // If user doesn't have PIX key registered, go to PIX step
     if (!pixKey && !isValidCPF(localPixKey)) {
       setStep("pix");
       return;
     }
     const key = pixKey || localPixKey.replace(/\D/g, "");
     onSubmit(amount, netAmount, key);
   };
 
   const canWithdraw = balance >= MIN_WITHDRAW;
 
   // Step 1: Amount selection (layout da referência)
   if (step === "amount") {
     return (
       <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="text-left text-lg font-medium">
               Solicite o saque
             </DialogTitle>
           </DialogHeader>
 
           <div className="space-y-6 py-4">
             {!canWithdraw ? (
               <div className="text-center py-8">
                 <p className="text-sm text-destructive">
                   Saldo insuficiente para saque.
                 </p>
               </div>
             ) : (
               <>
                 {/* Large Amount Display */}
                 <div className="text-center py-4">
                   <p className="text-4xl font-bold text-foreground">
                     {formatCurrency(amount)}
                   </p>
                   <p className="mt-3 text-sm text-muted-foreground">
                     Qual valor deseja retirar?
                   </p>
                 </div>
 
                 {/* Slider */}
                 <div className="space-y-3 px-2">
                   <Slider
                     value={[amount]}
                     onValueChange={handleSliderChange}
                     min={MIN_WITHDRAW}
                     max={balance}
                     step={1}
                     className="touch-manipulation"
                   />
                   <p className="text-center text-xs text-muted-foreground">
                     Arraste para indicar o valor
                   </p>
                 </div>
 
                 {/* Submit Button with dynamic value */}
                 <Button
                   className="w-full h-12 text-base font-semibold"
                   onClick={handleNext}
                 >
                   Sacar {formatCurrency(amount)}
                 </Button>
 
                 {/* Fee Info (simple text) */}
                 <div className="text-center space-y-2">
                   <p className="text-sm font-medium text-foreground">
                     Saque mínimo: {formatCurrency(MIN_WITHDRAW)}
                   </p>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     Será aplicada uma taxa de 4,99% sobre o valor do saque
                     referente aos custos operacionais.
                   </p>
                 </div>
               </>
             )}
           </div>
         </DialogContent>
       </Dialog>
     );
   }
 
 
   // Step 2: PIX key input (only if not registered)
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="text-left text-lg font-medium">
             Informe sua chave PIX
           </DialogTitle>
         </DialogHeader>
 
         <div className="space-y-6 py-4">
           <p className="text-sm text-muted-foreground">
             Para receber seu saque de {formatCurrency(netAmount)},
             precisamos da sua chave PIX (CPF).
           </p>
 
           <div className="space-y-2">
             <Label htmlFor="pix-key">Chave PIX (CPF)</Label>
             <Input
               id="pix-key"
               type="text"
               inputMode="numeric"
               placeholder="000.000.000-00"
               value={localPixKey}
               onChange={(e) => {
                 setLocalPixKey(formatCPF(e.target.value));
                 setPixError(null);
               }}
               className={pixError ? "border-destructive" : ""}
             />
             {pixError && (
               <p className="text-xs text-destructive">{pixError}</p>
             )}
           </div>
 
           <div className="flex gap-3">
             <Button
               variant="outline"
               className="flex-1"
               onClick={() => setStep("amount")}
             >
               Voltar
             </Button>
             <Button
               className="flex-1"
               onClick={() => {
                 if (!isValidCPF(localPixKey)) {
                   setPixError("CPF inválido");
                   return;
                 }
                 onSubmit(amount, netAmount, localPixKey.replace(/\D/g, ""));
               }}
             >
               Confirmar Saque
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }