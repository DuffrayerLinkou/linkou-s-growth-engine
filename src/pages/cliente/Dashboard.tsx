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

import { 
  phaseLabels, 
  phaseColorsDashboard as phaseColors,
  campaignStatusLabels,
  campaignStatusColors 
} from "@/lib/status-config";
import { 
  statusConfig, 
  priorityConfig 
} from "@/lib/task-config";

// Derivar labels e cores de task-config para manter consistência
const taskStatusLabels: Record<string, string> = Object.fromEntries(
  Object.entries(statusConfig).map(([key, config]) => [key, config.label])
);

const taskStatusColors: Record<string, string> = {
  todo: "text-muted-foreground",
  backlog: "text-muted-foreground",
  in_progress: "text-blue-500",
  blocked: "text-red-500",
  completed: "text-green-500",
};

const taskStatusIcons: Record<string, React.ReactNode> = {
  todo: <Circle className="h-4 w-4" />,
  backlog: <Circle className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
  blocked: <Ban className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
};

const priorityLabels: Record<string, string> = Object.fromEntries(
  Object.entries(priorityConfig).map(([key, config]) => [key, config.label])
);

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  low: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
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
      if (!clientInfo?.id) return { todo: 0, backlog: 0, in_progress: 0, blocked: 0, completed: 0, total: 0 };
      const { data, error } = await supabase
        .from("tasks")
        .select("status")
        .eq("client_id", clientInfo.id)
        .eq("visible_to_client", true);
      if (error) throw error;
      
      const summary = { todo: 0, backlog: 0, in_progress: 0, blocked: 0, completed: 0, total: data?.length || 0 };
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

  // Detect "new client" — no tasks and no campaigns yet
  const isNewClient =
    !loadingTasksSummary &&
    !loadingActiveCampaigns &&
    (tasksSummary?.total || 0) === 0 &&
    (activeCampaignsCount || 0) === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold tracking-tight"
        >
          Olá, {profile?.full_name?.split(" ")[0] || "Cliente"}! 👋
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm sm:text-base text-muted-foreground mt-1"
        >
          Acompanhe seu progresso, tarefas e resultados.
        </motion.p>
      </div>

      {/* Welcome Banner for New Clients */}
      {isNewClient && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">🚀</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg mb-1">Bem-vindo(a) à sua área de cliente!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Sua jornada está começando. Aqui estão os próximos passos para você aproveitar ao máximo a plataforma:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { emoji: "📋", label: "Acompanhe sua jornada", link: "/cliente/minha-jornada", desc: "Veja as fases do seu projeto" },
                  { emoji: "✅", label: "Veja suas tarefas", link: "/cliente/tarefas", desc: "Tarefas que dependem de você" },
                  { emoji: "📁", label: "Acesse seus arquivos", link: "/cliente/arquivos", desc: "Documentos compartilhados" },
                  { emoji: "📚", label: "Explore a base de conhecimento", link: "/cliente/base-conhecimento", desc: "Guias e dicas de marketing" },
                ].map((step) => (
                  <Link key={step.link} to={step.link}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                      <span className="text-xl">{step.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{step.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{step.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Fase da Jornada */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Fase da Jornada</CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {loadingClient ? (
                <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
              ) : clientData?.phase ? (
                <Badge className={`text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 ${phaseColors[clientData.phase]}`}>
                  {phaseLabels[clientData.phase]}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-xs sm:text-sm">Não definida</span>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tarefas Pendentes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Tarefas Pendentes</CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/10">
                <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {loadingPendingTasks ? (
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              ) : (
                <div className="text-xl sm:text-2xl font-bold">{pendingTasksCount}</div>
              )}
              <p className="text-[10px] sm:text-xs text-muted-foreground">tarefas abertas</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Campanhas Ativas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Campanhas Ativas</CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {loadingActiveCampaigns ? (
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              ) : (
                <div className="text-xl sm:text-2xl font-bold">{activeCampaignsCount}</div>
              )}
              <p className="text-[10px] sm:text-xs text-muted-foreground">em execução</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tarefas Concluídas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Tarefas Concluídas</CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {loadingTasksSummary ? (
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              ) : (
                <div className="text-xl sm:text-2xl font-bold">{tasksSummary?.completed || 0}</div>
              )}
              <p className="text-[10px] sm:text-xs text-muted-foreground">de {tasksSummary?.total || 0} tarefas</p>
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
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Progresso das Tarefas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="h-full">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base sm:text-lg">
                <span>Progresso das Tarefas</span>
                <Link to="/cliente/tarefas">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2">
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4">
              {loadingTasksSummary ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : tasksSummary && tasksSummary.total > 0 ? (
                <>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Concluídas</span>
                      <span className="font-medium">{tasksSummary.completed} de {tasksSummary.total}</span>
                    </div>
                    <Progress value={taskProgress} className="h-2 sm:h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {Object.entries(taskStatusLabels).map(([status, label]) => (
                      <div 
                        key={status} 
                        className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/50"
                      >
                        <span className={`${taskStatusColors[status]} shrink-0`}>
                          {taskStatusIcons[status]}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</p>
                          <p className="text-sm sm:text-base font-semibold">{tasksSummary[status as keyof typeof tasksSummary]}</p>
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
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Próximas Tarefas</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Tarefas mais urgentes</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {loadingUpcomingTasks ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 sm:h-12 w-full" />
                  ))}
                </div>
              ) : upcomingTasks && upcomingTasks.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2 overflow-x-hidden">
                  {upcomingTasks.map((task) => {
                    const dueDateStatus = getDueDateStatus(task.due_date);
                    return (
                      <div 
                        key={task.id} 
                        className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-muted/50 transition-colors overflow-hidden"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                          <span className={`${taskStatusColors[task.status || "todo"]} shrink-0`}>
                            {taskStatusIcons[task.status || "todo"]}
                          </span>
                          <p className="text-xs sm:text-sm font-medium truncate">{task.title}</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          {(task.priority === "urgent" || task.priority === "high") && (
                            <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 ${priorityColors[task.priority]}`}>
                              {task.priority === "urgent" ? "Urg" : "Alta"}
                            </Badge>
                          )}
                          {dueDateStatus && (
                            <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 ${dueDateStatus.class}`}>
                              {dueDateStatus.label}
                            </Badge>
                          )}
                          {task.due_date && !dueDateStatus && (
                            <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5">
                              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Campanhas Recentes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base sm:text-lg">
                <span>Campanhas Recentes</span>
                <Link to="/cliente/campanhas">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2">
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {loadingRecentCampaigns ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 sm:h-12 w-full" />
                  ))}
                </div>
              ) : recentCampaigns && recentCampaigns.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2 overflow-x-hidden">
                  {recentCampaigns.map((camp) => (
                    <div key={camp.id} className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                        <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                        <p className="text-xs sm:text-sm font-medium truncate">{camp.name}</p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <Badge className={`text-[10px] sm:text-xs px-1.5 ${campaignStatusColors[camp.status || "draft"]}`}>
                          {campaignStatusLabels[camp.status || "draft"]}
                        </Badge>
                        {camp.approved_by_ponto_focal && (
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
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
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base sm:text-lg">
                <span>Arquivos Recentes</span>
                <Link to="/cliente/arquivos">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2">
                    Ver todos <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {loadingRecentFiles ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 sm:h-12 w-full" />
                  ))}
                </div>
              ) : recentFiles && recentFiles.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2 overflow-x-hidden">
                  {recentFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                        <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
                          {fileTypeIcons[file.file_type || "default"] || fileTypeIcons.default}
                        </span>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                        onClick={async () => {
                          const { data } = await supabase.storage
                            .from("client-files")
                            .createSignedUrl(file.file_path, 60);
                          if (data?.signedUrl) {
                            window.open(data.signedUrl, "_blank");
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Meus Projetos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Meus Projetos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Projetos com progresso de tarefas</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {loadingMyProjects ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 sm:h-16 w-full" />
                  ))}
                </div>
              ) : myProjects && myProjects.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 overflow-x-hidden">
                  {myProjects.map((project) => (
                    <div key={project.id} className="p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors overflow-hidden">
                      <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
                          <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                          <p className="font-medium text-xs sm:text-sm truncate">{project.name}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 px-1.5">
                          {project.status === "active" ? "Ativo" : project.status === "completed" ? "OK" : project.status}
                        </Badge>
                      </div>
                      {project.totalTasks > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                            <span>Tarefas</span>
                            <span>{project.completedTasks}/{project.totalTasks}</span>
                          </div>
                          <Progress value={project.progress} className="h-1 sm:h-1.5" />
                        </div>
                      )}
                      {project.start_date && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 flex items-center gap-0.5 sm:gap-1 truncate">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                          {format(new Date(project.start_date), "dd/MM/yy", { locale: ptBR })}
                          {project.end_date && ` - ${format(new Date(project.end_date), "dd/MM/yy", { locale: ptBR })}`}
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
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Atividade Recente</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Últimas atualizações</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {loadingRecentActivity ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 sm:h-12 w-full" />
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2 overflow-x-hidden">
                  {recentActivity.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {getActivityIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-medium text-xs sm:text-sm truncate">{formatActivityAction(log)}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
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
