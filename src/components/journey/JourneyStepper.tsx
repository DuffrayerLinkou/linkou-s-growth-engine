import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type Phase = "diagnostico" | "estruturacao" | "operacao_guiada" | "transferencia";

interface JourneyStepperProps {
  currentPhase: Phase;
  compact?: boolean;
}

const phases: { id: Phase; label: string; description: string }[] = [
  {
    id: "diagnostico",
    label: "Diagnóstico",
    description: "Estamos mapeando gargalos e desperdícios para corrigir o que impede performance.",
  },
  {
    id: "estruturacao",
    label: "Estruturação",
    description: "Estamos montando base técnica e processo (dados, funil, integrações).",
  },
  {
    id: "operacao_guiada",
    label: "Operação Guiada",
    description: "Estamos rodando testes e otimizações enquanto treinamos seu ponto focal.",
  },
  {
    id: "transferencia",
    label: "Transferência",
    description: "Você tem o sistema documentado e pronto para operar com autonomia.",
  },
];

export function getPhaseIndex(phase: Phase): number {
  return phases.findIndex((p) => p.id === phase);
}

export function getPhaseLabel(phase: Phase): string {
  return phases.find((p) => p.id === phase)?.label || phase;
}

export function getPhaseDescription(phase: Phase): string {
  return phases.find((p) => p.id === phase)?.description || "";
}

export function getAllPhases() {
  return phases;
}

export function JourneyStepper({ currentPhase, compact = false }: JourneyStepperProps) {
  const currentIndex = getPhaseIndex(currentPhase);

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
            <p className="font-medium text-primary">{getPhaseLabel(currentPhase)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {getPhaseDescription(currentPhase)}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
