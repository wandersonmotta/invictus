/**
 * Client-side document validation via backend proxy to cpfcnpj.com.br.
 * The backend holds the API token securely.
 */

import { supabase } from "@/integrations/supabase/client";

export interface DocValidationResult {
  valid: boolean;
  name: string | null;
  tradeName?: string | null;
  fallback: boolean;
}

async function callBackend(type: "cpf" | "cnpj", digits: string): Promise<DocValidationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("hubdev-document-lookup", {
      body: { type, document: digits },
    });

    if (error) {
      return { valid: true, name: null, fallback: true };
    }

    if (data.valid === false) {
      return { valid: false, name: null, fallback: false };
    }

    return {
      valid: true,
      name: data.name ?? null,
      fallback: data.fallback ?? false,
    };
  } catch {
    return { valid: true, name: null, fallback: true };
  }
}

/**
 * Validates a CPF via backend (cpfcnpj.com.br).
 * Returns the full name when available.
 */
export async function validateCpfFromBrowser(digits: string): Promise<DocValidationResult> {
  return callBackend("cpf", digits);
}

/**
 * Validates a CNPJ via backend (cpfcnpj.com.br).
 * Returns the razão social when available.
 */
export async function validateCnpjFromBrowser(digits: string): Promise<DocValidationResult> {
  return callBackend("cnpj", digits);
}
