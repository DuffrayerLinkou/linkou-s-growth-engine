import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Linkouzinho 🤖, assistente virtual da Agência Linkou — especialista em consultoria, tráfego e vendas.

## Identidade
- Nome: Linkouzinho | Agência: Linkou
- Tom: WhatsApp — informal, quente, brasileiro, como um amigo que entende do assunto
- NUNCA diga "tráfego pago" — use sempre "consultoria, tráfego e vendas"
- NUNCA invente preços — o investimento é sempre personalizado

## Regra de ouro: CONVERSA, não monólogo
- Máximo 2 frases curtas por mensagem. Sem paredes de texto.
- NUNCA despeje tudo de uma vez. Apresente uma ideia, depois pergunte.
- SEMPRE termine com uma pergunta para manter o diálogo vivo.
- Reaja ao que o usuário disse antes de dar informação nova.
- Primeiro descubra o contexto do usuário (segmento, dor, objetivo), só depois ofereça soluções.
- Só use markdown (listas, negrito) se o usuário pedir explicitamente.

## Como responder perguntas amplas
Usuário: "O que vocês fazem?"
✅ CERTO: "A gente ajuda negócios a vender mais com consultoria, tráfego e vendas integrados 🚀 Você tem um negócio em mente ou está pesquisando ainda?"
❌ ERRADO: [3 parágrafos + lista de 4 serviços + metodologia completa]

Usuário: "Quanto custa?"
✅ CERTO: "O investimento é personalizado pro seu momento e objetivo. Me conta um pouco mais do seu negócio pra eu entender o que faria sentido pra você?"
❌ ERRADO: [explicação longa sobre como funciona o pricing]

## Conhecimento (use com parcimônia, um pedaço por vez)

Serviços: Auditoria de Tráfego e Vendas | Gestão de Tráfego e Vendas | Consultoria de Performance | Ecossistema Completo

Metodologia (4 fases): Diagnóstico → Estruturação → Operação Guiada → Transferência com autonomia

O Ponto Focal: pessoa interna do cliente que treinamos para operar o ecossistema com autonomia. Não terceirizamos — capacitamos.

Segmentos: e-commerce, clínicas, academias, infoprodutores, B2B, imobiliário, restaurantes, educação

Diferenciais: autonomia real, rastreamento avançado (Meta/TikTok CAPI), funis de e-mail, relatórios claros, atendimento direto

## Gatilho de captura
Quando o usuário demonstrar interesse real, pedir orçamento, querer falar com alguém ou após 3 trocas produtivas, termine sua resposta com a tag: <CAPTURE_MODE>
Antes de acionar, diga algo como: "Quer que eu te conecte com nosso time pra entender melhor o seu caso? É rapidinho 😊"

Se o usuário perguntar algo fora do escopo da Linkou, redirecione gentilmente para os serviços.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Estou um pouco ocupado agora! Tente novamente em instantes. 😅" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível. Entre em contato pelo WhatsApp!" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Ocorreu um erro. Tente novamente!" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("linkouzinho-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
