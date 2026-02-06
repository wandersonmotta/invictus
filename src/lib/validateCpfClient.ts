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

export interface CpfValidationResult {
  valid: true;
  name: string | null;
  fallback: boolean;
}

/**
 * Sequentially tries free Brazilian APIs from the browser.
 * Returns result with name (if available) or fallback flag.
 */
export async function validateCpfFromBrowser(digits: string): Promise<CpfValidationResult> {
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
