import { motion } from "framer-motion";
import { Target, Users, FolderKanban, TrendingUp, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

const statusLabels: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  lost: "Perdido",
  closed: "Fechado",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500",
  contacted: "bg-yellow-500/10 text-yellow-500",
  qualified: "bg-green-500/10 text-green-500",
  lost: "bg-red-500/10 text-red-500",
  closed: "bg-purple-500/10 text-purple-500",
};

export default function AdminDashboard() {
  const { profile, isAdmin } = useAuth();

  // Query: Total de Leads
  const { data: totalLeads, isLoading: loadingLeads } = useQuery({
    queryKey: ["admin-total-leads"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Query: Leads por Status
  const { data: leadsByStatus, isLoading: loadingLeadsByStatus } = useQuery({
    queryKey: ["admin-leads-by-status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("status");
      if (error) throw error;
      const counts: Record<string, number> = {
        new: 0,
        contacted: 0,
        qualified: 0,
        lost: 0,
        closed: 0,
      };
      data?.forEach((lead) => {
        const status = lead.status || "new";
        if (counts[status] !== undefined) counts[status]++;
      });
      return counts;
    },
  });

  // Query: Total de Clientes Ativos
  const { data: activeClients, isLoading: loadingActiveClients } = useQuery({
    queryKey: ["admin-active-clients"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count || 0;
    },
  });

  // Query: Clientes por Fase
  const { data: clientsByPhase, isLoading: loadingClientsByPhase } = useQuery({
    queryKey: ["admin-clients-by-phase"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("phase");
      if (error) throw error;
      const counts: Record<string, number> = {
        diagnostico: 0,
        estruturacao: 0,
        operacao_guiada: 0,
        transferencia: 0,
      };
      data?.forEach((client) => {
        const phase = client.phase || "diagnostico";
        if (counts[phase] !== undefined) counts[phase]++;
      });
      return counts;
    },
  });

  // Query: Projetos Ativos
  const { data: activeProjects, isLoading: loadingActiveProjects } = useQuery({
    queryKey: ["admin-active-projects"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .neq("status", "completed");
      if (error) throw error;
      return count || 0;
    },
  });

  // Query: Últimos 5 Leads
  const { data: recentLeads, isLoading: loadingRecentLeads } = useQuery({
    queryKey: ["admin-recent-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  // Query: Clientes em Operação Guiada
  const { data: clientsInOperacao, isLoading: loadingClientsInOperacao } = useQuery({
    queryKey: ["admin-clients-operacao-guiada"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, segment")
        .eq("phase", "operacao_guiada");
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = loadingLeads || loadingActiveClients || loadingActiveProjects;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Dashboard {isAdmin ? "Admin" : "Gestão"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-1"
        >
          Bem-vindo, {profile?.full_name?.split(" ")[0] || "Administrador"}! Aqui está o resumo da agência.
        </motion.p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingLeads ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalLeads}</div>
              )}
              <p className="text-xs text-muted-foreground">Todos os leads capturados</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Clientes Ativos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingActiveClients ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{activeClients}</div>
              )}
              <p className="text-xs text-muted-foreground">Status ativo</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projetos Ativos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos em Andamento</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FolderKanban className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingActiveProjects ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{activeProjects}</div>
              )}
              <p className="text-xs text-muted-foreground">Não encerrados</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Taxa de Conversão (calculada) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {totalLeads && totalLeads > 0
                    ? `${((activeClients || 0) / totalLeads * 100).toFixed(1)}%`
                    : "0%"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Lead → Cliente</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Leads por Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLeadsByStatus ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(leadsByStatus || {}).map(([status, count]) => (
                    <Badge key={status} variant="secondary" className={statusColors[status]}>
                      {statusLabels[status]}: {count}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Clientes por Fase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clientes por Fase da Jornada</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingClientsByPhase ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(clientsByPhase || {}).map(([phase, count]) => (
                    <Badge key={phase} variant="outline">
                      {phaseLabels[phase]}: {count}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lists */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Últimos Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Últimos Leads</CardTitle>
              <CardDescription>Últimos leads capturados</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecentLeads ? (
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
              ) : recentLeads && recentLeads.length > 0 ? (
                <div className="space-y-3">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={statusColors[lead.status || "new"]}>
                        {statusLabels[lead.status || "new"]}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum lead ainda</p>
                  <p className="text-sm">Novos leads aparecerão aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Clientes em Operação Guiada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Clientes em Operação Guiada</CardTitle>
              <CardDescription>Fase de testes e treinamento</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClientsInOperacao ? (
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
              ) : clientsInOperacao && clientsInOperacao.length > 0 ? (
                <div className="space-y-3">
                  {clientsInOperacao.map((client) => (
                    <div key={client.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{client.name}</p>
                        {client.segment && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {client.segment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cliente nesta fase</p>
                  <p className="text-sm">Clientes em Operação Guiada aparecerão aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
