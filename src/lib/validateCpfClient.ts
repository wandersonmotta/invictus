/**
 * Client-side CPF/CNPJ validation against free Brazilian APIs.
 * Runs from the user's browser (Brazilian IP) so geo-blocked APIs respond normally.
 */

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Validates CPF existence via Ministry of Health (SCPA) API.
 * Does NOT return the person's name — only confirms the CPF is registered.
 */
async function trySCPA(digits: string): Promise<{ name: string | null } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://scpa-backend.saude.gov.br/public/scpa-usuario/validacao-cpf/${digits}`,
    );
    if (res.ok) {
      const data = await res.json();
      if (!data?.error) return { name: null };
    }
    return null;
  } catch {
    return null;
  }
}

export interface DocValidationResult {
  valid: true;
  name: string | null;
  tradeName?: string | null;
  fallback: boolean;
}

/**
 * Validates a CPF from the browser (Brazilian IP).
 * Uses SCPA to confirm existence. Name must be entered manually.
 */
export async function validateCpfFromBrowser(digits: string): Promise<DocValidationResult> {
  const result = await trySCPA(digits);
  if (result) {
    return { valid: true, name: null, fallback: false };
  }
  // Fallback: accept with math-only validation
  return { valid: true, name: null, fallback: true };
}

/**
 * Validates a CNPJ by querying BrasilAPI then ReceitaWS from the browser.
 * Returns razão social.
 */
export async function validateCnpjFromBrowser(digits: string): Promise<DocValidationResult> {
  // Source 1: BrasilAPI
  try {
    const res = await fetchWithTimeout(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
    if (res.ok) {
      const data = await res.json();
      const razaoSocial: string | null = data.razao_social ?? null;
      return {
        valid: true,
        name: razaoSocial,
        fallback: false,
      };
    }
    await res.text();
  } catch {
    // fall through to next source
  }

  // Source 2: ReceitaWS
  try {
    const res = await fetchWithTimeout(`https://receitaws.com.br/v1/cnpj/${digits}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status !== "ERROR") {
        return {
          valid: true,
          name: data.nome ?? null,
          fallback: false,
        };
      }
    }
    await res.text();
  } catch {
    // fall through
  }

  // Fallback: accept with math-only validation
  return { valid: true, name: null, fallback: true };
}
