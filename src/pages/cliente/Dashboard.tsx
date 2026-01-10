import { motion } from "framer-motion";
import { 
  FolderKanban, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ListTodo,
  Megaphone,
  FileText,
  AlertTriangle,
  ArrowRight,
  Download,
  Calendar,
  CheckSquare,
  Circle,
  Loader2,
  Ban
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

import { phaseLabels, phaseColors as importedPhaseColors } from "@/lib/status-config";

const phaseColors: Record<string, string> = {
  diagnostico: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  estruturacao: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  operacao_guiada: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  transferencia: "bg-green-500/10 text-green-600 dark:text-green-400",
};

const taskStatusLabels: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Andamento",
  blocked: "Bloqueado",
  completed: "Concluído",
};

const taskStatusColors: Record<string, string> = {
  todo: "text-muted-foreground",
  in_progress: "text-blue-500",
  blocked: "text-red-500",
  completed: "text-green-500",
};

const taskStatusIcons: Record<string, React.ReactNode> = {
  todo: <Circle className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
  blocked: <Ban className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  low: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
};

const campaignStatusLabels: Record<string, string> = {
  draft: "Rascunho",
  running: "Ativa",
  completed: "Concluída",
  paused: "Pausada",
};

const campaignStatusColors: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-600",
  running: "bg-green-500/10 text-green-600",
  completed: "bg-blue-500/10 text-blue-600",
  paused: "bg-yellow-500/10 text-yellow-600",
};

const fileTypeIcons: Record<string, React.ReactNode> = {
  document: <FileText className="h-5 w-5 text-blue-500" />,
  spreadsheet: <FileText className="h-5 w-5 text-green-500" />,
  presentation: <FileText className="h-5 w-5 text-orange-500" />,
  image: <FileText className="h-5 w-5 text-purple-500" />,
  default: <FileText className="h-5 w-5 text-muted-foreground" />,
};

export default function ClienteDashboard() {
  const { profile, clientInfo } = useAuth();
  const isPontoFocal = profile?.ponto_focal === true;

  // Query: Dados do cliente (fase e status)
  const { data: clientData, isLoading: loadingClient } = useQuery({
    queryKey: ["client-data", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("phase, status")
        .eq("id", clientInfo.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientInfo?.id,
  });

  // Query: Tarefas pendentes (não concluídas)
  const { data: pendingTasksCount, isLoading: loadingPendingTasks } = useQuery({
    queryKey: ["client-pending-tasks", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return 0;
      const { count, error } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientInfo.id)
        .eq("visible_to_client", true)
        .neq("status", "completed");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!clientInfo?.id,
  });

  // Query: Campanhas ativas (em execução)
  const { data: activeCampaignsCount, isLoading: loadingActiveCampaigns } = useQuery({
    queryKey: ["client-active-campaigns", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return 0;
      const { count, error } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientInfo.id)
        .eq("status", "running");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!clientInfo?.id,
  });


  // Query: Resumo de tarefas por status
  const { data: tasksSummary, isLoading: loadingTasksSummary } = useQuery({
    queryKey: ["client-tasks-summary", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return { todo: 0, in_progress: 0, blocked: 0, completed: 0, total: 0 };
      const { data, error } = await supabase
        .from("tasks")
        .select("status")
        .eq("client_id", clientInfo.id)
        .eq("visible_to_client", true);
      if (error) throw error;
      
      const summary = { todo: 0, in_progress: 0, blocked: 0, completed: 0, total: data?.length || 0 };
      data?.forEach((task) => {
        const status = task.status as keyof typeof summary;
        if (status in summary) summary[status]++;
      });
      return summary;
    },
    enabled: !!clientInfo?.id,
  });

  // Query: Próximas 5 tarefas urgentes
  const { data: upcomingTasks, isLoading: loadingUpcomingTasks } = useQuery({
    queryKey: ["client-upcoming-tasks", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, due_date, status, priority")
        .eq("client_id", clientInfo.id)
        .eq("visible_to_client", true)
        .neq("status", "completed")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientInfo?.id,
  });

  // Query: Campanhas pendentes de aprovação (ponto focal)
  const { data: pendingCampaigns, isLoading: loadingPendingCampaigns } = useQuery({
    queryKey: ["client-pending-campaigns", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id || !isPontoFocal) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, status")
        .eq("client_id", clientInfo.id)
        .eq("status", "pending_approval")
        .eq("approved_by_ponto_focal", false);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientInfo?.id && isPontoFocal,
  });


  // Query: 3 últimas campanhas
  const { data: recentCampaigns, isLoading: loadingRecentCampaigns } = useQuery({
    queryKey: ["client-recent-campaigns", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, status, approved_by_ponto_focal")
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientInfo?.id,
  });

  // Query: 3 últimos arquivos
  const { data: recentFiles, isLoading: loadingRecentFiles } = useQuery({
    queryKey: ["client-recent-files", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      const { data, error } = await supabase
        .from("files")
        .select("id, name, file_type, created_at, file_path")
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientInfo?.id,
  });

  // Query: Meus Projetos com progresso
  const { data: myProjects, isLoading: loadingMyProjects } = useQuery({
    queryKey: ["client-my-projects-progress", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      
      // Get projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, status, start_date, end_date")
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (projectsError) throw projectsError;
      
      // Get tasks for each project to calculate progress
      const projectsWithProgress = await Promise.all(
        (projects || []).map(async (project) => {
          const { data: tasks } = await supabase
            .from("tasks")
            .select("status")
            .eq("project_id", project.id)
            .eq("visible_to_client", true);
          
          const total = tasks?.length || 0;
          const completed = tasks?.filter(t => t.status === "completed").length || 0;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
          
          return { ...project, progress, totalTasks: total, completedTasks: completed };
        })
      );
      
      return projectsWithProgress;
    },
    enabled: !!clientInfo?.id,
  });

  // Query: Atividade recente (últimos 5 audit_logs)
  const { data: recentActivity, isLoading: loadingRecentActivity } = useQuery({
    queryKey: ["client-recent-activity", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, created_at, action, entity_type, old_data, new_data")
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientInfo?.id,
  });

  const formatActivityAction = (log: { action: string; entity_type: string; old_data: any; new_data: any }) => {
    if (log.action === "phase_changed") {
      const from = phaseLabels[log.old_data?.phase] || log.old_data?.phase || "?";
      const to = phaseLabels[log.new_data?.phase] || log.new_data?.phase || "?";
      return `Fase alterada de "${from}" para "${to}"`;
    }
    
    const entityLabels: Record<string, string> = {
      tasks: "Tarefa",
      experiments: "Campanha",
      learnings: "Aprendizado",
      files: "Arquivo",
      projects: "Projeto",
      clients: "Cliente",
    };
    
    const actionLabels: Record<string, string> = {
      created: "criado(a)",
      updated: "atualizado(a)",
      deleted: "removido(a)",
      approved: "aprovado(a)",
    };
    
    const entity = entityLabels[log.entity_type] || log.entity_type;
    const action = actionLabels[log.action] || log.action;
    
    return `${entity} ${action}`;
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "phase_changed": return <Activity className="h-4 w-4 text-purple-500" />;
      case "created": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "approved": return <CheckSquare className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return { label: "Vencido", class: "text-red-500 bg-red-500/10" };
    if (isToday(date)) return { label: "Hoje", class: "text-orange-500 bg-orange-500/10" };
    const days = differenceInDays(date, new Date());
    if (days <= 3) return { label: `${days}d`, class: "text-yellow-500 bg-yellow-500/10" };
    return null;
  };

  const taskProgress = tasksSummary ? Math.round((tasksSummary.completed / tasksSummary.total) * 100) || 0 : 0;
  const pendingApprovalsCount = pendingCampaigns?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Olá, {profile?.full_name?.split(" ")[0] || "Cliente"}! 👋
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-1"
        >
          Acompanhe seu progresso, tarefas e resultados.
        </motion.p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Fase da Jornada */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fase da Jornada</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingClient ? (
                <Skeleton className="h-8 w-32" />
              ) : clientData?.phase ? (
                <Badge className={`text-sm px-3 py-1 ${phaseColors[clientData.phase]}`}>
                  {phaseLabels[clientData.phase]}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Não definida</span>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tarefas Pendentes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <ListTodo className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingPendingTasks ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{pendingTasksCount}</div>
              )}
              <p className="text-xs text-muted-foreground">tarefas abertas</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Campanhas Ativas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Megaphone className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingActiveCampaigns ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{activeCampaignsCount}</div>
              )}
              <p className="text-xs text-muted-foreground">em execução</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tarefas Concluídas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingTasksSummary ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{tasksSummary?.completed || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">de {tasksSummary?.total || 0} tarefas</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Ações do Ponto Focal (apenas se for ponto focal e houver pendências) */}
      {isPontoFocal && pendingApprovalsCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Ações Pendentes</CardTitle>
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">
                  {pendingApprovalsCount}
                </Badge>
              </div>
              <CardDescription>Itens aguardando sua aprovação como ponto focal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {(pendingCampaigns?.length || 0) > 0 && (
                  <Link to="/cliente/campanhas">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Megaphone className="h-4 w-4" />
                      {pendingCampaigns?.length} campanha(s) para aprovar
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Progresso das Tarefas + Próximas Tarefas */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Progresso das Tarefas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Progresso das Tarefas
                <Link to="/cliente/tarefas">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingTasksSummary ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : tasksSummary && tasksSummary.total > 0 ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Concluídas</span>
                      <span className="font-medium">{tasksSummary.completed} de {tasksSummary.total}</span>
                    </div>
                    <Progress value={taskProgress} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(taskStatusLabels).map(([status, label]) => (
                      <div 
                        key={status} 
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                      >
                        <span className={taskStatusColors[status]}>
                          {taskStatusIcons[status]}
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="font-semibold">{tasksSummary[status as keyof typeof tasksSummary]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <ListTodo className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa registrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Próximas Tarefas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Próximas Tarefas</CardTitle>
              <CardDescription>Tarefas mais urgentes</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUpcomingTasks ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : upcomingTasks && upcomingTasks.length > 0 ? (
                <div className="space-y-2">
                  {upcomingTasks.map((task) => {
                    const dueDateStatus = getDueDateStatus(task.due_date);
                    return (
                      <div 
                        key={task.id} 
                        className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={taskStatusColors[task.status || "todo"]}>
                            {taskStatusIcons[task.status || "todo"]}
                          </span>
                          <p className="text-sm font-medium truncate">{task.title}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {(task.priority === "urgent" || task.priority === "high") && (
                            <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                              {priorityLabels[task.priority]}
                            </Badge>
                          )}
                          {dueDateStatus && (
                            <Badge variant="outline" className={`text-xs ${dueDateStatus.class}`}>
                              {dueDateStatus.label}
                            </Badge>
                          )}
                          {task.due_date && !dueDateStatus && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa pendente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Campanhas Recentes + Arquivos Recentes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Campanhas Recentes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Campanhas Recentes
                <Link to="/cliente/campanhas">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecentCampaigns ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentCampaigns && recentCampaigns.length > 0 ? (
                <div className="space-y-2">
                  {recentCampaigns.map((camp) => (
                    <div key={camp.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Megaphone className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <p className="text-sm font-medium truncate">{camp.name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={campaignStatusColors[camp.status || "draft"]}>
                          {campaignStatusLabels[camp.status || "draft"]}
                        </Badge>
                        {camp.approved_by_ponto_focal && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma campanha registrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Arquivos Recentes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Arquivos Recentes
                <Link to="/cliente/arquivos">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Ver todos <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecentFiles ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentFiles && recentFiles.length > 0 ? (
                <div className="space-y-2">
                  {recentFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {fileTypeIcons[file.file_type || "default"] || fileTypeIcons.default}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 flex-shrink-0"
                        onClick={async () => {
                          const { data } = await supabase.storage
                            .from("client-files")
                            .createSignedUrl(file.file_path, 60);
                          if (data?.signedUrl) {
                            window.open(data.signedUrl, "_blank");
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum arquivo disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Meus Projetos + Atividade Recente */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Meus Projetos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card>
            <CardHeader>
              <CardTitle>Meus Projetos</CardTitle>
              <CardDescription>Projetos com progresso de tarefas</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMyProjects ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : myProjects && myProjects.length > 0 ? (
                <div className="space-y-3">
                  {myProjects.map((project) => (
                    <div key={project.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-primary" />
                          <p className="font-medium text-sm">{project.name}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {project.status === "active" ? "Ativo" : project.status === "completed" ? "Concluído" : project.status}
                        </Badge>
                      </div>
                      {project.totalTasks > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Tarefas</span>
                            <span>{project.completedTasks}/{project.totalTasks}</span>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>
                      )}
                      {project.start_date && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(project.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          {project.end_date && ` - ${format(new Date(project.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FolderKanban className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum projeto vinculado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Atividade Recente */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas atualizações</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecentActivity ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {recentActivity.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{formatActivityAction(log)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma atividade recente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
