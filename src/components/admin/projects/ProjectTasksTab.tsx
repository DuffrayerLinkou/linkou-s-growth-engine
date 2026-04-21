import { useEffect, useState } from "react";
import { Loader2, ListChecks, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  status: string | null;
  due_date: string | null;
  assignee?: { full_name: string | null } | null;
}

const statusLabel: Record<string, string> = {
  todo: "A fazer",
  in_progress: "Em andamento",
  review: "Revisão",
  done: "Concluído",
  blocked: "Bloqueado",
};

const statusColor: Record<string, string> = {
  todo: "bg-gray-500/10 text-gray-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  review: "bg-purple-500/10 text-purple-600",
  done: "bg-green-500/10 text-green-600",
  blocked: "bg-red-500/10 text-red-600",
};

export function ProjectTasksTab({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, due_date, assignee:profiles!tasks_assigned_to_fkey(full_name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setTasks((data as any) || []);
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ListChecks className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">Nenhuma tarefa vinculada a este projeto.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-md border hover:bg-muted/30 transition-colors">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{t.title}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {t.assignee?.full_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {t.assignee.full_name}
                </span>
              )}
              {t.due_date && <span>Prazo: {format(new Date(t.due_date), "dd/MM/yy", { locale: ptBR })}</span>}
            </div>
          </div>
          <Badge variant="secondary" className={statusColor[t.status || "todo"]}>
            {statusLabel[t.status || "todo"] || t.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}