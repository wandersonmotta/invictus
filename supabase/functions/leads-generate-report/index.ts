import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportData {
  title: string;
  period: { start: string; end: string };
  kpis: {
    investimento: number;
    conversoes: number;
    faturamento: number;
    roi: number;
  };
  platforms: {
    meta?: {
      spend: number;
      impressions: number;
      clicks: number;
      purchases: number;
      roas: number;
    };
    googleAds?: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
    };
    ga4?: {
      sessions: number;
      users: number;
      pageviews: number;
      bounceRate: number;
    };
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ReportData = await req.json();
    const { title, period, kpis, platforms } = body;

    // Generate HTML for PDF
    const html = generateReportHTML(title, period, kpis, platforms);

    // Save report to database
    const { data: report, error: reportError } = await supabase
      .from("ad_reports")
      .insert({
        user_id: userData.user.id,
        title: title || `Relatório ${period.start} - ${period.end}`,
        date_range_start: period.start,
        date_range_end: period.end,
        platforms: Object.keys(platforms).filter(
          (k) => platforms[k as keyof typeof platforms]
        ),
        report_data: { kpis, platforms },
      })
      .select()
      .single();

    if (reportError) {
      console.error("Error saving report:", reportError);
    }

    // Return HTML that can be printed/saved as PDF
    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: unknown) {
    console.error("Report generation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateReportHTML(
  title: string,
  period: { start: string; end: string },
  kpis: ReportData["kpis"],
  platforms: ReportData["platforms"]
): string {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const formatNumber = (v: number) =>
    new Intl.NumberFormat("pt-BR").format(v);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "Relatório de Marketing"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fafafa;
      padding: 40px;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #333;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #c9a227;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .subtitle { color: #888; font-size: 14px; }
    .period {
      background: linear-gradient(135deg, #c9a227 0%, #a68b1a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 16px;
      font-weight: 600;
      margin-top: 12px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #c9a227;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .kpi-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
    }
    .kpi-label { font-size: 12px; color: #888; margin-bottom: 4px; }
    .kpi-value { font-size: 24px; font-weight: 700; color: #fafafa; }
    .platform-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .platform-header {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .metric { }
    .metric-label { font-size: 11px; color: #888; }
    .metric-value { font-size: 16px; font-weight: 600; }
    .footer {
      text-align: center;
      padding-top: 32px;
      border-top: 1px solid #333;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body { background: white; color: black; }
      .kpi-card, .platform-card { background: #f5f5f5; border-color: #ddd; }
      .kpi-value, .metric-value { color: black; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">INVICTUS</div>
      <div class="subtitle">Fraternidade de Empreendedores</div>
      <div class="period">Período: ${formatDate(period.start)} - ${formatDate(period.end)}</div>
    </div>

    <div class="section">
      <div class="section-title">📊 Resumo Geral</div>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Investimento Total</div>
          <div class="kpi-value">${formatCurrency(kpis.investimento)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Conversões</div>
          <div class="kpi-value">${formatNumber(kpis.conversoes)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Faturamento</div>
          <div class="kpi-value">${formatCurrency(kpis.faturamento)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">ROI</div>
          <div class="kpi-value">${kpis.roi.toFixed(2)}x</div>
        </div>
      </div>
    </div>

    ${
      platforms.meta
        ? `
    <div class="section">
      <div class="platform-card">
        <div class="platform-header">📘 Meta Ads</div>
        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-label">Investimento</div>
            <div class="metric-value">${formatCurrency(platforms.meta.spend)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Impressões</div>
            <div class="metric-value">${formatNumber(platforms.meta.impressions)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Cliques</div>
            <div class="metric-value">${formatNumber(platforms.meta.clicks)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Compras</div>
            <div class="metric-value">${formatNumber(platforms.meta.purchases)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">ROAS</div>
            <div class="metric-value">${platforms.meta.roas.toFixed(2)}x</div>
          </div>
        </div>
      </div>
    </div>
    `
        : ""
    }

    ${
      platforms.googleAds
        ? `
    <div class="section">
      <div class="platform-card">
        <div class="platform-header">📗 Google Ads</div>
        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-label">Investimento</div>
            <div class="metric-value">${formatCurrency(platforms.googleAds.spend)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Impressões</div>
            <div class="metric-value">${formatNumber(platforms.googleAds.impressions)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Cliques</div>
            <div class="metric-value">${formatNumber(platforms.googleAds.clicks)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Conversões</div>
            <div class="metric-value">${formatNumber(platforms.googleAds.conversions)}</div>
          </div>
        </div>
      </div>
    </div>
    `
        : ""
    }

    ${
      platforms.ga4
        ? `
    <div class="section">
      <div class="platform-card">
        <div class="platform-header">📈 Google Analytics</div>
        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-label">Sessões</div>
            <div class="metric-value">${formatNumber(platforms.ga4.sessions)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Usuários</div>
            <div class="metric-value">${formatNumber(platforms.ga4.users)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Pageviews</div>
            <div class="metric-value">${formatNumber(platforms.ga4.pageviews)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Taxa de Rejeição</div>
            <div class="metric-value">${platforms.ga4.bounceRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>Relatório gerado automaticamente por Invictus Fraternidade</p>
      <p>Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
    </div>
  </div>

  <script>
    // Auto-print when opened
    window.onload = function() {
      // Give time for styles to load
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR");
}
