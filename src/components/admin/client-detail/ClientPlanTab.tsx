import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FileText, Target, Users, BarChart3, Layers, Calendar as CalendarIcon, DollarSign, ExternalLink, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  created_at: string | null;
}

const asArray = (v: unknown): any[] => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object" && Array.isArray((v as any).list)) return (v as any).list;
  return [];
};

export default function ClientPlanTab({ clientId }: { clientId: string }) {
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [clientName, setClientName] = useState("Cliente");
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const [planRes, clientRes] = await Promise.all([
        supabase.from("strategic_plans").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("clients").select("name").eq("id", clientId).maybeSingle(),
      ]);
      if (planRes.data) setPlan(planRes.data as StrategicPlan);
      if (clientRes.data?.name) setClientName(clientRes.data.name);
      setIsLoading(false);
    };
    fetch();
  }, [clientId]);

  if (isLoading) return <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>;

  const downloadPDF = async () => {
    if (!plan) return;
    setDownloading(true);
    try {
      const { generateStrategicPlanPDF } = await import("@/lib/pdf-generator");
      generateStrategicPlanPDF(plan as any, clientName);
    } finally {
      setDownloading(false);
    }
  };

  if (!plan) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">Nenhum plano estratégico cadastrado para este cliente.</p>
          <Button variant="outline" onClick={() => navigate("/admin/onboarding")}>
            <ExternalLink className="h-4 w-4 mr-2" /> Ir para Onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  const objectives = asArray(plan.objectives);
  const kpis = asArray(plan.kpis);
  const personas = asArray(plan.personas);
  const budget = plan.budget_allocation as any;
  const diagnostic = plan.diagnostic as any;
  const execPlan = plan.execution_plan as any;
  const funnel = plan.funnel_strategy as any;
  const isFunnelObject = funnel && typeof funnel === "object" && !Array.isArray(funnel);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">{plan.title}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={plan.status === "active" ? "default" : "secondary"}>
              {plan.status === "active" ? "Ativo" : plan.status === "draft" ? "Rascunho" : plan.status || "—"}
            </Badge>
            {plan.timeline_start && plan.timeline_end && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(plan.timeline_start), "dd/MM/yy")} — {format(new Date(plan.timeline_end), "dd/MM/yy")}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadPDF} disabled={downloading}>
            <Download className="h-4 w-4 mr-1" /> {downloading ? "..." : "PDF"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/onboarding")}>
            <ExternalLink className="h-4 w-4 mr-1" /> Editar
          </Button>
        </div>
      </div>

      {plan.executive_summary && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Sumário Executivo</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap text-muted-foreground">{plan.executive_summary}</p></CardContent>
        </Card>
      )}

      {diagnostic && typeof diagnostic === "object" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Diagnóstico</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {diagnostic.current_situation && <p className="text-sm whitespace-pre-wrap">{diagnostic.current_situation}</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.isArray(diagnostic.opportunities) && diagnostic.opportunities.length > 0 && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                  <p className="text-xs font-bold text-green-600 mb-2">OPORTUNIDADES</p>
                  <ul className="space-y-1 text-sm">{diagnostic.opportunities.map((o: string, i: number) => <li key={i} className="flex gap-2"><span className="text-green-600">•</span>{o}</li>)}</ul>
                </div>
              )}
              {Array.isArray(diagnostic.risks) && diagnostic.risks.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-bold text-destructive mb-2">RISCOS</p>
                  <ul className="space-y-1 text-sm">{diagnostic.risks.map((r: string, i: number) => <li key={i} className="flex gap-2"><span className="text-destructive">•</span>{r}</li>)}</ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personas.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Personas ({personas.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {personas.map((p: any, i: number) => typeof p === "string" ? (
                  <div key={i} className="border-l-4 border-primary p-3 rounded bg-muted/30 text-sm">{p}</div>
                ) : (
                  <div key={i} className="border-l-4 border-primary p-3 rounded bg-muted/30 space-y-1.5">
                    <p className="font-semibold text-sm">{p.name || `Persona ${i + 1}`}</p>
                    {p.demographics && <p className="text-xs text-muted-foreground">{p.demographics}</p>}
                    {Array.isArray(p.pain_points) && p.pain_points.length > 0 && <div className="text-xs"><span className="font-semibold text-primary">Dores:</span> {p.pain_points.join(" • ")}</div>}
                    {Array.isArray(p.channels) && p.channels.length > 0 && <div className="text-xs"><span className="font-semibold text-primary">Canais:</span> {p.channels.join(", ")}</div>}
                    {p.message_hook && <div className="text-xs italic mt-1 pt-1 border-t">"{p.message_hook}"</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {objectives.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Objetivos SMART ({objectives.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {objectives.map((o: any, i: number) => typeof o === "string" ? (
                  <div key={i} className="text-sm flex gap-2"><span className="text-primary font-bold">•</span>{o}</div>
                ) : (
                  <div key={i} className="text-sm border rounded-md p-2">
                    <p className="font-medium">{o.name || o.title}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {o.metric && <Badge variant="outline" className="text-[10px]">{o.metric}</Badge>}
                      {o.baseline != null && <Badge variant="secondary" className="text-[10px]">Base: {o.baseline}</Badge>}
                      {o.target != null && <Badge className="text-[10px]">Meta: {o.target}</Badge>}
                      {o.deadline && <Badge variant="outline" className="text-[10px]">{o.deadline}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {kpis.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> KPIs ({kpis.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {kpis.map((k: any, i: number) => typeof k === "string" ? (
                  <div key={i} className="text-sm flex gap-2"><span className="text-primary font-bold">•</span>{k}</div>
                ) : (
                  <div key={i} className="text-sm flex items-center justify-between border rounded-md p-2">
                    <div>
                      <p className="font-medium">{k.name}</p>
                      {k.category && <span className="text-[10px] text-muted-foreground uppercase">{k.category}</span>}
                    </div>
                    <div className="text-right">
                      {k.target != null && <p className="font-bold text-primary">{k.target}{k.unit ? ` ${k.unit}` : ""}</p>}
                      {k.current != null && <p className="text-[10px] text-muted-foreground">Atual: {k.current}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <section className="space-y-4">
      {funnel && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" /> Estratégia de Funil</CardTitle>
            </CardHeader>
            <CardContent>
              {!isFunnelObject ? (
                <p className="text-sm whitespace-pre-wrap">{String(funnel)}</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-2">
                  {(["topo", "meio", "fundo"] as const).map((stage) => {
                    const s = funnel[stage];
                    if (!s) return null;
                    return (
                      <div key={stage} className="border rounded-lg p-3 bg-muted/30">
                        <p className="text-xs font-bold uppercase text-primary mb-2">{stage}</p>
                        {s.goal && <p className="text-sm font-medium mb-1">{s.goal}</p>}
                        {Array.isArray(s.channels) && <p className="text-xs text-muted-foreground"><span className="font-semibold">Canais:</span> {s.channels.join(", ")}</p>}
                        {s.kpi && <p className="text-xs text-muted-foreground"><span className="font-semibold">KPI:</span> {s.kpi}</p>}
                        {s.budget_pct != null && <Badge className="text-[10px] mt-2">{s.budget_pct}% do budget</Badge>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {budget && typeof budget === "object" && Object.keys(budget).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Alocação de Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {budget.total_monthly && (
                <p className="text-sm font-bold text-primary">
                  Mensal: {Number(budget.total_monthly).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                {budget.by_channel && typeof budget.by_channel === "object" && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">POR CANAL</p>
                    {Object.entries(budget.by_channel).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
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
                      <div key={k} className="flex justify-between text-sm">
                        <span className="capitalize">{k}</span>
                        <span className="font-medium">{typeof v === "number" ? `${v}%` : String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {execPlan && typeof execPlan === "object" && Array.isArray(execPlan.waves) && execPlan.waves.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Plano de Execução</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {execPlan.waves.map((w: any, i: number) => (
              <div key={i} className="border-l-4 border-primary p-3 rounded bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{w.name || `Onda ${i + 1}`}</p>
                  {w.period && <span className="text-xs text-muted-foreground">{w.period}</span>}
                </div>
                {Array.isArray(w.deliverables) && w.deliverables.length > 0 && <p className="text-xs"><span className="font-semibold text-primary">Entregas:</span> {w.deliverables.join(" • ")}</p>}
                {Array.isArray(w.milestones) && w.milestones.length > 0 && <p className="text-xs mt-0.5"><span className="font-semibold text-primary">Marcos:</span> {w.milestones.join(" • ")}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {plan.campaign_types && plan.campaign_types.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tipos de Campanha</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {plan.campaign_types.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}
            </div>
          </CardContent>
        </Card>
      )}
      </section>
    </div>
  );
}
