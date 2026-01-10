import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  History,
  ArrowRight,
  Check,
  Loader2,
  Clock,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Circle,
  Ban,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { JourneyStepper, Phase, getPhaseLabel, getPhaseDescription } from "@/components/journey/JourneyStepper";
import { JourneyTimeline, PhaseDates, extractPhaseDatesFromClient, getEmptyPhaseDates } from "@/components/journey/JourneyTimeline";
import { JourneyOverviewCard } from "@/components/journey/JourneyOverviewCard";

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  old_data: { phase?: string } | null;
  new_data: { phase?: string } | null;
}

interface Acknowledgement {
  id: string;
  created_at: string;
  phase: string;
  acknowledged_by: string;
  note: string | null;
}

interface Task {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  journey_phase: string | null;
}

const statusConfig: Record<string, { label: string; icon: typeof Circle }> = {
  backlog: { label: "Backlog", icon: Circle },
  in_progress: { label: "Em Andamento", icon: Loader2 },
  blocked: { label: "Bloqueado", icon: Ban },
  completed: { label: "Concluído", icon: CheckCircle2 },
};

export default function MinhaJornada() {
  const { profile, clientInfo, refreshProfile } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [acknowledgements, setAcknowledgements] = useState<Acknowledgement[]>([]);
  const [phaseTasks, setPhaseTasks] = useState<Task[]>([]);
  const [phaseDates, setPhaseDates] = useState<PhaseDates>(getEmptyPhaseDates());
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const { toast } = useToast();

  const currentPhase = clientInfo?.phase as Phase || "diagnostico";
  const isPontoFocal = profile?.ponto_focal || false;

  const currentPhaseAck = acknowledgements.find(
    (ack) => ack.phase === currentPhase
  );

  const fetchData = async () => {
    if (!clientInfo?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch client with phase dates
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientInfo.id)
        .single();

      if (!clientError && clientData) {
        setPhaseDates(extractPhaseDatesFromClient(clientData));
      }

      // Fetch audit logs
      const { data: logs, error: logsError } = await supabase
        .from("audit_logs")
        .select("id, created_at, action, old_data, new_data")
        .eq("client_id", clientInfo.id)
        .eq("action", "phase_changed")
        .order("created_at", { ascending: false })
        .limit(20);

      if (logsError) throw logsError;
      setAuditLogs((logs || []) as AuditLog[]);

      // Fetch acknowledgements
      const { data: acks, error: acksError } = await supabase
        .from("acknowledgements")
        .select("*")
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false });

      if (acksError) throw acksError;
      setAcknowledgements(acks || []);

      // Fetch tasks for current phase
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, status, priority, journey_phase")
        .eq("client_id", clientInfo.id)
        .eq("journey_phase", currentPhase)
        .eq("visible_to_client", true)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;
      setPhaseTasks(tasks || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientInfo?.id, currentPhase]);

  const handleAcknowledge = async () => {
    if (!profile?.id || !clientInfo?.id) return;

    setIsAcknowledging(true);
    try {
      const { error } = await supabase.from("acknowledgements").insert({
        client_id: clientInfo.id,
        phase: currentPhase,
        acknowledged_by: profile.id,
      });

      if (error) throw error;

      toast({
        title: "Ciência registrada",
        description: `Você confirmou ciência da fase "${getPhaseLabel(currentPhase)}".`,
      });

      fetchData();
    } catch (error) {
      console.error("Error acknowledging:", error);
      toast({
        variant: "destructive",
        title: "Erro ao registrar ciência",
        description: "Tente novamente.",
      });
    } finally {
      setIsAcknowledging(false);
    }
  };

  // Calculate phase task progress
  const completedTasks = phaseTasks.filter((t) => t.status === "completed").length;
  const totalTasks = phaseTasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate duration for each log entry
  const getLogDuration = (logIndex: number): string | null => {
    if (logIndex >= auditLogs.length - 1) return null;
    const currentLog = auditLogs[logIndex];
    const previousLog = auditLogs[logIndex + 1];
    const days = differenceInDays(
      new Date(currentLog.created_at),
      new Date(previousLog.created_at)
    );
    return `${days} dias`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!clientInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sem cliente vinculado</h2>
        <p className="text-muted-foreground max-w-md">
          Você ainda não está vinculado a nenhum cliente. Entre em contato com o administrador para ser associado a um cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Minha Jornada
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-1"
        >
          Acompanhe o progresso da sua jornada com a Linkou.
        </motion.p>
      </div>

      {/* Journey Overview KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <JourneyOverviewCard 
          currentPhase={currentPhase} 
          phaseDates={phaseDates}
          phaseStartDate={phaseDates[currentPhase].start}
        />
      </motion.div>

      {/* Timeline Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Linha do Tempo
            </CardTitle>
            <CardDescription>
              Visualize os prazos e o progresso de cada etapa da jornada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JourneyTimeline 
              currentPhase={currentPhase} 
              phaseDates={phaseDates} 
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Phase Detail Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Fase Atual: {getPhaseLabel(currentPhase)}</CardTitle>
            <CardDescription>
              {getPhaseDescription(currentPhase)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Compact Stepper */}
            <JourneyStepper currentPhase={currentPhase} compact />

            {/* Phase Deadline Progress */}
            {phaseDates[currentPhase].start && phaseDates[currentPhase].end && (
              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progresso Temporal da Fase</span>
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(phaseDates[currentPhase].start!), "dd/MM", { locale: ptBR })} - {format(parseISO(phaseDates[currentPhase].end!), "dd/MM", { locale: ptBR })}
                  </span>
                </div>
                {(() => {
                  const start = parseISO(phaseDates[currentPhase].start!);
                  const end = parseISO(phaseDates[currentPhase].end!);
                  const today = new Date();
                  const totalDays = differenceInDays(end, start);
                  const elapsedDays = differenceInDays(today, start);
                  const percentage = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
                  
                  return (
                    <>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{elapsedDays} dias decorridos</span>
                        <span>{Math.max(0, totalDays - elapsedDays)} dias restantes</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Acknowledgement Section */}
            <div className="mt-6 pt-6 border-t">
              {isPontoFocal ? (
                currentPhaseAck ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-600">
                        Ciência registrada
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Em{" "}
                        {format(
                          new Date(currentPhaseAck.created_at),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <FileCheck className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">Confirme sua ciência</p>
                        <p className="text-sm text-muted-foreground">
                          Como ponto focal, confirme que está ciente desta fase.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleAcknowledge}
                      disabled={isAcknowledging}
                    >
                      {isAcknowledging && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Estou ciente desta fase
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {currentPhaseAck ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {currentPhaseAck
                        ? "Ponto focal confirmou ciência"
                        : "Aguardando confirmação do ponto focal"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentPhaseAck
                        ? `Em ${format(
                            new Date(currentPhaseAck.created_at),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}`
                        : "Ponto focal ainda não confirmou ciência desta fase."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Phase Tasks Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Tarefas desta Fase
                </CardTitle>
                <CardDescription>
                  Tarefas da etapa "{getPhaseLabel(currentPhase)}"
                </CardDescription>
              </div>
              {totalTasks > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Progresso</p>
                    <p className="font-semibold">{completedTasks} de {totalTasks}</p>
                  </div>
                  <div className="w-20">
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  <span className="text-sm font-medium min-w-[3ch]">{progressPercentage}%</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {phaseTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Circle className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">Nenhuma tarefa nesta fase</p>
                <p className="text-sm">
                  Tarefas serão adicionadas pela equipe.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {phaseTasks.slice(0, 5).map((task, index) => {
                  const status = task.status || "backlog";
                  const StatusIcon = statusConfig[status]?.icon || Circle;
                  const isCompleted = status === "completed";

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isCompleted ? "bg-green-500/5 border-green-500/20" : "bg-card"
                      }`}
                    >
                      <StatusIcon 
                        className={`h-5 w-5 flex-shrink-0 ${
                          isCompleted 
                            ? "text-green-600" 
                            : status === "in_progress" 
                              ? "text-blue-600 animate-spin" 
                              : status === "blocked"
                                ? "text-red-600"
                                : "text-muted-foreground"
                        }`} 
                      />
                      <span className={`flex-1 ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          isCompleted 
                            ? "bg-green-500/20 text-green-600" 
                            : status === "in_progress"
                              ? "bg-blue-500/20 text-blue-600"
                              : status === "blocked"
                                ? "bg-red-500/20 text-red-600"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {statusConfig[status]?.label || status}
                      </Badge>
                    </motion.div>
                  );
                })}

                {phaseTasks.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{phaseTasks.length - 5} tarefas adicionais
                  </p>
                )}

                <div className="pt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/cliente/tarefas">
                      Ver todas as tarefas
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* History Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Transições
            </CardTitle>
            <CardDescription>
              Registro de alterações de fase com duração de cada etapa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">Ainda não há histórico</p>
                <p className="text-sm">
                  Mudanças de fase aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {auditLogs.map((log, index) => {
                  const fromPhase = (log.old_data as any)?.phase as Phase;
                  const toPhase = (log.new_data as any)?.phase as Phase;
                  const duration = getLogDuration(index);
                  const isLast = index === auditLogs.length - 1;

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4"
                    >
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                        {!isLast && (
                          <div className="w-0.5 flex-1 min-h-[50px] bg-muted" />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`pb-4 flex-1 ${isLast ? "pb-0" : ""}`}>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <Badge variant="outline">
                            {getPhaseLabel(fromPhase)}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                            {getPhaseLabel(toPhase)}
                          </Badge>
                          {duration && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (após {duration})
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}