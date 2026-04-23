import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPhasesByService, ServiceType, ServicePhase } from "@/lib/service-phases-config";

// Phase é uma string opaca — pode ser qualquer chave de qualquer fluxo de serviço.
// Mantemos os antigos valores literais para compatibilidade com código que ainda usa "diagnostico" etc.
export type Phase = string;

interface JourneyStepperProps {
  currentPhase: Phase;
  serviceType?: ServiceType;
  compact?: boolean;
}

// ---------- Helpers service-aware ----------

export function getPhaseIndexForService(phase: Phase, serviceType: ServiceType = "auditoria"): number {
  const phases = getPhasesByService(serviceType);
  return phases.findIndex((p) => p.value === phase);
}

export function getPhaseLabelForService(phase: Phase, serviceType: ServiceType = "auditoria"): string {
  const phases = getPhasesByService(serviceType);
  return phases.find((p) => p.value === phase)?.label || phase;
}

export function getPhaseDescriptionForService(phase: Phase, serviceType: ServiceType = "auditoria"): string {
  const phases = getPhasesByService(serviceType);
  return phases.find((p) => p.value === phase)?.description || "";
}

export function getAllPhasesForService(serviceType: ServiceType = "auditoria"): Array<{ id: Phase; label: string; description: string }> {
  return getPhasesByService(serviceType).map((p) => ({
    id: p.value,
    label: p.label,
    description: p.description || "",
  }));
}

// ---------- Compatibilidade retro (assume auditoria) ----------

export function getPhaseIndex(phase: Phase): number {
  return getPhaseIndexForService(phase, "auditoria");
}

export function getPhaseLabel(phase: Phase): string {
  return getPhaseLabelForService(phase, "auditoria");
}

export function getPhaseDescription(phase: Phase): string {
  return getPhaseDescriptionForService(phase, "auditoria");
}

export function getAllPhases() {
  return getAllPhasesForService("auditoria");
}

// ---------- Componente ----------

export function JourneyStepper({ currentPhase, serviceType = "auditoria", compact = false }: JourneyStepperProps) {
  const phases = getAllPhasesForService(serviceType);
  const currentIndex = phases.findIndex((p) => p.id === currentPhase);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {phases.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={phase.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
              </div>
              {index < phases.length - 1 && (
                <div
                  className={cn(
                    "w-4 h-0.5 transition-colors",
                    index < currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Horizontal scroll container for mobile */}
      <div className="overflow-x-auto -mx-3 px-3 pb-2 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
        <div className="flex items-center justify-between min-w-[400px] sm:min-w-0">
          {phases.map((phase, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={phase.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-shrink-0">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-colors text-sm sm:text-base",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary text-primary-foreground ring-2 sm:ring-4 ring-primary/20",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : index + 1}
                  </motion.div>
                  <span
                    className={cn(
                      "text-[10px] sm:text-xs mt-1 sm:mt-2 text-center font-medium max-w-[60px] sm:max-w-[80px] leading-tight",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {phase.label}
                  </span>
                </div>
                {index < phases.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 rounded-full transition-colors min-w-[20px]",
                      index < currentIndex ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current phase description */}
      {currentIndex >= 0 && (
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-primary/5 border border-primary/10"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Circle className="h-4 w-4 text-primary fill-primary" />
            </div>
            <div>
              <p className="font-medium text-primary">{getPhaseLabelForService(currentPhase, serviceType)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {getPhaseDescriptionForService(currentPhase, serviceType)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
