 /**
  * Format a CPF string: 12345678900 → 123.456.789-00
  */
 export function formatCPF(value: string): string {
   const digits = value.replace(/\D/g, "").slice(0, 11);
   if (digits.length <= 3) return digits;
   if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
   if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
   return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
 }
 
 /**
  * Validate a CPF using the official algorithm
  */
 export function isValidCPF(cpf: string): boolean {
   const digits = cpf.replace(/\D/g, "");
   
   // Must have exactly 11 digits
   if (digits.length !== 11) return false;
   
   // Reject all same digits (e.g., 111.111.111-11)
   if (/^(\d)\1+$/.test(digits)) return false;
   
   // Validate first check digit
   let sum = 0;
   for (let i = 0; i < 9; i++) {
     sum += parseInt(digits[i]) * (10 - i);
   }
   let remainder = (sum * 10) % 11;
   if (remainder === 10 || remainder === 11) remainder = 0;
   if (remainder !== parseInt(digits[9])) return false;
   
   // Validate second check digit
   sum = 0;
   for (let i = 0; i < 10; i++) {
     sum += parseInt(digits[i]) * (11 - i);
   }
   remainder = (sum * 10) % 11;
   if (remainder === 10 || remainder === 11) remainder = 0;
   if (remainder !== parseInt(digits[10])) return false;
   
   return true;
 }