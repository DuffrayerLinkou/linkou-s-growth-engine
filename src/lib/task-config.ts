import { Circle, Loader2, Ban, CheckCircle2 } from "lucide-react";

export type TaskStatus = "todo" | "backlog" | "in_progress" | "blocked" | "completed";
export type JourneyPhase = "diagnostico" | "estruturacao" | "operacao_guiada" | "transferencia";

export const statusConfig: Record<TaskStatus, { label: string; color: string; icon: typeof Circle }> = {
  todo: { label: "A Fazer", color: "bg-slate-500/20 text-slate-600", icon: Circle },
  backlog: { label: "Backlog", color: "bg-muted text-muted-foreground", icon: Circle },
  in_progress: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-600", icon: Loader2 },
  blocked: { label: "Bloqueado", color: "bg-red-500/20 text-red-600", icon: Ban },
  completed: { label: "Concluído", color: "bg-green-500/20 text-green-600", icon: CheckCircle2 },
};

export const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-muted-foreground" },
  medium: { label: "Média", color: "text-yellow-600" },
  high: { label: "Alta", color: "text-orange-600" },
  urgent: { label: "Urgente", color: "text-red-600" },
};

export const journeyPhaseConfig: Record<JourneyPhase, { label: string; color: string; order: number }> = {
  diagnostico: { label: "Diagnóstico", color: "bg-purple-500/20 text-purple-600 border-purple-500/30", order: 1 },
  estruturacao: { label: "Estruturação", color: "bg-blue-500/20 text-blue-600 border-blue-500/30", order: 2 },
  operacao_guiada: { label: "Operação Guiada", color: "bg-orange-500/20 text-orange-600 border-orange-500/30", order: 3 },
  transferencia: { label: "Transferência", color: "bg-green-500/20 text-green-600 border-green-500/30", order: 4 },
};

export const statusColumns: TaskStatus[] = ["todo", "backlog", "in_progress", "blocked", "completed"];
export const allPhases: JourneyPhase[] = ["diagnostico", "estruturacao", "operacao_guiada", "transferencia"];

// Helper to check if a task is overdue
export const isTaskOverdue = (dueDate: string | null, status: string | null): boolean => {
  if (!dueDate || status === "completed") return false;
  return new Date(dueDate) < new Date();
};
