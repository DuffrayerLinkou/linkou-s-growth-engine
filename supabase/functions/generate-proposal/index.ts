import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_name, lead_segment, lead_objective, service_type, custom_context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um especialista em propostas comerciais da Linkou, uma agência de marketing digital.

Serviços da Linkou:
- Gestão de Tráfego (Meta Ads e Google Ads): estratégia de funil completo, otimização semanal, relatórios mensais
- Auditoria e Consultoria: diagnóstico de contas de anúncios, setup de tracking, dashboards, treinamento
- Produção de Mídia: criativos para anúncios, conteúdo para redes sociais, vídeos e imagens profissionais
- Sites e Landing Pages: sites institucionais, landing pages de conversão, design responsivo, SEO
- Design: identidade visual, branding, templates para redes sociais
- Aplicação Web: apps sob medida com IA, banco de dados, deploy automatizado

Metodologia Linkou (4 fases):
1. Diagnóstico - análise completa do cenário atual
2. Estruturação - setup de ferramentas e estratégia
3. Operação Guiada - execução com acompanhamento próximo
4. Transferência - autonomia para o cliente

Gere slides profissionais, persuasivos e específicos para o cliente. Use dados concretos quando possível. O tom deve ser profissional mas acessível.`;

    const userPrompt = `Gere uma proposta comercial em slides para:
- Cliente: ${lead_name}
- Segmento: ${lead_segment || "Não especificado"}
- Objetivo: ${lead_objective || "Não especificado"}
- Serviço: ${service_type}
${custom_context ? `- Contexto adicional: ${custom_context}` : ""}

Gere entre 6 e 8 slides estruturados.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_proposal_slides",
              description: "Gera slides estruturados para uma proposta comercial da Linkou.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Título da proposta" },
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["cover", "about", "diagnostic", "solution", "scope", "investment", "next_steps", "custom"],
                        },
                        title: { type: "string" },
                        content: { type: "array", items: { type: "string" } },
                        highlights: { type: "array", items: { type: "string" } },
                      },
                      required: ["type", "title", "content"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "slides"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_proposal_slides" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-proposal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao gerar proposta" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
