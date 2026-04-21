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
  {
    type: "function",
    function: {
      name: "create_campaign",
      description: "Estrutura uma campanha de tráfego pago completa e profissional para o cliente atual. Use quando o admin pedir para criar, estruturar ou montar uma campanha. Baseie-se nos dados do briefing, plano estratégico, personas, métricas históricas e segmento do cliente para definir targeting, estratégia, objetivo, budget e copy como um gestor de tráfego profissional. Defina o objetivo correto para cada plataforma (ex: Meta=conversions/traffic/awareness, Google=search/display/pmax). A campanha será criada como rascunho (draft) para revisão.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da campanha (ex: '[Meta] Conversão - Público Frio - Abril/26')" },
          platform: { type: "string", enum: ["meta_ads", "google_ads", "tiktok_ads", "linkedin_ads", "other"], description: "Plataforma de anúncios" },
          objective: { type: "string", description: "Objetivo principal (ex: conversions, traffic, awareness, leads, engagement, video_views, app_installs, reach)" },
          objective_detail: { type: "string", description: "Detalhamento do objetivo (ex: 'Gerar leads qualificados via formulário instantâneo')" },
          campaign_type: { type: "string", description: "Tipo de campanha (ex: prospecting, retargeting, remarketing, branding, launch)" },
          strategy: { type: "string", description: "Estratégia detalhada da campanha incluindo funil, público e abordagem" },
          budget: { type: "number", description: "Budget total da campanha em R$" },
          daily_budget: { type: "number", description: "Budget diário em R$" },
          start_date: { type: "string", description: "Data de início (YYYY-MM-DD)" },
          end_date: { type: "string", description: "Data de término (YYYY-MM-DD)" },
          headline: { type: "string", description: "Headline principal do anúncio" },
          ad_copy: { type: "string", description: "Texto/copy do anúncio" },
          call_to_action: { type: "string", description: "CTA do anúncio (ex: Saiba Mais, Compre Agora, Cadastre-se)" },
          targeting: { type: "object", description: "Configuração de público-alvo em JSON (idade, gênero, interesses, localização, custom audiences, lookalikes)" },
          placements: { type: "array", items: { type: "string" }, description: "Posicionamentos (ex: feed, stories, reels, search, display, youtube)" },
          bidding_strategy: { type: "string", description: "Estratégia de lance (ex: lowest_cost, cost_cap, bid_cap, target_cpa, maximize_conversions)" },
          target_cpa: { type: "number", description: "CPA alvo em R$" },
          target_roas: { type: "number", description: "ROAS alvo" },
          description: { type: "string", description: "Descrição geral da campanha e contexto estratégico" },
        },
        required: ["name", "platform"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Cria um novo projeto para o cliente atual. Use quando o admin pedir para criar, iniciar ou montar um projeto.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do projeto (ex: 'Projeto Lançamento Produto X - Q2/2026')" },
          description: { type: "string", description: "Descrição do projeto com escopo e objetivos" },
          start_date: { type: "string", description: "Data de início (YYYY-MM-DD)" },
          end_date: { type: "string", description: "Data de término (YYYY-MM-DD)" },
          budget: { type: "number", description: "Budget total do projeto em R$" },
          status: { type: "string", enum: ["planning", "active", "paused", "completed"], description: "Status inicial. Padrão: planning" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_strategic_plan",
      description: "Cria um plano estratégico completo e profissional para o cliente atual. Use quando o admin pedir para criar plano, estratégia, planejamento. Gere personas detalhadas, KPIs SMART, estratégia de funil (topo/meio/fundo), alocação de budget por canal e tipos de campanha recomendados. Baseie-se no briefing, métricas históricas e segmento do cliente.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título do plano (ex: 'Plano Estratégico Q2/2026 - Escala de Vendas')" },
          objectives: { type: "array", items: { type: "object" }, description: "Array de objetivos SMART com name, description, target, deadline" },
          kpis: { type: "array", items: { type: "object" }, description: "Array de KPIs com name, target, current, unit (ex: CPL, ROAS, leads/mês)" },
          personas: { type: "array", items: { type: "object" }, description: "Array de personas com name, age_range, interests, pain_points, channels" },
          funnel_strategy: { type: "string", description: "Estratégia de funil detalhada: topo (awareness), meio (consideração), fundo (conversão)" },
          campaign_types: { type: "array", items: { type: "string" }, description: "Tipos de campanha recomendados (ex: prospecting, retargeting, branding, remarketing)" },
          timeline_start: { type: "string", description: "Data de início do plano (YYYY-MM-DD)" },
          timeline_end: { type: "string", description: "Data de término do plano (YYYY-MM-DD)" },
          budget_allocation: { type: "object", description: "Alocação de budget por canal/objetivo em JSON (ex: { meta_ads: 60, google_ads: 30, tiktok: 10 })" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_briefing",
      description: "Cria um briefing para o cliente atual. Use quando o admin ditar informações do cliente como nicho, público-alvo, objetivos, diferenciais, concorrentes ou budget.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título do briefing (ex: 'Briefing Inicial - [Nome Cliente]')" },
          nicho: { type: "string", description: "Nicho/segmento de mercado do cliente" },
          publico_alvo: { type: "string", description: "Descrição detalhada do público-alvo" },
          objetivos: { type: "string", description: "Objetivos de marketing e vendas do cliente" },
          diferenciais: { type: "string", description: "Diferenciais competitivos do cliente" },
          concorrentes: { type: "string", description: "Principais concorrentes" },
          budget_mensal: { type: "number", description: "Budget mensal disponível em R$" },
          observacoes: { type: "string", description: "Observações adicionais" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Lê o conteúdo textual de um arquivo do cliente atual (PDF, TXT, MD, CSV, JSON). Use APENAS quando o usuário pedir explicitamente para analisar, ler, resumir ou extrair informações de um arquivo específico. Não dispare automaticamente — leitura consome tokens. Identifique o arquivo via file_id (preferencial) ou file_name (busca aproximada).",
      parameters: {
        type: "object",
        properties: {
          file_id: { type: "string", description: "UUID exato do arquivo (preferencial quando disponível na lista de arquivos do contexto)" },
          file_name: { type: "string", description: "Nome ou parte do nome do arquivo (usado quando file_id não está disponível). Busca case-insensitive." },
        },
      },
    },
  },
];

// Memory & state management tools (admin only)
const memoryTools = [
  {
    type: "function",
    function: {
      name: "log_decision",
      description: "Registra uma decisão estratégica/operacional importante tomada (com ou sem o bot) na memória de longo prazo do cliente. Use quando o usuário fechar uma escolha relevante: 'vamos pausar a campanha X', 'decidimos focar em Meta', 'aprovamos a alocação 60/40'. Não use para conversas casuais.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título curto da decisão (ex: 'Pausar campanha PMax Q2')" },
          decision: { type: "string", description: "A decisão em si, em 1-2 frases" },
          rationale: { type: "string", description: "Justificativa/motivo (opcional, mas recomendado)" },
          related_entity_type: { type: "string", description: "Tipo de entidade relacionada (ex: campaign, plan, task)" },
          related_entity_id: { type: "string", description: "UUID da entidade relacionada (opcional)" },
        },
        required: ["title", "decision"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_insight",
      description: "Registra um insight/conclusão da análise feita agora para que fique disponível depois e possa ser validado pelo time. Use no MODO AUDITOR ao identificar oportunidade, risco ou diagnóstico relevante baseado em evidências reais.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título curto do insight" },
          body: { type: "string", description: "Corpo do insight com a análise completa" },
          category: { type: "string", enum: ["audit", "opportunity", "risk", "performance"], description: "Categoria" },
          urgency: { type: "string", enum: ["low", "medium", "high"], description: "Urgência. Padrão: medium" },
          evidence: { type: "object", description: "Evidências em JSON (ex: { metric: 'CPL', from: 12, to: 28, period: 'Mar/26' })" },
        },
        required: ["title", "body", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_conversation_state",
      description: "Atualiza o estado contextual da conversa atual (tópico em foco, objetivo, pendências). Use quando o foco da conversa mudar de assunto ou quando o usuário definir um objetivo para a interação.",
      parameters: {
        type: "object",
        properties: {
          current_topic: { type: "string", description: "Tópico em foco (ex: 'Campanha Black Friday')" },
          current_objective: { type: "string", description: "Objetivo desta conversa (ex: 'reduzir CPL Meta em 20%')" },
          pending_items: { type: "array", items: { type: "object" }, description: "Pendências [{type, description, due}]" },
        },
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

      case "create_campaign": {
        // Find latest project for this client
        const { data: project } = await db
          .from("projects")
          .select("id")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!project) {
          return { success: false, message: "Nenhum projeto encontrado para este cliente. Crie um projeto antes de estruturar campanhas." };
        }

        const campaignPayload: Record<string, unknown> = {
          client_id: clientId,
          project_id: project.id,
          name: args.name as string,
          platform: args.platform as string,
          created_by: userId,
          status: "draft",
        };

        const optionalFields = [
          "objective", "objective_detail", "campaign_type", "strategy",
          "budget", "daily_budget", "start_date", "end_date",
          "headline", "ad_copy", "call_to_action", "targeting",
          "placements", "bidding_strategy", "target_cpa", "target_roas", "description",
        ];
        for (const key of optionalFields) {
          if (args[key] !== undefined && args[key] !== null) {
            campaignPayload[key] = args[key];
          }
        }

        const { error } = await db.from("campaigns").insert(campaignPayload);
        if (error) throw error;
        return { success: true, message: `Campanha "${args.name}" (${args.platform}) criada como rascunho com sucesso. Revise na seção Campanhas.` };
      }

      case "create_project": {
        const projectPayload: Record<string, unknown> = {
          client_id: clientId,
          name: args.name as string,
          created_by: userId,
          status: (args.status as string) || "planning",
        };
        for (const key of ["description", "start_date", "end_date", "budget"]) {
          if (args[key] !== undefined && args[key] !== null) projectPayload[key] = args[key];
        }
        const { error } = await db.from("projects").insert(projectPayload);
        if (error) throw error;
        return { success: true, message: `Projeto "${args.name}" criado com sucesso em status "${projectPayload.status}".` };
      }

      case "create_strategic_plan": {
        const planPayload: Record<string, unknown> = {
          client_id: clientId,
          title: args.title as string,
          created_by: userId,
          status: "draft",
        };
        for (const key of ["objectives", "kpis", "personas", "funnel_strategy", "campaign_types", "timeline_start", "timeline_end", "budget_allocation"]) {
          if (args[key] !== undefined && args[key] !== null) planPayload[key] = args[key];
        }
        const { error } = await db.from("strategic_plans").insert(planPayload);
        if (error) throw error;
        return { success: true, message: `Plano estratégico "${args.title}" criado como rascunho. Revise na seção Plano Estratégico.` };
      }

      case "create_briefing": {
        const briefingPayload: Record<string, unknown> = {
          client_id: clientId,
          title: args.title as string,
          created_by: userId,
          status: "pending",
        };
        for (const key of ["nicho", "publico_alvo", "objetivos", "diferenciais", "concorrentes", "budget_mensal", "observacoes"]) {
          if (args[key] !== undefined && args[key] !== null) briefingPayload[key] = args[key];
        }
        const { error } = await db.from("briefings").insert(briefingPayload);
        if (error) throw error;
        return { success: true, message: `Briefing "${args.title}" criado com sucesso.` };
      }

      case "read_file": {
        const fileId = args.file_id as string | undefined;
        const fileName = args.file_name as string | undefined;
        if (!fileId && !fileName) {
          return { success: false, message: "Forneça file_id ou file_name." };
        }

        // Locate file (scoped to client)
        let fileQuery = db
          .from("files")
          .select("id, name, file_path, mime_type, file_type")
          .eq("client_id", clientId);
        if (fileId) {
          fileQuery = fileQuery.eq("id", fileId);
        } else if (fileName) {
          fileQuery = fileQuery.ilike("name", `%${fileName}%`);
        }
        const { data: fileRow, error: fileErr } = await fileQuery
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fileErr) throw fileErr;
        if (!fileRow) {
          return { success: false, message: `Arquivo não encontrado para ${fileId ? `id=${fileId}` : `nome ~ "${fileName}"`}.` };
        }

        // Download from storage
        const { data: blob, error: dlErr } = await db.storage
          .from("client-files")
          .download(fileRow.file_path as string);
        if (dlErr || !blob) {
          return { success: false, message: `Falha ao baixar arquivo: ${dlErr?.message || "sem dados"}` };
        }

        const mime = (fileRow.mime_type as string | null)?.toLowerCase() || "";
        const lowerName = (fileRow.name as string).toLowerCase();
        const MAX = 8000;
        let content = "";

        try {
          if (mime.includes("pdf") || lowerName.endsWith(".pdf")) {
            // Parse PDF via esm.sh
            const arrayBuf = await blob.arrayBuffer();
            const pdfMod: any = await import("https://esm.sh/pdf-parse@1.1.1?target=deno");
            const PDFParser = pdfMod.default || pdfMod;
            const pdfData = await PDFParser(new Uint8Array(arrayBuf));
            content = (pdfData?.text || "").trim();
          } else if (
            mime.startsWith("text/") ||
            mime.includes("json") ||
            mime.includes("csv") ||
            /\.(txt|md|csv|json|log|xml|html?)$/i.test(lowerName)
          ) {
            content = (await blob.text()).trim();
          } else if (
            mime.includes("officedocument") ||
            /\.(docx?|xlsx?|pptx?)$/i.test(lowerName)
          ) {
            return {
              success: false,
              message: `Arquivo "${fileRow.name}" está em formato Office (DOCX/XLSX/PPTX). Não consigo ler diretamente — peça ao usuário para converter para PDF ou TXT.`,
            };
          } else if (mime.startsWith("image/")) {
            return {
              success: false,
              message: `Arquivo "${fileRow.name}" é uma imagem. Use OCR externo ou descreva o conteúdo manualmente.`,
            };
          } else {
            return {
              success: false,
              message: `Formato não suportado para leitura: ${mime || "desconhecido"} (${fileRow.name}). Suportados: PDF, TXT, MD, CSV, JSON, HTML.`,
            };
          }
        } catch (parseErr) {
          console.error("read_file parse error:", parseErr);
          return {
            success: false,
            message: `Erro ao extrair texto de "${fileRow.name}": ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
          };
        }

        if (!content) {
          return { success: false, message: `Arquivo "${fileRow.name}" está vazio ou não contém texto extraível.` };
        }

        const truncated = content.length > MAX;
        const finalContent = truncated ? content.slice(0, MAX) + "\n\n[...truncado, arquivo continua]" : content;

        return {
          success: true,
          message: `Arquivo "${fileRow.name}" lido com sucesso (${content.length} caracteres${truncated ? `, truncado em ${MAX}` : ""}).\n\n--- CONTEÚDO ---\n${finalContent}`,
        };
      }

      case "log_decision": {
        const { data, error } = await db.from("client_decisions").insert({
          client_id: clientId,
          title: args.title as string,
          decision: args.decision as string,
          rationale: (args.rationale as string) || null,
          decided_by: userId,
          related_entity_type: (args.related_entity_type as string) || null,
          related_entity_id: (args.related_entity_id as string) || null,
        }).select("id").single();
        if (error) throw error;
        return { success: true, message: `Decisão "${args.title}" registrada (id: ${data?.id?.slice(0,8)}).` };
      }

      case "record_insight": {
        const { data, error } = await db.from("insights").insert({
          client_id: clientId,
          title: args.title as string,
          body: args.body as string,
          category: (args.category as string) || "audit",
          urgency: (args.urgency as string) || "medium",
          evidence: (args.evidence as Record<string, unknown>) || {},
          generated_by: "bot",
          status: "new",
          created_by: userId,
        }).select("id").single();
        if (error) throw error;
        return { success: true, message: `Insight "${args.title}" registrado para validação (id: ${data?.id?.slice(0,8)}).` };
      }

      case "set_conversation_state": {
        // Handled at outer scope by caller (it has access to conversation row).
        // Here we just acknowledge — actual upsert happens after tool loop.
        return { success: true, message: `Estado atualizado: tópico="${args.current_topic || '-'}", objetivo="${args.current_objective || '-'}".` };
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
    const [
      clientRes, campaignsRes, metricsRes, plansRes, briefingsRes, tasksRes, filesRes,
      goalsRes, offersRes, channelsRes, constraintsRes, decisionsRes, actionsRes, insightsRes,
      convRes,
    ] = await Promise.all([
      db.from("clients").select("name, segment, phase, status").eq("id", client_id).single(),
      db.from("campaigns")
        .select("name, platform, status, budget, metrics, results, start_date, end_date, objective, campaign_type, strategy")
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
        .select("title, status, objectives, kpis, funnel_strategy, campaign_types, timeline_start, timeline_end, personas, budget_allocation")
        .eq("client_id", client_id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle(),
      db.from("briefings")
        .select("nicho, publico_alvo, objetivos, diferenciais, concorrentes, budget_mensal, observacoes")
        .eq("client_id", client_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db.from("tasks")
        .select("id, title, status, priority, due_date, executor_type, journey_phase, description, execution_guide, assigned_to")
        .eq("client_id", client_id)
        .order("created_at", { ascending: false })
        .limit(20),
      db.from("files")
        .select("id, name, file_type, mime_type, category, description, task_id, created_at")
        .eq("client_id", client_id)
        .order("created_at", { ascending: false })
        .limit(15),
      db.from("client_goals")
        .select("title, description, target_metric, target_value, deadline, priority, status")
        .eq("client_id", client_id).eq("status", "active")
        .order("priority", { ascending: false }).limit(10),
      db.from("client_offers")
        .select("name, description, price, target_audience, differentiators")
        .eq("client_id", client_id).eq("status", "active").limit(10),
      db.from("client_channels")
        .select("channel, account_id, status, monthly_budget, notes, last_activity_at")
        .eq("client_id", client_id).eq("status", "active").limit(10),
      db.from("client_constraints")
        .select("type, description, severity")
        .eq("client_id", client_id).eq("active", true).limit(20),
      db.from("client_decisions")
        .select("title, decision, rationale, decided_at, related_entity_type")
        .eq("client_id", client_id)
        .order("decided_at", { ascending: false }).limit(8),
      db.from("client_actions")
        .select("action_type, payload, executed_at, status")
        .eq("client_id", client_id)
        .order("executed_at", { ascending: false }).limit(10),
      db.from("insights")
        .select("title, body, category, urgency, status, created_at")
        .eq("client_id", client_id)
        .in("status", ["new", "acknowledged"])
        .order("created_at", { ascending: false }).limit(8),
      db.from("assistant_conversations")
        .select("id, current_topic, current_objective, last_recommendation, last_action, pending_items")
        .eq("user_id", userId).eq("mode", mode).eq("client_id", client_id)
        .maybeSingle(),
    ]);

    const client = clientRes.data;
    const campaigns = campaignsRes.data || [];
    const metrics = metricsRes.data || [];
    const plan = plansRes.data;
    const briefing = briefingsRes.data;
    const tasks = tasksRes.data || [];
    const files = filesRes.data || [];
    const goals = goalsRes.data || [];
    const offers = offersRes.data || [];
    const channels = channelsRes.data || [];
    const constraints = constraintsRes.data || [];
    const decisions = decisionsRes.data || [];
    const recentActions = actionsRes.data || [];
    const openInsights = insightsRes.data || [];
    const conversationState = convRes.data;

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

    if (briefing) {
      context += `## Briefing do Cliente:\n`;
      if (briefing.nicho) context += `- Nicho: ${briefing.nicho}\n`;
      if (briefing.publico_alvo) context += `- Público-alvo: ${briefing.publico_alvo}\n`;
      if (briefing.objetivos) context += `- Objetivos: ${briefing.objetivos}\n`;
      if (briefing.diferenciais) context += `- Diferenciais: ${briefing.diferenciais}\n`;
      if (briefing.concorrentes) context += `- Concorrentes: ${briefing.concorrentes}\n`;
      if (briefing.budget_mensal) context += `- Budget mensal: R$${briefing.budget_mensal}\n`;
      if (briefing.observacoes) context += `- Observações: ${briefing.observacoes}\n`;
      context += "\n";
    }

    if (plan) {
      if (plan.personas) context += `- Personas: ${JSON.stringify(plan.personas)}\n`;
      if (plan.budget_allocation) context += `- Alocação de Budget: ${JSON.stringify(plan.budget_allocation)}\n`;
    }

    if (tasks.length > 0) {
      const open = tasks.filter((t) => t.status !== "done");
      const done = tasks.filter((t) => t.status === "done");
      context += `\n## Tarefas (${open.length} abertas / ${done.length} recentes concluídas)\n`;
      context += `| ID | Status | Prioridade | Título | Prazo | Executor | Fase |\n`;
      context += `|---|---|---|---|---|---|---|\n`;
      for (const t of tasks) {
        const shortId = String(t.id).slice(0, 8);
        context += `| ${shortId} | ${t.status || "-"} | ${t.priority || "-"} | ${(t.title || "").slice(0, 60)} | ${t.due_date || "-"} | ${t.executor_type || "-"} | ${t.journey_phase || "-"} |\n`;
      }
      // Add brief descriptions for top open tasks
      const topOpen = open.slice(0, 5).filter((t) => t.description || t.execution_guide);
      if (topOpen.length > 0) {
        context += `\n### Detalhes das tarefas abertas prioritárias:\n`;
        for (const t of topOpen) {
          context += `- **${t.title}**`;
          if (t.description) context += ` — ${String(t.description).slice(0, 200)}`;
          if (t.execution_guide) context += `\n  Guia: ${String(t.execution_guide).slice(0, 300)}`;
          context += `\n`;
        }
      }
      context += "\n";
    }

    if (files.length > 0) {
      context += `## Arquivos do Cliente (últimos ${files.length} — use \`read_file\` para ler conteúdo)\n`;
      for (const f of files) {
        const dateStr = f.created_at ? String(f.created_at).split("T")[0] : "-";
        const cat = f.category ? ` [${f.category}]` : "";
        const desc = f.description ? ` — ${String(f.description).slice(0, 80)}` : "";
        const linked = f.task_id ? ` (anexo de tarefa)` : "";
        context += `- \`${f.id}\` **${f.name}**${cat} (${dateStr})${linked}${desc}\n`;
      }
      context += "\n";
    }

    // ── Memória operacional ──────────────────────────────────────────
    if (goals.length > 0) {
      context += `## 🎯 Objetivos Ativos do Cliente\n`;
      for (const g of goals) {
        const tgt = g.target_metric ? ` (meta: ${g.target_metric}=${g.target_value || "?"})` : "";
        const dl = g.deadline ? ` • prazo ${g.deadline}` : "";
        context += `- [${g.priority}] **${g.title}**${tgt}${dl}\n`;
        if (g.description) context += `  ${String(g.description).slice(0,200)}\n`;
      }
      context += "\n";
    }

    if (offers.length > 0) {
      context += `## 💼 Ofertas Ativas\n`;
      for (const o of offers) {
        context += `- **${o.name}**${o.price ? ` — R$${o.price}` : ""}${o.target_audience ? ` • público: ${o.target_audience}` : ""}\n`;
        if (o.description) context += `  ${String(o.description).slice(0,200)}\n`;
      }
      context += "\n";
    }

    if (channels.length > 0) {
      context += `## 📡 Canais Ativos\n`;
      for (const c of channels) {
        const bd = c.monthly_budget ? ` • R$${c.monthly_budget}/mês` : "";
        context += `- ${c.channel}${c.account_id ? ` (${c.account_id})` : ""}${bd}${c.notes ? ` — ${c.notes}` : ""}\n`;
      }
      context += "\n";
    }

    if (constraints.length > 0) {
      context += `## 🚫 Restrições/Regras a RESPEITAR (obrigatório)\n`;
      for (const r of constraints) {
        context += `- [${r.severity}/${r.type}] ${r.description}\n`;
      }
      context += `\n⚠️ Recuse qualquer ação que viole as regras acima e cite a restrição.\n\n`;
    }

    if (decisions.length > 0) {
      context += `## 🧠 Decisões Recentes (memória)\n`;
      for (const d of decisions) {
        const date = d.decided_at ? String(d.decided_at).split("T")[0] : "-";
        context += `- (${date}) **${d.title}**: ${d.decision}${d.rationale ? ` — _${d.rationale}_` : ""}\n`;
      }
      context += "\n";
    }

    if (recentActions.length > 0) {
      context += `## ⚡ Últimas Ações Executadas\n`;
      for (const a of recentActions.slice(0, 6)) {
        const date = a.executed_at ? String(a.executed_at).split("T")[0] : "-";
        context += `- (${date}) ${a.action_type} [${a.status}]\n`;
      }
      context += "\n";
    }

    if (openInsights.length > 0) {
      context += `## 💡 Insights Abertos (gerados anteriormente)\n`;
      for (const i of openInsights) {
        context += `- [${i.urgency}/${i.category}] **${i.title}** — ${String(i.body).slice(0,180)}\n`;
      }
      context += "\n";
    }

    if (conversationState) {
      const stateBits: string[] = [];
      if (conversationState.current_topic) stateBits.push(`tópico: ${conversationState.current_topic}`);
      if (conversationState.current_objective) stateBits.push(`objetivo: ${conversationState.current_objective}`);
      const pend = Array.isArray(conversationState.pending_items) ? conversationState.pending_items : [];
      if (pend.length > 0) stateBits.push(`pendências: ${pend.length}`);
      if (stateBits.length > 0) {
        context += `## 🧭 Estado da Conversa\n${stateBits.join(" • ")}\n`;
        if (conversationState.last_recommendation) {
          const lr = conversationState.last_recommendation as Record<string, unknown>;
          if (lr?.title) context += `Última recomendação: ${lr.title}\n`;
        }
        context += "\n";
      }
    }

    // System prompt by mode
    const baseIdentity = `Você é o Linkouzinho 🤖, assistente inteligente da Agência Linkou — agência de consultoria, tráfego e vendas.\nData atual: ${new Date().toISOString().split("T")[0]}\n\n`;

    let systemPrompt: string;
    if (mode === "admin") {
      systemPrompt =
        baseIdentity +
        `Modo: ORQUESTRADOR OPERACIONAL (equipe interna).\n\n` +
        `## Papel\n` +
        `Você NÃO é um respondedor. Você é um orquestrador inteligente que analisa cada mensagem, identifica a INTENÇÃO do usuário e assume internamente um dos 3 modos abaixo para conduzir o cliente até o RESULTADO (mais leads, mais vendas, mais performance).\n\n` +
        `## Camada de roteamento (INTERNA — nunca exponha ao usuário)\n` +
        `Antes de responder, classifique silenciosamente a intenção da mensagem em UM dos modos:\n\n` +
        `### 🔍 MODO AUDITOR\n` +
        `Quando: usuário pede análise, diagnóstico, menciona problema, queda, erro, "o que tá errado", "por que caiu", "analisa", "revisa".\n` +
        `Foco: identificar erros, gargalos, falhas estruturais.\n` +
        `Formato de saída (markdown):\n` +
        `**1. Diagnóstico** — o que está acontecendo (com base nos dados reais).\n` +
        `**2. Problema principal** — o maior gargalo identificado.\n` +
        `**3. Evidência** — dados concretos do contexto que comprovam (números, períodos, comparações).\n` +
        `**4. Impacto** — o que isso está custando em leads/vendas/CPL.\n\n` +
        `### 🎯 MODO ESTRATEGISTA\n` +
        `Quando: usuário pede direção, plano, "o que fazer", "estratégia", "prioridade", "próximos passos", "como melhorar", "como crescer". Também é o modo PADRÃO em casos ambíguos.\n` +
        `Foco: definir prioridades e plano de ação claro.\n` +
        `Formato de saída (markdown):\n` +
        `**1. Contexto** — leitura curta da situação atual.\n` +
        `**2. Objetivo** — o resultado-alvo dessa estratégia.\n` +
        `**3. Plano** — lista priorizada de ações (máx. 3-5 itens).\n` +
        `**4. Prioridade #1** — destaque do que tem maior impacto agora e por quê.\n` +
        `**5. Próximo passo** — UMA ação clara para começar.\n\n` +
        `### ⚡ MODO EXECUTOR\n` +
        `Quando: usuário pede ação direta — "cria", "agenda", "estrutura", "lança", "preenche", "ajusta", "registra", "monta".\n` +
        `Foco: executar via tool call imediatamente quando o contexto for claro.\n` +
        `Formato de saída (markdown):\n` +
        `**1. Ação** — o que vai ser feito (em uma linha).\n` +
        `**2. Como executar** — chama a tool apropriada AGORA (sem pedir permissão se o contexto basta).\n` +
        `**3. Resultado esperado** — o impacto esperado em leads/vendas/performance.\n` +
        `**4. Próximo passo** — UMA ação seguinte clara.\n\n` +
        `## Regras CRÍTICAS\n` +
        `1. NUNCA mencione "modo Auditor/Estrategista/Executor" na resposta — é decisão interna.\n` +
        `2. UMA direção por resposta — nunca misture análise + plano longo + execução na mesma mensagem.\n` +
        `3. Se faltar dado essencial, faça UMA pergunta objetiva e pare.\n` +
        `4. NUNCA invente dados. Use apenas o contexto fornecido.\n` +
        `5. Sempre termine com UM próximo passo claro e executável.\n` +
        `6. Foco obsessivo em impacto real: leads, qualificação, vendas, CPL, ROAS.\n` +
        `7. Em ambiguidade, assuma ESTRATEGISTA (mais útil por padrão).\n\n` +
        `## Ferramentas disponíveis (use principalmente no modo EXECUTOR)\n` +
        `Quando a ação for clara e acionável, EXECUTE imediatamente via tool call:\n` +
        `- **create_appointment**: Agendar reuniões/calls.\n` +
        `- **create_task**: Criar tarefas com prioridade e prazo.\n` +
        `- **upsert_traffic_metrics**: Registrar/atualizar métricas mensais.\n` +
        `- **create_campaign**: Estruturar campanhas técnicas (use briefing + plano + métricas para targeting, budget, copy, bidding). Nomenclatura: [Plataforma] Objetivo - Público - Período. Status: draft.\n` +
        `- **create_project**: Criar projetos (nome, escopo, datas, budget).\n` +
        `- **create_strategic_plan**: Gerar plano completo (personas, KPIs SMART, funil topo/meio/fundo, alocação de budget % por canal, tipos de campanha) baseado em dados reais.\n` +
        `- **create_briefing**: Estruturar briefing (nicho, público, objetivos, diferenciais, concorrentes, budget).\n\n` +
        `- **read_file**: Lê o conteúdo de um PDF/TXT/MD/CSV/JSON do cliente. Use APENAS quando pedido explicitamente ("analisa o PDF", "resume o briefing", "lê esse arquivo"). Identifique pelo \`id\` da lista de Arquivos do contexto (preferencial) ou pelo nome.\n\n` +
        `## Análise estratégica (suporte ao AUDITOR e ESTRATEGISTA)\n` +
        `Compare CPL/CPV entre meses, calcule variação %, identifique gargalos no funil (impressão→clique→lead→SQL→venda), aponte canais com melhor ROAS, sugira realocação de budget e projete cenários com base em histórico.\n\n` +
        `Ao inferir datas, use ano atual (${new Date().getFullYear()}) e mês atual como referência.\n\n` +
        `${context}` +
        `Responda APENAS com base nos dados acima. Se não houver dados suficientes para o modo escolhido, peça UMA informação objetiva antes de seguir.`;
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
