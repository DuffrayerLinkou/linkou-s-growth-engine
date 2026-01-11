import { motion } from "framer-motion";
import { format, differenceInDays, isPast, isToday, isFuture, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Clock, Circle, AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Phase, getAllPhases, getPhaseLabel } from "./JourneyStepper";

export interface PhaseDate {
  start: string | null;
  end: string | null;
  completed_at: string | null;
}

export interface PhaseDates {
  diagnostico: PhaseDate;
  estruturacao: PhaseDate;
  operacao_guiada: PhaseDate;
  transferencia: PhaseDate;
}

interface JourneyTimelineProps {
  currentPhase: Phase;
  phaseDates: PhaseDates;
  className?: string;
}

function getPhaseStatus(
  phaseId: Phase,
  currentPhase: Phase,
  phaseDates: PhaseDates
): "completed" | "current" | "upcoming" {
  const phases = getAllPhases();
  const phaseIndex = phases.findIndex((p) => p.id === phaseId);
  const currentIndex = phases.findIndex((p) => p.id === currentPhase);

  if (phaseDates[phaseId].completed_at) {
    return "completed";
  }
  if (phaseIndex < currentIndex) {
    return "completed";
  }
  if (phaseIndex === currentIndex) {
    return "current";
  }
  return "upcoming";
}

function getDeadlineStatus(
  endDate: string | null
): { status: "ok" | "warning" | "overdue" | "none"; daysLeft: number } {
  if (!endDate) return { status: "none", daysLeft: 0 };

  const end = parseISO(endDate);
  const today = new Date();
  const daysLeft = differenceInDays(end, today);

  if (isPast(end) && !isToday(end)) {
    return { status: "overdue", daysLeft: Math.abs(daysLeft) };
  }
  if (daysLeft <= 7) {
    return { status: "warning", daysLeft };
  }
  return { status: "ok", daysLeft };
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Não definido";
  
  const startStr = start ? format(parseISO(start), "dd/MM", { locale: ptBR }) : "?";
  const endStr = end ? format(parseISO(end), "dd/MM", { locale: ptBR }) : "?";
  
  return `${startStr} - ${endStr}`;
}

export function JourneyTimeline({ currentPhase, phaseDates, className }: JourneyTimelineProps) {
  const phases = getAllPhases();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop Timeline - Horizontal */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-6 left-8 right-8 h-1 bg-muted rounded-full" />
          
          {/* Progress Line */}
          <motion.div
            className="absolute top-6 left-8 h-1 bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${(phases.findIndex((p) => p.id === currentPhase) / (phases.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Phase Nodes */}
          <div className="relative flex justify-between">
            {phases.map((phase, index) => {
              const status = getPhaseStatus(phase.id, currentPhase, phaseDates);
              const dates = phaseDates[phase.id];
              const deadline = status === "current" ? getDeadlineStatus(dates.end) : { status: "none" as const, daysLeft: 0 };
              
              return (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center w-1/4"
                >
                  {/* Node */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all",
                      status === "completed" && "bg-primary border-primary text-primary-foreground",
                      status === "current" && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                      status === "upcoming" && "bg-muted border-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {status === "completed" ? (
                      <Check className="h-6 w-6" />
                    ) : status === "current" ? (
                      <Circle className="h-5 w-5 fill-current" />
                    ) : (
                      <span className="font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <p
                    className={cn(
                      "mt-3 font-medium text-sm text-center",
                      status === "current" ? "text-primary" : status === "completed" ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {phase.label}
                  </p>

                  {/* Date Range */}
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateRange(dates.start, dates.end)}
                  </p>

                  {/* Status Badge */}
                  <div className="mt-2">
                    {status === "completed" && dates.completed_at && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Concluída
                      </Badge>
                    )}
                    {status === "completed" && !dates.completed_at && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Concluída
                      </Badge>
                    )}
                    {status === "current" && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          deadline.status === "overdue" && "bg-red-500/10 text-red-600",
                          deadline.status === "warning" && "bg-yellow-500/10 text-yellow-600",
                          deadline.status === "ok" && "bg-blue-500/10 text-blue-600",
                          deadline.status === "none" && "bg-blue-500/10 text-blue-600"
                        )}
                      >
                        {deadline.status === "overdue" && (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {deadline.daysLeft}d atrasado
                          </>
                        )}
                        {deadline.status === "warning" && (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            {deadline.daysLeft}d restantes
                          </>
                        )}
                        {deadline.status === "ok" && (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            {deadline.daysLeft}d restantes
                          </>
                        )}
                        {deadline.status === "none" && (
                          <>
                            <Circle className="h-3 w-3 mr-1 fill-current" />
                            Em andamento
                          </>
                        )}
                      </Badge>
                    )}
                    {status === "upcoming" && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Prevista
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Timeline - Vertical */}
      <div className="md:hidden space-y-0">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase.id, currentPhase, phaseDates);
          const dates = phaseDates[phase.id];
          const deadline = status === "current" ? getDeadlineStatus(dates.end) : { status: "none" as const, daysLeft: 0 };
          const isLast = index === phases.length - 1;

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-3"
            >
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0",
                    status === "completed" && "bg-primary border-primary text-primary-foreground",
                    status === "current" && "bg-primary border-primary text-primary-foreground ring-2 ring-primary/20",
                    status === "upcoming" && "bg-muted border-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {status === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : status === "current" ? (
                    <Circle className="h-3 w-3 fill-current" />
                  ) : (
                    <span className="font-semibold text-xs">{index + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-[48px]",
                      status === "completed" ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className={cn("pb-4 flex-1 min-w-0", isLast && "pb-0")}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p
                    className={cn(
                      "font-medium text-sm",
                      status === "current" ? "text-primary" : status === "completed" ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {phase.label}
                  </p>
                  
                  {/* Status Badge */}
                  {status === "completed" && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-green-500/10 text-green-600">
                      <Check className="h-2.5 w-2.5 mr-0.5" />
                      OK
                    </Badge>
                  )}
                  {status === "current" && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-5",
                        deadline.status === "overdue" && "bg-red-500/10 text-red-600",
                        deadline.status === "warning" && "bg-yellow-500/10 text-yellow-600",
                        (deadline.status === "ok" || deadline.status === "none") && "bg-blue-500/10 text-blue-600"
                      )}
                    >
                      {deadline.status === "overdue" && `${deadline.daysLeft}d atraso`}
                      {deadline.status === "warning" && `${deadline.daysLeft}d`}
                      {deadline.status === "ok" && `${deadline.daysLeft}d`}
                      {deadline.status === "none" && "Atual"}
                    </Badge>
                  )}
                  {status === "upcoming" && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">Prev.</Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  {formatDateRange(dates.start, dates.end)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function getEmptyPhaseDates(): PhaseDates {
  return {
    diagnostico: { start: null, end: null, completed_at: null },
    estruturacao: { start: null, end: null, completed_at: null },
    operacao_guiada: { start: null, end: null, completed_at: null },
    transferencia: { start: null, end: null, completed_at: null },
  };
}

export function extractPhaseDatesFromClient(client: any): PhaseDates {
  return {
    diagnostico: {
      start: client.phase_diagnostico_start || null,
      end: client.phase_diagnostico_end || null,
      completed_at: client.phase_diagnostico_completed_at || null,
    },
    estruturacao: {
      start: client.phase_estruturacao_start || null,
      end: client.phase_estruturacao_end || null,
      completed_at: client.phase_estruturacao_completed_at || null,
    },
    operacao_guiada: {
      start: client.phase_operacao_guiada_start || null,
      end: client.phase_operacao_guiada_end || null,
      completed_at: client.phase_operacao_guiada_completed_at || null,
    },
    transferencia: {
      start: client.phase_transferencia_start || null,
      end: client.phase_transferencia_end || null,
      completed_at: client.phase_transferencia_completed_at || null,
    },
  };
}