export interface ProposalSlide {
  type: "cover" | "about" | "diagnostic" | "solution" | "scope" | "investment" | "next_steps" | "custom";
  title: string;
  content: string[];
  highlights?: string[];
}

export interface ProposalTemplate {
  id: string;
  label: string;
  serviceType: string;
  slides: ProposalSlide[];
}

const aboutSlide: ProposalSlide = {
  type: "about",
  title: "Sobre a Linkou",
  content: [
    "Somos uma agência de marketing digital focada em performance e resultados reais.",
    "Combinamos estratégia de tráfego pago, produção de mídia e tecnologia para acelerar o crescimento dos nossos clientes.",
    "Nossa metodologia proprietária de 4 fases — Diagnóstico, Estruturação, Operação Guiada e Transferência — garante autonomia e previsibilidade para o seu negócio.",
  ],
  highlights: [
    "Meta Ads & Google Ads",
    "Produção de Criativos",
    "Sites & Landing Pages",
    "Aplicações Web com IA",
  ],
};

const nextStepsSlide: ProposalSlide = {
  type: "next_steps",
  title: "Próximos Passos",
  content: [
    "1. Aprovação desta proposta",
    "2. Assinatura do contrato e primeiro pagamento",
    "3. Reunião de kick-off e briefing detalhado",
    "4. Início da fase de Diagnóstico (semana 1)",
    "5. Entrega do plano estratégico e início da execução",
  ],
};

const investmentSlide: ProposalSlide = {
  type: "investment",
  title: "Investimento",
  content: [
    "Valor mensal: R$ [VALOR]",
    "Setup inicial: R$ [VALOR]",
    "Duração mínima: 3 meses",
    "Forma de pagamento: boleto ou cartão de crédito",
  ],
  highlights: [
    "Sem taxa de performance",
    "Relatórios mensais inclusos",
    "Suporte dedicado via WhatsApp",
  ],
};

export const proposalTemplates: ProposalTemplate[] = [
  {
    id: "gestao-trafego",
    label: "Gestão de Tráfego",
    serviceType: "gestao",
    slides: [
      { type: "cover", title: "Proposta de Gestão de Tráfego Pago", content: [] },
      aboutSlide,
      {
        type: "diagnostic",
        title: "Diagnóstico Inicial",
        content: [
          "Análise da presença digital atual e posicionamento de mercado",
          "Auditoria das contas de anúncios existentes (se houver)",
          "Mapeamento do funil de vendas e pontos de conversão",
          "Identificação de oportunidades de crescimento imediato",
        ],
      },
      {
        type: "solution",
        title: "Nossa Solução",
        content: [
          "Gestão completa de campanhas em Meta Ads e Google Ads",
          "Estratégia de funil completo: topo, meio e fundo",
          "Otimização semanal baseada em dados reais",
          "Testes A/B contínuos de criativos e audiências",
        ],
        highlights: ["ROI mensurado", "Otimização semanal", "Relatórios transparentes"],
      },
      {
        type: "scope",
        title: "Escopo e Entregáveis",
        content: [
          "Criação e gestão de campanhas em Meta Ads",
          "Criação e gestão de campanhas em Google Ads",
          "Setup completo de tracking (Pixel, CAPI, GTM)",
          "Dashboard personalizado de performance",
          "Relatório mensal com análise e recomendações",
          "Reunião mensal de alinhamento estratégico",
        ],
      },
      investmentSlide,
      nextStepsSlide,
    ],
  },
  {
    id: "auditoria",
    label: "Auditoria de Tráfego",
    serviceType: "auditoria",
    slides: [
      { type: "cover", title: "Proposta de Auditoria e Consultoria", content: [] },
      aboutSlide,
      {
        type: "diagnostic",
        title: "O que vamos analisar",
        content: [
          "Estrutura completa das suas contas de anúncios",
          "Configuração de pixels e rastreamento de conversões",
          "Segmentação de público e estratégia de lances",
          "Performance de criativos e copy dos anúncios",
          "Funil de conversão e experiência da landing page",
        ],
      },
      {
        type: "solution",
        title: "O que você recebe",
        content: [
          "Relatório detalhado com diagnóstico completo",
          "Plano de ação priorizado com quick wins",
          "Recomendações de otimização por canal",
          "Treinamento do time interno (opcional)",
        ],
        highlights: ["Diagnóstico completo", "Plano de ação", "Quick wins identificados"],
      },
      {
        type: "scope",
        title: "Entregáveis",
        content: [
          "Relatório de auditoria (PDF completo)",
          "Checklist de correções prioritárias",
          "Dashboards de monitoramento",
          "Reunião de apresentação dos resultados",
          "30 dias de suporte para implementação",
        ],
      },
      investmentSlide,
      nextStepsSlide,
    ],
  },
  {
    id: "producao-midia",
    label: "Produção de Mídia",
    serviceType: "producao",
    slides: [
      { type: "cover", title: "Proposta de Produção de Mídia", content: [] },
      aboutSlide,
      {
        type: "diagnostic",
        title: "Cenário Atual",
        content: [
          "Análise dos criativos e conteúdos atuais",
          "Benchmark com concorrentes do segmento",
          "Identificação de formatos com maior potencial de conversão",
          "Mapeamento da identidade visual e tom de voz",
        ],
      },
      {
        type: "solution",
        title: "Nossa Proposta Criativa",
        content: [
          "Produção mensal de criativos otimizados para anúncios",
          "Conteúdo para redes sociais alinhado com a estratégia",
          "Vídeos e imagens profissionais com briefing estratégico",
          "Roteiros baseados em dados de performance",
        ],
        highlights: ["Criativos que convertem", "Testes A/B", "Alinhado com tráfego"],
      },
      {
        type: "scope",
        title: "Pacote Mensal",
        content: [
          "X criativos estáticos para anúncios",
          "X vídeos curtos (Reels / Stories)",
          "X posts para feed/stories orgânico",
          "Roteiros e copy para todas as peças",
          "2 rodadas de revisão por peça",
        ],
      },
      investmentSlide,
      nextStepsSlide,
    ],
  },
  {
    id: "site-landing",
    label: "Site / Landing Page",
    serviceType: "site",
    slides: [
      { type: "cover", title: "Proposta de Desenvolvimento Web", content: [] },
      aboutSlide,
      {
        type: "diagnostic",
        title: "Análise da Presença Web",
        content: [
          "Avaliação do site/landing page atual (se existente)",
          "Análise de UX e taxa de conversão",
          "Benchmark de mercado e concorrentes",
          "Identificação de oportunidades de melhoria",
        ],
      },
      {
        type: "solution",
        title: "O que vamos construir",
        content: [
          "Design responsivo e moderno alinhado à sua marca",
          "Otimizado para conversão e geração de leads",
          "SEO técnico implementado desde o início",
          "Integração com ferramentas de marketing (pixel, GTM, analytics)",
        ],
        highlights: ["Alta conversão", "SEO otimizado", "Mobile first"],
      },
      {
        type: "scope",
        title: "Entregáveis do Projeto",
        content: [
          "Wireframe e protótipo navegável",
          "Design das páginas principais",
          "Desenvolvimento e codificação",
          "Setup de domínio e hospedagem",
          "Configuração de tracking e analytics",
          "Treinamento de uso do painel (se aplicável)",
        ],
      },
      investmentSlide,
      nextStepsSlide,
    ],
  },
  {
    id: "design",
    label: "Design / Identidade Visual",
    serviceType: "design",
    slides: [
      { type: "cover", title: "Proposta de Design e Identidade Visual", content: [] },
      aboutSlide,
      {
        type: "diagnostic",
        title: "Análise de Marca",
        content: [
          "Avaliação da identidade visual atual",
          "Pesquisa de referências e tendências do segmento",
          "Análise de posicionamento e diferenciação",
          "Mapeamento de pontos de contato da marca",
        ],
      },
      {
        type: "solution",
        title: "Nossa Abordagem",
        content: [
          "Criação de identidade visual completa e profissional",
          "Guia de marca com diretrizes de uso",
          "Aplicações em materiais digitais e impressos",
          "Alinhamento com estratégia de marketing digital",
        ],
        highlights: ["Marca memorável", "Guia completo", "Aplicações práticas"],
      },
      {
        type: "scope",
        title: "Entregáveis",
        content: [
          "Logo principal e variações",
          "Paleta de cores e tipografia",
          "Padrões gráficos e elementos visuais",
          "Manual de identidade visual (PDF)",
          "Templates para redes sociais",
          "Papelaria digital básica",
        ],
      },
      investmentSlide,
      nextStepsSlide,
    ],
  },
  {
    id: "webapp",
    label: "Aplicação Web",
    serviceType: "webapp",
    slides: [
      { type: "cover", title: "Proposta de Aplicação Web", content: [] },
      aboutSlide,
      {
        type: "diagnostic",
        title: "Entendimento do Desafio",
        content: [
          "Levantamento de requisitos e necessidades do negócio",
          "Análise de fluxos e processos atuais",
          "Definição de escopo funcional e técnico",
          "Identificação de integrações necessárias",
        ],
      },
      {
        type: "solution",
        title: "Solução Tecnológica",
        content: [
          "Aplicação web moderna, responsiva e escalável",
          "Desenvolvida com tecnologias de ponta e IA",
          "Banco de dados seguro e estruturado",
          "Integração com APIs e serviços externos",
        ],
        highlights: ["Tecnologia moderna", "IA integrada", "Escalável"],
      },
      {
        type: "scope",
        title: "Etapas do Projeto",
        content: [
          "Discovery e prototipagem",
          "Design de interfaces (UI/UX)",
          "Desenvolvimento frontend e backend",
          "Testes e homologação",
          "Deploy e configuração de produção",
          "Suporte e manutenção pós-lançamento",
        ],
      },
      investmentSlide,
      nextStepsSlide,
    ],
  },
];

export function getTemplateByServiceType(serviceType: string): ProposalTemplate | undefined {
  return proposalTemplates.find((t) => t.serviceType === serviceType);
}
