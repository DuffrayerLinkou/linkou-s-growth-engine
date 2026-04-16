import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;

    const { messages, client_id, mode } = await req.json();
    if (!messages || !Array.isArray(messages)) return json({ error: "messages required" }, 400);
    if (!client_id) return json({ error: "client_id required" }, 400);
    if (!["admin", "client"].includes(mode)) return json({ error: "mode must be admin or client" }, 400);

    // Use service role to fetch data
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify access: admin role or user belongs to client
    if (mode === "client") {
      const { data: profile } = await db
        .from("profiles")
        .select("client_id")
        .eq("id", userId)
        .single();
      if (profile?.client_id !== client_id) return json({ error: "Forbidden" }, 403);
    } else {
      // Admin mode: verify admin role
      const { data: role } = await db
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "account_manager"])
        .limit(1)
        .single();
      if (!role) return json({ error: "Forbidden" }, 403);
    }

    // Fetch client data in parallel
    const [clientRes, campaignsRes, metricsRes, plansRes] = await Promise.all([
      db.from("clients").select("name, segment, phase, status").eq("id", client_id).single(),
      db.from("campaigns")
        .select("name, platform, status, budget, metrics, results, start_date, end_date")
        .eq("client_id", client_id)
        .order("created_at", { ascending: false })
        .limit(10),
      db.from("traffic_metrics")
        .select("month, year, investimento, impressoes, cliques, quantidade_leads, quantidade_vendas, custo_por_lead, custo_por_venda, alcance")
        .eq("client_id", client_id)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(6),
      db.from("strategic_plans")
        .select("title, status, objectives, kpis, funnel_strategy, campaign_types, timeline_start, timeline_end")
        .eq("client_id", client_id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle(),
    ]);

    const client = clientRes.data;
    const campaigns = campaignsRes.data || [];
    const metrics = metricsRes.data || [];
    const plan = plansRes.data;

    // Build context block
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    let context = `## Dados do Cliente: ${client?.name || "N/A"}\n`;
    context += `- Segmento: ${client?.segment || "N/A"}\n`;
    context += `- Fase atual: ${client?.phase || "N/A"}\n`;
    context += `- Status: ${client?.status || "N/A"}\n\n`;

    if (campaigns.length > 0) {
      context += `## Campanhas Recentes (${campaigns.length}):\n`;
      for (const c of campaigns) {
        context += `- **${c.name}** (${c.platform || "N/A"}): status=${c.status}, budget=R$${c.budget || 0}\n`;
        if (c.metrics && typeof c.metrics === "object") {
          const m = c.metrics as Record<string, unknown>;
          const metricParts = Object.entries(m)
            .filter(([, v]) => v !== null && v !== undefined && v !== "")
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
          if (metricParts) context += `  Métricas: ${metricParts}\n`;
        }
        if (c.results) context += `  Resultados: ${c.results}\n`;
      }
      context += "\n";
    }

    if (metrics.length > 0) {
      context += `## Métricas de Tráfego (últimos meses):\n`;
      context += `| Mês | Investimento | Impressões | Cliques | Leads | Vendas | CPL | CPV |\n`;
      context += `|-----|-------------|-----------|---------|-------|--------|-----|-----|\n`;
      for (const m of metrics) {
        context += `| ${monthNames[(m.month || 1) - 1]}/${m.year} | R$${m.investimento || 0} | ${m.impressoes || 0} | ${m.cliques || 0} | ${m.quantidade_leads || 0} | ${m.quantidade_vendas || 0} | R$${m.custo_por_lead || 0} | R$${m.custo_por_venda || 0} |\n`;
      }
      context += "\n";
    }

    if (plan) {
      context += `## Plano Estratégico: ${plan.title}\n`;
      context += `- Status: ${plan.status}\n`;
      if (plan.objectives) context += `- Objetivos: ${JSON.stringify(plan.objectives)}\n`;
      if (plan.kpis) context += `- KPIs: ${JSON.stringify(plan.kpis)}\n`;
      if (plan.funnel_strategy) context += `- Estratégia de Funil: ${plan.funnel_strategy}\n`;
      if (plan.campaign_types) context += `- Tipos de Campanha: ${(plan.campaign_types as string[]).join(", ")}\n`;
      context += "\n";
    }

    // System prompt by mode
    const baseIdentity = `Você é o Linkouzinho 🤖, assistente inteligente da Agência Linkou — agência de consultoria, tráfego e vendas.\n\n`;

    let systemPrompt: string;
    if (mode === "admin") {
      systemPrompt =
        baseIdentity +
        `Modo: ANALISTA TÉCNICO (para equipe interna/admin).\n` +
        `Tom: direto, técnico, analítico. Use termos de marketing digital.\n` +
        `Foco: insights de performance, comparações, recomendações de otimização, identificar problemas e oportunidades.\n` +
        `Quando relevante, sugira ações específicas (ajustar budget, pausar campanha, escalar canal).\n` +
        `Formate com markdown: tabelas, bullet points, negrito para números importantes.\n\n` +
        `${context}` +
        `Responda APENAS com base nos dados acima. Se não tiver dados suficientes, diga claramente.`;
    } else {
      systemPrompt =
        baseIdentity +
        `Modo: CONSULTOR ACESSÍVEL (para o cliente).\n` +
        `Tom: amigável, claro, sem jargões excessivos. Explique conceitos quando necessário.\n` +
        `Foco: explicar resultados de forma compreensível, mostrar progresso, indicar próximos passos.\n` +
        `Use linguagem positiva e encorajadora, mas honesta.\n` +
        `Formate com markdown: emojis moderados, bullet points, destaque números relevantes.\n\n` +
        `${context}` +
        `Responda APENAS com base nos dados acima. Se não tiver dados suficientes, diga claramente.`;
    }

    // Call Lovable AI Gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20), // limit context window
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }, 429);
      if (response.status === 402) return json({ error: "Créditos de IA esgotados." }, 402);
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return json({ error: "Erro ao processar com IA" }, 500);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("assistant-chat error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
