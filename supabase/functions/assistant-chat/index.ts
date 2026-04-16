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

// ── Tool definitions (admin only) ──────────────────────────────────────
const adminTools = [
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Agenda uma reunião/compromisso para o cliente atual. Use quando o admin pedir para agendar, marcar reunião, call, etc.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da reunião" },
          date: { type: "string", description: "Data e hora no formato ISO 8601 (ex: 2026-04-20T14:00:00)" },
          duration_minutes: { type: "number", description: "Duração em minutos. Padrão: 60" },
          description: { type: "string", description: "Descrição ou pauta da reunião (opcional)" },
        },
        required: ["title", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Cria uma tarefa para o cliente atual. Use quando o admin pedir para criar task, tarefa, atividade, to-do.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da tarefa" },
          description: { type: "string", description: "Descrição detalhada (opcional)" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Prioridade. Padrão: medium" },
          due_date: { type: "string", description: "Data limite no formato YYYY-MM-DD (opcional)" },
          executor_type: { type: "string", enum: ["internal", "client"], description: "Quem executa: internal (equipe Linkou) ou client. Padrão: internal" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_traffic_metrics",
      description: "Insere ou atualiza métricas de tráfego de um mês/ano específico para o cliente atual. Use quando o admin pedir para preencher, atualizar ou registrar métricas de tráfego.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "number", description: "Mês (1-12)" },
          year: { type: "number", description: "Ano (ex: 2026)" },
          investimento: { type: "number", description: "Investimento total em R$" },
          impressoes: { type: "number", description: "Número de impressões" },
          cliques: { type: "number", description: "Número de cliques" },
          alcance: { type: "number", description: "Alcance" },
          quantidade_leads: { type: "number", description: "Quantidade de leads" },
          quantidade_vendas: { type: "number", description: "Quantidade de vendas" },
          custo_por_lead: { type: "number", description: "Custo por lead em R$" },
          custo_por_venda: { type: "number", description: "Custo por venda em R$" },
        },
        required: ["month", "year"],
      },
    },
  },
];

// ── Tool executors ─────────────────────────────────────────────────────
async function executeTool(
  db: ReturnType<typeof createClient>,
  toolName: string,
  args: Record<string, unknown>,
  clientId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    switch (toolName) {
      case "create_appointment": {
        const { error } = await db.from("appointments").insert({
          client_id: clientId,
          title: args.title as string,
          appointment_date: args.date as string,
          duration_minutes: (args.duration_minutes as number) || 60,
          description: (args.description as string) || null,
          created_by: userId,
          status: "scheduled",
        });
        if (error) throw error;
        return { success: true, message: `Reunião "${args.title}" agendada para ${args.date} com sucesso.` };
      }

      case "create_task": {
        const { error } = await db.from("tasks").insert({
          client_id: clientId,
          title: args.title as string,
          description: (args.description as string) || null,
          priority: (args.priority as string) || "medium",
          due_date: (args.due_date as string) || null,
          executor_type: (args.executor_type as string) || "internal",
          created_by: userId,
          status: "todo",
          visible_to_client: true,
        });
        if (error) throw error;
        return { success: true, message: `Tarefa "${args.title}" criada com sucesso.` };
      }

      case "upsert_traffic_metrics": {
        const month = args.month as number;
        const year = args.year as number;

        // Check existing
        const { data: existing } = await db
          .from("traffic_metrics")
          .select("id")
          .eq("client_id", clientId)
          .eq("month", month)
          .eq("year", year)
          .maybeSingle();

        const metricsPayload: Record<string, unknown> = {
          client_id: clientId,
          month,
          year,
          updated_by: userId,
        };
        // Only set provided fields
        for (const key of ["investimento", "impressoes", "cliques", "alcance", "quantidade_leads", "quantidade_vendas", "custo_por_lead", "custo_por_venda"]) {
          if (args[key] !== undefined && args[key] !== null) {
            metricsPayload[key] = args[key];
          }
        }

        if (existing) {
          const { error } = await db.from("traffic_metrics").update(metricsPayload).eq("id", existing.id);
          if (error) throw error;
          return { success: true, message: `Métricas de ${month}/${year} atualizadas com sucesso.` };
        } else {
          metricsPayload.created_by = userId;
          const { error } = await db.from("traffic_metrics").insert(metricsPayload);
          if (error) throw error;
          return { success: true, message: `Métricas de ${month}/${year} inseridas com sucesso.` };
        }
      }

      default:
        return { success: false, message: `Tool "${toolName}" não reconhecida.` };
    }
  } catch (err) {
    console.error(`Tool ${toolName} error:`, err);
    return { success: false, message: `Erro ao executar ${toolName}: ${err instanceof Error ? err.message : String(err)}` };
  }
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
    const baseIdentity = `Você é o Linkouzinho 🤖, assistente inteligente da Agência Linkou — agência de consultoria, tráfego e vendas.\nData atual: ${new Date().toISOString().split("T")[0]}\n\n`;

    let systemPrompt: string;
    if (mode === "admin") {
      systemPrompt =
        baseIdentity +
        `Modo: ANALISTA TÉCNICO (para equipe interna/admin).\n` +
        `Tom: direto, técnico, analítico. Use termos de marketing digital.\n` +
        `Foco: insights de performance, comparações, recomendações de otimização, identificar problemas e oportunidades.\n` +
        `Quando relevante, sugira ações específicas (ajustar budget, pausar campanha, escalar canal).\n` +
        `Formate com markdown: tabelas, bullet points, negrito para números importantes.\n\n` +
        `## Ferramentas disponíveis\n` +
        `Você tem acesso a 3 ferramentas para executar ações no sistema:\n` +
        `- **create_appointment**: Use para agendar reuniões, calls, compromissos. Extraia data/hora da mensagem do usuário.\n` +
        `- **create_task**: Use para criar tarefas/atividades. Extraia título, prioridade e prazo se mencionados.\n` +
        `- **upsert_traffic_metrics**: Use para registrar/atualizar métricas de tráfego de um mês específico.\n\n` +
        `Quando o usuário pedir uma ação, use a ferramenta apropriada. Confirme os dados antes de executar se forem ambíguos.\n` +
        `Ao inferir datas, use o ano atual (${new Date().getFullYear()}) e o mês atual como referência.\n\n` +
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

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-20),
    ];

    // ── Decide: tool calling (admin) or direct streaming ───────────────
    const isAdminMode = mode === "admin";

    if (isAdminMode) {
      // Step 1: Non-streaming call with tools to check for tool_calls
      const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: allMessages,
          tools: adminTools,
          tool_choice: "auto",
          stream: false,
        }),
      });

      if (!firstResponse.ok) {
        if (firstResponse.status === 429) return json({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }, 429);
        if (firstResponse.status === 402) return json({ error: "Créditos de IA esgotados." }, 402);
        const t = await firstResponse.text();
        console.error("AI gateway error (step1):", firstResponse.status, t);
        return json({ error: "Erro ao processar com IA" }, 500);
      }

      const firstResult = await firstResponse.json();
      const choice = firstResult.choices?.[0];

      if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
        // Execute each tool call
        const toolMessages: Array<{ role: string; tool_call_id: string; content: string }> = [];

        for (const tc of choice.message.tool_calls) {
          const fnName = tc.function.name;
          let fnArgs: Record<string, unknown> = {};
          try {
            fnArgs = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
          } catch {
            fnArgs = {};
          }

          const result = await executeTool(db, fnName, fnArgs, client_id, userId);
          toolMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }

        // Step 2: Stream the final response with tool results
        const finalMessages = [
          ...allMessages,
          choice.message, // assistant message with tool_calls
          ...toolMessages,
        ];

        const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: finalMessages,
            stream: true,
          }),
        });

        if (!streamResponse.ok) {
          const t = await streamResponse.text();
          console.error("AI gateway error (step2):", streamResponse.status, t);
          return json({ error: "Erro ao processar confirmação" }, 500);
        }

        return new Response(streamResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // No tool calls → the model responded with text. Stream it back.
      // Since we already have the full response, we convert it to an SSE stream.
      const content = choice?.message?.content || "Sem resposta.";
      const ssePayload = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`;
      return new Response(ssePayload, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ── Client mode: direct streaming (no tools) ───────────────────────
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
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
