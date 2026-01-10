import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap, Tag, Search, Target, CheckCircle2 } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
}

interface ChecklistSection {
  title: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
}

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    title: "Velocidade e Performance",
    icon: <Zap className="h-5 w-5 text-yellow-500" />,
    items: [
      { id: "webp", label: "Imagens otimizadas (WebP)", description: "Use formato WebP para melhor compressão" },
      { id: "lazy", label: "Lazy loading ativado", description: "Carregue imagens sob demanda" },
      { id: "minify", label: "CSS/JS minificados", description: "Vite faz isso automaticamente em produção" },
      { id: "cdn", label: "CDN configurado", description: "Acelere entrega de assets globalmente" },
      { id: "compress", label: "Compressão gzip/brotli", description: "Reduza tamanho das requisições" },
    ],
  },
  {
    title: "Rastreamento e Analytics",
    icon: <Tag className="h-5 w-5 text-blue-500" />,
    items: [
      { id: "meta_pixel", label: "Meta Pixel instalado", description: "Para remarketing Facebook/Instagram" },
      { id: "ga4", label: "Google Analytics 4 configurado", description: "Métricas de audiência e comportamento" },
      { id: "gtm", label: "Tag Manager funcionando", description: "Gerenciamento centralizado de tags" },
      { id: "conversions", label: "Eventos de conversão criados", description: "Rastreie leads e vendas" },
      { id: "utm", label: "UTMs em campanhas", description: "Identifique origem do tráfego" },
    ],
  },
  {
    title: "SEO e Indexação",
    icon: <Search className="h-5 w-5 text-green-500" />,
    items: [
      { id: "title", label: "Title tag otimizada (<60 chars)", description: "Título atrativo com palavra-chave" },
      { id: "meta_desc", label: "Meta description definida", description: "Descrição persuasiva para SERP" },
      { id: "og", label: "Open Graph configurado", description: "Preview bonito ao compartilhar" },
      { id: "sitemap", label: "Sitemap.xml presente", description: "Facilite indexação pelo Google" },
      { id: "robots", label: "Robots.txt configurado", description: "Controle o que será indexado" },
      { id: "canonical", label: "URLs canônicas definidas", description: "Evite conteúdo duplicado" },
    ],
  },
  {
    title: "Conversão e UX",
    icon: <Target className="h-5 w-5 text-red-500" />,
    items: [
      { id: "form", label: "Formulário funcionando", description: "Teste envio de leads" },
      { id: "thankyou", label: "Thank you page configurada", description: "Página de confirmação após envio" },
      { id: "whatsapp", label: "WhatsApp CTA visível", description: "Botão flutuante ou destaque" },
      { id: "mobile", label: "Mobile responsive", description: "Funciona bem em todos os dispositivos" },
      { id: "cta", label: "CTAs claros e visíveis", description: "Botões de ação destacados" },
      { id: "loading", label: "Tempo de carregamento <3s", description: "Página carrega rapidamente" },
    ],
  },
];

const EXTERNAL_TOOLS = [
  { name: "PageSpeed Insights", url: "https://pagespeed.web.dev/", description: "Análise de performance do Google" },
  { name: "GTmetrix", url: "https://gtmetrix.com/", description: "Teste de velocidade detalhado" },
  { name: "Meta Pixel Helper", url: "https://chrome.google.com/webstore/detail/meta-pixel-helper/", description: "Extensão para validar pixel" },
  { name: "Tag Assistant", url: "https://tagassistant.google.com/", description: "Valide GTM e GA4" },
  { name: "Mobile-Friendly Test", url: "https://search.google.com/test/mobile-friendly", description: "Teste de responsividade" },
  { name: "Rich Results Test", url: "https://search.google.com/test/rich-results", description: "Teste dados estruturados" },
];

export function PerformanceTab() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("landing-checklist");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
    localStorage.setItem("landing-checklist", JSON.stringify([...newChecked]));
  };

  const totalItems = CHECKLIST_SECTIONS.reduce((acc, section) => acc + section.items.length, 0);
  const completedItems = checkedItems.size;
  const progress = Math.round((completedItems / totalItems) * 100);

  const resetChecklist = () => {
    setCheckedItems(new Set());
    localStorage.removeItem("landing-checklist");
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">Progresso da Otimização</h3>
              <p className="text-muted-foreground">
                {completedItems} de {totalItems} itens concluídos
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold">{progress}%</p>
                <Badge variant={progress === 100 ? "default" : "secondary"}>
                  {progress === 100 ? "Completo!" : "Em progresso"}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={resetChecklist}>
                Resetar
              </Button>
            </div>
          </div>
          <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklists */}
      <div className="grid gap-6 md:grid-cols-2">
        {CHECKLIST_SECTIONS.map((section) => {
          const sectionCompleted = section.items.filter((item) => checkedItems.has(item.id)).length;
          
          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">{section.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>
                        {sectionCompleted}/{section.items.length} concluídos
                      </CardDescription>
                    </div>
                  </div>
                  {sectionCompleted === section.items.length && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => toggleItem(item.id)}
                    >
                      <Checkbox
                        id={item.id}
                        checked={checkedItems.has(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <label
                          htmlFor={item.id}
                          className={`text-sm font-medium cursor-pointer ${
                            checkedItems.has(item.id) ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {item.label}
                        </label>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* External Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ferramentas Externas</CardTitle>
          <CardDescription>Links úteis para validação e análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXTERNAL_TOOLS.map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
