import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  GripVertical,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Route,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TaskStatus = "todo" | "backlog" | "in_progress" | "blocked" | "completed";
type JourneyPhase = "diagnostico" | "estruturacao" | "operacao_guiada" | "transferencia";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  client_id: string;
  project_id: string | null;
  assigned_to: string | null;
  created_at: string | null;
  journey_phase: string | null;
  visible_to_client: boolean | null;
  clients?: { name: string } | null;
}

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "A Fazer", color: "bg-slate-500/20 text-slate-600" },
  backlog: { label: "Backlog", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-600" },
  blocked: { label: "Bloqueado", color: "bg-red-500/20 text-red-600" },
  completed: { label: "Concluído", color: "bg-green-500/20 text-green-600" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-muted-foreground" },
  medium: { label: "Média", color: "text-yellow-600" },
  high: { label: "Alta", color: "text-orange-600" },
  urgent: { label: "Urgente", color: "text-red-600" },
};

const journeyPhaseConfig: Record<JourneyPhase, { label: string; color: string }> = {
  diagnostico: { label: "Diagnóstico", color: "bg-purple-500/20 text-purple-600" },
  estruturacao: { label: "Estruturação", color: "bg-blue-500/20 text-blue-600" },
  operacao_guiada: { label: "Operação Guiada", color: "bg-orange-500/20 text-orange-600" },
  transferencia: { label: "Transferência", color: "bg-green-500/20 text-green-600" },
};

const columns: TaskStatus[] = ["todo", "backlog", "in_progress", "blocked", "completed"];

export default function AdminTasks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_id: "",
    project_id: "",
    assigned_to: "",
    priority: "medium",
    due_date: "",
    status: "backlog",
    journey_phase: "",
    visible_to_client: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks with client info
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["admin-tasks", clientFilter, phaseFilter],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(`*, clients(name)`)
        .order("created_at", { ascending: false });

      if (clientFilter && clientFilter !== "all") {
        query = query.eq("client_id", clientFilter);
      }

      if (phaseFilter && phaseFilter !== "all") {
        query = query.eq("journey_phase", phaseFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
  });

  // Fetch clients for filter and form
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch admins/managers for assignment
  const { data: assignees = [] } = useQuery({
    queryKey: ["assignees-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name,
          user_roles!inner(role)
        `)
        .in("user_roles.role", ["admin", "account_manager"]);
      if (error) throw error;
      return data;
    },
  });

  // Create/Update task mutation
  const taskMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const taskData = {
        title: data.title,
        description: data.description || null,
        client_id: data.client_id,
        project_id: data.project_id || null,
        assigned_to: data.assigned_to || null,
        priority: data.priority,
        due_date: data.due_date || null,
        status: data.status,
        journey_phase: data.journey_phase === "none" ? null : data.journey_phase || null,
        visible_to_client: data.visible_to_client,
      };

      if (data.id) {
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert(taskData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      setIsDialogOpen(false);
      setEditingTask(null);
      resetForm();
      toast({
        title: editingTask ? "Tarefa atualizada!" : "Tarefa criada!",
        description: "A tarefa foi salva com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar tarefa",
        description: error.message,
      });
    },
  });

  // Update task status mutation (for drag and drop simulation)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      client_id: "",
      project_id: "",
      assigned_to: "",
      priority: "medium",
      due_date: "",
      status: "backlog",
      journey_phase: "",
      visible_to_client: true,
    });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      client_id: task.client_id,
      project_id: task.project_id || "",
      assigned_to: task.assigned_to || "",
      priority: task.priority || "medium",
      due_date: task.due_date || "",
      status: task.status || "backlog",
      journey_phase: task.journey_phase || "",
      visible_to_client: task.visible_to_client ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.client_id) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha o título e selecione um cliente.",
      });
      return;
    }
    taskMutation.mutate(editingTask ? { ...formData, id: editingTask.id } : formData);
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((task) => (task.status || "backlog") === status);

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie as tarefas de todos os clientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTask(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Título da tarefa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição detalhada..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, client_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assigned_to: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignees.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || "Sem nome"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fase da Jornada</Label>
                  <Select
                    value={formData.journey_phase}
                    onValueChange={(value) =>
                      setFormData({ ...formData, journey_phase: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sem fase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem fase</SelectItem>
                      <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                      <SelectItem value="estruturacao">Estruturação</SelectItem>
                      <SelectItem value="operacao_guiada">Operação Guiada</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {statusConfig[col].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="visible_to_client"
                  checked={formData.visible_to_client}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, visible_to_client: checked === true })
                  }
                />
                <Label htmlFor="visible_to_client" className="text-sm font-normal cursor-pointer">
                  Visível para o cliente
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={taskMutation.isPending}>
                  {taskMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Clientes</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por fase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Fases</SelectItem>
            <SelectItem value="diagnostico">Diagnóstico</SelectItem>
            <SelectItem value="estruturacao">Estruturação</SelectItem>
            <SelectItem value="operacao_guiada">Operação Guiada</SelectItem>
            <SelectItem value="transferencia">Transferência</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {tasksLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
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
                {getTasksByStatus(status).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="cursor-pointer"
                    onClick={() => openEditDialog(task)}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {task.visible_to_client === false && (
                              <EyeOff className="h-3 w-3 text-muted-foreground" />
                            )}
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {task.clients?.name || "Sem cliente"}
                          </Badge>
                          {task.journey_phase && journeyPhaseConfig[task.journey_phase as JourneyPhase] && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${journeyPhaseConfig[task.journey_phase as JourneyPhase].color}`}
                            >
                              <Route className="h-3 w-3 mr-1" />
                              {journeyPhaseConfig[task.journey_phase as JourneyPhase].label}
                            </Badge>
                          )}
                        </div>

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


                        {/* Quick status change buttons */}
                        <div className="flex gap-1 pt-1">
                          {columns
                            .filter((s) => s !== status)
                            .slice(0, 2)
                            .map((newStatus) => (
                              <Button
                                key={newStatus}
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveTask(task.id, newStatus);
                                }}
                              >
                                → {statusConfig[newStatus].label}
                              </Button>
                            ))}
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
      )}
    </div>
  );
}
