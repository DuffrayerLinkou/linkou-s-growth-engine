import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target, Users, BarChart3, Calendar as CalendarIcon, DollarSign,
  Layers, FileText, AlertTriangle, Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

interface StrategicPlan {
  id: string;
  title: string;
  status: string | null;
  executive_summary?: string | null;
  objectives: Json | null;
  kpis: Json | null;
  personas: Json | null;
  funnel_strategy: Json | null;
  campaign_types: string[] | null;
  timeline_start: string | null;
  timeline_end: string | null;
  budget_allocation: Json | null;
  diagnostic?: Json | null;
  execution_plan?: Json | null;
  client_id: string;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  completed: "Concluído",
};

const asArray = (v: unknown): any[] => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object" && Array.isArray((v as any).list)) return (v as any).list;
  return [];
};

export default function PlanoEstrategico() {
  const { clientInfo } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("Cliente");

  useEffect(() => {
    if (clientInfo?.name) setClientName(clientInfo.name);
  }, [clientInfo]);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["client-strategic-plans", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      const { data, error } = await supabase
        .from("strategic_plans")
        .select("*")
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StrategicPlan[];
    },
    enabled: !!clientInfo?.id,
  });

  const handleDownload = async (plan: StrategicPlan) => {
    setDownloadingId(plan.id);
    try {
      const { generateStrategicPlanPDF } = await import("@/lib/pdf-generator");
      generateStrategicPlanPDF(plan as any, clientName);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <Target className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">Nenhum Plano Estratégico</h2>
        <p className="text-muted-foreground max-w-md">
          O plano estratégico do seu projeto será exibido aqui quando criado pela equipe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Plano Estratégico
        </h1>
        <p className="text-muted-foreground">
          Visão geral da estratégia de marketing do seu projeto
        </p>
      </div>

      {plans.map((plan) => {
        const objectives = asArray(plan.objectives);
        const kpis = asArray(plan.kpis);
        const personas = asArray(plan.personas);
        const diagnostic = plan.diagnostic as any;
        const execPlan = plan.execution_plan as any;
        const funnel = plan.funnel_strategy as any;
        const isFunnelObject = funnel && typeof funnel === "object" && !Array.isArray(funnel);
        const budget = plan.budget_allocation as any;

        return (
          <div key={plan.id} className="space-y-4">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-xl">{plan.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                        {statusLabels[plan.status || "draft"] || plan.status}
                      </Badge>
                      {(plan.timeline_start || plan.timeline_end) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          {plan.timeline_start && format(new Date(plan.timeline_start), "dd/MM/yyyy", { locale: ptBR })}
                          {plan.timeline_start && plan.timeline_end && " — "}
                          {plan.timeline_end && format(new Date(plan.timeline_end), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(plan)}
                    disabled={downloadingId === plan.id}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingId === plan.id ? "Gerando..." : "Baixar PDF"}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Executive Summary */}
            {plan.executive_summary && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Sumário Executivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{plan.executive_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Diagnóstico */}
            {diagnostic && typeof diagnostic === "object" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Diagnóstico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {diagnostic.current_situation && (
                    <p className="text-sm whitespace-pre-wrap">{diagnostic.current_situation}</p>
                  )}
                  {diagnostic.positioning && (
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-bold text-primary mb-1">POSICIONAMENTO</p>
                      <p className="text-sm">{diagnostic.positioning}</p>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Array.isArray(diagnostic.opportunities) && diagnostic.opportunities.length > 0 && (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                        <p className="text-xs font-bold text-green-600 mb-2">OPORTUNIDADES</p>
                        <ul className="space-y-1 text-sm">
                          {diagnostic.opportunities.map((o: string, i: number) => (
                            <li key={i} className="flex gap-2"><span className="text-green-600">•</span>{o}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(diagnostic.risks) && diagnostic.risks.length > 0 && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-xs font-bold text-destructive mb-2">RISCOS</p>
                        <ul className="space-y-1 text-sm">
                          {diagnostic.risks.map((r: string, i: number) => (
                            <li key={i} className="flex gap-2"><span className="text-destructive">•</span>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {Array.isArray(diagnostic.competitors) && diagnostic.competitors.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-2">CONCORRENTES</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {diagnostic.competitors.map((c: any, i: number) => (
                          <div key={i} className="border rounded-md p-2 text-xs">
                            <p className="font-semibold text-sm">{c.name}</p>
                            {c.strengths && <p className="mt-1"><span className="text-primary">Fortes:</span> {c.strengths}</p>}
                            {c.weaknesses && <p><span className="text-destructive">Fracos:</span> {c.weaknesses}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Personas */}
            {personas.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Personas ({personas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {personas.map((p: any, i: number) => typeof p === "string" ? (
                      <div key={i} className="border-l-4 border-primary p-3 rounded bg-muted/30 text-sm">{p}</div>
                    ) : (
                      <div key={i} className="border-l-4 border-primary p-3 rounded bg-muted/30 space-y-1.5">
                        <p className="font-semibold text-sm">{p.name || `Persona ${i + 1}`}</p>
                        {p.demographics && <p className="text-xs text-muted-foreground">{p.demographics}</p>}
                        {Array.isArray(p.pain_points) && p.pain_points.length > 0 && (
                          <div className="text-xs"><span className="font-semibold text-primary">Dores:</span> {p.pain_points.join(" • ")}</div>
                        )}
                        {Array.isArray(p.desires) && p.desires.length > 0 && (
                          <div className="text-xs"><span className="font-semibold text-primary">Desejos:</span> {p.desires.join(" • ")}</div>
                        )}
                        {Array.isArray(p.objections) && p.objections.length > 0 && (
                          <div className="text-xs"><span className="font-semibold text-primary">Objeções:</span> {p.objections.join(" • ")}</div>
                        )}
                        {Array.isArray(p.channels) && p.channels.length > 0 && (
                          <div className="text-xs"><span className="font-semibold text-primary">Canais:</span> {p.channels.join(", ")}</div>
                        )}
                        {p.message_hook && (
                          <div className="text-xs italic mt-1 pt-1 border-t">"{p.message_hook}"</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Objetivos */}
              {objectives.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Objetivos SMART ({objectives.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {objectives.map((o: any, i: number) => typeof o === "string" ? (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">{o}</div>
                    ) : (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1.5">
                        <p className="font-medium text-sm">{o.name || o.title}</p>
                        {o.description && <p className="text-xs text-muted-foreground">{o.description}</p>}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {o.metric && <Badge variant="outline" className="text-[10px]">{o.metric}</Badge>}
                          {o.baseline != null && <Badge variant="secondary" className="text-[10px]">Base: {o.baseline}</Badge>}
                          {o.target != null && <Badge className="text-[10px]">Meta: {o.target}</Badge>}
                          {o.deadline && <Badge variant="outline" className="text-[10px]">{o.deadline}</Badge>}
                          {o.owner && <Badge variant="outline" className="text-[10px]">{o.owner}</Badge>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* KPIs */}
              {kpis.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      KPIs ({kpis.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {kpis.map((k: any, i: number) => typeof k === "string" ? (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">{k}</div>
                    ) : (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{k.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {k.category && <span className="text-[10px] text-muted-foreground uppercase">{k.category}</span>}
                            {k.frequency && <span className="text-[10px] text-muted-foreground">· {k.frequency}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {k.target != null && <p className="font-bold text-primary text-sm">{k.target}{k.unit ? ` ${k.unit}` : ""}</p>}
                          {k.current != null && <p className="text-[10px] text-muted-foreground">Atual: {k.current}</p>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Funnel */}
            {funnel && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Estratégia de Funil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isFunnelObject ? (
                    <p className="text-sm whitespace-pre-wrap">{String(funnel)}</p>
                  ) : (
                    <div className="grid md:grid-cols-3 gap-3">
                      {(["topo", "meio", "fundo"] as const).map((stage) => {
                        const s = funnel[stage];
                        if (!s) return null;
                        return (
                          <div key={stage} className="border rounded-lg p-3 bg-muted/30 space-y-1.5">
                            <p className="text-xs font-bold uppercase text-primary">{stage}</p>
                            {s.goal && <p className="text-sm font-medium">{s.goal}</p>}
                            {Array.isArray(s.channels) && s.channels.length > 0 && (
                              <p className="text-xs text-muted-foreground"><span className="font-semibold">Canais:</span> {s.channels.join(", ")}</p>
                            )}
                            {s.creatives && (
                              <p className="text-xs text-muted-foreground"><span className="font-semibold">Criativos:</span> {s.creatives}</p>
                            )}
                            {s.kpi && <p className="text-xs text-muted-foreground"><span className="font-semibold">KPI:</span> {s.kpi}</p>}
                            {s.budget_pct != null && <Badge className="text-[10px]">{s.budget_pct}% do budget</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Budget */}
            {budget && typeof budget === "object" && Object.keys(budget).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Alocação de Budget
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {budget.total_monthly != null && (
                    <p className="text-sm font-bold text-primary">
                      Mensal: {Number(budget.total_monthly).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {budget.by_channel && typeof budget.by_channel === "object" && Object.keys(budget.by_channel).length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1">POR CANAL</p>
                        {Object.entries(budget.by_channel).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm py-1">
                            <span className="capitalize">{k.replace(/_/g, " ")}</span>
                            <span className="font-medium">{typeof v === "number" ? `${v}%` : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {budget.by_phase && typeof budget.by_phase === "object" && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1">POR ETAPA</p>
                        {Object.entries(budget.by_phase).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm py-1">
                            <span className="capitalize">{k}</span>
                            <span className="font-medium">{typeof v === "number" ? `${v}%` : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {budget.reserve_pct != null && (
                    <p className="text-xs text-muted-foreground">Reserva: {budget.reserve_pct}%</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Execution Plan */}
            {execPlan && typeof execPlan === "object" && Array.isArray(execPlan.waves) && execPlan.waves.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    Plano de Execução
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {execPlan.waves.map((w: any, i: number) => (
                    <div key={i} className="border-l-4 border-primary p-3 rounded bg-muted/30">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                        <p className="font-semibold text-sm">{w.name || `Onda ${i + 1}`}</p>
                        {w.period && <span className="text-xs text-muted-foreground">{w.period}</span>}
                      </div>
                      {Array.isArray(w.deliverables) && w.deliverables.length > 0 && (
                        <p className="text-xs"><span className="font-semibold text-primary">Entregas:</span> {w.deliverables.join(" • ")}</p>
                      )}
                      {Array.isArray(w.milestones) && w.milestones.length > 0 && (
                        <p className="text-xs mt-0.5"><span className="font-semibold text-primary">Marcos:</span> {w.milestones.join(" • ")}</p>
                      )}
                    </div>
                  ))}
                  {execPlan.governance && typeof execPlan.governance === "object" && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-bold text-muted-foreground mb-2">GOVERNANÇA</p>
                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        {execPlan.governance.call_cadence && <p><span className="font-semibold">Cadência:</span> {execPlan.governance.call_cadence}</p>}
                        {execPlan.governance.reports && <p><span className="font-semibold">Relatórios:</span> {execPlan.governance.reports}</p>}
                        {execPlan.governance.tools && <p><span className="font-semibold">Ferramentas:</span> {execPlan.governance.tools}</p>}
                        {execPlan.governance.responsibles && <p><span className="font-semibold">Responsáveis:</span> {execPlan.governance.responsibles}</p>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Campaign Types */}
            {plan.campaign_types && plan.campaign_types.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tipos de Campanha</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {plan.campaign_types.map((type, i) => (
                      <Badge key={i} variant="secondary">{type}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
