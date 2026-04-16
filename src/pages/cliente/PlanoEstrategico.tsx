import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Megaphone,
  Layers,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StrategicPlan {
  id: string;
  title: string;
  status: string | null;
  objectives: unknown;
  kpis: unknown;
  personas: unknown;
  funnel_strategy: string | null;
  campaign_types: string[] | null;
  timeline_start: string | null;
  timeline_end: string | null;
  budget_allocation: unknown;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  completed: "Concluído",
};

const statusColors: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-600",
  active: "bg-green-500/20 text-green-600",
  completed: "bg-blue-500/20 text-blue-600",
};

export default function PlanoEstrategico() {
  const { clientInfo } = useAuth();

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
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
        const objectives = Array.isArray(plan.objectives) ? plan.objectives : [];
        const kpis = Array.isArray(plan.kpis) ? plan.kpis : [];
        const personas = Array.isArray(plan.personas) ? plan.personas : [];
        const budgetAllocation = plan.budget_allocation && typeof plan.budget_allocation === "object"
          ? plan.budget_allocation
          : null;

        return (
          <div key={plan.id} className="space-y-4">
            {/* Plan Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  <Badge className={statusColors[plan.status || "draft"] || statusColors.draft}>
                    {statusLabels[plan.status || "draft"] || plan.status}
                  </Badge>
                </div>
                {(plan.timeline_start || plan.timeline_end) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="h-4 w-4" />
                    {plan.timeline_start && format(new Date(plan.timeline_start), "dd/MM/yyyy", { locale: ptBR })}
                    {plan.timeline_start && plan.timeline_end && " — "}
                    {plan.timeline_end && format(new Date(plan.timeline_end), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}
              </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Objectives */}
              {objectives.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Objetivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {objectives.map((obj, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <p className="font-medium text-sm">{typeof obj === "string" ? obj : obj.name}</p>
                        {typeof obj !== "string" && obj.description && (
                          <p className="text-xs text-muted-foreground mt-1">{obj.description}</p>
                        )}
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
                      <Layers className="h-4 w-4 text-primary" />
                      KPIs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {kpis.map((kpi, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">{typeof kpi === "string" ? kpi : kpi.name}</span>
                        {typeof kpi !== "string" && kpi.target && (
                          <Badge variant="outline" className="text-xs">{kpi.target}</Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Personas */}
              {personas.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Personas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {personas.map((persona, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <p className="font-medium text-sm">{typeof persona === "string" ? persona : persona.name}</p>
                        {typeof persona !== "string" && persona.description && (
                          <p className="text-xs text-muted-foreground mt-1">{persona.description}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Funnel Strategy */}
              {plan.funnel_strategy && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Estratégia de Funil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{plan.funnel_strategy}</p>
                  </CardContent>
                </Card>
              )}

              {/* Campaign Types */}
              {plan.campaign_types && plan.campaign_types.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-primary" />
                      Tipos de Campanha
                    </CardTitle>
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

              {/* Budget Allocation */}
              {budgetAllocation && Object.keys(budgetAllocation).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Alocação de Budget
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(budgetAllocation).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="text-sm capitalize">{String(key).replace(/_/g, " ")}</span>
                        <span className="text-sm font-semibold">
                          {typeof value === "number"
                            ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
