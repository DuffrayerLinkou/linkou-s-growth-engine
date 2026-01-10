import { motion } from "framer-motion";
import { FolderKanban, Activity, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const phaseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  estruturacao: "Estruturação",
  operacao_guiada: "Operação Guiada",
  transferencia: "Transferência",
};

const phaseColors: Record<string, string> = {
  diagnostico: "bg-yellow-500/10 text-yellow-600",
  estruturacao: "bg-blue-500/10 text-blue-600",
  operacao_guiada: "bg-purple-500/10 text-purple-600",
  transferencia: "bg-green-500/10 text-green-600",
};

const projectStatusLabels: Record<string, string> = {
  planning: "Planejamento",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
};

const projectStatusColors: Record<string, string> = {
  planning: "bg-gray-500/10 text-gray-600",
  active: "bg-green-500/10 text-green-600",
  paused: "bg-yellow-500/10 text-yellow-600",
  completed: "bg-blue-500/10 text-blue-600",
};

export default function ClienteDashboard() {
  const { profile, clientInfo } = useAuth();

  // Query: Dados do cliente (fase e status)
  const { data: clientData, isLoading: loadingClient } = useQuery({
    queryKey: ["client-data", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("phase, status")
        .eq("id", clientInfo.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientInfo?.id,
  });

  // Query: Total de Projetos do Cliente
  const { data: totalProjects, isLoading: loadingTotalProjects } = useQuery({
    queryKey: ["client-total-projects", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return 0;
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientInfo.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!clientInfo?.id,
  });

  // Query: Última mudança de fase
  const { data: lastPhaseChange, isLoading: loadingLastPhaseChange } = useQuery({
    queryKey: ["client-last-phase-change", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return null;
      const { data, error } = await supabase
        .from("audit_logs")
        .select("created_at, new_data")
        .eq("client_id", clientInfo.id)
        .eq("action", "phase_changed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientInfo?.id,
  });

  // Query: Meus Projetos (até 5)
  const { data: myProjects, isLoading: loadingMyProjects } = useQuery({
    queryKey: ["client-my-projects", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status")
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientInfo?.id,
  });

  // Query: Histórico Recente (últimos 5 audit_logs)
  const { data: recentHistory, isLoading: loadingRecentHistory } = useQuery({
    queryKey: ["client-recent-history", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, created_at, action, old_data, new_data")
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientInfo?.id,
  });

  const formatAuditAction = (log: { action: string; old_data: any; new_data: any }) => {
    if (log.action === "phase_changed") {
      const from = phaseLabels[log.old_data?.phase] || log.old_data?.phase || "?";
      const to = phaseLabels[log.new_data?.phase] || log.new_data?.phase || "?";
      return `Fase alterada de "${from}" para "${to}"`;
    }
    return log.action;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Olá, {profile?.full_name?.split(" ")[0] || "Cliente"}! 👋
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-1"
        >
          Acompanhe seus projetos e resultados.
        </motion.p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Fase Atual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fase Atual</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingClient ? (
                <Skeleton className="h-8 w-32" />
              ) : clientData?.phase ? (
                <Badge className={`text-sm px-3 py-1 ${phaseColors[clientData.phase]}`}>
                  {phaseLabels[clientData.phase]}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Não definida</span>
              )}
              <p className="text-xs text-muted-foreground mt-2">Sua jornada Linkou</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status do Cliente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingClient ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold capitalize">
                  {clientData?.status === "active" ? "Ativo" : clientData?.status || "-"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Situação atual</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total de Projetos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FolderKanban className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingTotalProjects ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalProjects}</div>
              )}
              <p className="text-xs text-muted-foreground">Total de projetos</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Última Atualização */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingLastPhaseChange ? (
                <Skeleton className="h-8 w-24" />
              ) : lastPhaseChange?.created_at ? (
                <div className="text-lg font-bold">
                  {format(new Date(lastPhaseChange.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Sem atualizações</span>
              )}
              <p className="text-xs text-muted-foreground">Mudança de fase</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lists */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Meus Projetos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Meus Projetos</CardTitle>
              <CardDescription>Projetos vinculados à sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMyProjects ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : myProjects && myProjects.length > 0 ? (
                <div className="space-y-3">
                  {myProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FolderKanban className="h-5 w-5 text-primary" />
                        </div>
                        <p className="font-medium text-sm">{project.name}</p>
                      </div>
                      <Badge className={projectStatusColors[project.status || "planning"]}>
                        {projectStatusLabels[project.status || "planning"]}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ainda não há projetos vinculados</p>
                  <p className="text-sm">Seus projetos aparecerão aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Histórico Recente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Histórico Recente</CardTitle>
              <CardDescription>Últimas atualizações da sua jornada</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecentHistory ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentHistory && recentHistory.length > 0 ? (
                <div className="space-y-3">
                  {recentHistory.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{formatAuditAction(log)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mudança recente na jornada</p>
                  <p className="text-sm">O histórico aparecerá aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
