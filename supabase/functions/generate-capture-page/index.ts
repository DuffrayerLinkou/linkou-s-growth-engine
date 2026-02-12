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

    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Descreva a página com pelo menos 10 caracteres" }), {
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

    const systemPrompt = `Você é um especialista em landing pages de alta conversão e copywriting persuasivo em português brasileiro.
O usuário vai descrever uma página de captura que deseja criar. Você deve gerar todos os campos necessários para montar a página.

Regras:
- Headline deve ser impactante e focada no benefício principal (máx 80 caracteres)
- Subheadline complementa a headline com urgência ou prova social (máx 120 caracteres)
- Gere entre 3 e 5 benefícios curtos e diretos
- O slug deve ser em minúsculas, sem acentos, separado por hífens
- Cores devem ser em formato hexadecimal (#RRGGBB)
- Escolha cores que combinem com o nicho/segmento descrito
- Meta title máximo 60 caracteres, meta description máximo 160 caracteres
- Texto do botão deve ter senso de urgência (máx 30 caracteres)
- Tudo em português brasileiro
- Se o usuário mencionar "vídeo", "VSL", "video sales letter" ou "youtube", defina layout_type como "vsl". Caso contrário, use "standard".`;

    console.log("Generating capture page for prompt:", prompt.substring(0, 100));

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
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_capture_page",
              description: "Gera todos os campos de uma página de captura de leads.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Título interno da página (curto, para identificação)" },
                  slug: { type: "string", description: "Slug para URL, minúsculas sem acentos, separado por hífens" },
                  headline: { type: "string", description: "Headline principal da página" },
                  subheadline: { type: "string", description: "Sub-headline complementar" },
                  benefits: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de 3 a 5 benefícios curtos"
                  },
                  button_text: { type: "string", description: "Texto do botão CTA" },
                  thank_you_message: { type: "string", description: "Mensagem exibida após o envio do formulário" },
                  primary_color: { type: "string", description: "Cor primária em hexadecimal (#RRGGBB)" },
                  background_color: { type: "string", description: "Cor de fundo em hexadecimal (#RRGGBB)" },
                  text_color: { type: "string", description: "Cor do texto em hexadecimal (#RRGGBB)" },
                  meta_title: { type: "string", description: "Meta title para SEO (máx 60 caracteres)" },
                  meta_description: { type: "string", description: "Meta description para SEO (máx 160 caracteres)" },
                  layout_type: { type: "string", description: "Tipo de layout: 'standard' (padrão) ou 'vsl' (com vídeo em destaque)" },
                  video_url: { type: "string", description: "URL do YouTube para o vídeo (apenas quando layout_type é 'vsl'). Pode ser vazio." },
                },
                required: ["title", "slug", "headline", "subheadline", "benefits", "button_text", "thank_you_message", "primary_color", "background_color", "text_color", "meta_title", "meta_description", "layout_type"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_capture_page" } },
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

    const pageData = JSON.parse(toolCall.function.arguments);
    console.log("Capture page generated successfully:", pageData.title);

    return new Response(JSON.stringify({ page: pageData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating capture page:", error);
    return new Response(JSON.stringify({ error: "Erro interno ao gerar página" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
