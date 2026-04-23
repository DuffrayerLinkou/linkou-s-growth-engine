import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FolderKanban, Building2, Calendar, DollarSign, Pencil, Loader2, ListChecks, Megaphone, Lightbulb, FileText, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { projectStatusColors, projectStatusLabels } from "@/lib/status-config";
import { ProjectTasksTab } from "./ProjectTasksTab";
import { ProjectCampaignsTab } from "./ProjectCampaignsTab";
import { ProjectLearningsTab } from "./ProjectLearningsTab";
import { ProjectFilesTab } from "./ProjectFilesTab";
import { parseDateOnly } from "@/lib/utils";

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  created_at: string;
  client_name: string | null;
}

interface Counts {
  tasksTotal: number;
  tasksDone: number;
  campaigns: number;
  deliverables: number;
  learnings: number;
  files: number;
}

interface Props {
  project: ProjectDetail | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit?: () => void;
}

const formatCurrency = (v: number | null) =>
  !v ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function ProjectDetailDialog({ project, open, onOpenChange, onEdit }: Props) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    if (!open || !project) return;
    setLoadingCounts(true);
    (async () => {
      const [tasksRes, doneRes, campRes, learnRes, filesRes] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", project.id),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", project.id).eq("status", "done"),
        supabase.from("campaigns").select("id").eq("project_id", project.id),
        supabase.from("learnings").select("id", { count: "exact", head: true }).eq("project_id", project.id),
        supabase.from("files").select("id", { count: "exact", head: true }).eq("project_id", project.id),
      ]);
      const campaignIds = (campRes.data || []).map((c: any) => c.id);
      let demandsCount = 0;
      if (campaignIds.length > 0) {
        const { count } = await supabase
          .from("creative_demands")
          .select("id", { count: "exact", head: true })
          .in("campaign_id", campaignIds);
        demandsCount = count || 0;
      }
      setCounts({
        tasksTotal: tasksRes.count || 0,
        tasksDone: doneRes.count || 0,
        campaigns: campaignIds.length,
        deliverables: demandsCount,
        learnings: learnRes.count || 0,
        files: filesRes.count || 0,
      });
      setLoadingCounts(false);
    })();
  }, [open, project]);

  if (!project) return null;

  const status = project.status || "planning";
  const progress = counts && counts.tasksTotal > 0 ? Math.round((counts.tasksDone / counts.tasksTotal) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FolderKanban className="h-5 w-5 text-primary" />
                {project.name}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {project.client_name || "—"}
                </span>
                <Badge variant="secondary" className={projectStatusColors[status]}>
                  {projectStatusLabels[status]}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <div className="overflow-x-auto -mx-1 px-1 scrollbar-none">
            <TabsList className="inline-flex md:grid md:grid-cols-5 md:w-full whitespace-nowrap">
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1.5">
                <ListChecks className="h-3.5 w-3.5" />
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="gap-1.5">
                <Megaphone className="h-3.5 w-3.5" />
                Campanhas
              </TabsTrigger>
              <TabsTrigger value="learnings" className="gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                Aprendizados
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Arquivos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-5 mt-5">
            {project.description && (
              <div className="p-4 rounded-md bg-muted/40 border-l-4 border-primary">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Hipótese / Objetivo</p>
                <p className="text-sm leading-relaxed">{project.description}</p>
              </div>
            )}

            {counts && counts.tasksTotal > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso de tarefas</span>
                  <span className="font-semibold">
                    {counts.tasksDone}/{counts.tasksTotal} · {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-md border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Início
                </div>
                <p className="font-medium text-sm">
                  {project.start_date ? format((parseDateOnly(project.start_date) ?? new Date(0)), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                </p>
              </div>
              <div className="p-3 rounded-md border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Término
                </div>
                <p className="font-medium text-sm">
                  {project.end_date ? format((parseDateOnly(project.end_date) ?? new Date(0)), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                </p>
              </div>
              <div className="p-3 rounded-md border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Budget
                </div>
                <p className="font-medium text-sm">{formatCurrency(project.budget)}</p>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground mb-1">Criado em</div>
                <p className="font-medium text-sm">
                  {format(new Date(project.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {loadingCounts ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : counts && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatBox icon={<Megaphone className="h-4 w-4" />} label="Campanhas" value={counts.campaigns} />
                <StatBox icon={<Sparkles className="h-4 w-4" />} label="Criativos" value={counts.deliverables} />
                <StatBox icon={<ListChecks className="h-4 w-4" />} label="Tarefas" value={counts.tasksTotal} />
                <StatBox icon={<Lightbulb className="h-4 w-4" />} label="Aprendizados" value={counts.learnings} />
                <StatBox icon={<FileText className="h-4 w-4" />} label="Arquivos" value={counts.files} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-5">
            <ProjectTasksTab projectId={project.id} />
          </TabsContent>
          <TabsContent value="campaigns" className="mt-5">
            <ProjectCampaignsTab projectId={project.id} />
          </TabsContent>
          <TabsContent value="learnings" className="mt-5">
            <ProjectLearningsTab projectId={project.id} />
          </TabsContent>
          <TabsContent value="files" className="mt-5">
            <ProjectFilesTab projectId={project.id} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {onEdit && (
            <Button onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar projeto
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="p-3 rounded-md bg-muted/40 flex items-center gap-3">
      <div className="p-2 rounded-md bg-background text-muted-foreground">{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}