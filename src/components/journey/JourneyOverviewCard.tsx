import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Calendar, Clock, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Phase, getPhaseLabel, getAllPhases } from "./JourneyStepper";
import { PhaseDates } from "./JourneyTimeline";

interface JourneyOverviewCardProps {
  currentPhase: Phase;
  phaseDates: PhaseDates;
  phaseStartDate?: string | null;
}

export function JourneyOverviewCard({ currentPhase, phaseDates, phaseStartDate }: JourneyOverviewCardProps) {
  const phases = getAllPhases();
  const currentPhaseIndex = phases.findIndex((p) => p.id === currentPhase) + 1;
  const totalPhases = phases.length;
  const progressPercentage = Math.round((currentPhaseIndex / totalPhases) * 100);

  // Calculate days in current phase
  const currentPhaseDates = phaseDates[currentPhase];
  const startDate = currentPhaseDates.start || phaseStartDate;
  const daysInPhase = startDate 
    ? differenceInDays(new Date(), parseISO(startDate)) 
    : 0;

  // Calculate journey end prediction
  const lastPhase = phaseDates.transferencia;
  const journeyEndDate = lastPhase.end;

  // Calculate days until deadline
  const currentPhaseEnd = currentPhaseDates.end;
  const daysUntilDeadline = currentPhaseEnd 
    ? differenceInDays(parseISO(currentPhaseEnd), new Date())
    : null;

  const kpis = [
    {
      icon: Target,
      label: "Fase Atual",
      value: getPhaseLabel(currentPhase),
      subtext: `${currentPhaseIndex} de ${totalPhases}`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Clock,
      label: "Dias na Fase",
      value: daysInPhase > 0 ? `${daysInPhase}` : "-",
      subtext: daysInPhase > 0 ? "dias" : "Sem data de início",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Calendar,
      label: "Prazo da Fase",
      value: daysUntilDeadline !== null 
        ? daysUntilDeadline >= 0 
          ? `${daysUntilDeadline}` 
          : `${Math.abs(daysUntilDeadline)}`
        : "-",
      subtext: daysUntilDeadline !== null
        ? daysUntilDeadline >= 0
          ? "dias restantes"
          : "dias em atraso"
        : "Prazo não definido",
      color: daysUntilDeadline !== null && daysUntilDeadline < 0 
        ? "text-red-600" 
        : daysUntilDeadline !== null && daysUntilDeadline <= 7 
          ? "text-yellow-600" 
          : "text-green-600",
      bgColor: daysUntilDeadline !== null && daysUntilDeadline < 0 
        ? "bg-red-500/10" 
        : daysUntilDeadline !== null && daysUntilDeadline <= 7 
          ? "bg-yellow-500/10" 
          : "bg-green-500/10",
    },
    {
      icon: TrendingUp,
      label: "Previsão de Término",
      value: journeyEndDate 
        ? format(parseISO(journeyEndDate), "dd/MM/yyyy", { locale: ptBR })
        : "-",
      subtext: journeyEndDate ? "da jornada completa" : "Não definido",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <Card>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 sm:gap-3 p-2 sm:p-0 rounded-lg bg-muted/30 sm:bg-transparent"
            >
              <div className={`p-1.5 sm:p-2 rounded-lg ${kpi.bgColor} flex-shrink-0`}>
                <kpi.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${kpi.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{kpi.label}</p>
                <p className={`text-base sm:text-xl font-bold ${kpi.color} truncate`}>{kpi.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{kpi.subtext}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium">Progresso da Jornada</span>
            <span className="text-xs sm:text-sm text-muted-foreground">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
          <div className="flex justify-between mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground">
            <span>Início</span>
            <span>Transferência</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}