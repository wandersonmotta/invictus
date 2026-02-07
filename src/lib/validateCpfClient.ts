/**
 * Client-side CPF validation against free Brazilian APIs.
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

async function tryBrasilAPI(digits: string): Promise<{ name: string | null } | null> {
  try {
    const res = await fetchWithTimeout(`https://brasilapi.com.br/api/cpf/v1/${digits}`);
    if (res.ok) {
      const data = await res.json();
      return { name: data.nome ?? null };
    }
    await res.text();
    return null;
  } catch {
    return null;
  }
}

async function tryInvertexto(digits: string): Promise<{ name: string | null } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.invertexto.com/v1/validator?value=${digits}&token=free`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.valid === true) return { name: null };
    }
    await res.text();
    return null;
  } catch {
    return null;
  }
}

async function tryNuvemFiscal(digits: string): Promise<{ name: string | null } | null> {
  try {
    const res = await fetchWithTimeout(`https://api.nuvemfiscal.com.br/cpf/${digits}`);
    if (res.ok) {
      const data = await res.json();
      return { name: data.nome ?? data.name ?? null };
    }
    await res.text();
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
 * Sequentially tries free Brazilian APIs from the browser.
 * Returns result with name (if available) or fallback flag.
 */
export async function validateCpfFromBrowser(digits: string): Promise<DocValidationResult> {
  const sources = [tryBrasilAPI, tryInvertexto, tryNuvemFiscal];

  for (const source of sources) {
    const result = await source(digits);
    if (result) {
      return { valid: true, name: result.name, fallback: false };
    }
  }

  // All sources failed — accept with math-only validation
  return { valid: true, name: null, fallback: true };
}

/**
 * Validates a CNPJ by querying BrasilAPI from the browser (Brazilian IP).
 * Returns razão social and nome fantasia when available.
 */
export async function validateCnpjFromBrowser(digits: string): Promise<DocValidationResult> {
  try {
    const res = await fetchWithTimeout(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
    if (res.ok) {
      const data = await res.json();
      const razaoSocial: string | null = data.razao_social ?? null;
      const nomeFantasia: string | null = data.nome_fantasia ?? null;
      return {
        valid: true,
        name: nomeFantasia || razaoSocial,
        tradeName: nomeFantasia,
        fallback: false,
      };
    }
    await res.text();
  } catch {
    // Network error — fall through
  }

  // Fallback: accept with math-only validation
  return { valid: true, name: null, fallback: true };
}
