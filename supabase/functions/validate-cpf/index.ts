const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Mathematical CPF validation (check digits) */
function isValidCPFMath(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(digits[10])) return false;

  return true;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Try BrasilAPI */
async function tryBrasilAPI(digits: string): Promise<{ valid: true; name: string | null } | null> {
  try {
    const res = await fetchWithTimeout(`https://brasilapi.com.br/api/cpf/v1/${digits}`);
    if (res.ok) {
      const data = await res.json();
      return { valid: true, name: data.nome ?? null };
    }
    // consume body to avoid leak
    await res.text();
    return null; // 404 or other — try next source
  } catch {
    return null;
  }
}

/** Try Invertexto free validator */
async function tryInvertexto(digits: string): Promise<{ valid: true; name: string | null } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.invertexto.com/v1/validator?value=${digits}&token=free`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.valid === true) {
        return { valid: true, name: null };
      }
    }
    await res.text();
    return null;
  } catch {
    return null;
  }
}

/** Try Nuvem Fiscal free tier */
async function tryNuvemFiscal(digits: string): Promise<{ valid: true; name: string | null } | null> {
  try {
    const res = await fetchWithTimeout(`https://api.nuvemfiscal.com.br/cpf/${digits}`);
    if (res.ok) {
      const data = await res.json();
      return { valid: true, name: data.nome ?? data.name ?? null };
    }
    await res.text();
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf } = await req.json();
    const digits = (cpf ?? "").replace(/\D/g, "");

    // 1. Mathematical validation
    if (!isValidCPFMath(digits)) {
      return json({ valid: false, reason: "invalid_digits" });
    }

    // 2. Try multiple free sources sequentially
    const sources = [tryBrasilAPI, tryInvertexto, tryNuvemFiscal];

    for (const source of sources) {
      const result = await source(digits);
      if (result) {
        return json({ valid: true, name: result.name, fallback: false });
      }
    }

    // 3. No source confirmed — accept with fallback (math validation passed)
    return json({ valid: true, name: null, fallback: true });
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
});
