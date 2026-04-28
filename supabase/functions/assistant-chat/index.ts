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

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

// fetch com timeout para evitar travas na chamada do Lovable AI Gateway
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 45000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// Converte um texto pronto em uma stream SSE compatível com o frontend
function sseFromText(text: string): Response {
  const payload = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`;
  return new Response(payload, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

// Lê uma stream SSE da Lovable AI e devolve { text, hadError }.
// hadError = true quando o provedor sinaliza finish_reason=error / MALFORMED_FUNCTION_CALL
// ou quando o stream termina sem nenhum delta de texto.
async function readSSEContent(resp: Response): Promise<{ text: string; hadError: boolean }> {
  if (!resp.body) return { text: "", hadError: true };
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let sawErrorFinish = false;

  const handleLine = (rawLine: string) => {
    let line = rawLine;
    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (!line || line.startsWith(":")) return;
    if (!line.startsWith("data: ")) return;
    const jsonStr = line.slice(6).trim();
    if (jsonStr === "[DONE]") return;
    try {
      const parsed = JSON.parse(jsonStr);
      const choice = parsed?.choices?.[0];
      const delta = choice?.delta?.content as string | undefined;
      if (delta) text += delta;
      const finish = choice?.finish_reason || choice?.native_finish_reason;
      if (
        finish === "error" ||
        finish === "MALFORMED_FUNCTION_CALL" ||
        finish === "content_filter"
      ) {
        sawErrorFinish = true;
      }
    } catch {
      // ignore partial JSON
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        handleLine(line);
      }
    }
    if (buffer.trim()) {
      for (const raw of buffer.split("\n")) handleLine(raw);
    }
  } catch (e) {
    console.error("readSSEContent error:", e);
    return { text, hadError: true };
  }

  return { text, hadError: sawErrorFinish || text.trim().length === 0 };
}

// Sanitiza o histórico que vai pro modelo: remove mensagens assistentes vazias
// ou claramente truncadas, evitando que respostas quebradas anteriores
// disparem novos MALFORMED_FUNCTION_CALL.
function sanitizeHistory(messages: Array<{ role: string; content: string }>) {
  return messages
    .filter((m) => m && typeof m.content === "string")
    .map((m) => ({
      role: m.role,
      content: m.content.length > 8000 ? m.content.slice(0, 8000) + "…" : m.content,
    }))
    .filter((m) => {
      if (m.role !== "assistant") return true;
      const c = m.content.trim();
      if (c.length === 0) return false;
      // descarta a mensagem de erro padrão do front pra não contaminar contexto
      if (c.startsWith("⚠️ Não recebi resposta")) return false;
      if (c.startsWith("❌")) return false;
      return true;
    });
}

// ── Tool definitions (admin only) ──────────────────────────────────────
const adminTools = [
  {
    type: "function",
    function: {
      name: "create_creative_demand",
      description: "Cria uma DEMANDA CRIATIVA para o cliente atual (briefing de produção: copy de vídeo, copy estática, vídeo, arte ou enxoval de mídia). Use quando o admin pedir 'cria demanda criativa', 'novo briefing de criativo', 'pedir produção de vídeo/post/arte'. Status inicial: briefing.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título curto da demanda (ex: 'Reel de lançamento Abril')" },
          briefing: { type: "string", description: "Briefing detalhado (referências, tom, mensagem-chave)" },
          objective: { type: "string", description: "Objetivo da peça (ex: gerar leads, branding, conversão)" },
          platform: { type: "string", description: "Plataforma alvo (Instagram, TikTok, YouTube, Meta Ads, etc.)" },
          format: { type: "string", description: "Formato (Reel, Stories, Feed, VSL, Carrossel, etc.)" },
          deadline: { type: "string", description: "Prazo no formato YYYY-MM-DD" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Prioridade. Padrão: medium" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_creative_deliverable",
      description: "Cria um ENTREGÁVEL vinculado a uma demanda criativa (uma peça específica: copy de vídeo, copy estática, vídeo, imagem, enxoval). Use depois de criar/identificar a demanda. Pode incluir o conteúdo (texto/copy) já neste momento se o admin ditou.",
      parameters: {
        type: "object",
        properties: {
          demand_id: { type: "string", description: "UUID da demanda criativa pai" },
          type: { type: "string", enum: ["video_copy", "static_copy", "video", "image", "media_kit"], description: "Tipo do entregável" },
          title: { type: "string", description: "Título do entregável (ex: 'Roteiro Reel 30s')" },
          content: { type: "string", description: "Conteúdo textual da peça (roteiro, copy, headline+corpo+CTA). Opcional." },
          status: { type: "string", enum: ["in_production", "in_approval", "adjustments", "delivered"], description: "Status inicial. Padrão: in_production. NÃO use 'approved' (somente Ponto Focal via UI)." },
        },
        required: ["demand_id", "type", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_demand_status",
      description: "Move o status de uma demanda criativa. Use para sinalizar que a demanda saiu do briefing, está em produção, em aprovação, em ajustes ou foi entregue. NÃO marca 'approved' — aprovação é exclusiva do Ponto Focal via UI.",
      parameters: {
        type: "object",
        properties: {
          demand_id: { type: "string", description: "UUID da demanda" },
          status: { type: "string", enum: ["briefing", "in_production", "in_approval", "adjustments", "delivered"], description: "Novo status" },
        },
        required: ["demand_id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_deliverable_status",
      description: "Move o status de um entregável criativo. NÃO permite 'approved' — aprovação só pelo Ponto Focal via UI em /cliente/criativos.",
      parameters: {
        type: "object",
        properties: {
          deliverable_id: { type: "string", description: "UUID do entregável" },
          status: { type: "string", enum: ["in_production", "in_approval", "adjustments", "delivered"], description: "Novo status" },
          feedback: { type: "string", description: "Notas/feedback opcional sobre a transição" },
        },
        required: ["deliverable_id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_deliverable_version",
      description: "Adiciona uma NOVA VERSÃO de copy/texto a um entregável criativo. Incrementa current_version. Use quando o admin ditar uma copy/roteiro novo no chat ou pedir 'atualiza a copy do entregável X com isso'. Para versões de arquivo (vídeo, arte), o upload deve ser feito pela UI.",
      parameters: {
        type: "object",
        properties: {
          deliverable_id: { type: "string", description: "UUID do entregável" },
          content: { type: "string", description: "Texto/copy da nova versão (roteiro, headline+corpo+CTA, etc.)" },
          notes: { type: "string", description: "Notas sobre o que mudou nessa versão (opcional)" },
        },
        required: ["deliverable_id", "content"],
      },
    },
  },
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
      name: "list_projects",
      description: "Lista os projetos do cliente atual (id, nome, status, datas, budget). Use para obter o UUID antes de chamar update_project, link_task_to_project, link_campaign_to_project, create_learning ou update_learning.",
      parameters: { type: "object", properties: { limit: { type: "number", description: "Máx. de projetos. Padrão 20." } } },
    },
  },
  {
    type: "function",
    function: {
      name: "update_project",
      description: "Atualiza um projeto existente do cliente atual: status (planning/active/paused/completed), hipótese (description), datas ou budget.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "UUID do projeto" },
          name: { type: "string" },
          description: { type: "string", description: "HIPÓTESE/OBJETIVO refinado" },
          start_date: { type: "string", description: "YYYY-MM-DD" },
          end_date: { type: "string", description: "YYYY-MM-DD" },
          budget: { type: "number" },
          status: { type: "string", enum: ["planning", "active", "paused", "completed"] },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "link_task_to_project",
      description: "Vincula uma tarefa existente a um projeto (define task.project_id). Ambos devem pertencer ao cliente atual.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "UUID da tarefa" },
          project_id: { type: "string", description: "UUID do projeto" },
        },
        required: ["task_id", "project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "link_campaign_to_project",
      description: "Vincula uma campanha existente a um projeto (define campaign.project_id). Ambos devem pertencer ao cliente atual.",
      parameters: {
        type: "object",
        properties: {
          campaign_id: { type: "string", description: "UUID da campanha" },
          project_id: { type: "string", description: "UUID do projeto" },
        },
        required: ["campaign_id", "project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_learning",
      description: "Registra um APRENDIZADO (hipótese validada/invalidada) vinculado a um projeto. NUNCA marque como aprovado — aprovação é exclusiva do Ponto Focal via UI.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "UUID do projeto fonte do aprendizado" },
          title: { type: "string", description: "Título curto do aprendizado" },
          description: { type: "string", description: "Detalhes do que foi testado, dados e contexto" },
          impact: { type: "string", description: "Impacto observado (qualitativo + numérico)" },
          category: { type: "string", description: "Categoria (ex: oferta, copy, criativo, público, funil, canal)" },
          tags: { type: "array", items: { type: "string" }, description: "Tags para busca posterior" },
        },
        required: ["project_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_learning",
      description: "Edita um aprendizado existente (texto, impacto, categoria, tags). NÃO altera approved_by_ponto_focal — só Ponto Focal aprova via UI.",
      parameters: {
        type: "object",
        properties: {
          learning_id: { type: "string", description: "UUID do aprendizado" },
          title: { type: "string" },
          description: { type: "string" },
          impact: { type: "string" },
          category: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["learning_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_strategic_plan",
      description: "Cria um plano estratégico PROFUNDO e EDITORIAL para o cliente atual. NÃO crie nada raso: gere ao menos 3 personas detalhadas, 5+ objetivos SMART numéricos, 6+ KPIs categorizados, funil topo/meio/fundo estruturado, diagnóstico (oportunidades + riscos + concorrência), alocação de budget por canal e por etapa, e plano de execução com 3 ondas (90 dias) + governança. Baseie-se em briefing, métricas históricas, segmento e contexto real do cliente.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título do plano (ex: 'Plano Estratégico Q2/2026 — Escala de Vendas')" },
          executive_summary: { type: "string", description: "Sumário executivo de 3-5 linhas: contexto, objetivo principal, abordagem-chave, resultado esperado." },
          timeline_start: { type: "string", description: "Data de início (YYYY-MM-DD)" },
          timeline_end: { type: "string", description: "Data de término (YYYY-MM-DD)" },
          campaign_types: { type: "array", items: { type: "string" }, description: "Tipos de campanha recomendados" },
          diagnostic: {
            type: "object",
            description: "Diagnóstico completo da situação atual",
            properties: {
              current_situation: { type: "string", description: "Análise da situação atual (3-6 linhas) baseada nos dados do cliente." },
              opportunities: { type: "array", items: { type: "string" }, description: "Mínimo 3 oportunidades concretas." },
              risks: { type: "array", items: { type: "string" }, description: "Mínimo 3 riscos relevantes." },
              competition: {
                type: "array",
                description: "Lista de 2-5 concorrentes",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    strengths: { type: "string" },
                    weaknesses: { type: "string" },
                  },
                },
              },
            },
          },
          personas: {
            type: "array",
            description: "Mínimo 3 personas profundas e segmentadas.",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Nome/apelido da persona" },
                demographics: { type: "string", description: "Idade, gênero, renda, profissão, localização" },
                pain_points: { type: "array", items: { type: "string" }, description: "Mínimo 3 dores reais" },
                desires: { type: "array", items: { type: "string" }, description: "Mínimo 2 desejos/aspirações" },
                objections: { type: "array", items: { type: "string" }, description: "Mínimo 2 objeções de compra" },
                channels: { type: "array", items: { type: "string" }, description: "Canais onde estão (Instagram, Google, TikTok…)" },
                message_hook: { type: "string", description: "Mensagem-chave que ressoa com essa persona" },
              },
              required: ["name", "demographics", "pain_points"],
            },
          },
          objectives: {
            type: "array",
            description: "Mínimo 5 objetivos SMART com baseline e meta numérica.",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                metric: { type: "string", description: "Ex: leads/mês, ROAS, CPL" },
                baseline: { type: "number", description: "Valor atual" },
                target: { type: "number", description: "Meta numérica" },
                deadline: { type: "string", description: "YYYY-MM-DD" },
                owner: { type: "string", description: "Responsável" },
              },
              required: ["name", "metric", "target"],
            },
          },
          kpis: {
            type: "array",
            description: "Mínimo 6 KPIs distribuídos entre Aquisição, Conversão e Retenção.",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string", enum: ["aquisicao", "conversao", "retencao", "branding"] },
                unit: { type: "string", description: "Ex: R$, %, un" },
                current: { type: "number" },
                target: { type: "number" },
                source: { type: "string", description: "Fonte: Meta Ads, GA4, CRM…" },
                frequency: { type: "string", description: "Diária / Semanal / Mensal" },
              },
              required: ["name", "category", "target"],
            },
          },
          funnel_strategy: {
            type: "object",
            description: "Estratégia estruturada por etapa do funil.",
            properties: {
              topo: {
                type: "object",
                properties: {
                  goal: { type: "string" },
                  channels: { type: "array", items: { type: "string" } },
                  creatives: { type: "array", items: { type: "string" } },
                  kpi: { type: "string" },
                  budget_pct: { type: "number" },
                },
              },
              meio: {
                type: "object",
                properties: {
                  goal: { type: "string" },
                  channels: { type: "array", items: { type: "string" } },
                  creatives: { type: "array", items: { type: "string" } },
                  kpi: { type: "string" },
                  budget_pct: { type: "number" },
                },
              },
              fundo: {
                type: "object",
                properties: {
                  goal: { type: "string" },
                  channels: { type: "array", items: { type: "string" } },
                  creatives: { type: "array", items: { type: "string" } },
                  kpi: { type: "string" },
                  budget_pct: { type: "number" },
                },
              },
              reengajamento: {
                type: "object",
                properties: {
                  goal: { type: "string" },
                  channels: { type: "array", items: { type: "string" } },
                  kpi: { type: "string" },
                  budget_pct: { type: "number" },
                },
              },
            },
          },
          budget_allocation: {
            type: "object",
            properties: {
              total_monthly: { type: "number", description: "Investimento mensal total em R$" },
              by_channel: { type: "object", description: "% por canal: { meta_ads: 50, google_ads: 30, ... }" },
              by_phase: { type: "object", description: "% por etapa: { topo: 20, meio: 30, fundo: 50 }" },
              reserve_pct: { type: "number", description: "% de reserva para experimentação" },
            },
          },
          execution_plan: {
            type: "object",
            description: "Plano de execução com ondas (sprints) e governança.",
            properties: {
              waves: {
                type: "array",
                description: "Mínimo 3 ondas (ex: Mês 1, Mês 2, Mês 3).",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    period: { type: "string", description: "Ex: Mês 1 (Mai/26)" },
                    deliverables: { type: "array", items: { type: "string" } },
                    milestones: { type: "array", items: { type: "string" } },
                  },
                  required: ["name", "deliverables"],
                },
              },
              governance: {
                type: "object",
                properties: {
                  cadence: { type: "string", description: "Cadência de calls (semanal / quinzenal)" },
                  reports: { type: "string", description: "Relatórios entregues e periodicidade" },
                  tools: { type: "array", items: { type: "string" } },
                  responsibles: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        required: ["title", "executive_summary", "personas", "objectives", "kpis", "funnel_strategy"],
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
  {
    type: "function",
    function: {
      name: "search_documents",
      description: "Busca semântica nos arquivos JÁ INDEXADOS do cliente atual via similaridade vetorial. Use quando o usuário perguntar sobre conteúdo de documentos, briefings, contratos, ou pedir resumo de um tópico que pode estar em arquivos. Mais econômico que read_file: retorna apenas os trechos relevantes. NÃO chame se a resposta já está no contexto operacional carregado.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Pergunta ou tópico para busca semântica (ex: 'qual o público-alvo do produto X', 'cláusulas de rescisão')" },
          top_k: { type: "number", description: "Número máximo de trechos a retornar. Padrão: 5, máximo: 10" },
        },
        required: ["query"],
      },
    },
  },
];

// Memory & state management tools (admin only)
const memoryTools = [
  {
    type: "function",
    function: {
      name: "send_campaign_approval_email",
      description: "Dispara um e-mail transacional avisando o Ponto Focal e os Gestores do cliente atual de que existem campanhas aguardando aprovação. Usa o template oficial 'campanha pendente de aprovação'. Use quando o admin pedir 'avisa o cliente por e-mail', 'manda e-mail das campanhas pendentes', 'notifica o ponto focal por e-mail das aprovações'. NÃO inventa template — usa o já existente.",
      parameters: {
        type: "object",
        properties: {
          campaign_ids: {
            type: "array",
            items: { type: "string" },
            description: "UUIDs específicos de campanhas para incluir. Se omitido, pega todas as campanhas do cliente em status 'pending_approval' não aprovadas pelo Ponto Focal.",
          },
          include_all_client_users: {
            type: "boolean",
            description: "Se true, envia também para todos os usuários vinculados ao cliente (não só pontos focais e gestores). Padrão: false.",
          },
        },
      },
    },
  },
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

// ── Client-mode tools (limitadas) ──────────────────────────────────────
const clientTools = [
  {
    type: "function",
    function: {
      name: "request_creative_demand",
      description: "Cria uma nova DEMANDA CRIATIVA em status 'briefing' para o cliente atual. Use quando o usuário cliente pedir 'quero um vídeo', 'preciso de uma copy', 'cria um post', 'monta um briefing pra produção'. Pergunte pelos campos faltantes (título, formato, prazo) ANTES de chamar se a mensagem estiver vaga.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título curto da demanda (ex: 'Reel pro lançamento da semana que vem')" },
          briefing: { type: "string", description: "Descrição do que o cliente quer (referências, tom, mensagem-chave)" },
          objective: { type: "string", description: "Objetivo (ex: gerar leads, branding)" },
          platform: { type: "string", description: "Plataforma alvo (Instagram, TikTok, etc.)" },
          format: { type: "string", description: "Formato (Reel, Stories, Feed, Carrossel, VSL...)" },
          deadline: { type: "string", description: "Prazo desejado (YYYY-MM-DD)" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Padrão: medium" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_keywords",
      description: "Lista as palavras-chave (SEO) e clusters do cliente atual com id curto. Use ANTES de update_keyword/record_keyword_ranking para obter o UUID correto, ou quando o admin pedir 'mostra as keywords', 'lista palavras-chave', 'quais termos estamos monitorando'.",
      parameters: {
        type: "object",
        properties: {
          filter: { type: "string", description: "Filtro opcional por status (target/ranking/opportunity/archived) ou texto parcial do termo." },
          limit: { type: "number", description: "Máx. de keywords. Padrão 30." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_keyword",
      description: "Cria uma nova palavra-chave (SEO) para o cliente atual. Use quando o admin pedir 'cadastra a keyword X', 'adiciona o termo Y', 'monitorar essa palavra'. NUNCA invente volume/dificuldade/CPC — só preencha se o admin disser explicitamente; caso contrário deixe nulo e oriente importar de Semrush/Ahrefs/Keyword Planner.",
      parameters: {
        type: "object",
        properties: {
          term: { type: "string", description: "Termo da palavra-chave (ex: 'consultoria de tráfego')" },
          intent: { type: "string", enum: ["informational", "navigational", "transactional", "commercial"], description: "Intenção de busca. Padrão: informational" },
          search_volume: { type: "number", description: "Volume mensal de busca (opcional, só se fornecido pelo admin)" },
          difficulty: { type: "number", description: "Dificuldade SEO 0-100 (opcional)" },
          cpc: { type: "number", description: "CPC estimado em R$ (opcional)" },
          target_url: { type: "string", description: "URL do site do cliente alvo desse termo (opcional)" },
          cluster_id: { type: "string", description: "UUID do cluster/pillar (opcional)" },
          status: { type: "string", enum: ["target", "ranking", "opportunity", "archived"], description: "Status. Padrão: target" },
          notes: { type: "string", description: "Notas livres (opcional)" },
          tags: { type: "array", items: { type: "string" }, description: "Tags livres (opcional)" },
        },
        required: ["term"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_keyword",
      description: "Atualiza qualquer campo de uma palavra-chave existente do cliente atual: posição, status, intenção, volume, dificuldade, CPC, URL alvo, cluster, vínculos com campanha/tarefa, tags, notas.",
      parameters: {
        type: "object",
        properties: {
          keyword_id: { type: "string", description: "UUID da keyword" },
          term: { type: "string" },
          intent: { type: "string", enum: ["informational", "navigational", "transactional", "commercial"] },
          search_volume: { type: "number" },
          difficulty: { type: "number" },
          cpc: { type: "number" },
          current_position: { type: "number", description: "Posição atual no Google (1-100). Atualiza apenas o campo, não cria histórico — para isso use record_keyword_ranking." },
          target_url: { type: "string" },
          cluster_id: { type: "string" },
          campaign_id: { type: "string", description: "UUID de campanha vinculada (opcional)" },
          task_id: { type: "string", description: "UUID de tarefa vinculada (opcional)" },
          status: { type: "string", enum: ["target", "ranking", "opportunity", "archived"] },
          notes: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["keyword_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_keyword_cluster",
      description: "Cria um cluster/pillar de conteúdo SEO (agrupa keywords relacionadas em torno de um tema-pilar). Use ao organizar estratégia de conteúdo: 'cria um cluster para cursos online', 'novo pillar sobre gestão de tráfego'.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do cluster (ex: 'Fundo de funil — cursos online')" },
          intent: { type: "string", enum: ["informational", "navigational", "transactional", "commercial"], description: "Intenção dominante do cluster (opcional)" },
          pillar_url: { type: "string", description: "URL do artigo pillar (opcional)" },
          description: { type: "string", description: "Descrição/contexto do cluster (opcional)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_keyword_ranking",
      description: "Registra um ponto histórico de posição para uma keyword (alimenta o sparkline de evolução) E atualiza o current_position. Use quando o admin disser 'a keyword X subiu pra posição Y', 'registra ranking', 'caiu pra posição N'.",
      parameters: {
        type: "object",
        properties: {
          keyword_id: { type: "string", description: "UUID da keyword" },
          position: { type: "number", description: "Posição atual no Google (1-100)" },
          notes: { type: "string", description: "Notas opcionais sobre a checagem" },
          source: { type: "string", description: "Origem da medição (manual, gsc, serpapi). Padrão: manual" },
        },
        required: ["keyword_id", "position"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_keyword_opportunities",
      description: "Lê todas as keywords do cliente, cruza volume × dificuldade × posição atual e devolve recomendações priorizadas: quick wins (pos 11-20), candidatas a artigo de blog (alto vol + baixa dif + sem ranking), candidatas a Google Ads (alta intenção comercial + baixo orgânico), gaps por cluster. Use quando o admin pedir 'analisa oportunidades de SEO', 'onde devemos focar', 'quick wins'.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "bulk_create_keywords",
      description: "Cria várias palavras-chave de uma vez (até 200) para o cliente atual. Use quando o usuário ditar uma lista de termos pra cadastrar de uma vez. Aceita só term obrigatório por item; demais campos opcionais. Para importar a partir de uma planilha (CSV/XLSX) já enviada nos arquivos do cliente, prefira `import_keywords_from_document` — é muito mais econômico e mantém volume/dificuldade/CPC.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Lista de keywords (máx 200)",
            items: {
              type: "object",
              properties: {
                term: { type: "string" },
                intent: { type: "string", enum: ["informational", "navigational", "transactional", "commercial"] },
                search_volume: { type: "number" },
                difficulty: { type: "number" },
                cpc: { type: "number" },
                target_url: { type: "string" },
                cluster_id: { type: "string" },
                status: { type: "string", enum: ["target", "ranking", "opportunity", "archived"] },
                tags: { type: "array", items: { type: "string" } },
                notes: { type: "string" },
              },
              required: ["term"],
            },
          },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_keyword",
      description: "Remove ou arquiva uma palavra-chave do cliente atual. Use mode='archive' (padrão, recomendado — preserva histórico) ou mode='hard' para excluir definitivamente (apenas se o usuário pedir 'apaga de vez').",
      parameters: {
        type: "object",
        properties: {
          keyword_id: { type: "string", description: "UUID da keyword" },
          mode: { type: "string", enum: ["archive", "hard"], description: "Padrão: archive" },
        },
        required: ["keyword_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_keyword_cluster",
      description: "Atualiza um cluster/pillar SEO existente (nome, intenção, URL pillar, descrição).",
      parameters: {
        type: "object",
        properties: {
          cluster_id: { type: "string", description: "UUID do cluster" },
          name: { type: "string" },
          intent: { type: "string", enum: ["informational", "navigational", "transactional", "commercial"] },
          pillar_url: { type: "string" },
          description: { type: "string" },
        },
        required: ["cluster_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_documents",
      description: "Busca semântica nos arquivos JÁ INDEXADOS do cliente (PDF, DOCX, TXT, MD, CSV, JSON, HTML, XLSX/XLS e PPTX). Use quando o cliente perguntar sobre conteúdo de algum arquivo, planilha ou apresentação que ele subiu. Retorna apenas os trechos relevantes.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Pergunta ou tópico (ex: 'qual a meta de leads do mês', 'cláusulas de rescisão')" },
          top_k: { type: "number", description: "Máximo de trechos. Padrão 5, máximo 10." },
        },
        required: ["query"],
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
  userId: string,
  mode: string = "admin"
): Promise<{ success: boolean; message: string }> {
  try {
    // Client-mode allowlist: bloqueia qualquer tool fora do conjunto permitido
    if (mode === "client") {
      const allowed = new Set([
        "request_creative_demand",
        "set_conversation_state",
        // SEO / Palavras-chave (cliente pode operar nas próprias)
        "list_keywords",
        "create_keyword",
        "bulk_create_keywords",
        "update_keyword",
        "delete_keyword",
        "create_keyword_cluster",
        "update_keyword_cluster",
        "record_keyword_ranking",
        "analyze_keyword_opportunities",
        // RAG documental (cliente já podia ler arquivos próprios)
        "search_documents",
      ]);
      if (!allowed.has(toolName)) {
        return { success: false, message: "Ação restrita à equipe interna." };
      }
    }
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

      case "list_projects": {
        const limit = Math.min(Number(args.limit) || 20, 50);
        const { data, error } = await db
          .from("projects")
          .select("id, name, status, start_date, end_date, budget, description")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) throw error;
        const list = (data || []).map((p: any) =>
          `- \`${p.id}\` [${p.status || "—"}] ${p.name}${p.budget ? ` — R$${Number(p.budget).toLocaleString("pt-BR")}` : ""}${p.start_date ? ` (${p.start_date}${p.end_date ? ` → ${p.end_date}` : ""})` : ""}`
        ).join("\n");
        return { success: true, message: data && data.length ? `Projetos do cliente:\n${list}` : "Nenhum projeto encontrado para este cliente." };
      }

      case "update_project": {
        const projectId = args.project_id as string;
        if (!projectId) return { success: false, message: "project_id é obrigatório." };
        // Scope check
        const { data: existing, error: chkErr } = await db
          .from("projects").select("id, name").eq("id", projectId).eq("client_id", clientId).maybeSingle();
        if (chkErr) throw chkErr;
        if (!existing) return { success: false, message: "Projeto não encontrado para este cliente." };
        const update: Record<string, unknown> = {};
        for (const key of ["name", "description", "start_date", "end_date", "budget", "status"]) {
          if (args[key] !== undefined && args[key] !== null) update[key] = args[key];
        }
        if (Object.keys(update).length === 0) return { success: false, message: "Nenhum campo para atualizar." };
        const { error } = await db.from("projects").update(update).eq("id", projectId).eq("client_id", clientId);
        if (error) throw error;
        return { success: true, message: `Projeto "${existing.name}" atualizado (${Object.keys(update).join(", ")}).` };
      }

      case "link_task_to_project": {
        const taskId = args.task_id as string;
        const projectId = args.project_id as string;
        if (!taskId || !projectId) return { success: false, message: "task_id e project_id são obrigatórios." };
        const { data: proj } = await db.from("projects").select("id, name").eq("id", projectId).eq("client_id", clientId).maybeSingle();
        if (!proj) return { success: false, message: "Projeto não encontrado para este cliente." };
        const { data: task } = await db.from("tasks").select("id, title").eq("id", taskId).eq("client_id", clientId).maybeSingle();
        if (!task) return { success: false, message: "Tarefa não encontrada para este cliente." };
        const { error } = await db.from("tasks").update({ project_id: projectId }).eq("id", taskId).eq("client_id", clientId);
        if (error) throw error;
        return { success: true, message: `Tarefa "${task.title}" vinculada ao projeto "${proj.name}".` };
      }

      case "link_campaign_to_project": {
        const campaignId = args.campaign_id as string;
        const projectId = args.project_id as string;
        if (!campaignId || !projectId) return { success: false, message: "campaign_id e project_id são obrigatórios." };
        const { data: proj } = await db.from("projects").select("id, name").eq("id", projectId).eq("client_id", clientId).maybeSingle();
        if (!proj) return { success: false, message: "Projeto não encontrado para este cliente." };
        const { data: camp } = await db.from("campaigns").select("id, name").eq("id", campaignId).eq("client_id", clientId).maybeSingle();
        if (!camp) return { success: false, message: "Campanha não encontrada para este cliente." };
        const { error } = await db.from("campaigns").update({ project_id: projectId }).eq("id", campaignId).eq("client_id", clientId);
        if (error) throw error;
        return { success: true, message: `Campanha "${camp.name}" vinculada ao projeto "${proj.name}".` };
      }

      case "create_learning": {
        const projectId = args.project_id as string;
        if (!projectId) return { success: false, message: "project_id é obrigatório." };
        const { data: proj } = await db.from("projects").select("id, name").eq("id", projectId).eq("client_id", clientId).maybeSingle();
        if (!proj) return { success: false, message: "Projeto não encontrado para este cliente." };
        const payload: Record<string, unknown> = {
          client_id: clientId,
          project_id: projectId,
          title: args.title as string,
          created_by: userId,
          approved_by_ponto_focal: false,
        };
        for (const key of ["description", "impact", "category"]) {
          if (args[key] !== undefined && args[key] !== null) payload[key] = args[key];
        }
        if (Array.isArray(args.tags)) payload.tags = args.tags;
        const { error } = await db.from("learnings").insert(payload);
        if (error) throw error;
        return { success: true, message: `Aprendizado "${args.title}" registrado no projeto "${proj.name}". Aguardando aprovação do Ponto Focal via UI.` };
      }

      case "update_learning": {
        const learningId = args.learning_id as string;
        if (!learningId) return { success: false, message: "learning_id é obrigatório." };
        const { data: existing } = await db.from("learnings").select("id, title").eq("id", learningId).eq("client_id", clientId).maybeSingle();
        if (!existing) return { success: false, message: "Aprendizado não encontrado para este cliente." };
        const update: Record<string, unknown> = {};
        for (const key of ["title", "description", "impact", "category"]) {
          if (args[key] !== undefined && args[key] !== null) update[key] = args[key];
        }
        if (Array.isArray(args.tags)) update.tags = args.tags;
        if (Object.keys(update).length === 0) return { success: false, message: "Nenhum campo para atualizar." };
        const { error } = await db.from("learnings").update(update).eq("id", learningId).eq("client_id", clientId);
        if (error) throw error;
        return { success: true, message: `Aprendizado "${existing.title}" atualizado (${Object.keys(update).join(", ")}).` };
      }

      case "create_strategic_plan": {
        const planPayload: Record<string, unknown> = {
          client_id: clientId,
          title: args.title as string,
          created_by: userId,
          status: "draft",
        };
        for (const key of [
          "executive_summary",
          "objectives",
          "kpis",
          "personas",
          "funnel_strategy",
          "campaign_types",
          "timeline_start",
          "timeline_end",
          "budget_allocation",
          "diagnostic",
          "execution_plan",
        ]) {
          if (args[key] !== undefined && args[key] !== null) planPayload[key] = args[key];
        }
        const { error } = await db.from("strategic_plans").insert(planPayload);
        if (error) throw error;
        return { success: true, message: `Plano estratégico "${args.title}" criado como rascunho com diagnóstico, ${(asArr(args.personas)).length} personas, ${(asArr(args.objectives)).length} objetivos SMART e ${(asArr(args.kpis)).length} KPIs. Revise na seção Plano Estratégico.` };
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

      case "create_creative_demand":
      case "request_creative_demand": {
        const payload: Record<string, unknown> = {
          client_id: clientId,
          title: args.title as string,
          status: "briefing",
          requested_by: userId,
          priority: (args.priority as string) || "medium",
        };
        for (const k of ["briefing", "objective", "platform", "format", "deadline"]) {
          if (args[k] !== undefined && args[k] !== null && args[k] !== "") payload[k] = args[k];
        }
        const { data, error } = await db.from("creative_demands").insert(payload).select("id").single();
        if (error) throw error;
        return { success: true, message: `Demanda criativa "${args.title}" criada (id: ${String(data?.id).slice(0,8)}). Status: briefing.` };
      }

      case "create_creative_deliverable": {
        const status = (args.status as string) || "in_production";
        if (status === "approved") {
          return { success: false, message: "Status 'approved' é exclusivo do Ponto Focal via UI." };
        }
        // Verifica que a demanda pertence ao cliente
        const { data: demand, error: dErr } = await db
          .from("creative_demands")
          .select("id, client_id")
          .eq("id", args.demand_id as string)
          .maybeSingle();
        if (dErr) throw dErr;
        if (!demand || demand.client_id !== clientId) {
          return { success: false, message: "Demanda não encontrada ou não pertence a este cliente." };
        }
        const payload: Record<string, unknown> = {
          client_id: clientId,
          demand_id: args.demand_id as string,
          type: args.type as string,
          title: args.title as string,
          status,
          current_version: 1,
          created_by: userId,
        };
        if (args.content) payload.content = args.content;
        const { data: deliv, error } = await db.from("creative_deliverables").insert(payload).select("id").single();
        if (error) throw error;
        // Se veio conteúdo, cria também a versão 1 no histórico
        if (args.content && deliv?.id) {
          await db.from("creative_deliverable_versions").insert({
            client_id: clientId,
            deliverable_id: deliv.id,
            version_number: 1,
            content: args.content as string,
            created_by: userId,
          });
        }
        return { success: true, message: `Entregável "${args.title}" (${args.type}) criado com status ${status}.` };
      }

      case "update_demand_status": {
        const status = args.status as string;
        if (status === "approved") {
          return { success: false, message: "Aprovação só pelo Ponto Focal via UI em /cliente/criativos." };
        }
        const { data: existing } = await db
          .from("creative_demands")
          .select("id, client_id, title")
          .eq("id", args.demand_id as string)
          .maybeSingle();
        if (!existing || existing.client_id !== clientId) {
          return { success: false, message: "Demanda não encontrada ou não pertence a este cliente." };
        }
        const { error } = await db
          .from("creative_demands")
          .update({ status })
          .eq("id", args.demand_id as string);
        if (error) throw error;
        return { success: true, message: `Demanda "${existing.title}" movida para "${status}".` };
      }

      case "update_deliverable_status": {
        const status = args.status as string;
        if (status === "approved") {
          return { success: false, message: "Aprovação só pelo Ponto Focal via UI em /cliente/criativos." };
        }
        const { data: existing } = await db
          .from("creative_deliverables")
          .select("id, client_id, title")
          .eq("id", args.deliverable_id as string)
          .maybeSingle();
        if (!existing || existing.client_id !== clientId) {
          return { success: false, message: "Entregável não encontrado ou não pertence a este cliente." };
        }
        const updatePayload: Record<string, unknown> = { status };
        if (args.feedback) updatePayload.feedback = args.feedback;
        const { error } = await db
          .from("creative_deliverables")
          .update(updatePayload)
          .eq("id", args.deliverable_id as string);
        if (error) throw error;
        return { success: true, message: `Entregável "${existing.title}" movido para "${status}".` };
      }

      case "add_deliverable_version": {
        const { data: existing } = await db
          .from("creative_deliverables")
          .select("id, client_id, title, current_version")
          .eq("id", args.deliverable_id as string)
          .maybeSingle();
        if (!existing || existing.client_id !== clientId) {
          return { success: false, message: "Entregável não encontrado ou não pertence a este cliente." };
        }
        const newVersion = ((existing.current_version as number) || 0) + 1;
        const { error: vErr } = await db.from("creative_deliverable_versions").insert({
          client_id: clientId,
          deliverable_id: args.deliverable_id as string,
          version_number: newVersion,
          content: args.content as string,
          notes: (args.notes as string) || null,
          created_by: userId,
        });
        if (vErr) throw vErr;
        const { error: uErr } = await db
          .from("creative_deliverables")
          .update({ current_version: newVersion, content: args.content as string })
          .eq("id", args.deliverable_id as string);
        if (uErr) throw uErr;
        return { success: true, message: `Versão v${newVersion} adicionada ao entregável "${existing.title}".` };
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

      case "list_keywords": {
        const limit = Math.min(Math.max(Number(args.limit) || 30, 1), 100);
        const filter = (args.filter as string)?.trim().toLowerCase();
        let q = db.from("keywords")
          .select("id, term, intent, search_volume, difficulty, cpc, current_position, status, cluster_id, target_url, tags")
          .eq("client_id", clientId)
          .order("search_volume", { ascending: false, nullsFirst: false })
          .limit(limit);
        if (filter && ["target", "ranking", "opportunity", "archived"].includes(filter)) {
          q = q.eq("status", filter);
        } else if (filter) {
          q = q.ilike("term", `%${filter}%`);
        }
        const { data: kws, error: kwErr } = await q;
        if (kwErr) throw kwErr;
        const { data: clusters } = await db.from("keyword_clusters")
          .select("id, name, intent, pillar_url")
          .eq("client_id", clientId);
        const list = (kws || []) as Array<Record<string, unknown>>;
        if (list.length === 0) return { success: true, message: "Nenhuma keyword cadastrada para esse cliente ainda." };
        let msg = `Encontradas ${list.length} keyword(s):\n`;
        for (const k of list) {
          const sid = String(k.id).slice(0, 8);
          const vol = k.search_volume ?? "?";
          const dif = k.difficulty ?? "?";
          const pos = k.current_position ?? "—";
          msg += `- \`${sid}\` **${k.term}** [${k.intent}] vol=${vol} dif=${dif} pos=${pos} • status=${k.status}\n`;
        }
        if (clusters && clusters.length > 0) {
          msg += `\nClusters: ${clusters.map((c) => `\`${String(c.id).slice(0,8)}\` ${c.name}`).join(" • ")}`;
        }
        return { success: true, message: msg };
      }

      case "create_keyword": {
        const term = (args.term as string)?.trim();
        if (!term) return { success: false, message: "term é obrigatório." };
        const payload: Record<string, unknown> = {
          client_id: clientId,
          term,
          intent: (args.intent as string) || "informational",
          status: (args.status as string) || "target",
          created_by: userId,
        };
        for (const key of ["search_volume", "difficulty", "cpc", "target_url", "cluster_id", "notes"]) {
          if (args[key] !== undefined && args[key] !== null && args[key] !== "") payload[key] = args[key];
        }
        if (Array.isArray(args.tags)) payload.tags = args.tags;
        const { data, error } = await db.from("keywords").insert(payload).select("id").single();
        if (error) throw error;
        return { success: true, message: `Keyword "${term}" cadastrada (id: ${String(data?.id).slice(0, 8)}).` };
      }

      case "update_keyword": {
        const keywordId = args.keyword_id as string;
        if (!keywordId) return { success: false, message: "keyword_id é obrigatório." };
        const payload: Record<string, unknown> = {};
        for (const key of ["term", "intent", "search_volume", "difficulty", "cpc", "current_position", "target_url", "cluster_id", "campaign_id", "task_id", "status", "notes"]) {
          if (args[key] !== undefined) payload[key] = args[key];
        }
        if (Array.isArray(args.tags)) payload.tags = args.tags;
        if (Object.keys(payload).length === 0) return { success: false, message: "Nenhum campo para atualizar." };
        const { error } = await db.from("keywords").update(payload).eq("id", keywordId).eq("client_id", clientId);
        if (error) throw error;
        return { success: true, message: `Keyword \`${keywordId.slice(0, 8)}\` atualizada (${Object.keys(payload).join(", ")}).` };
      }

      case "create_keyword_cluster": {
        const name = (args.name as string)?.trim();
        if (!name) return { success: false, message: "name é obrigatório." };
        const payload: Record<string, unknown> = {
          client_id: clientId,
          name,
          created_by: userId,
        };
        for (const key of ["intent", "pillar_url", "description"]) {
          if (args[key] !== undefined && args[key] !== null && args[key] !== "") payload[key] = args[key];
        }
        const { data, error } = await db.from("keyword_clusters").insert(payload).select("id").single();
        if (error) throw error;
        return { success: true, message: `Cluster "${name}" criado (id: ${String(data?.id).slice(0, 8)}).` };
      }

      case "record_keyword_ranking": {
        const keywordId = args.keyword_id as string;
        const position = Number(args.position);
        if (!keywordId || !Number.isFinite(position)) return { success: false, message: "keyword_id e position são obrigatórios." };
        const { error: rErr } = await db.from("keyword_rankings").insert({
          client_id: clientId,
          keyword_id: keywordId,
          position,
          notes: (args.notes as string) || null,
          source: (args.source as string) || "manual",
        });
        if (rErr) throw rErr;
        // Update current_position + status (auto-promote to ranking se 1-100)
        const updatePayload: Record<string, unknown> = { current_position: position };
        if (position >= 1 && position <= 100) updatePayload.status = position <= 10 ? "ranking" : "ranking";
        const { error: uErr } = await db.from("keywords")
          .update(updatePayload)
          .eq("id", keywordId)
          .eq("client_id", clientId);
        if (uErr) throw uErr;
        return { success: true, message: `Ranking registrado: keyword \`${keywordId.slice(0, 8)}\` na posição ${position}.` };
      }

      case "analyze_keyword_opportunities": {
        const { data: kws, error: kwErr } = await db.from("keywords")
          .select("id, term, intent, search_volume, difficulty, current_position, status, cluster_id, target_url")
          .eq("client_id", clientId)
          .neq("status", "archived")
          .limit(200);
        if (kwErr) throw kwErr;
        const list = (kws || []) as Array<{
          id: string; term: string; intent: string | null;
          search_volume: number | null; difficulty: number | null;
          current_position: number | null; status: string; cluster_id: string | null; target_url: string | null;
        }>;
        if (list.length === 0) return { success: true, message: "Nenhuma keyword cadastrada para analisar." };

        const quickWins = list.filter((k) => k.current_position && k.current_position >= 11 && k.current_position <= 20)
          .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)).slice(0, 10);
        const articleCandidates = list.filter((k) => !k.current_position && (k.search_volume || 0) >= 100 && (k.difficulty ?? 100) <= 40)
          .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)).slice(0, 10);
        const adsCandidates = list.filter((k) => (k.intent === "transactional" || k.intent === "commercial") && (!k.current_position || k.current_position > 10))
          .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)).slice(0, 10);
        const noClusterHighVol = list.filter((k) => !k.cluster_id && (k.search_volume || 0) >= 200)
          .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0)).slice(0, 8);

        let msg = `## Análise de oportunidades SEO (${list.length} keywords)\n\n`;
        if (quickWins.length > 0) {
          msg += `### ⚡ Quick Wins (pos 11-20 — empurrar pra primeira página)\n`;
          for (const k of quickWins) msg += `- \`${k.id.slice(0,8)}\` **${k.term}** — pos ${k.current_position}, vol ${k.search_volume || "?"}, dif ${k.difficulty ?? "?"}\n`;
          msg += "\n";
        }
        if (articleCandidates.length > 0) {
          msg += `### 📝 Candidatas a artigo de blog (sem ranking, alto vol, baixa dif)\n`;
          for (const k of articleCandidates) msg += `- \`${k.id.slice(0,8)}\` **${k.term}** — vol ${k.search_volume}, dif ${k.difficulty ?? "?"}\n`;
          msg += "\n";
        }
        if (adsCandidates.length > 0) {
          msg += `### 💰 Candidatas a Google Ads (intenção comercial, fora do top 10)\n`;
          for (const k of adsCandidates) msg += `- \`${k.id.slice(0,8)}\` **${k.term}** [${k.intent}] — pos ${k.current_position || "—"}, vol ${k.search_volume || "?"}\n`;
          msg += "\n";
        }
        if (noClusterHighVol.length > 0) {
          msg += `### 🧩 Gap: keywords sem cluster (alto volume — agrupar em pillars)\n`;
          for (const k of noClusterHighVol) msg += `- \`${k.id.slice(0,8)}\` **${k.term}** — vol ${k.search_volume}\n`;
          msg += "\n";
        }
        if (quickWins.length === 0 && articleCandidates.length === 0 && adsCandidates.length === 0 && noClusterHighVol.length === 0) {
          msg += "_Nenhuma oportunidade evidente com os dados atuais. Considere importar volume/dificuldade de Semrush, Ahrefs ou Keyword Planner para enriquecer a análise._";
        }
        return { success: true, message: msg };
      }

      case "bulk_create_keywords": {
        const items = Array.isArray(args.items) ? (args.items as Array<Record<string, unknown>>) : [];
        if (items.length === 0) return { success: false, message: "items é obrigatório (array de keywords)." };
        if (items.length > 50) return { success: false, message: "Máx. 50 keywords por chamada." };
        const rows: Array<Record<string, unknown>> = [];
        for (const it of items) {
          const term = (it.term as string)?.trim();
          if (!term) continue;
          const row: Record<string, unknown> = {
            client_id: clientId,
            term,
            intent: (it.intent as string) || "informational",
            status: (it.status as string) || "target",
            created_by: userId,
          };
          for (const k of ["search_volume", "difficulty", "cpc", "target_url", "cluster_id", "notes"]) {
            if (it[k] !== undefined && it[k] !== null && it[k] !== "") row[k] = it[k];
          }
          if (Array.isArray(it.tags)) row.tags = it.tags;
          rows.push(row);
        }
        if (rows.length === 0) return { success: false, message: "Nenhum item válido (term faltando)." };
        const { data, error } = await db.from("keywords").insert(rows).select("id, term");
        if (error) throw error;
        const created = (data || []) as Array<{ id: string; term: string }>;
        return { success: true, message: `${created.length} keyword(s) cadastrada(s):\n${created.map((k) => `- \`${String(k.id).slice(0,8)}\` ${k.term}`).join("\n")}` };
      }

      case "delete_keyword": {
        const keywordId = args.keyword_id as string;
        if (!keywordId) return { success: false, message: "keyword_id é obrigatório." };
        const mode2 = (args.mode as string) || "archive";
        if (mode2 === "hard") {
          const { error } = await db.from("keywords").delete().eq("id", keywordId).eq("client_id", clientId);
          if (error) throw error;
          return { success: true, message: `Keyword \`${keywordId.slice(0, 8)}\` excluída definitivamente.` };
        }
        const { error } = await db.from("keywords").update({ status: "archived" }).eq("id", keywordId).eq("client_id", clientId);
        if (error) throw error;
        return { success: true, message: `Keyword \`${keywordId.slice(0, 8)}\` arquivada (status=archived). Histórico preservado.` };
      }

      case "update_keyword_cluster": {
        const clusterId = args.cluster_id as string;
        if (!clusterId) return { success: false, message: "cluster_id é obrigatório." };
        const payload: Record<string, unknown> = {};
        for (const key of ["name", "intent", "pillar_url", "description"]) {
          if (args[key] !== undefined && args[key] !== null) payload[key] = args[key];
        }
        if (Object.keys(payload).length === 0) return { success: false, message: "Nenhum campo para atualizar." };
        const { error } = await db.from("keyword_clusters").update(payload).eq("id", clusterId).eq("client_id", clientId);
        if (error) throw error;
        return { success: true, message: `Cluster \`${clusterId.slice(0, 8)}\` atualizado (${Object.keys(payload).join(", ")}).` };
      }

      case "search_documents": {
        const query = (args.query as string)?.trim();
        if (!query) return { success: false, message: "Forneça uma query para buscar." };
        const topK = Math.min(Math.max(Number(args.top_k) || 5, 1), 10);

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) return { success: false, message: "LOVABLE_API_KEY não configurada." };

        // Generate query embedding
        let embedding: number[];
        try {
          const embRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/text-embedding-004",
              input: query,
            }),
          });
          if (!embRes.ok) {
            const t = await embRes.text();
            return { success: false, message: `Falha ao gerar embedding: ${embRes.status} ${t.slice(0,200)}` };
          }
          const embData = await embRes.json();
          embedding = embData?.data?.[0]?.embedding;
          if (!Array.isArray(embedding)) return { success: false, message: "Resposta de embedding inválida." };
        } catch (e) {
          return { success: false, message: `Erro de embedding: ${e instanceof Error ? e.message : String(e)}` };
        }

        // Call match_document_chunks RPC
        const { data: matches, error: matchErr } = await db.rpc("match_document_chunks", {
          query_embedding: JSON.stringify(embedding),
          target_client_id: clientId,
          match_count: topK,
          similarity_threshold: 0.4,
        });

        if (matchErr) {
          return { success: false, message: `Erro na busca vetorial: ${matchErr.message}` };
        }

        const results = (matches || []) as Array<{
          chunk_id: string;
          file_id: string;
          file_name: string;
          content: string;
          page_number: number | null;
          similarity: number;
        }>;

        if (results.length === 0) {
          return { success: true, message: `Nenhum trecho relevante encontrado para "${query}". Os arquivos podem não ter sido indexados — peça ao usuário para clicar em "Tornar pesquisável" nos arquivos relevantes.` };
        }

        let formatted = `Encontrados ${results.length} trecho(s) relevantes para "${query}":\n\n`;
        for (const r of results) {
          const sim = (r.similarity * 100).toFixed(1);
          const pg = r.page_number ? ` (pág ${r.page_number})` : "";
          formatted += `**${r.file_name}**${pg} — ${sim}% similaridade\n${r.content.slice(0, 1200)}\n\n---\n\n`;
        }
        return { success: true, message: formatted };
      }

      case "send_campaign_approval_email": {
        if (mode === "client") {
          return { success: false, message: "Ação restrita à equipe interna." };
        }
        // 1. Selecionar campanhas
        let campaignsQuery = db
          .from("campaigns")
          .select("id, name, approved_by_ponto_focal, status")
          .eq("client_id", clientId);
        const ids = Array.isArray(args.campaign_ids) ? (args.campaign_ids as string[]) : null;
        if (ids && ids.length > 0) {
          campaignsQuery = campaignsQuery.in("id", ids);
        } else {
          campaignsQuery = campaignsQuery
            .eq("status", "pending_approval")
            .eq("approved_by_ponto_focal", false);
        }
        const { data: camps, error: campErr } = await campaignsQuery;
        if (campErr) throw campErr;
        const targetCamps = (camps || []).filter((c: any) => !c.approved_by_ponto_focal);
        if (targetCamps.length === 0) {
          return { success: false, message: "Nenhuma campanha pendente de aprovação encontrada para este cliente." };
        }

        // 2. Resolver destinatários: ponto focal + gestores (+ todos os usuários se pedido)
        const includeAll = args.include_all_client_users === true;
        const profileSelect = "email, full_name, ponto_focal, user_type";
        let profilesQuery = db.from("profiles").select(profileSelect).eq("client_id", clientId);
        if (!includeAll) {
          profilesQuery = profilesQuery.or("ponto_focal.eq.true,user_type.eq.manager");
        }
        const { data: profiles, error: profErr } = await profilesQuery;
        if (profErr) throw profErr;
        const recipientSet = new Set<string>();
        for (const p of (profiles || []) as any[]) {
          if (p?.email) recipientSet.add(String(p.email).toLowerCase());
        }
        if (recipientSet.size === 0) {
          return { success: false, message: "Não encontrei e-mails de Ponto Focal/Gestor cadastrados para este cliente. Cadastre os usuários antes." };
        }

        // 3. Disparar via notify-email para cada campanha (template oficial já existente)
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sendOne = async (campaignName: string) => {
          try {
            const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                apikey: SUPABASE_SERVICE_ROLE_KEY,
              },
              body: JSON.stringify({
                event_type: "campaign_pending_approval",
                client_id: clientId,
                campaign_name: campaignName,
              }),
            });
            return res.ok;
          } catch (e) {
            console.error("notify-email failed:", e);
            return false;
          }
        };
        let okCount = 0;
        for (const c of targetCamps as any[]) {
          const ok = await sendOne(c.name);
          if (ok) okCount += 1;
        }
        if (okCount === 0) {
          return { success: false, message: "Falha ao disparar os e-mails de aprovação. Verifique os logs do notify-email." };
        }
        const campNames = targetCamps.map((c: any) => `• ${c.name}`).join("\n");
        return {
          success: true,
          message: `📧 E-mail enviado para ${recipientSet.size} destinatário(s) (Ponto Focal/Gestor${includeAll ? " + usuários do cliente" : ""}) avisando sobre ${okCount}/${targetCamps.length} campanha(s) aguardando aprovação:\n${campNames}`,
        };
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
      convRes, creativeDemandsRes, creativeDeliverablesRes,
      projectsRes, learningsRes,
      keywordsRes, keywordClustersRes,
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
      db.from("creative_demands")
        .select("id, title, status, platform, format, deadline, priority, objective")
        .eq("client_id", client_id)
        .order("created_at", { ascending: false })
        .limit(15),
      db.from("creative_deliverables")
        .select("id, demand_id, title, type, status, current_version, approved_by_ponto_focal")
        .eq("client_id", client_id)
        .neq("status", "delivered")
        .order("created_at", { ascending: false })
        .limit(40),
      db.from("projects")
        .select("id, name, status, start_date, end_date, budget, description")
        .eq("client_id", client_id)
        .order("created_at", { ascending: false })
        .limit(10),
      db.from("learnings")
        .select("id, title, impact, category, project_id, approved_by_ponto_focal, created_at")
        .eq("client_id", client_id)
        .order("created_at", { ascending: false })
        .limit(8),
      db.from("keywords")
        .select("id, term, intent, search_volume, difficulty, current_position, status, cluster_id")
        .eq("client_id", client_id)
        .neq("status", "archived")
        .order("search_volume", { ascending: false, nullsFirst: false })
        .limit(20),
      db.from("keyword_clusters")
        .select("id, name, intent, pillar_url")
        .eq("client_id", client_id)
        .order("created_at", { ascending: false })
        .limit(20),
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
    const creativeDemands = creativeDemandsRes.data || [];
    const creativeDeliverables = creativeDeliverablesRes.data || [];
    const projects = projectsRes.data || [];
    const learnings = learningsRes.data || [];
    const keywords = keywordsRes.data || [];
    const keywordClusters = keywordClustersRes.data || [];

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
      if (plan.funnel_strategy) context += `- Estratégia de Funil: ${typeof plan.funnel_strategy === "string" ? plan.funnel_strategy : JSON.stringify(plan.funnel_strategy)}\n`;
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

    if (creativeDemands.length > 0) {
      context += `## 🎨 Demandas Criativas (${creativeDemands.length})\n`;
      for (const d of creativeDemands) {
        const dlv = creativeDeliverables.filter((x) => x.demand_id === d.id);
        const meta: string[] = [];
        if (d.format) meta.push(d.format as string);
        if (d.platform) meta.push(d.platform as string);
        if (d.deadline) meta.push(`prazo ${d.deadline}`);
        if (d.priority) meta.push(`prio: ${d.priority}`);
        const metaStr = meta.length ? ` (${meta.join(", ")})` : "";
        context += `- \`${String(d.id).slice(0,8)}\` [${d.status}] **${d.title}**${metaStr}\n`;
        if (dlv.length > 0) {
          for (const x of dlv) {
            const appr = x.approved_by_ponto_focal ? " ✅" : "";
            context += `   └ \`${String(x.id).slice(0,8)}\` [${x.status}] ${x.title} (${x.type}, v${x.current_version})${appr}\n`;
          }
        }
      }
      context += "\n";
    }

    if (projects.length > 0) {
      context += `## 📦 Projetos (${projects.length})\n`;
      for (const p of projects) {
        const linkedTasks = tasks.filter((t: any) => (t as any).project_id === p.id);
        const doneTasks = linkedTasks.filter((t: any) => t.status === "completed" || t.status === "done").length;
        const linkedCamps = campaigns.filter((c: any) => (c as any).project_id === p.id).length;
        const linkedLearn = learnings.filter((l: any) => l.project_id === p.id).length;
        const period = p.start_date ? `${p.start_date}${p.end_date ? ` → ${p.end_date}` : ""}` : "—";
        const budget = p.budget ? `R$${Number(p.budget).toLocaleString("pt-BR")}` : "—";
        context += `- \`${String(p.id).slice(0,8)}\` [${p.status || "—"}] **${p.name}** — ${budget} (${period})\n`;
        if (p.description) context += `   └ hipótese: ${String(p.description).slice(0, 160)}\n`;
        context += `   └ tarefas: ${linkedTasks.length} (${doneTasks} concluídas) • campanhas: ${linkedCamps} • aprendizados: ${linkedLearn}\n`;
      }
      context += "\n";
    }

    if (learnings.length > 0) {
      context += `## 🎓 Aprendizados Recentes (${learnings.length})\n`;
      for (const l of learnings) {
        const d = l.created_at ? new Date(l.created_at as string).toLocaleDateString("pt-BR") : "";
        const appr = l.approved_by_ponto_focal ? " ✅ aprovado" : " ⏳ aguardando aprovação";
        const cat = l.category ? `[${l.category}] ` : "";
        const proj = l.project_id ? ` • projeto \`${String(l.project_id).slice(0,8)}\`` : "";
        context += `- \`${String(l.id).slice(0,8)}\` (${d}) ${cat}**${l.title}**${appr}${proj}\n`;
        if (l.impact) context += `   └ impacto: ${String(l.impact).slice(0, 160)}\n`;
      }
      context += "\n";
    }

    if (keywords.length > 0 || keywordClusters.length > 0) {
      context += `## 🔑 Palavras-chave & SEO\n`;
      if (keywords.length > 0) {
        const top = keywords.slice(0, 10) as Array<Record<string, unknown>>;
        context += `Top ${top.length} keywords ativas (de ${keywords.length}):\n`;
        for (const k of top) {
          const sid = String(k.id).slice(0, 8);
          const vol = k.search_volume ?? "?";
          const dif = k.difficulty ?? "?";
          const pos = k.current_position ?? "—";
          context += `- \`${sid}\` **${k.term}** [${k.intent}] vol=${vol} dif=${dif} pos=${pos} • ${k.status}\n`;
        }
      }
      if (keywordClusters.length > 0) {
        context += `\nClusters (${keywordClusters.length}):\n`;
        for (const c of keywordClusters) {
          const count = (keywords as Array<Record<string, unknown>>).filter((k) => k.cluster_id === c.id).length;
          context += `- \`${String(c.id).slice(0,8)}\` **${c.name}**${c.intent ? ` [${c.intent}]` : ""} → ${count} keyword(s)\n`;
        }
      }
      context += `\nStatus: target / ranking / opportunity / archived\n\n`;
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
        `7. Em ambiguidade, assuma ESTRATEGISTA (mais útil por padrão).\n` +
        `8. NUNCA afirme que executou uma ação se não houve uma tool call real bem-sucedida nesta resposta. Para AVISO POR E-MAIL DE CAMPANHAS AGUARDANDO APROVAÇÃO use a tool send_campaign_approval_email (template oficial). Para WhatsApp, publicação em plataforma externa, ou qualquer ação fora das tools listadas, diga claramente: "ainda não tenho essa ação disponível por aqui — registre como tarefa que eu crio agora" e ofereça criar via create_task.\n\n` +
        `## Ferramentas disponíveis (use principalmente no modo EXECUTOR)\n` +
        `Quando a ação for clara e acionável, EXECUTE imediatamente via tool call:\n` +
        `- **create_appointment**: Agendar reuniões/calls.\n` +
        `- **create_task**: Criar tarefas com prioridade e prazo.\n` +
        `- **upsert_traffic_metrics**: Registrar/atualizar métricas mensais.\n` +
        `- **create_campaign**: Estruturar campanhas técnicas (use briefing + plano + métricas para targeting, budget, copy, bidding). Nomenclatura: [Plataforma] Objetivo - Público - Período. Status: draft.\n` +
        `- **create_project**: Criar projetos como ONDAS DE EXECUÇÃO (description = HIPÓTESE/OBJETIVO).\n` +
        `- **create_strategic_plan**: Gera plano estratégico EDITORIAL e PROFUNDO. NÃO crie planos rasos. Mínimo OBRIGATÓRIO: sumário executivo, diagnóstico (situação + 3 oportunidades + 3 riscos + concorrência), 3+ personas profundas (demografia, dores, desejos, objeções, canais, mensagem-chave), 5+ objetivos SMART numéricos com baseline/meta/prazo, 6+ KPIs categorizados (aquisição/conversão/retenção), funil estruturado em topo/meio/fundo (goal, canais, criativos, KPI, % budget), alocação de budget por canal e por etapa, plano de execução com 3 ondas (90 dias, entregas e marcos) e governança (cadência, relatórios, ferramentas). Use SEMPRE briefing, métricas históricas, segmento e contexto real. Linguagem profissional de consultoria sênior.\n` +
        `- **create_briefing**: Estruturar briefing (nicho, público, objetivos, diferenciais, concorrentes, budget).\n\n` +
        `## 📦 Projetos & Aprendizados (ondas de execução do plano)\n` +
        `- **list_projects**: liste antes de agir para obter o UUID correto.\n` +
        `- **update_project**: mover status (planning/active/paused/completed), refinar hipótese (description), ajustar datas/budget.\n` +
        `- **link_task_to_project** / **link_campaign_to_project**: amarra entregas (tasks/campaigns) à onda certa. Use IDs do contexto.\n` +
        `- **create_learning**: registra hipótese validada/invalidada com impacto + categoria + tags. Sempre vinculado a um project_id.\n` +
        `- **update_learning**: edita texto/tags. NUNCA marque como aprovado — só o Ponto Focal aprova pela UI em /admin/projetos.\n\n` +
        `## 🎨 Demandas Criativas (orquestração de produção)\n` +
        `- **create_creative_demand**: Cria a demanda (briefing pai). Use ao iniciar uma produção (vídeo, copy, arte, enxoval).\n` +
        `- **create_creative_deliverable**: Cria entregáveis vinculados (video_copy, static_copy, video, image, media_kit). Pode já incluir o conteúdo textual.\n` +
        `- **update_demand_status** / **update_deliverable_status**: Move pelo fluxo briefing → in_production → in_approval → adjustments → delivered.\n` +
        `- **add_deliverable_version**: Quando o admin ditar uma copy/roteiro novo no chat, persista como versão (incrementa current_version).\n` +
        `- ⚠️ NUNCA marque status 'approved' — aprovação é exclusiva do Ponto Focal pela UI em /cliente/criativos.\n\n` +
        `## 🔑 Palavras-chave & SEO\n` +
        `- **list_keywords**: lê keywords + clusters do cliente (use ANTES de update/record_ranking pra obter o UUID).\n` +
        `- **create_keyword** / **update_keyword**: gerencia termo, intenção, posição, vínculos com cluster/campanha/tarefa.\n` +
        `- **bulk_create_keywords**: cadastra várias de uma vez (até 50) — use quando o usuário ditar lista.\n` +
        `- **delete_keyword**: arquiva (padrão, preserva histórico) ou exclui definitivamente (mode='hard').\n` +
        `- **create_keyword_cluster** / **update_keyword_cluster**: agrupa em pillars de conteúdo (1 cluster = 1 pillar + N satélites).\n` +
        `- **record_keyword_ranking**: registra ponto histórico de posição (alimenta sparkline) E atualiza current_position.\n` +
        `- **analyze_keyword_opportunities**: cruza volume × dificuldade × posição → quick wins, candidatas a artigo, candidatas a Ads, gaps por cluster.\n` +
        `- ⚠️ NUNCA invente volume/dificuldade/CPC — se o admin não informar, deixe nulo e oriente importar de Semrush/Ahrefs/Keyword Planner via /admin/keywords.\n\n` +
        `- **read_file**: Lê o conteúdo de um PDF/TXT/MD/CSV/JSON do cliente. Use APENAS quando pedido explicitamente ("analisa o PDF", "resume o briefing", "lê esse arquivo"). Identifique pelo \`id\` da lista de Arquivos do contexto (preferencial) ou pelo nome.\n\n` +
        `## 🔍 Busca documental (RAG)\n` +
        `- **search_documents**: busca semântica nos arquivos JÁ INDEXADOS do cliente (PDF, DOCX, TXT, MD, CSV, JSON, HTML, **XLSX/XLS** e **PPTX**). Use quando o usuário perguntar sobre conteúdo de arquivos/briefings/contratos/planilhas/decks OU pedir resumo de um tópico que pode estar nos documentos. Mais econômico que read_file (retorna só os trechos relevantes). NÃO chame se a resposta já está no contexto operacional acima.\n\n` +
        `## Memória de longo prazo (use com critério)\n` +
        `- **log_decision**: registre quando o usuário FECHAR uma decisão relevante (não use em conversas casuais).\n` +
        `- **record_insight**: no MODO AUDITOR, ao identificar oportunidade/risco/diagnóstico com evidência real, persista para validação posterior.\n` +
        `- **set_conversation_state**: atualize tópico/objetivo/pendências quando o foco mudar.\n\n` +
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
        `## 🎨 Demandas Criativas\n` +
        `Você pode CRIAR uma nova demanda criativa quando o cliente pedir produção de conteúdo (vídeo, copy, post, arte, enxoval). Use a tool **request_creative_demand** com título, formato, plataforma e prazo. Se faltar informação básica (formato/prazo), faça UMA pergunta curta antes.\n` +
        `⚠️ NUNCA aprove ou rejeite entregáveis pelo chat — a aprovação é exclusiva do Ponto Focal via UI. Se o cliente pedir aprovação, oriente: "abra a demanda em /cliente/criativos para aprovar com seu clique (preserva auditoria)".\n` +
        `Você pode listar e resumir o status das demandas existentes a partir do contexto acima.\n\n` +
        `## 🔑 Palavras-chave & SEO (controle total)\n` +
        `Você pode operar a seção de Palavras-Chave do cliente em /cliente/keywords sob pedido. Quando o cliente pedir, use as tools:\n` +
        `- **list_keywords**: mostra termos monitorados (use ANTES de update/record/delete pra pegar o UUID curto).\n` +
        `- **create_keyword** / **bulk_create_keywords**: cadastra um termo ou uma lista (até 50). NUNCA invente volume/dificuldade/CPC — só preencha se o cliente disser; caso contrário deixe nulo.\n` +
        `- **update_keyword**: muda status, intenção, posição, URL alvo, cluster, tags, notas.\n` +
        `- **delete_keyword**: padrão arquiva (preserva histórico). Só use mode='hard' se o cliente pedir 'apaga de vez'.\n` +
        `- **create_keyword_cluster** / **update_keyword_cluster**: organiza em pillars (1 pillar + N satélites).\n` +
        `- **record_keyword_ranking**: registra posição nova ('a keyword X subiu pra Y') — alimenta o gráfico histórico.\n` +
        `- **analyze_keyword_opportunities**: roda análise completa — quick wins, candidatas a blog, candidatas a Google Ads, gaps por cluster. Use quando o cliente pedir 'analisa minhas palavras-chave', 'onde focar', 'quick wins', 'oportunidades de SEO'.\n\n` +
        `## 🔍 Busca em arquivos (RAG)\n` +
        `- **search_documents**: busca semântica nos arquivos do cliente já indexados (PDF, DOCX, TXT, CSV, **planilhas XLSX/XLS** e **apresentações PPTX** inclusive). Use quando o cliente perguntar sobre o conteúdo de algum arquivo, planilha de métricas ou deck/apresentação que ele subiu. Para indexar um arquivo novo, oriente abrir /cliente/arquivos e clicar em "🧠 Tornar pesquisável pelo Linkouzinho".\n\n` +
        `${context}` +
        `Responda APENAS com base nos dados acima. Se não tiver dados suficientes, diga claramente.`;
    }

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...sanitizeHistory(messages).slice(-16),
    ];

    // ── Decide: tool calling (admin) or direct streaming ───────────────
    const activeTools = mode === "admin"
      ? [...adminTools, ...memoryTools]
      : clientTools;

    {
      // Step 1: Non-streaming call with tools to check for tool_calls
      const firstResponse = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: allMessages,
          tools: activeTools,
          tool_choice: "auto",
          stream: false,
        }),
      }, 60000).catch((e) => {
        console.error("AI gateway fetch error (step1):", e);
        return null as unknown as Response;
      });

      if (!firstResponse) {
        return sseFromText("⚠️ A IA demorou demais para responder. Tente novamente em alguns segundos.");
      }

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
        const stateUpdates: Record<string, unknown> = {};
        let lastActionForState: Record<string, unknown> | null = null;

        for (const tc of choice.message.tool_calls) {
          const fnName = tc.function.name;
          let fnArgs: Record<string, unknown> = {};
          try {
            fnArgs = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
          } catch {
            fnArgs = {};
          }

          const result = await executeTool(db, fnName, fnArgs, client_id, userId, mode);
          toolMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });

          // Persist action log (skip pure state updates to avoid noise)
          if (fnName !== "set_conversation_state") {
            try {
              await db.from("client_actions").insert({
                client_id,
                action_type: fnName,
                payload: fnArgs,
                executed_by: userId,
                status: result.success ? "success" : "failed",
                error_message: result.success ? null : result.message.slice(0, 500),
              });
            } catch (e) {
              console.error("Failed to log client_action:", e);
            }
          }

          // Track state changes
          if (fnName === "set_conversation_state") {
            if (fnArgs.current_topic) stateUpdates.current_topic = fnArgs.current_topic;
            if (fnArgs.current_objective) stateUpdates.current_objective = fnArgs.current_objective;
            if (fnArgs.pending_items) stateUpdates.pending_items = fnArgs.pending_items;
          }
          if (result.success) {
            lastActionForState = {
              tool: fnName,
              params: fnArgs,
              result: result.message,
              created_at: new Date().toISOString(),
            };
          }
        }

        // Upsert conversation state
        if (Object.keys(stateUpdates).length > 0 || lastActionForState) {
          try {
            const upsertPayload: Record<string, unknown> = {
              user_id: userId,
              client_id,
              mode,
              current_client_id: client_id,
              state_updated_at: new Date().toISOString(),
              ...stateUpdates,
            };
            if (lastActionForState) upsertPayload.last_action = lastActionForState;
            await db.from("assistant_conversations").upsert(
              upsertPayload,
              { onConflict: "user_id,client_id,mode" }
            );
          } catch (e) {
            console.error("Failed to upsert conversation state:", e);
          }
        }

        // Step 2: Stream the final response with tool results.
        // Importante: NÃO enviar tools nessa etapa (evita loops e respostas vazias).
        const finalMessages = [
          ...allMessages,
          choice.message, // assistant message with tool_calls
          ...toolMessages,
        ];

        const streamResponse = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: finalMessages,
            stream: false,
            tool_choice: "none",
          }),
        }, 60000).catch((e) => {
          console.error("AI gateway fetch error (step2):", e);
          return null as unknown as Response;
        });

        // Fallback determinístico: se o modelo falhar/vier vazio, montamos a confirmação
        // a partir do resultado real das tools executadas. Assim o usuário NUNCA fica sem retorno.
        const buildFallbackSummary = () => {
          const lines: string[] = [];
          for (const tm of toolMessages) {
            try {
              const parsed = JSON.parse(tm.content);
              const ok = parsed?.success ? "✅" : "⚠️";
              const msg = String(parsed?.message || "").slice(0, 600);
              if (msg) lines.push(`${ok} ${msg}`);
            } catch {
              /* ignore */
            }
          }
          if (lines.length === 0) {
            return "Ação processada, mas não consegui montar uma confirmação detalhada agora. Tente perguntar novamente.";
          }
          return lines.join("\n\n");
        };

        if (!streamResponse || !streamResponse.ok) {
          if (streamResponse) {
            const t = await streamResponse.text().catch(() => "");
            console.error("AI gateway error (step2):", streamResponse.status, t);
          }
          return sseFromText(buildFallbackSummary());
        }

        // Lê resposta não-stream e cai no fallback se vier vazia / com erro de tool
        let finalText = "";
        try {
          const data = await streamResponse.json();
          finalText = data?.choices?.[0]?.message?.content || "";
          const fr = data?.choices?.[0]?.finish_reason || data?.choices?.[0]?.native_finish_reason;
          if (
            !finalText.trim() ||
            fr === "error" ||
            fr === "MALFORMED_FUNCTION_CALL" ||
            fr === "content_filter"
          ) {
            finalText = buildFallbackSummary();
          }
        } catch (e) {
          console.error("step2 parse error:", e);
          finalText = buildFallbackSummary();
        }
        return sseFromText(finalText);
      }

      // No tool calls → the model responded with text. Stream it back.
      // Since we already have the full response, we convert it to an SSE stream.
      const content =
        choice?.message?.content ||
        "Não consegui gerar uma resposta dessa vez. Tente reformular o pedido ou enviar de novo em alguns segundos.";
      const fr0 = choice?.finish_reason || choice?.native_finish_reason;
      const safe =
        !content?.trim() || fr0 === "error" || fr0 === "MALFORMED_FUNCTION_CALL" || fr0 === "content_filter"
          ? "Não consegui gerar uma resposta dessa vez. Tente reformular o pedido ou enviar de novo em alguns segundos."
          : content;
      return sseFromText(safe);
    }
  } catch (e) {
    console.error("assistant-chat error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
