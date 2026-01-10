import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  UserCheck, 
  Building2, 
  Compass,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  UserPlus,
  FolderPlus,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Labels e cores
const statusLabels: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  lost: "Perdido",
  closed: "Fechado",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  qualified: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  lost: "bg-red-500/10 text-red-600 border-red-500/20",
  closed: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const phaseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  estruturacao: "Estruturação",
  operacao_guiada: "Operação Guiada",
  transferencia: "Transferência",
};

const phaseColors: Record<string, string> = {
  diagnostico: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  estruturacao: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  operacao_guiada: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  transferencia: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const phaseOrder = ["diagnostico", "estruturacao", "operacao_guiada", "transferencia"];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // === QUERIES ===

  // KPI 1: Leads no período (últimos 30 dias)
  const { data: leadsInPeriod, isLoading: loadingLeadsPeriod } = useQuery({
    queryKey: ["leads-period"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());
      return count || 0;
    },
  });

  // KPI 2: Leads qualificados
  const { data: qualifiedLeads, isLoading: loadingQualified } = useQuery({
    queryKey: ["leads-qualified"],
    queryFn: async () => {
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "qualified");
      return count || 0;
    },
  });

  // KPI 3: Clientes ativos
  const { data: activeClients, isLoading: loadingActiveClients } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const { count } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");
      return count || 0;
    },
  });

  // KPI 4: Clientes em operação guiada
  const { data: clientsOperacao, isLoading: loadingOperacao } = useQuery({
    queryKey: ["clients-operacao"],
    queryFn: async () => {
      const { count } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("phase", "operacao_guiada");
      return count || 0;
    },
  });

  // Pipeline: Leads por status
  const { data: leadsByStatus, isLoading: loadingPipeline } = useQuery({
    queryKey: ["leads-by-status"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("status");
      const counts: Record<string, number> = { new: 0, contacted: 0, qualified: 0, lost: 0, closed: 0 };
      data?.forEach((lead) => {
        if (lead.status && counts[lead.status] !== undefined) {
          counts[lead.status]++;
        }
      });
      return counts;
    },
  });

  // Jornada: Clientes por fase
  const { data: clientsByPhase, isLoading: loadingJornada } = useQuery({
    queryKey: ["clients-by-phase"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("phase").eq("status", "ativo");
      const counts: Record<string, number> = { diagnostico: 0, estruturacao: 0, operacao_guiada: 0, transferencia: 0 };
      data?.forEach((client) => {
        if (client.phase && counts[client.phase] !== undefined) {
          counts[client.phase]++;
        }
      });
      return counts;
    },
  });

  // Fila de Ação: Leads novos sem contato (> 2 dias)
  const { data: staleLeads, isLoading: loadingStaleLeads } = useQuery({
    queryKey: ["stale-leads"],
    queryFn: async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const { data } = await supabase
        .from("leads")
        .select("id, name, created_at")
        .eq("status", "new")
        .lt("created_at", twoDaysAgo.toISOString())
        .order("created_at", { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  // Fila de Ação: Clientes sem ponto focal
  const { data: clientsWithoutFocal, isLoading: loadingNoFocal } = useQuery({
    queryKey: ["clients-no-focal"],
    queryFn: async () => {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .eq("status", "ativo")
        .limit(10);
      
      if (!clients) return [];
      
      const results = [];
      for (const client of clients) {
        const { data: hasFocal } = await supabase.rpc("client_has_ponto_focal", { _client_id: client.id });
        if (!hasFocal) {
          results.push(client);
          if (results.length >= 3) break;
        }
      }
      return results;
    },
  });

  // Fila de Ação: Clientes parados (> 14 dias)
  const { data: staleClients, isLoading: loadingStaleClients } = useQuery({
    queryKey: ["stale-clients"],
    queryFn: async () => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const { data } = await supabase
        .from("clients")
        .select("id, name, phase, updated_at")
        .eq("status", "ativo")
        .lt("updated_at", fourteenDaysAgo.toISOString())
        .order("updated_at", { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  // Fila de Ação: Projetos parados (> 7 dias)
  const { data: staleProjects, isLoading: loadingStaleProjects } = useQuery({
    queryKey: ["stale-projects"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data } = await supabase
        .from("projects")
        .select("id, name, client_id, updated_at")
        .neq("status", "completed")
        .lt("updated_at", sevenDaysAgo.toISOString())
        .order("updated_at", { ascending: true })
        .limit(2);
      return data || [];
    },
  });

  // Atividade Recente: audit_logs
  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, client_id, new_data, old_data, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // === HELPERS ===
  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "phase_changed":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "lead_converted":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "ponto_focal_set":
        return <UserPlus className="h-4 w-4 text-violet-500" />;
      case "project_created":
        return <FolderPlus className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionText = (log: any) => {
    const newData = log.new_data as Record<string, any> | null;
    
    switch (log.action) {
      case "phase_changed":
        const toPhase = newData?.phase ? phaseLabels[newData.phase] || newData.phase : "nova fase";
        return `Cliente avançou para ${toPhase}`;
      case "lead_converted":
        return "Lead convertido em cliente";
      case "ponto_focal_set":
        return "Ponto focal definido";
      case "project_created":
        return "Novo projeto criado";
      default:
        return log.action?.replace(/_/g, " ") || "Ação registrada";
    }
  };

  // Calcular total de alertas
  const totalAlerts = (staleLeads?.length || 0) + (clientsWithoutFocal?.length || 0) + (staleClients?.length || 0) + (staleProjects?.length || 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {profile?.full_name || "Admin"}! Aqui está o resumo da agência.
        </p>
      </motion.div>

      {/* BLOCO 1: KPIs Rápidos */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads no período */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/leads")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leads (30 dias)</p>
                {loadingLeadsPeriod ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">{leadsInPeriod}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads qualificados */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/leads?status=qualified")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qualificados</p>
                {loadingQualified ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">{qualifiedLeads}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clientes ativos */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/clientes?status=ativo")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes Ativos</p>
                {loadingActiveClients ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">{activeClients}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operação guiada */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/clientes?phase=operacao_guiada")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Op. Guiada</p>
                {loadingOperacao ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">{clientsOperacao}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Compass className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* BLOCO 2: Pipeline de Leads */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Pipeline de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPipeline ? (
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 flex-1" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <button
                    key={status}
                    onClick={() => navigate(`/admin/leads?status=${status}`)}
                    className={`flex-1 min-w-[120px] p-4 rounded-lg border transition-all hover:shadow-md hover:scale-[1.02] ${statusColors[status]}`}
                  >
                    <p className="text-2xl font-bold">{leadsByStatus?.[status] || 0}</p>
                    <p className="text-sm font-medium">{label}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* BLOCO 3: Jornada dos Clientes */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Compass className="h-5 w-5 text-muted-foreground" />
              Jornada dos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingJornada ? (
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 flex-1" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {phaseOrder.map((phase, index) => (
                  <div key={phase} className="flex items-center">
                    <button
                      onClick={() => navigate(`/admin/clientes?phase=${phase}`)}
                      className={`flex-1 min-w-[140px] p-4 rounded-lg border transition-all hover:shadow-md hover:scale-[1.02] ${phaseColors[phase]}`}
                    >
                      <p className="text-2xl font-bold">{clientsByPhase?.[phase] || 0}</p>
                      <p className="text-sm font-medium">{phaseLabels[phase]}</p>
                    </button>
                    {index < phaseOrder.length - 1 && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground mx-1 hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* BLOCO 4 e 5: Grid de duas colunas */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* BLOCO 4: Fila de Ação */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Requer Atenção
                {totalAlerts > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-600 rounded-full">
                    {totalAlerts}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(loadingStaleLeads || loadingNoFocal || loadingStaleClients || loadingStaleProjects) ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : totalAlerts === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-500/50" />
                  <p>Tudo em dia! Nenhum item requer atenção.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Leads sem contato */}
                  {staleLeads?.map((lead) => (
                    <button
                      key={`lead-${lead.id}`}
                      onClick={() => navigate(`/admin/leads?status=new`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors text-left"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          Lead "{lead.name}" sem contato
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(lead.created_at)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}

                  {/* Clientes sem ponto focal */}
                  {clientsWithoutFocal?.map((client) => (
                    <button
                      key={`focal-${client.id}`}
                      onClick={() => navigate(`/admin/clientes/${client.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 hover:bg-violet-500/10 transition-colors text-left"
                    >
                      <AlertTriangle className="h-4 w-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          "{client.name}" sem ponto focal
                        </p>
                        <p className="text-xs text-muted-foreground">Definir responsável</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}

                  {/* Clientes parados */}
                  {staleClients?.map((client) => (
                    <button
                      key={`stale-${client.id}`}
                      onClick={() => navigate(`/admin/clientes/${client.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 transition-colors text-left"
                    >
                      <Clock className="h-4 w-4 text-orange-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          "{client.name}" parado em {phaseLabels[client.phase || ""] || client.phase}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Atualizado {formatRelativeTime(client.updated_at)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}

                  {/* Projetos parados */}
                  {staleProjects?.map((project) => (
                    <button
                      key={`proj-${project.id}`}
                      onClick={() => navigate(`/admin/projetos`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <Clock className="h-4 w-4 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          Projeto "{project.name}" sem atualização
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Atualizado {formatRelativeTime(project.updated_at)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* BLOCO 5: Atividade Recente */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !recentActivity || recentActivity.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma atividade registrada ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => {
                        if (log.client_id) {
                          navigate(`/admin/clientes/${log.client_id}`);
                        } else if (log.entity_type === "leads") {
                          navigate(`/admin/leads`);
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left border border-transparent hover:border-border"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {getActionText(log)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(log.created_at)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
