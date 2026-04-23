import { Circle, Loader2, Ban, CheckCircle2 } from "lucide-react";
import { servicePhases, getPhasesByService, ServiceType, ServicePhase } from "@/lib/service-phases-config";

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

// ---------- Service-aware helpers ----------

/**
 * Look up a phase across ALL service flows. `journey_phase` is a free text in the DB,
 * so a task can carry any phase value from any service (auditoria, gestao, design, ...).
 * Returns the first match found.
 */
export const findPhaseAcrossServices = (
  phaseValue: string | null | undefined,
): (ServicePhase & { serviceType: ServiceType }) | null => {
  if (!phaseValue) return null;
  for (const [serviceType, phases] of Object.entries(servicePhases) as [ServiceType, ServicePhase[]][]) {
    const found = phases.find((p) => p.value === phaseValue);
    if (found) return { ...found, serviceType };
  }
  return null;
};

export const getAnyPhaseLabel = (phaseValue: string | null | undefined, fallback = "Sem fase"): string => {
  if (!phaseValue) return fallback;
  return findPhaseAcrossServices(phaseValue)?.label || phaseValue;
};

export const getAnyPhaseColor = (phaseValue: string | null | undefined): string => {
  return findPhaseAcrossServices(phaseValue)?.color || "bg-muted text-muted-foreground border-muted";
};

export const getAnyPhaseOrder = (phaseValue: string | null | undefined): number => {
  return findPhaseAcrossServices(phaseValue)?.order ?? 0;
};

/**
 * All phases across all services, deduplicated by value. Useful for "all clients" filter.
 * When the same value exists in multiple services with different labels, the first one wins.
 */
export const getAllPhasesUnion = (): ServicePhase[] => {
  const seen = new Set<string>();
  const out: ServicePhase[] = [];
  for (const phases of Object.values(servicePhases)) {
    for (const p of phases) {
      if (!seen.has(p.value)) {
        seen.add(p.value);
        out.push(p);
      }
    }
  }
  return out;
};

export { getPhasesByService };
export type { ServiceType, ServicePhase };

// Helper to check if a task is overdue (timezone-safe for `date` columns)
import { parseDateOnly } from "@/lib/utils";
export const isTaskOverdue = (dueDate: string | null, status: string | null): boolean => {
  if (!dueDate || status === "completed") return false;
  const due = parseDateOnly(dueDate);
  if (!due) return false;
  // Compare date-only: a task with due_date = today is NOT overdue.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
};
