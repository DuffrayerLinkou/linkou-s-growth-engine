import { useState, useEffect, useMemo } from "react";
import {
  FolderKanban,
  Search,
  Loader2,
  Filter,
  DollarSign,
  Sparkles,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard } from "@/components/admin/projects/ProjectCard";
import { ProjectDetailDialog } from "@/components/admin/projects/ProjectDetailDialog";
import {
  projectStatusLabels as statusLabels,
} from "@/lib/status-config";
import { useAuth } from "@/hooks/useAuth";

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
  clients?: { id: string; name: string };
}

interface ProjectWithStats extends Project {
  tasksTotal: number;
  tasksDone: number;
  campaignsCount: number;
  deliverablesCount: number;
  learningsCount: number;
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-md bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClienteProjetos() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activePeriodOnly, setActivePeriodOnly] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithStats | null>(null);
  const { toast } = useToast();

  const clientId = profile?.client_id;

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        const [projectsRes, statsRes] = await Promise.all([
          supabase
            .from("projects")
            .select("id, client_id, name, description, status, start_date, end_date, budget, created_at, clients(id, name)")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false }),
          supabase.rpc("get_project_stats", { _client_id: clientId }),
        ]);

        if (projectsRes.error) throw projectsRes.error;

        const statsByProject = new Map<string, {
          tasksTotal: number; tasksDone: number; campaignsCount: number;
          deliverablesCount: number; learningsCount: number;
        }>();
        (statsRes.data || []).forEach((s: any) => {
          statsByProject.set(s.project_id, {
            tasksTotal: s.tasks_total || 0,
            tasksDone: s.tasks_done || 0,
            campaignsCount: s.campaigns_count || 0,
            deliverablesCount: s.deliverables_count || 0,
            learningsCount: s.learnings_count || 0,
          });
        });

        const enriched: ProjectWithStats[] = (projectsRes.data || []).map((p: any) => ({
          ...p,
          tasksTotal: statsByProject.get(p.id)?.tasksTotal || 0,
          tasksDone: statsByProject.get(p.id)?.tasksDone || 0,
          campaignsCount: statsByProject.get(p.id)?.campaignsCount || 0,
          deliverablesCount: statsByProject.get(p.id)?.deliverablesCount || 0,
          learningsCount: statsByProject.get(p.id)?.learningsCount || 0,
        }));
        setProjects(enriched);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar projetos",
          description: "Tente novamente mais tarde.",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clientId, toast]);

  const today = new Date().toISOString().slice(0, 10);
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPeriod =
      !activePeriodOnly ||
      ((!project.start_date || project.start_date <= today) &&
        (!project.end_date || project.end_date >= today));
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const kpis = useMemo(() => {
    const active = projects.filter((p) => p.status === "active").length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const ongoingDeliveries = projects.reduce(
      (sum, p) => sum + (p.tasksTotal - p.tasksDone),
      0,
    );
    const recentLearnings = projects.reduce((sum, p) => sum + p.learningsCount, 0);
    return { active, totalBudget, ongoingDeliveries, recentLearnings };
  }, [projects]);

  const formatCurrency = (value: number) => {
    if (!value) return "R$ 0";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
        <p className="text-muted-foreground">
          Acompanhe as ondas de execução do seu plano estratégico.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Projetos ativos" value={kpis.active.toString()} />
        <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Budget alocado" value={formatCurrency(kpis.totalBudget)} />
        <KpiCard icon={<Sparkles className="h-4 w-4" />} label="Entregas em andamento" value={kpis.ongoingDeliveries.toString()} />
        <KpiCard icon={<Lightbulb className="h-4 w-4" />} label="Aprendizados" value={kpis.recentLearnings.toString()} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
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
        <div className="flex items-center gap-2 px-3 rounded-md border h-10">
          <Switch id="active-period" checked={activePeriodOnly} onCheckedChange={setActivePeriodOnly} />
          <Label htmlFor="active-period" className="text-sm cursor-pointer whitespace-nowrap">
            Período ativo
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum projeto encontrado</p>
            <p className="text-sm mt-1">Os projetos da sua conta aparecerão aqui.</p>
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
            />
          ))}
        </div>
      )}

      <ProjectDetailDialog
        project={
          selectedProject
            ? {
                id: selectedProject.id,
                name: selectedProject.name,
                description: selectedProject.description,
                status: selectedProject.status,
                start_date: selectedProject.start_date,
                end_date: selectedProject.end_date,
                budget: selectedProject.budget,
                created_at: selectedProject.created_at,
                client_name: selectedProject.clients?.name || null,
              }
            : null
        }
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
      />
    </div>
  );
}