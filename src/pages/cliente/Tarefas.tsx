import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, AlertCircle, User, CheckCircle2, Circle, Loader2, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TaskStatus = "backlog" | "in_progress" | "blocked" | "completed";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
  created_at: string | null;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: typeof Circle }> = {
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

export default function ClienteTarefas() {
  const { clientInfo } = useAuth();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["client-tasks", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!clientInfo?.id,
  });

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((task) => (task.status || "backlog") === status);

  const columns: TaskStatus[] = ["backlog", "in_progress", "blocked", "completed"];

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {columns.map((status) => {
          const count = getTasksByStatus(status).length;
          const StatusIcon = statusConfig[status].icon;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {statusConfig[status].label}
                    </p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${statusConfig[status].color}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((status) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-md text-xs ${statusConfig[status].color}`}
                >
                  {statusConfig[status].label}
                </span>
                <span className="text-muted-foreground text-sm">
                  ({getTasksByStatus(status).length})
                </span>
              </h3>
            </div>

            <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
              {getTasksByStatus(status).map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 space-y-2">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        {task.priority && (
                          <span
                            className={`flex items-center gap-1 ${
                              priorityConfig[task.priority]?.color ||
                              "text-muted-foreground"
                            }`}
                          >
                            <AlertCircle className="h-3 w-3" />
                            {priorityConfig[task.priority]?.label || task.priority}
                          </span>
                        )}

                        {task.due_date && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(task.due_date), "dd/MM", {
                              locale: ptBR,
                            })}
                          </span>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {getTasksByStatus(status).length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Nenhuma tarefa
                </div>
              )}
            </div>
          </div>
        ))}
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
