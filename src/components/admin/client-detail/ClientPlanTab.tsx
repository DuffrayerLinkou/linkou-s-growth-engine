import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Target, Users, BarChart3, Layers, Calendar, DollarSign, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface StrategicPlan {
  id: string;
  title: string;
  status: string | null;
  objectives: Json | null;
  kpis: Json | null;
  personas: Json | null;
  funnel_strategy: string | null;
  campaign_types: string[] | null;
  timeline_start: string | null;
  timeline_end: string | null;
  budget_allocation: Json | null;
  created_at: string | null;
}

export default function ClientPlanTab({ clientId }: { clientId: string }) {
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("strategic_plans")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setPlan(data as StrategicPlan);
      setIsLoading(false);
    };
    fetch();
  }, [clientId]);

  if (isLoading) return <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>;

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

  const objectives = Array.isArray(plan.objectives) ? plan.objectives : [];
  const kpis = Array.isArray(plan.kpis) ? plan.kpis : [];
  const personas = Array.isArray(plan.personas) ? plan.personas : [];
  const budget = plan.budget_allocation as Record<string, any> | null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{plan.title}</h3>
          <div className="flex items-center gap-2 mt-1">
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
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/onboarding")}>
          <ExternalLink className="h-4 w-4 mr-1" /> Editar no Onboarding
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {objectives.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Objetivos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {objectives.map((obj: any, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    {typeof obj === "string" ? obj : obj?.description || obj?.title || JSON.stringify(obj)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {kpis.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> KPIs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {kpis.map((kpi: any, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    {typeof kpi === "string" ? kpi : kpi?.name || kpi?.title || JSON.stringify(kpi)}
                    {kpi?.target && <Badge variant="outline" className="text-xs ml-1">Meta: {kpi.target}</Badge>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {personas.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Personas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {personas.map((p: any, i: number) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{typeof p === "string" ? p : p?.name || p?.title || `Persona ${i + 1}`}</span>
                    {p?.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {plan.funnel_strategy && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" /> Estratégia de Funil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{plan.funnel_strategy}</p>
            </CardContent>
          </Card>
        )}

        {plan.campaign_types && plan.campaign_types.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tipos de Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {plan.campaign_types.map((t, i) => (
                  <Badge key={i} variant="secondary">{t}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {budget && Object.keys(budget).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Alocação de Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(budget).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="font-medium">
                      {typeof val === "number" ? val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
