import { motion } from "framer-motion";
import { BookOpen, Target, BarChart3, Facebook, Search, Lightbulb, ExternalLink, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const knowledgeBase = {
  otimizacao: {
    icon: Target,
    label: "Otimização",
    description: "Melhore o desempenho das suas campanhas",
    guides: [
      {
        title: "Como melhorar o CTR dos seus anúncios",
        level: "Iniciante",
        content: [
          "Use imagens de alta qualidade e relevantes para o público",
          "Escreva títulos que despertem curiosidade ou urgência",
          "Inclua números e estatísticas quando possível",
          "Teste diferentes CTAs (Saiba mais, Compre agora, Garanta já)",
          "Segmente bem o público para maior relevância",
          "Use emojis estrategicamente em textos (com moderação)"
        ]
      },
      {
        title: "Estrutura de funil: Topo, Meio e Fundo",
        level: "Intermediário",
        content: [
          "TOPO: Consciência - Vídeos, posts educativos, alcance amplo",
          "MEIO: Consideração - Depoimentos, comparativos, remarketing",
          "FUNDO: Conversão - Ofertas diretas, urgência, público quente",
          "Use públicos diferentes para cada etapa do funil",
          "Ajuste orçamento: 50% topo, 30% meio, 20% fundo (início)",
          "Acompanhe a jornada do lead entre as etapas"
        ]
      },
      {
        title: "Boas práticas para landing pages",
        level: "Iniciante",
        content: [
          "Título claro e objetivo acima da dobra",
          "CTA visível e contrastante com o fundo",
          "Formulário simples (máximo 5 campos)",
          "Prova social: depoimentos, logos de clientes, avaliações",
          "Velocidade de carregamento menor que 3 segundos",
          "Design responsivo e mobile-first",
          "Remova menus e links que distraiam da conversão"
        ]
      },
      {
        title: "Testes A/B: como e quando fazer",
        level: "Avançado",
        content: [
          "Teste apenas UMA variável por vez (título, imagem, CTA)",
          "Aguarde volume estatístico significativo (mín. 100 conversões)",
          "Duração mínima de 7 dias para capturar padrões semanais",
          "Documente todas as hipóteses e resultados",
          "Vencedor deve ter pelo menos 95% de confiança estatística",
          "Aplique aprendizados em outras campanhas"
        ]
      },
      {
        title: "Frequência ideal de anúncios",
        level: "Intermediário",
        content: [
          "Frequência ideal: 1.5 a 3 por semana para público frio",
          "Público quente tolera frequência maior (até 5-7)",
          "Monitore fadiga criativa: queda de CTR + aumento de frequência",
          "Renove criativos a cada 2-3 semanas",
          "Use cap de frequência quando disponível na plataforma",
          "Diversifique formatos para reduzir saturação"
        ]
      }
    ]
  },
  metricas: {
    icon: BarChart3,
    label: "Métricas",
    description: "Entenda e interprete seus resultados",
    guides: [
      {
        title: "Glossário de métricas essenciais",
        level: "Iniciante",
        content: [
          "CTR (Taxa de Cliques): Cliques ÷ Impressões × 100",
          "CPC (Custo por Clique): Valor gasto ÷ Cliques",
          "CPM (Custo por Mil): Custo para 1.000 impressões",
          "CPA (Custo por Aquisição): Valor gasto ÷ Conversões",
          "ROAS (Retorno sobre Investimento em Ads): Receita ÷ Investimento",
          "LTV (Valor Vitalício): Receita média por cliente ao longo do tempo",
          "CAC (Custo de Aquisição de Cliente): Investimento total ÷ Novos clientes"
        ]
      },
      {
        title: "Como interpretar seus relatórios",
        level: "Intermediário",
        content: [
          "Compare períodos equivalentes (semana vs semana, mês vs mês)",
          "Considere sazonalidade e eventos externos",
          "Analise tendências, não apenas números absolutos",
          "Cruze dados de diferentes fontes (Ads + Analytics + CRM)",
          "Foque em métricas de resultado, não apenas vaidade",
          "Documente insights e hipóteses para validar depois"
        ]
      },
      {
        title: "KPIs mais importantes por objetivo",
        level: "Intermediário",
        content: [
          "RECONHECIMENTO: Alcance, Frequência, CPM, Brand Lift",
          "CONSIDERAÇÃO: CTR, CPC, Tempo no site, Páginas/sessão",
          "CONVERSÃO: CPA, ROAS, Taxa de conversão, Ticket médio",
          "RETENÇÃO: LTV, Churn rate, NPS, Taxa de recompra",
          "Defina metas SMART para cada KPI",
          "Revise KPIs mensalmente e ajuste estratégia"
        ]
      },
      {
        title: "Benchmarks por segmento de mercado",
        level: "Avançado",
        content: [
          "E-commerce: CTR 1-2%, CPC R$0.50-2.00, ROAS 3-5x",
          "B2B/Serviços: CTR 0.5-1.5%, CPL R$20-100, Taxa conv. 2-5%",
          "Educação: CTR 1-3%, CPL R$15-60, Taxa matrícula 5-15%",
          "Imobiliário: CTR 0.5-1%, CPL R$30-150, Ciclo longo",
          "Use benchmarks como referência, não como regra absoluta",
          "Seu histórico próprio é o melhor benchmark"
        ]
      },
      {
        title: "Como calcular ROI de campanhas",
        level: "Intermediário",
        content: [
          "ROI = (Receita - Investimento) ÷ Investimento × 100",
          "Considere custos além do investimento em mídia (equipe, ferramentas)",
          "Atribua valor a leads mesmo que não convertam imediatamente",
          "Use janelas de atribuição adequadas ao ciclo de venda",
          "Calcule ROI por canal, campanha e criativo",
          "Projete ROI considerando LTV, não apenas primeira compra"
        ]
      }
    ]
  },
  metaAds: {
    icon: Facebook,
    label: "Meta Ads",
    description: "Facebook e Instagram Ads",
    guides: [
      {
        title: "Estrutura de campanhas no Meta",
        level: "Iniciante",
        content: [
          "CAMPANHA: Define objetivo (Conversão, Tráfego, Alcance, etc.)",
          "CONJUNTO DE ANÚNCIOS: Define público, posicionamento, orçamento",
          "ANÚNCIO: Define criativo (imagem, vídeo, texto, CTA)",
          "Use nomenclatura padronizada para organização",
          "Exemplo: [Objetivo]_[Público]_[Criativo]_[Data]",
          "Mantenha estrutura limpa: delete campanhas inativas"
        ]
      },
      {
        title: "Públicos: Interesse, Lookalike, Custom",
        level: "Intermediário",
        content: [
          "INTERESSE: Baseado em comportamento e interesses declarados",
          "CUSTOM AUDIENCE: Sua base (site, lista, engajamento)",
          "LOOKALIKE: Pessoas similares à sua base (1% a 10%)",
          "Comece com Lookalike 1% para qualidade máxima",
          "Use exclusões para evitar sobreposição entre conjuntos",
          "Teste públicos amplos com CBO e deixe o algoritmo otimizar"
        ]
      },
      {
        title: "Formatos de anúncio mais eficazes",
        level: "Iniciante",
        content: [
          "REELS: Maior alcance orgânico, formato vertical 9:16",
          "CARROSSEL: Ideal para mostrar produtos ou contar histórias",
          "IMAGEM ÚNICA: Simples e direto, bom para remarketing",
          "VÍDEO: Alta retenção, primeiros 3 segundos são cruciais",
          "STORIES: Imersivo, use CTAs swipe-up ou adesivos",
          "Adapte o criativo para cada posicionamento"
        ]
      },
      {
        title: "Pixel do Facebook: como funciona",
        level: "Intermediário",
        content: [
          "Pixel é um código JavaScript instalado no seu site",
          "Rastreia ações: PageView, Lead, Purchase, AddToCart, etc.",
          "Permite criar públicos de remarketing precisos",
          "Alimenta o algoritmo para otimização de conversões",
          "Configure eventos padrão e personalizados",
          "Use API de Conversões para dados mais precisos (server-side)"
        ]
      },
      {
        title: "Otimização de orçamento (CBO vs ABO)",
        level: "Avançado",
        content: [
          "CBO (Campaign Budget Optimization): Orçamento na campanha",
          "ABO (Ad Set Budget Optimization): Orçamento por conjunto",
          "CBO é recomendado pelo Meta para maioria dos casos",
          "Use ABO quando quiser controle granular de gastos",
          "CBO precisa de pelo menos 50 conversões/semana para otimizar bem",
          "Teste ambos e compare resultados no seu contexto"
        ]
      },
      {
        title: "Remarketing e retargeting eficaz",
        level: "Intermediário",
        content: [
          "Segmente por tempo: 3 dias, 7 dias, 30 dias, 180 dias",
          "Crie sequências de mensagens diferentes por tempo",
          "Use dynamic ads para mostrar produtos já visualizados",
          "Exclua quem já converteu (ou crie upsell específico)",
          "Remarketing de vídeo: quem assistiu 50%+ é público quente",
          "Combine remarketing com ofertas exclusivas para aumentar conversão"
        ]
      }
    ]
  },
  googleAds: {
    icon: Search,
    label: "Google Ads",
    description: "Pesquisa, Display e YouTube",
    guides: [
      {
        title: "Rede de Pesquisa vs Display vs YouTube",
        level: "Iniciante",
        content: [
          "PESQUISA: Intenção alta, usuário busca ativamente",
          "DISPLAY: Alcance amplo, impacto visual, remarketing",
          "YOUTUBE: Vídeo, awareness, audiências semelhantes",
          "Pesquisa converte melhor, Display alcança mais, YouTube engaja",
          "Combine redes para cobrir todo o funil",
          "Comece com Pesquisa se orçamento for limitado"
        ]
      },
      {
        title: "Palavras-chave: correspondência e negativação",
        level: "Intermediário",
        content: [
          "AMPLA: Alcance máximo, menos controle (use com cuidado)",
          "FRASE: Termo aparece na busca, ordem preservada",
          "EXATA: Apenas buscas específicas, controle total",
          "NEGATIVAS: Impedem exibição em buscas irrelevantes",
          "Revise termos de pesquisa semanalmente",
          "Adicione negativas constantemente para otimizar"
        ]
      },
      {
        title: "Extensões de anúncio importantes",
        level: "Iniciante",
        content: [
          "SITELINKS: Links adicionais para páginas específicas",
          "FRASE DE DESTAQUE: Diferenciais (Frete grátis, 24h, etc.)",
          "SNIPPETS: Categorias de produtos/serviços",
          "CHAMADA: Número de telefone clicável",
          "LOCAL: Endereço do Google Meu Negócio",
          "Use todas as extensões relevantes para ocupar mais espaço"
        ]
      },
      {
        title: "Quality Score e como melhorar",
        level: "Avançado",
        content: [
          "Quality Score: 1-10, afeta posição e CPC",
          "Componentes: CTR esperado, relevância do anúncio, experiência LP",
          "CTR: Melhore títulos e descrições, use palavras-chave",
          "Relevância: Agrupe palavras-chave por tema, crie anúncios específicos",
          "LP: Velocidade, conteúdo relevante, mobile-friendly",
          "QS alto = CPC menor + posição melhor"
        ]
      },
      {
        title: "Conversões e acompanhamento",
        level: "Intermediário",
        content: [
          "Configure conversões: formulário, compra, ligação, etc.",
          "Use Google Tag Manager para facilitar implementação",
          "Atribua valores às conversões quando possível",
          "Configure conversões offline para vendas fora do site",
          "Use Enhanced Conversions para dados mais precisos",
          "Monitore janela de conversão (30, 60, 90 dias)"
        ]
      },
      {
        title: "Performance Max: prós e contras",
        level: "Avançado",
        content: [
          "PRÓS: Automação total, alcança todas as redes Google",
          "PRÓS: Machine learning otimiza em tempo real",
          "CONTRAS: Menos controle e visibilidade de dados",
          "CONTRAS: Precisa de volume para aprender bem",
          "Ideal para e-commerce com feed de produtos",
          "Mantenha campanhas de Pesquisa separadas para controle"
        ]
      }
    ]
  },
  dicas: {
    icon: Lightbulb,
    label: "Dicas Gerais",
    description: "Boas práticas de comunicação",
    guides: [
      {
        title: "Como criar briefings eficazes",
        level: "Iniciante",
        content: [
          "Defina objetivo claro e mensurável da campanha",
          "Descreva o público-alvo com detalhes (dores, desejos)",
          "Informe orçamento disponível e período de veiculação",
          "Compartilhe materiais de referência (concorrentes, inspirações)",
          "Liste diferenciais e argumentos de venda principais",
          "Indique restrições ou obrigatoriedades (cores, termos, etc.)"
        ]
      },
      {
        title: "Comunicação eficiente com a agência",
        level: "Iniciante",
        content: [
          "Centralize comunicação em um canal (evite fragmentação)",
          "Defina prazos realistas para aprovações (48-72h)",
          "Dê feedback específico e construtivo, não apenas 'não gostei'",
          "Alinhe expectativas de resultados desde o início",
          "Participe das reuniões de alinhamento mensais",
          "Compartilhe informações de mercado que possam ajudar"
        ]
      },
      {
        title: "Cronograma ideal de aprovações",
        level: "Intermediário",
        content: [
          "Dia 1-2: Recebimento e análise do briefing pela agência",
          "Dia 3-5: Criação e revisão interna dos criativos",
          "Dia 6-7: Envio para aprovação do cliente",
          "Dia 8-9: Feedback e ajustes (se necessário)",
          "Dia 10: Aprovação final e subida das campanhas",
          "Planeje com antecedência para datas sazonais (Black Friday, etc.)"
        ]
      },
      {
        title: "Checklist antes de aprovar campanhas",
        level: "Iniciante",
        content: [
          "Texto está sem erros de português e coerente?",
          "Imagens/vídeos estão em boa qualidade e no formato correto?",
          "CTA está claro e alinhado com o objetivo?",
          "Link de destino está funcionando e é o correto?",
          "Público-alvo está de acordo com o briefing?",
          "Orçamento e período estão corretos?",
          "Há alguma restrição legal ou de marca sendo violada?"
        ]
      },
      {
        title: "Perguntas frequentes (FAQ)",
        level: "Iniciante",
        content: [
          "Quanto tempo leva para ver resultados? 2-4 semanas para otimização inicial",
          "Posso alterar a campanha no ar? Sim, mas evite mudanças drásticas",
          "Por que o custo subiu? Concorrência, sazonalidade, fadiga criativa",
          "Como sei se está funcionando? Acompanhe KPIs definidos no início",
          "Devo pausar campanhas no fim de semana? Depende do seu negócio",
          "Qual plataforma é melhor? Depende do público e objetivo"
        ]
      }
    ]
  }
};

const externalResources = [
  {
    name: "Meta Blueprint",
    url: "https://www.facebookblueprint.com/",
    description: "Cursos oficiais do Meta sobre anúncios"
  },
  {
    name: "Google Skillshop",
    url: "https://skillshop.google.com/",
    description: "Certificações gratuitas do Google"
  },
  {
    name: "Think with Google",
    url: "https://www.thinkwithgoogle.com/intl/pt-br/",
    description: "Insights e tendências de marketing"
  }
];

const getLevelColor = (level: string) => {
  switch (level) {
    case "Iniciante":
      return "bg-success/10 text-success border-success/20";
    case "Intermediário":
      return "bg-warning/10 text-warning border-warning/20";
    case "Avançado":
      return "bg-primary/10 text-primary border-primary/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function BaseConhecimento() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Base de Conhecimento</h1>
            <p className="text-muted-foreground">
              Recursos e guias para maximizar seus resultados em marketing digital
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs defaultValue="otimizacao" className="w-full">
          <TabsList className="w-full h-auto gap-1 bg-muted/50 p-1 overflow-x-auto flex-nowrap scrollbar-hide">
            {Object.entries(knowledgeBase).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background flex-shrink-0 px-2 sm:px-3"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(knowledgeBase).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <category.icon className="h-5 w-5 text-primary" />
                    {category.label}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.guides.map((guide, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-left min-w-0">
                            <span className="font-medium text-sm sm:text-base break-words">{guide.title}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs w-fit flex-shrink-0 ${getLevelColor(guide.level)}`}
                            >
                              {guide.level}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 pl-1">
                            {guide.content.map((item, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* External Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ExternalLink className="h-5 w-5 text-primary" />
              Recursos Externos
            </CardTitle>
            <CardDescription>
              Certificações e conteúdos oficiais das plataformas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {externalResources.map((resource) => (
                <Button
                  key={resource.name}
                  variant="outline"
                  className="h-auto flex-col items-start p-4 text-left hover:bg-muted/50"
                  asChild
                >
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <span className="font-medium flex items-center gap-2">
                      {resource.name}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {resource.description}
                    </span>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
