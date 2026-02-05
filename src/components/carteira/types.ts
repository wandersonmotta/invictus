 export type TransactionType = "entrada" | "saida";
 export type TransactionStatus = "aprovado" | "pendente" | "rejeitado";
 
 export interface Transaction {
   id: string;
   date: string;
   description: string;
   type: TransactionType;
   status: TransactionStatus;
   amount: number;       // Valor exibido (bruto para entrada, líquido para saída)
   grossAmount?: number; // Valor bruto original (para saídas, usado internamente)
 }
 
 // Business constants
 export const WITHDRAW_FEE_RATE = 0.0499; // 4.99%
 export const MIN_WITHDRAW = 100;         // R$100,00
 
 /**
  * Calculate net amount after fee
  */
 export function calculateNetAmount(grossAmount: number): number {
   return Math.round(grossAmount * (1 - WITHDRAW_FEE_RATE) * 100) / 100;
 }
 
 /**
  * Calculate fee amount
  */
 export function calculateFee(grossAmount: number): number {
   return Math.round(grossAmount * WITHDRAW_FEE_RATE * 100) / 100;
 }