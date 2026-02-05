 export type TransactionType = "entrada" | "saida";
 export type TransactionStatus = "aprovado" | "pendente" | "rejeitado";
 
 export interface Transaction {
   id: string;
   date: string;
   description: string;
   type: TransactionType;
   status: TransactionStatus;
   amount: number;
 }