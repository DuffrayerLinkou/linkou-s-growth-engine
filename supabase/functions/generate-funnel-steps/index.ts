import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { objective, audience, tone, step_count, interval_days, funnel_name } = await req.json();

    if (!objective || !audience || !tone || !step_count || !interval_days) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios ausentes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toneMap: Record<string, string> = {
      professional: "profissional e institucional, com linguagem clara e respeitosa",
      consultive: "consultivo e próximo, como um especialista que guia o cliente com empatia",
      direct: "direto e com senso de urgência, destacando consequências de não agir",
    };

    const toneDescription = toneMap[tone] || toneMap.consultive;

    const systemPrompt = `Você é um especialista em email marketing consultivo B2B/B2C brasileiro.
Sua missão é criar sequências de emails de alta conversão para a Linkou, agência de consultoria, tráfego e vendas.

Regras absolutas:
- NUNCA mencione "tráfego pago". Sempre use "consultoria, tráfego e vendas" ou "estratégias de aquisição".
- Sempre use as variáveis de personalização: {{nome}}, {{segmento}}, {{objetivo}}
- Tom de voz: ${toneDescription}
- Cada email deve ter um objetivo claro e único (apresentar, provar valor, quebrar objeção, criar urgência, fechar)
- HTML inline compatível com clientes de email (sem CSS externo, sem classes, apenas style inline)
- Estrutura HTML de cada email:
  * Fundo branco (#FFFFFF), fonte Arial/sans-serif, largura máxima 600px centralizada
  * Header com fundo roxo (#7C3AED) e logo da Linkou em texto branco
  * Corpo com padding 24px, text-color #1A1A1A, line-height 1.6
  * CTA button: fundo #7C3AED, texto branco, border-radius 8px, padding 14px 28px
  * Footer: assinatura "Leo Santana — Diretor Comercial — Linkou" em fundo #F3F4F6, fonte pequena, cinza
- Linguagem sempre em português brasileiro
- Assunto do email deve ter no máximo 60 caracteres e gerar curiosidade/urgência`;

    const userPrompt = `Crie ${step_count} steps de email para o funil "${funnel_name}".

Objetivo do funil: ${objective}
Público-alvo: ${audience}
Tom de voz: ${toneDescription}
Intervalo entre emails: ${interval_days} dias

Gere ${step_count} emails únicos e progressivos. O primeiro email deve ter delay_days = ${interval_days === 0 ? 0 : interval_days}, e cada seguinte aumenta ${interval_days} dias.`;

    console.log("Generating funnel steps:", { funnel_name, step_count, tone });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
              name: "generate_funnel_steps",
              description: "Gera uma sequência de steps de email para um funil de drip marketing.",
              parameters: {
                type: "object",
                properties: {
                  steps: {
                    type: "array",
                    description: "Array com todos os steps do funil",
                    items: {
                      type: "object",
                      properties: {
                        step_number: { type: "integer", description: "Número sequencial do step (1, 2, 3...)" },
                        delay_days: { type: "integer", description: "Número de dias após a inscrição para enviar este email" },
                        subject: { type: "string", description: "Assunto do email (máx 60 caracteres, persuasivo)" },
                        html_body: { type: "string", description: "Corpo completo do email em HTML inline, com variáveis {{nome}}, {{segmento}}, {{objetivo}}" },
                      },
                      required: ["step_number", "delay_days", "subject", "html_body"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["steps"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_funnel_steps" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro na API de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "Resposta inesperada da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { steps } = JSON.parse(toolCall.function.arguments);
    console.log("Funnel steps generated successfully:", steps.length, "steps");

    return new Response(JSON.stringify({ steps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating funnel steps:", error);
    return new Response(JSON.stringify({ error: "Erro interno ao gerar steps" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
