export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
}

export const emailTemplateCategories = [
  "Comercial",
  "Follow-up",
  "Onboarding",
  "Cobrança",
  "Geral",
] as const;

const PRIMARY_COLOR = "#7C3AED";
const BG_COLOR = "#f4f4f7";
const CONTACT_EMAIL = "contato@agencialinkou.com.br";
const CONTACT_PHONE = "(41) 98898-8054";

export function wrapWithLinkoLayout(content: string): string {
  // Convert plain text line breaks to HTML
  const htmlContent = content.replace(/\n/g, "<br/>");
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BG_COLOR};font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:${PRIMARY_COLOR};padding:32px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">Linkou</h1>
  </td></tr>
  <tr><td style="padding:36px 32px 24px;">
    <div style="color:#4a4a68;font-size:15px;line-height:1.7;">
      ${htmlContent}
    </div>
  </td></tr>
  <tr><td style="padding:24px 32px;border-top:1px solid #eee;text-align:center;">
    <p style="margin:0 2px;color:#1a1a2e;font-size:14px;font-weight:700;">Leo Santana</p>
    <p style="margin:0 0 8px;color:#4a4a68;font-size:12px;font-weight:500;">Diretor Comercial — Linkou</p>
    <p style="margin:0;color:#9e9eb8;font-size:13px;font-weight:600;">Linkou — Marketing de Performance</p>
    <p style="margin:8px 0 4px;color:#9e9eb8;font-size:12px;">✉ <a href="mailto:${CONTACT_EMAIL}" style="color:${PRIMARY_COLOR};text-decoration:none;">${CONTACT_EMAIL}</a></p>
    <p style="margin:0 0 4px;color:#9e9eb8;font-size:12px;">📞 ${CONTACT_PHONE}</p>
    <p style="margin:0;"><a href="https://agencialinkou.com.br" style="color:${PRIMARY_COLOR};font-size:12px;text-decoration:none;">agencialinkou.com.br</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function replacePlaceholders(text: string, data: { nome?: string; empresa?: string }): string {
  let result = text;
  if (data.nome) result = result.replace(/\{\{nome\}\}/g, data.nome);
  if (data.empresa) result = result.replace(/\{\{empresa\}\}/g, data.empresa);
  return result;
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: "apresentacao-comercial",
    name: "Apresentação Comercial",
    category: "Comercial",
    subject: "Transforme seus resultados digitais — {{empresa}}",
    body: `Olá {{nome}},

Tudo bem? Me chamo Leo Santana e sou da Linkou.

Estamos ajudando empresas como a {{empresa}} a escalar seus resultados com tráfego pago e estratégias de marketing digital personalizadas.

Gostaria de entender melhor seus desafios atuais e mostrar como podemos ajudar. Podemos agendar uma conversa rápida de 15 minutos?

Fico no aguardo!`,
  },
  {
    id: "followup-pos-reuniao",
    name: "Follow-up Pós-Reunião",
    category: "Follow-up",
    subject: "Foi ótimo conversar com você, {{nome}}!",
    body: `Olá {{nome}},

Obrigado pela reunião de hoje! Foi muito bom entender melhor os desafios da {{empresa}}.

Conforme conversamos, seguem os próximos passos:
- [passo 1]
- [passo 2]
- [passo 3]

Qualquer dúvida, estou à disposição.`,
  },
  {
    id: "proposta-enviada",
    name: "Proposta Enviada",
    category: "Comercial",
    subject: "Proposta Linkou para {{empresa}}",
    body: `Olá {{nome}},

Conforme alinhado, segue em anexo a proposta comercial personalizada para a {{empresa}}.

Principais pontos:
- Escopo dos serviços
- Investimento e condições
- Cronograma de implementação

Estou disponível para esclarecer qualquer dúvida. Podemos agendar uma call para revisar juntos?`,
  },
  {
    id: "boas-vindas-cliente",
    name: "Boas-vindas Novo Cliente",
    category: "Onboarding",
    subject: "Bem-vindo(a) à Linkou, {{nome}}! 🎉",
    body: `Olá {{nome}},

É um prazer ter a {{empresa}} como nosso novo cliente! Estamos muito animados para começar essa jornada juntos.

Próximos passos do onboarding:
1. Preenchimento do briefing
2. Reunião de kick-off
3. Configuração das ferramentas
4. Início das campanhas

Seu gestor de conta entrará em contato em breve para agendar o kick-off.

Seja bem-vindo(a)!`,
  },
  {
    id: "lembrete-pagamento",
    name: "Lembrete de Pagamento",
    category: "Cobrança",
    subject: "Lembrete: fatura pendente — {{empresa}}",
    body: `Olá {{nome}},

Esperamos que esteja tudo bem! Gostaríamos de lembrar que a fatura referente ao mês de [mês] está pendente.

Detalhes:
- Valor: R$ [valor]
- Vencimento: [data]

Caso já tenha efetuado o pagamento, desconsidere este email. Se precisar de alguma ajuda, estamos à disposição.`,
  },
  {
    id: "reativacao-lead",
    name: "Reativação de Lead",
    category: "Follow-up",
    subject: "{{nome}}, ainda podemos ajudar a {{empresa}}!",
    body: `Olá {{nome}},

Faz um tempo que conversamos e gostaria de saber como estão as coisas na {{empresa}}.

O mercado digital está em constante evolução e temos novidades que podem ser muito relevantes para vocês:
- [novidade 1]
- [novidade 2]

Que tal agendarmos uma conversa rápida para atualizar?`,
  },
  {
    id: "convite-reuniao",
    name: "Convite para Reunião",
    category: "Geral",
    subject: "Convite: Reunião {{empresa}} + Linkou",
    body: `Olá {{nome}},

Gostaria de agendar uma reunião para discutirmos [pauta].

Sugestões de horário:
- [data/hora 1]
- [data/hora 2]
- [data/hora 3]

A reunião terá duração de aproximadamente [X] minutos e será via [Google Meet/Zoom].

Qual horário funciona melhor para você?`,
  },
  {
    id: "feedback-campanha",
    name: "Feedback de Campanha",
    category: "Geral",
    subject: "Resultados do mês — {{empresa}}",
    body: `Olá {{nome}},

Segue o resumo dos resultados das campanhas de [mês]:

📊 Principais métricas:
- Investimento: R$ [valor]
- Leads gerados: [número]
- Custo por lead: R$ [valor]
- Conversões: [número]
- ROAS: [valor]x

✅ O que funcionou bem:
- [ponto positivo 1]
- [ponto positivo 2]

🔄 Ajustes para o próximo mês:
- [ajuste 1]
- [ajuste 2]

Vamos agendar uma call para revisar juntos?`,
  },
];
