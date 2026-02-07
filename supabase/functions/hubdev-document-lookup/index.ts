const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidCPFMath(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem >= 10) rem = 0;
  if (rem !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem >= 10) rem = 0;
  if (rem !== parseInt(digits[10])) return false;
  return true;
}

function isValidCNPJMath(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
  let rem = sum % 11;
  if (rem < 2) { if (parseInt(digits[12]) !== 0) return false; }
  else { if (parseInt(digits[12]) !== 11 - rem) return false; }
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
  rem = sum % 11;
  if (rem < 2) { if (parseInt(digits[13]) !== 0) return false; }
  else { if (parseInt(digits[13]) !== 11 - rem) return false; }
  return true;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, document } = await req.json();
    const digits = (document ?? "").replace(/\D/g, "");

    if (type === "cpf") {
      if (!isValidCPFMath(digits)) {
        return json({ valid: false, reason: "invalid_digits" });
      }
    } else if (type === "cnpj") {
      if (!isValidCNPJMath(digits)) {
        return json({ valid: false, reason: "invalid_digits" });
      }
    } else {
      return json({ error: "type must be 'cpf' or 'cnpj'" }, 400);
    }

    const token = Deno.env.get("CPFCNPJ_TOKEN");
    if (!token) {
      // Fallback: math-only validation
      return json({ valid: true, name: null, fallback: true });
    }

    const packageId = type === "cpf" ? "1" : "4";
    const url = `https://api.cpfcnpj.com.br/${token}/${packageId}/${digits}`;

    const res = await fetch(url);
    if (!res.ok) {
      await res.text();
      return json({ valid: true, name: null, fallback: true });
    }

    const data = await res.json();

    // API returns status as boolean or number
    const status = data.status === true || data.status === 1 || data.status === "1";
    if (!status) {
      return json({ valid: false, reason: "not_found" });
    }

    const name = type === "cpf"
      ? (data.nome ?? null)
      : (data.razao_social ?? data.nome ?? null);

    return json({ valid: true, name, fallback: false });
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
});
