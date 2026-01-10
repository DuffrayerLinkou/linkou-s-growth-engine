import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, AlertCircle, CheckCircle2, Circle, Loader2, Ban, Route, Filter } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

type TaskStatus = "todo" | "backlog" | "in_progress" | "blocked" | "completed";
type JourneyPhase = "diagnostico" | "estruturacao" | "operacao_guiada" | "transferencia";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
  created_at: string | null;
  journey_phase: string | null;
  visible_to_client: boolean | null;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: typeof Circle }> = {
  todo: { label: "A Fazer", color: "bg-slate-500/20 text-slate-600", icon: Circle },
  backlog: { label: "Backlog", color: "bg-muted text-muted-foreground", icon: Circle },
  in_progress: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-600", icon: Loader2 },
  blocked: { label: "Bloqueado", color: "bg-red-500/20 text-red-600", icon: Ban },
  completed: { label: "Concluído", color: "bg-green-500/20 text-green-600", icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-muted-foreground" },
  medium: { label: "Média", color: "text-yellow-600" },
  high: { label: "Alta", color: "text-orange-600" },
  urgent: { label: "Urgente", color: "text-red-600" },
};

const journeyPhaseConfig: Record<JourneyPhase, { label: string; color: string; order: number }> = {
  diagnostico: { label: "Diagnóstico", color: "bg-purple-500/20 text-purple-600 border-purple-500/30", order: 1 },
  estruturacao: { label: "Estruturação", color: "bg-blue-500/20 text-blue-600 border-blue-500/30", order: 2 },
  operacao_guiada: { label: "Operação Guiada", color: "bg-orange-500/20 text-orange-600 border-orange-500/30", order: 3 },
  transferencia: { label: "Transferência", color: "bg-green-500/20 text-green-600 border-green-500/30", order: 4 },
};

const allPhases: JourneyPhase[] = ["diagnostico", "estruturacao", "operacao_guiada", "transferencia"];

export default function ClienteTarefas() {
  const { clientInfo } = useAuth();
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const currentClientPhase = clientInfo?.phase as JourneyPhase || "diagnostico";

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["client-tasks", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientInfo.id)
        .eq("visible_to_client", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!clientInfo?.id,
  });

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesPhase = phaseFilter === "all" || task.journey_phase === phaseFilter;
    const matchesStatus = statusFilter === "all" || (task.status || "backlog") === statusFilter;
    return matchesPhase && matchesStatus;
  });

  // Group tasks by phase
  const getTasksByPhase = (phase: JourneyPhase | null) =>
    filteredTasks.filter((task) => task.journey_phase === phase);

  const getTasksWithoutPhase = () =>
    filteredTasks.filter((task) => !task.journey_phase);

  // Calculate progress for a phase
  const getPhaseProgress = (phase: JourneyPhase) => {
    const phaseTasks = tasks.filter((t) => t.journey_phase === phase);
    if (phaseTasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = phaseTasks.filter((t) => t.status === "completed").length;
    return {
      completed,
      total: phaseTasks.length,
      percentage: Math.round((completed / phaseTasks.length) * 100),
    };
  };

  // Overall progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const overallPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
        <h1 className="text-3xl font-bold">Minhas Tarefas</h1>
        <p className="text-muted-foreground">
          Acompanhe o andamento das tarefas do seu projeto
        </p>
      </div>

      {/* Current Phase Banner */}
      <Card className={`border ${journeyPhaseConfig[currentClientPhase]?.color || ""}`}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${journeyPhaseConfig[currentClientPhase]?.color || "bg-muted"}`}>
                <Route className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fase Atual da Jornada</p>
                <p className="font-semibold">
                  {journeyPhaseConfig[currentClientPhase]?.label || "Diagnóstico"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progresso Geral</p>
                <p className="font-semibold">{completedTasks} de {totalTasks} tarefas</p>
              </div>
              <div className="w-24">
                <Progress value={overallPercentage} className="h-2" />
              </div>
              <span className="text-sm font-medium">{overallPercentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por fase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Fases</SelectItem>
            {allPhases.map((phase) => (
              <SelectItem key={phase} value={phase}>
                {journeyPhaseConfig[phase].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="todo">A Fazer</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Grouped by Phase */}
      <div className="space-y-6">
        {allPhases.map((phase, phaseIndex) => {
          const phaseTasks = getTasksByPhase(phase);
          const progress = getPhaseProgress(phase);
          const isCurrentPhase = phase === currentClientPhase;
          const phaseOrder = journeyPhaseConfig[phase].order;
          const currentPhaseOrder = journeyPhaseConfig[currentClientPhase].order;
          const isCompletedPhase = phaseOrder < currentPhaseOrder;
          const isFuturePhase = phaseOrder > currentPhaseOrder;

          // Skip phases with no tasks if filtering
          if (phaseFilter !== "all" && phaseTasks.length === 0) return null;

          return (
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseIndex * 0.1 }}
            >
              <Card className={isCurrentPhase ? `border-2 ${journeyPhaseConfig[phase].color.replace("bg-", "border-").split(" ")[0]}` : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="secondary" 
                        className={journeyPhaseConfig[phase].color}
                      >
                        {journeyPhaseConfig[phase].label}
                      </Badge>
                      {isCurrentPhase && (
                        <Badge variant="outline" className="text-xs">
                          Fase Atual
                        </Badge>
                      )}
                      {isCompletedPhase && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{progress.completed}/{progress.total}</span>
                      <Progress value={progress.percentage} className="w-20 h-2" />
                      <span>{progress.percentage}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {phaseTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {isFuturePhase 
                        ? "Tarefas desta fase serão liberadas em breve"
                        : "Nenhuma tarefa nesta fase"}
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {phaseTasks.map((task, index) => {
                        const taskStatus = (task.status || "backlog") as TaskStatus;
                        const StatusIcon = statusConfig[taskStatus].icon;
                        const isCompleted = taskStatus === "completed";

                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${
                              isCompleted ? "bg-green-500/5 border-green-500/20" : "bg-card"
                            }`}
                          >
                            <div className={`p-1.5 rounded-md ${statusConfig[taskStatus].color}`}>
                              <StatusIcon className={`h-4 w-4 ${taskStatus === "in_progress" ? "animate-spin" : ""}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs">
                                <Badge variant="secondary" className={statusConfig[taskStatus].color}>
                                  {statusConfig[taskStatus].label}
                                </Badge>
                                {task.priority && (
                                  <span className={`flex items-center gap-1 ${priorityConfig[task.priority]?.color || "text-muted-foreground"}`}>
                                    <AlertCircle className="h-3 w-3" />
                                    {priorityConfig[task.priority]?.label || task.priority}
                                  </span>
                                )}
                                {task.due_date && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Tasks without phase */}
        {getTasksWithoutPhase().length > 0 && phaseFilter === "all" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Outras Tarefas</Badge>
                  <span className="text-sm text-muted-foreground">
                    {getTasksWithoutPhase().length} tarefas
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {getTasksWithoutPhase().map((task, index) => {
                    const taskStatus = (task.status || "backlog") as TaskStatus;
                    const StatusIcon = statusConfig[taskStatus].icon;
                    const isCompleted = taskStatus === "completed";

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          isCompleted ? "bg-green-500/5 border-green-500/20" : "bg-card"
                        }`}
                      >
                        <div className={`p-1.5 rounded-md ${statusConfig[taskStatus].color}`}>
                          <StatusIcon className={`h-4 w-4 ${taskStatus === "in_progress" ? "animate-spin" : ""}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <Badge variant="secondary" className={statusConfig[taskStatus].color}>
                              {statusConfig[taskStatus].label}
                            </Badge>
                            {task.priority && (
                              <span className={`flex items-center gap-1 ${priorityConfig[task.priority]?.color || "text-muted-foreground"}`}>
                                <AlertCircle className="h-3 w-3" />
                                {priorityConfig[task.priority]?.label || task.priority}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {tasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa ainda</h3>
            <p className="text-muted-foreground">
              As tarefas do seu projeto aparecerão aqui quando forem criadas pela
              equipe.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
