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

export const emailTemplates: EmailTemplate[] = [
  {
    id: "apresentacao-comercial",
    name: "Apresentação Comercial",
    category: "Comercial",
    subject: "Transforme seus resultados digitais — {{empresa}}",
    body: `Olá {{nome}},

Tudo bem? Me chamo [seu nome] e sou da Linkou.

Estamos ajudando empresas como a {{empresa}} a escalar seus resultados com tráfego pago e estratégias de marketing digital personalizadas.

Gostaria de entender melhor seus desafios atuais e mostrar como podemos ajudar. Podemos agendar uma conversa rápida de 15 minutos?

Fico no aguardo!

Abraços,
[seu nome]`,
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

Qualquer dúvida, estou à disposição.

Abraços,
[seu nome]`,
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

Estou disponível para esclarecer qualquer dúvida. Podemos agendar uma call para revisar juntos?

Abraços,
[seu nome]`,
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

Seja bem-vindo(a)!

Equipe Linkou`,
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

Caso já tenha efetuado o pagamento, desconsidere este email. Se precisar de alguma ajuda, estamos à disposição.

Atenciosamente,
Equipe Linkou`,
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

Que tal agendarmos uma conversa rápida para atualizar?

Abraços,
[seu nome]`,
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

Qual horário funciona melhor para você?

Abraços,
[seu nome]`,
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

Vamos agendar uma call para revisar juntos?

Abraços,
[seu nome]`,
  },
];
