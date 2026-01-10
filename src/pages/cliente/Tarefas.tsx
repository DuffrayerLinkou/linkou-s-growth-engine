import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, AlertCircle, CheckCircle2, Loader2, Ban, Route, Filter, Star, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  TaskStatus,
  JourneyPhase,
  statusConfig,
  priorityConfig,
  journeyPhaseConfig,
  allPhases,
  isTaskOverdue,
} from "@/lib/task-config";

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
  executor_type: string | null;
}

export default function ClienteTarefas() {
  const { clientInfo, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);

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

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-tasks"] });
      toast({
        title: "Tarefa concluída!",
        description: "A tarefa foi marcada como concluída com sucesso.",
      });
      setTaskToComplete(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao concluir tarefa",
        description: error.message,
      });
    },
  });

  // Check if user can complete a task
  const canCompleteTask = (task: Task) => {
    return (
      task.executor_type === "client" &&
      task.assigned_to === user?.id &&
      task.status !== "completed"
    );
  };

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

  // Get status icon
  const getStatusIcon = (status: TaskStatus) => {
    const icons: Record<TaskStatus, typeof Circle> = {
      todo: Circle,
      backlog: Circle,
      in_progress: Loader2,
      blocked: Ban,
      completed: CheckCircle2,
    };
    return icons[status] || Circle;
  };

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
                        const StatusIcon = getStatusIcon(taskStatus);
                        const isCompleted = taskStatus === "completed";
                        const isMyTask = canCompleteTask(task);
                        const overdue = isTaskOverdue(task.due_date, task.status);

                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border",
                              isCompleted 
                                ? "bg-green-500/5 border-green-500/20" 
                                : isMyTask 
                                  ? "bg-amber-500/5 border-amber-500/30" 
                                  : overdue
                                    ? "bg-red-500/5 border-red-500/30"
                                    : "bg-card"
                            )}
                          >
                            <div className={`p-1.5 rounded-md ${statusConfig[taskStatus].color}`}>
                              <StatusIcon className={`h-4 w-4 ${taskStatus === "in_progress" ? "animate-spin" : ""}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                                  {task.title}
                                </p>
                                {isMyTask && (
                                  <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Sua Tarefa
                                  </Badge>
                                )}
                              </div>
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
                                  <span className={cn(
                                    "flex items-center gap-1",
                                    overdue ? "text-red-600 font-medium" : "text-muted-foreground"
                                  )}>
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                    {overdue && <AlertCircle className="h-3 w-3" />}
                                  </span>
                                )}
                              </div>
                              {isMyTask && (
                                <Button
                                  size="sm"
                                  className="mt-3"
                                  onClick={() => setTaskToComplete(task)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Marcar como Concluída
                                </Button>
                              )}
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
                    const StatusIcon = getStatusIcon(taskStatus);
                    const isCompleted = taskStatus === "completed";
                    const isMyTask = canCompleteTask(task);
                    const overdue = isTaskOverdue(task.due_date, task.status);

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border",
                          isCompleted 
                            ? "bg-green-500/5 border-green-500/20" 
                            : isMyTask 
                              ? "bg-amber-500/5 border-amber-500/30" 
                              : overdue
                                ? "bg-red-500/5 border-red-500/30"
                                : "bg-card"
                        )}
                      >
                        <div className={`p-1.5 rounded-md ${statusConfig[taskStatus].color}`}>
                          <StatusIcon className={`h-4 w-4 ${taskStatus === "in_progress" ? "animate-spin" : ""}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                              {task.title}
                            </p>
                            {isMyTask && (
                              <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Sua Tarefa
                              </Badge>
                            )}
                          </div>
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
                              <span className={cn(
                                "flex items-center gap-1",
                                overdue ? "text-red-600 font-medium" : "text-muted-foreground"
                              )}>
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                {overdue && <AlertCircle className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                          {isMyTask && (
                            <Button
                              size="sm"
                              className="mt-3"
                              onClick={() => setTaskToComplete(task)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Marcar como Concluída
                            </Button>
                          )}
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!taskToComplete} onOpenChange={() => setTaskToComplete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar tarefa como concluída?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está marcando a tarefa "{taskToComplete?.title}" como concluída. 
              Esta ação notificará a equipe sobre a conclusão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToComplete && completeTaskMutation.mutate(taskToComplete.id)}
              disabled={completeTaskMutation.isPending}
            >
              {completeTaskMutation.isPending ? "Concluindo..." : "Confirmar Conclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
