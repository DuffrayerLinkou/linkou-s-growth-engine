import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Calendar,
  AlertCircle,
  Route,
  Star,
  Users,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { TasksKanban } from "@/components/admin/TasksKanban";
import {
  TaskStatus,
  JourneyPhase,
  statusConfig,
  journeyPhaseConfig,
  statusColumns,
  allPhases,
} from "@/lib/task-config";

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
  executor_type: string | null;
  clients?: { name: string } | null;
}

export default function AdminTasks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
    executor_type: "internal" as "internal" | "client",
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

  // Fetch admins/managers for internal assignment
  const { data: internalAssignees = [] } = useQuery({
    queryKey: ["internal-assignees-list"],
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

  // Fetch client users for client assignment
  const { data: clientUsers = [] } = useQuery({
    queryKey: ["client-users-list", formData.client_id],
    queryFn: async () => {
      if (!formData.client_id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, ponto_focal")
        .eq("client_id", formData.client_id)
        .order("ponto_focal", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!formData.client_id,
  });

  // Build assignee names map
  const assigneeNames = useMemo(() => {
    const map = new Map<string, string>();
    internalAssignees.forEach((user) => {
      map.set(user.id, user.full_name || "Sem nome");
    });
    // Also add client users from all clients for display purposes
    return map;
  }, [internalAssignees]);

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
        executor_type: data.executor_type,
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

  // Update task status mutation (for drag and drop)
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

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      setIsDialogOpen(false);
      setEditingTask(null);
      setIsDeleteDialogOpen(false);
      resetForm();
      toast({
        title: "Tarefa excluída!",
        description: "A tarefa foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir tarefa",
        description: error.message,
      });
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
      executor_type: "internal",
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
      executor_type: (task.executor_type as "internal" | "client") || "internal",
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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateStatusMutation.mutateAsync({ id: taskId, status: newStatus });
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <Label>Tipo de Executor</Label>
                  <RadioGroup
                    value={formData.executor_type}
                    onValueChange={(value: "internal" | "client") =>
                      setFormData({ ...formData, executor_type: value, assigned_to: "" })
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="internal" id="executor-internal" />
                      <Label htmlFor="executor-internal" className="font-normal cursor-pointer">
                        Equipe Interna
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="client" id="executor-client" />
                      <Label htmlFor="executor-client" className="font-normal cursor-pointer">
                        Cliente
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Responsável</Label>
                {formData.executor_type === "internal" ? (
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assigned_to: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione da equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {internalAssignees.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || "Sem nome"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assigned_to: value })
                    }
                    disabled={!formData.client_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.client_id ? "Selecione do cliente" : "Selecione o cliente primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clientUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            {user.ponto_focal && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                            <span>{user.full_name || user.email}</span>
                            {user.ponto_focal && <span className="text-xs text-muted-foreground">(Ponto Focal)</span>}
                          </div>
                        </SelectItem>
                      ))}
                      {clientUsers.length === 0 && formData.client_id && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Nenhum usuário cadastrado para este cliente
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
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
                      {allPhases.map((phase) => (
                        <SelectItem key={phase} value={phase}>
                          {journeyPhaseConfig[phase].label}
                        </SelectItem>
                      ))}
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
                      {statusColumns.map((col) => (
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

              {/* Form Actions */}
              <div className={`flex pt-4 border-t ${editingTask ? 'justify-between' : 'justify-end'}`}>
                {editingTask && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={deleteTaskMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
                <div className="flex gap-2">
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
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tarefa "{editingTask?.title}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => editingTask && deleteTaskMutation.mutate(editingTask.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTaskMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            {allPhases.map((phase) => (
              <SelectItem key={phase} value={phase}>
                {journeyPhaseConfig[phase].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {tasksLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <TasksKanban
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onTaskClick={openEditDialog}
          assigneeNames={assigneeNames}
        />
      )}
    </div>
  );
}
