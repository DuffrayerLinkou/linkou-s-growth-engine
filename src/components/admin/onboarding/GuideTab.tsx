import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Users, Settings, Target, MessageSquare, FileText, BarChart3, TrendingUp, Zap } from "lucide-react";

const checklistSections = [
  {
    title: "1. Informações Básicas",
    icon: Users,
    items: [
      "Cadastrar cliente no sistema com dados completos",
      "Coletar dados de contato (email, telefone, WhatsApp)",
      "Registrar informações da empresa (CNPJ, segmento, site)",
      "Definir nicho de atuação e público-alvo inicial",
      "Estabelecer budget mensal para mídia paga",
      "Identificar ponto focal para comunicação",
    ],
  },
  {
    title: "2. Acessos e Integrações",
    icon: Settings,
    items: [
      "Solicitar acesso ao Gerenciador de Negócios do Facebook",
      "Solicitar acesso ao Google Ads (se aplicável)",
      "Configurar Pixel do Facebook no site do cliente",
      "Configurar Google Analytics 4",
      "Integrar Google Tag Manager",
      "Configurar conversões personalizadas",
      "Verificar domínio no Facebook Business",
      "Conectar página do Instagram ao Business Manager",
    ],
  },
  {
    title: "3. Planejamento Estratégico",
    icon: Target,
    items: [
      "Definir objetivos mensuráveis (SMART)",
      "Criar personas detalhadas",
      "Mapear segmentações de público",
      "Planejar estrutura de funil (Topo, Meio, Fundo)",
      "Definir KPIs principais de acompanhamento",
      "Estabelecer metas de curto, médio e longo prazo",
      "Criar calendário de campanhas",
      "Definir estratégia de criativos",
    ],
  },
];

const bestPractices = [
  {
    title: "Comunicação com Cliente",
    icon: MessageSquare,
    tips: [
      "Agendar reuniões semanais de alinhamento nos primeiros 30 dias",
      "Enviar relatórios de performance semanalmente",
      "Manter canal de comunicação rápida (WhatsApp/Slack)",
      "Documentar todas as decisões importantes",
      "Alinhar expectativas sobre resultados e prazos",
    ],
  },
  {
    title: "Documentação",
    icon: FileText,
    tips: [
      "Manter briefing sempre atualizado",
      "Documentar aprendizados de cada campanha",
      "Registrar resultados de testes A/B",
      "Criar biblioteca de criativos aprovados",
      "Salvar histórico de alterações importantes",
    ],
  },
  {
    title: "Primeiras Campanhas",
    icon: Zap,
    tips: [
      "Começar com campanhas de teste para calibrar algoritmo",
      "Testar diferentes públicos e criativos",
      "Investir 30% em campanhas de topo de funil",
      "Criar estrutura de remarketing desde o início",
      "Monitorar métricas diariamente na primeira semana",
    ],
  },
];

const essentialMetrics = [
  {
    category: "Desempenho Inicial",
    icon: BarChart3,
    metrics: [
      { name: "CTR (Click-Through Rate)", ideal: "> 1%", description: "Taxa de cliques nos anúncios" },
      { name: "CPC (Custo por Clique)", ideal: "Varia por nicho", description: "Valor pago por cada clique" },
      { name: "CPM (Custo por Mil)", ideal: "R$ 10-50", description: "Custo para 1000 impressões" },
      { name: "Taxa de Conversão", ideal: "> 2%", description: "% de visitantes que convertem" },
    ],
  },
  {
    category: "ROI e Vendas",
    icon: TrendingUp,
    metrics: [
      { name: "ROAS", ideal: "> 3x", description: "Retorno sobre gasto em anúncios" },
      { name: "CPA (Custo por Aquisição)", ideal: "< Ticket Médio", description: "Custo para adquirir um cliente" },
      { name: "Ticket Médio", ideal: "Crescente", description: "Valor médio por venda" },
      { name: "LTV (Lifetime Value)", ideal: "> 3x CAC", description: "Valor total do cliente no tempo" },
    ],
  },
];

export function GuideTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Guia de Onboarding
          </CardTitle>
          <CardDescription>
            Checklist completo e boas práticas para um onboarding de sucesso
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Checklist de Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {checklistSections.map((section, index) => (
              <AccordionItem key={index} value={`section-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <section.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{section.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      {section.items.length} itens
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pl-12 pb-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
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

      {/* Best Practices */}
      <div className="grid gap-4 md:grid-cols-3">
        {bestPractices.map((practice, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <practice.icon className="h-4 w-4 text-primary" />
                {practice.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {practice.tips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Essential Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Métricas Essenciais
          </CardTitle>
          <CardDescription>
            Principais métricas para acompanhar o desempenho das campanhas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {essentialMetrics.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <div className="flex items-center gap-2">
                  <group.icon className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">{group.category}</h4>
                </div>
                <div className="space-y-2">
                  {group.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{metric.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Ideal: {metric.ideal}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
