import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  History,
  ArrowRight,
  Check,
  Loader2,
  Clock,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { JourneyStepper, Phase, getPhaseLabel } from "@/components/journey/JourneyStepper";

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

export default function MinhaJornada() {
  const { profile, clientInfo, refreshProfile } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [acknowledgements, setAcknowledgements] = useState<Acknowledgement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const { toast } = useToast();

  const currentPhase = (clientInfo as any)?.phase as Phase || "diagnostico";
  const isPontoFocal = profile?.ponto_focal || false;

  const currentPhaseAck = acknowledgements.find(
    (ack) => ack.phase === currentPhase
  );

  const fetchData = async () => {
    if (!clientInfo?.id) return;

    setIsLoading(true);
    try {
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
  }, [clientInfo?.id]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
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

      {/* Stepper Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Etapas da Jornada</CardTitle>
            <CardDescription>
              Você está na etapa{" "}
              <span className="font-medium text-foreground">
                {getPhaseLabel(currentPhase)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JourneyStepper currentPhase={currentPhase} />

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

      {/* History Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Mudanças
            </CardTitle>
            <CardDescription>
              Registro de alterações na sua jornada
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
              <div className="space-y-4">
                {auditLogs.map((log, index) => {
                  const fromPhase = (log.old_data as any)?.phase as Phase;
                  const toPhase = (log.new_data as any)?.phase as Phase;

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        {index < auditLogs.length - 1 && (
                          <div className="w-0.5 h-full min-h-[40px] bg-muted" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">
                            {getPhaseLabel(fromPhase)}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                            {getPhaseLabel(toPhase)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(
                            new Date(log.created_at),
                            "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </p>
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
