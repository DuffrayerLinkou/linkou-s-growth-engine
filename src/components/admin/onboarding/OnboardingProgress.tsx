import { CheckCircle2, Circle, Clock, FileText, ClipboardList, Target, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OnboardingStage {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "pending" | "in_progress" | "completed";
}

interface OnboardingProgressProps {
  stages: {
    contract: "pending" | "in_progress" | "completed";
    briefing: "pending" | "in_progress" | "completed";
    planning: "pending" | "in_progress" | "completed";
    payments: "pending" | "in_progress" | "completed";
  };
  clientName?: string;
}

export function OnboardingProgress({ stages, clientName }: OnboardingProgressProps) {
  const stagesList: OnboardingStage[] = [
    { id: "contract", label: "Contrato", icon: FileText, status: stages.contract },
    { id: "briefing", label: "Briefing", icon: ClipboardList, status: stages.briefing },
    { id: "planning", label: "Planejamento", icon: Target, status: stages.planning },
    { id: "payments", label: "Pagamentos", icon: CreditCard, status: stages.payments },
  ];

  const completedCount = stagesList.filter(s => s.status === "completed").length;
  const progressPercentage = Math.round((completedCount / stagesList.length) * 100);

  const getStatusIcon = (status: "pending" | "in_progress" | "completed") => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: "pending" | "in_progress" | "completed") => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400";
      case "in_progress":
        return "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Progresso do Onboarding
            {clientName && <span className="font-normal text-muted-foreground ml-2">— {clientName}</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
            <span className="text-sm text-muted-foreground">concluído</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stagesList.map((stage, index) => (
            <div
              key={stage.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                getStatusColor(stage.status)
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <stage.icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium truncate">{stage.label}</span>
              </div>
              {getStatusIcon(stage.status)}
            </div>
          ))}
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}