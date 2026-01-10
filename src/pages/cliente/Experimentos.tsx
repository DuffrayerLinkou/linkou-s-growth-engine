import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FlaskConical,
  Target,
  Calendar,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommentSection } from "@/components/cliente/CommentSection";
import { ApprovalButton } from "@/components/cliente/ApprovalButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

type ExperimentStatus = "draft" | "running" | "completed" | "failed";

interface Experiment {
  id: string;
  name: string;
  description: string | null;
  hypothesis: string | null;
  status: string | null;
  results: string | null;
  metrics: Record<string, unknown> | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  project_id: string;
  approved_by_ponto_focal: boolean;
  approved_at: string | null;
  approved_by: string | null;
  projects?: {
    name: string;
  } | null;
  approver?: {
    full_name: string | null;
  } | null;
}

const statusConfig: Record<
  ExperimentStatus,
  { label: string; color: string }
> = {
  draft: { label: "Rascunho", color: "bg-slate-500/20 text-slate-600 border-slate-500/30" },
  running: { label: "Em Execução", color: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
  completed: { label: "Concluído", color: "bg-green-500/20 text-green-600 border-green-500/30" },
  failed: { label: "Falhou", color: "bg-red-500/20 text-red-600 border-red-500/30" },
};

export default function ClienteExperimentos() {
  const { clientInfo } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: experiments = [], isLoading } = useQuery({
    queryKey: ["client-experiments", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];

      const { data, error } = await supabase
        .from("experiments")
        .select(`
          *,
          projects:project_id (name),
          approver:approved_by (full_name)
        `)
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Experiment[];
    },
    enabled: !!clientInfo?.id,
  });

  const filteredExperiments = experiments.filter((exp) => {
    if (statusFilter === "all") return true;
    return exp.status === statusFilter;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Stats
  const totalExperiments = experiments.length;
  const runningExperiments = experiments.filter((e) => e.status === "running").length;
  const completedExperiments = experiments.filter((e) => e.status === "completed").length;
  const approvedExperiments = experiments.filter((e) => e.approved_by_ponto_focal).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Experimentos</h1>
        <p className="text-muted-foreground">
          Acompanhe os experimentos realizados em seu projeto
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalExperiments}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runningExperiments}</p>
                <p className="text-xs text-muted-foreground">Em Execução</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedExperiments}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FlaskConical className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedExperiments}</p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="running">Em Execução</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Experiments List */}
      <div className="space-y-4">
        {filteredExperiments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum experimento ainda</h3>
              <p className="text-muted-foreground">
                Os experimentos do seu projeto aparecerão aqui quando forem criados.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredExperiments.map((experiment, index) => {
            const status = (experiment.status || "draft") as ExperimentStatus;
            const isExpanded = expandedIds.has(experiment.id);

            return (
              <motion.div
                key={experiment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(experiment.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className={statusConfig[status].color}>
                              {statusConfig[status].label}
                            </Badge>
                            {experiment.projects?.name && (
                              <Badge variant="outline">{experiment.projects.name}</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{experiment.name}</CardTitle>
                          {experiment.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {experiment.description}
                            </p>
                          )}
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        {experiment.start_date && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Início: {format(new Date(experiment.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        {experiment.end_date && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Fim: {format(new Date(experiment.end_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        <ApprovalButton
                          entityType="experiment"
                          entityId={experiment.id}
                          clientId={clientInfo?.id || ""}
                          isApproved={experiment.approved_by_ponto_focal}
                          approvedAt={experiment.approved_at}
                          approvedByName={experiment.approver?.full_name}
                        />
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {experiment.hypothesis && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Hipótese</p>
                            <p className="text-sm">{experiment.hypothesis}</p>
                          </div>
                        )}

                        {experiment.results && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-xs font-medium text-green-600 mb-1">Resultados</p>
                            <p className="text-sm">{experiment.results}</p>
                          </div>
                        )}

                        {experiment.metrics && Object.keys(experiment.metrics).length > 0 && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Métricas</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(experiment.metrics).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="text-muted-foreground">{key}:</span>{" "}
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t pt-4">
                          <CommentSection
                            entityType="experiment"
                            entityId={experiment.id}
                            clientId={clientInfo?.id || ""}
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
