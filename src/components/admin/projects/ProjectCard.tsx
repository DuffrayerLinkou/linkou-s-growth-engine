import { motion } from "framer-motion";
import { Calendar, DollarSign, Building2, Megaphone, Sparkles, Lightbulb, ListChecks, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectStatusLabels, projectStatusColors } from "@/lib/status-config";
import { parseDateOnly } from "@/lib/utils";

export interface ProjectCardData {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  client_name: string | null;
  tasksTotal: number;
  tasksDone: number;
  campaignsCount: number;
  deliverablesCount: number;
  learningsCount: number;
}

interface Props {
  project: ProjectCardData;
  index: number;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusBorderColor: Record<string, string> = {
  planning: "before:bg-gray-400",
  active: "before:bg-green-500",
  paused: "before:bg-yellow-500",
  completed: "before:bg-blue-500",
};

const formatCurrency = (value: number | null) => {
  if (!value) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
};

export function ProjectCard({ project, index, onOpen, onEdit, onDelete }: Props) {
  const status = project.status || "planning";
  const progress = project.tasksTotal > 0 ? Math.round((project.tasksDone / project.tasksTotal) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Card
        onClick={onOpen}
        className={`relative overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-md transition-all before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${statusBorderColor[status] || "before:bg-gray-400"}`}
      >
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base leading-tight truncate">{project.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{project.client_name || "Sem cliente"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="secondary" className={projectStatusColors[status]}>
                {projectStatusLabels[status]}
              </Badge>
              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Ações do projeto"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {onEdit && (
                      <DropdownMenuItem onSelect={onEdit}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                    )}
                    {onEdit && onDelete && <DropdownMenuSeparator />}
                    {onDelete && (
                      <DropdownMenuItem
                        onSelect={onDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Apagar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">{project.description}</p>
          )}

          {/* Progresso */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                {project.tasksDone}/{project.tasksTotal} tarefas
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/40">
              <Megaphone className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
              <span className="text-sm font-semibold">{project.campaignsCount}</span>
              <span className="text-[10px] text-muted-foreground">campanhas</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/40">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
              <span className="text-sm font-semibold">{project.deliverablesCount}</span>
              <span className="text-[10px] text-muted-foreground">criativos</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-md bg-muted/40">
              <Lightbulb className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
              <span className="text-sm font-semibold">{project.learningsCount}</span>
              <span className="text-[10px] text-muted-foreground">aprendizados</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {project.start_date ? format((parseDateOnly(project.start_date) ?? new Date(0)), "dd/MM/yy", { locale: ptBR }) : "—"}
              {project.end_date && ` › ${format((parseDateOnly(project.end_date) ?? new Date(0)), "dd/MM/yy", { locale: ptBR })}`}
            </div>
            <div className="flex items-center gap-1 font-medium text-foreground">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(project.budget)}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}