import { useState, useEffect, useMemo } from "react";
import {
  FolderKanban,
  Search,
  Plus,
  Building2,
  Loader2,
  Filter,
  DollarSign,
  Sparkles,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard, type ProjectCardData } from "@/components/admin/projects/ProjectCard";
import { ProjectDetailDialog } from "@/components/admin/projects/ProjectDetailDialog";

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  created_at: string;
  clients?: Client;
}

const projectSchema = z.object({
  client_id: z.string().min(1, "Selecione um cliente"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  description: z.string().max(1000).optional().or(z.literal("")),
  status: z.string().default("planning"),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  budget: z.string().optional().or(z.literal("")),
});

import {
  projectStatusLabels as statusLabels,
  projectStatusColors as statusColors,
} from "@/lib/status-config";

interface ProjectWithStats extends Project {
  tasksTotal: number;
  tasksDone: number;
  campaignsCount: number;
  deliverablesCount: number;
  learningsCount: number;
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [activePeriodOnly, setActivePeriodOnly] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: "",
    name: "",
    description: "",
    status: "planning",
    start_date: "",
    end_date: "",
    budget: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, clientsRes, tasksRes, campRes, learnRes] = await Promise.all([
        supabase
          .from("projects")
          .select("*, clients(id, name)")
          .order("created_at", { ascending: false }),
        supabase.from("clients").select("id, name").eq("status", "ativo"),
        supabase.from("tasks").select("project_id, status"),
        supabase.from("campaigns").select("project_id"),
        supabase.from("learnings").select("project_id"),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      const tasksByProject = new Map<string, { total: number; done: number }>();
      (tasksRes.data || []).forEach((t: any) => {
        if (!t.project_id) return;
        const cur = tasksByProject.get(t.project_id) || { total: 0, done: 0 };
        cur.total += 1;
        if (t.status === "done") cur.done += 1;
        tasksByProject.set(t.project_id, cur);
      });
      const countBy = (rows: any[]) => {
        const m = new Map<string, number>();
        rows.forEach((r) => {
          if (!r.project_id) return;
          m.set(r.project_id, (m.get(r.project_id) || 0) + 1);
        });
        return m;
      };
      const campMap = countBy(campRes.data || []);
      const learnMap = countBy(learnRes.data || []);

      const enriched: ProjectWithStats[] = (projectsRes.data || []).map((p: any) => ({
        ...p,
        tasksTotal: tasksByProject.get(p.id)?.total || 0,
        tasksDone: tasksByProject.get(p.id)?.done || 0,
        campaignsCount: campMap.get(p.id) || 0,
        deliverablesCount: 0,
        learningsCount: learnMap.get(p.id) || 0,
      }));
      setProjects(enriched);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openForm = (project?: ProjectWithStats | null) => {
    if (project) {
      setSelectedProject(project);
      setFormData({
        client_id: project.client_id,
        name: project.name,
        description: project.description || "",
        status: project.status || "planning",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        budget: project.budget?.toString() || "",
      });
    } else {
      setSelectedProject(null);
      setFormData({
        client_id: "",
        name: "",
        description: "",
        status: "planning",
        start_date: "",
        end_date: "",
        budget: "",
      });
    }
    setErrors({});
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    setErrors({});
    const result = projectSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        client_id: formData.client_id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      };

      if (selectedProject) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", selectedProject.id);

        if (error) throw error;

        // Refetch to get updated client data
        await fetchData();

        toast({
          title: "Projeto atualizado",
          description: "As informações foram salvas.",
        });
      } else {
        const { error } = await supabase.from("projects").insert(projectData);

        if (error) throw error;

        // Refetch to get new project with client data
        await fetchData();

        toast({
          title: "Projeto criado",
          description: "O novo projeto foi adicionado.",
        });
      }

      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", selectedProject.id);

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id));

      toast({
        title: "Projeto excluído",
        description: "O projeto foi removido com sucesso.",
      });

      setIsDeleteOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Tente novamente.",
      });
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clients?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesClient = clientFilter === "all" || project.client_id === clientFilter;
    const matchesPeriod = !activePeriodOnly || (
      (!project.start_date || project.start_date <= today) &&
      (!project.end_date || project.end_date >= today)
    );
    return matchesSearch && matchesStatus && matchesClient && matchesPeriod;
  });

  const kpis = useMemo(() => {
    const active = projects.filter((p) => p.status === "active").length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const ongoingDeliveries = projects.reduce((sum, p) => sum + (p.tasksTotal - p.tasksDone), 0);
    const recentLearnings = projects.reduce((sum, p) => sum + p.learningsCount, 0);
    return { active, totalBudget, ongoingDeliveries, recentLearnings };
  }, [projects]);

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie os projetos da agência.
          </p>
        </div>
        <Button onClick={() => openForm()} disabled={clients.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Projetos ativos" value={kpis.active.toString()} />
        <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Budget alocado" value={formatCurrency(kpis.totalBudget)} />
        <KpiCard icon={<Sparkles className="h-4 w-4" />} label="Entregas em andamento" value={kpis.ongoingDeliveries.toString()} />
        <KpiCard icon={<Lightbulb className="h-4 w-4" />} label="Aprendizados" value={kpis.recentLearnings.toString()} />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">
        <div className="relative col-span-full lg:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos ou clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-[170px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos clientes</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 px-3 rounded-md border h-10 col-span-full lg:col-auto justify-center sm:justify-start">
          <Switch id="active-period" checked={activePeriodOnly} onCheckedChange={setActivePeriodOnly} />
          <Label htmlFor="active-period" className="text-sm cursor-pointer whitespace-nowrap">
            Período ativo
          </Label>
        </div>
      </div>

      {/* Grid de projetos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4 opacity-50" />
            <p>Crie um cliente primeiro</p>
            <p className="text-sm">Projetos precisam estar vinculados a um cliente.</p>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum projeto encontrado</p>
            <Button variant="link" onClick={() => openForm()}>
              Criar primeiro projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              index={index}
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                start_date: project.start_date,
                end_date: project.end_date,
                budget: project.budget,
                client_name: project.clients?.name || null,
                tasksTotal: project.tasksTotal,
                tasksDone: project.tasksDone,
                campaignsCount: project.campaignsCount,
                deliverablesCount: project.deliverablesCount,
                learningsCount: project.learningsCount,
              }}
              onOpen={() => {
                setSelectedProject(project);
                setIsViewOpen(true);
              }}
              onEdit={() => openForm(project)}
              onDelete={() => {
                setSelectedProject(project);
                setIsDeleteOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedProject ? "Editar Projeto" : "Novo Projeto"}
            </DialogTitle>
            <DialogDescription>
              {selectedProject
                ? "Atualize as informações do projeto."
                : "Preencha os dados do novo projeto."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && (
                <p className="text-sm text-destructive">{errors.client_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do projeto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Campanha Q1 2025"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Hipótese / Objetivo</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Qual hipótese este projeto valida? Qual resultado esperado?"
                rows={3}
              />
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
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data término</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : selectedProject ? (
                "Salvar alterações"
              ) : (
                "Criar projeto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os experimentos, aprendizados,
              tarefas e arquivos vinculados a este projeto também serão
              excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject ? {
          id: selectedProject.id,
          name: selectedProject.name,
          description: selectedProject.description,
          status: selectedProject.status,
          start_date: selectedProject.start_date,
          end_date: selectedProject.end_date,
          budget: selectedProject.budget,
          created_at: selectedProject.created_at,
          client_name: selectedProject.clients?.name || null,
        } : null}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        onEdit={() => {
          setIsViewOpen(false);
          openForm(selectedProject);
        }}
      />
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2.5 rounded-md bg-primary/10 text-primary">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
