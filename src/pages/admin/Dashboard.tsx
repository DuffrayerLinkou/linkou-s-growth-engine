import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  Building2, 
  Compass,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  UserPlus,
  FolderPlus,
  ChevronRight,
  Calendar,
  ListTodo,
  Megaphone,
  CalendarClock,
  AlertCircle,
  FileCheck,
  FileUp,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow, format, differenceInDays, isToday, isTomorrow, addDays, startOfDay, subDays, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { DateRangeFilter, presets } from "@/components/admin/DateRangeFilter";
import { ExportDashboard } from "@/components/admin/ExportDashboard";

import {
  leadStatusLabels as statusLabels,
  leadStatusColors as statusColors,
  phaseLabels,
  phaseColors,
  phaseOrder,
} from "@/lib/status-config";

// Helper to get phase end field name
const getPhaseEndField = (phase: string) => {
  const map: Record<string, string> = {
    diagnostico: "phase_diagnostico_end",
    estruturacao: "phase_estruturacao_end",
    operacao_guiada: "phase_operacao_guiada_end",
    transferencia: "phase_transferencia_end",
  };
  return map[phase];
};

type DeadlineStatus = "ok" | "warning" | "overdue" | "none";

const getDeadlineStatus = (endDate: string | null): { status: DeadlineStatus; daysLeft: number } => {
  if (!endDate) return { status: "none", daysLeft: 0 };
  const end = new Date(endDate);
  const today = startOfDay(new Date());
  const daysLeft = differenceInDays(end, today);
  
  if (daysLeft < 0) return { status: "overdue", daysLeft };
  if (daysLeft <= 7) return { status: "warning", daysLeft };
  return { status: "ok", daysLeft };
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Estado do filtro de datas - padrão: últimos 30 dias
  const [selectedPreset, setSelectedPreset] = useState("last30days");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const preset = presets.find(p => p.value === "last30days");
    return preset?.getRange();
  });

  // Calcula o período anterior para comparação
  const previousPeriod = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return null;
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    return { from: subDays(dateRange.from, days), to: subDays(dateRange.from, 1) };
  }, [dateRange]);

  // === QUERIES ===

  // KPI 1: Leads no período selecionado
  const { data: leadsInPeriod, isLoading: loadingLeadsPeriod } = useQuery({
    queryKey: ["leads-period", dateRange],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return 0;
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfDay(dateRange.from).toISOString())
        .lte("created_at", endOfDay(dateRange.to).toISOString());
      return count || 0;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Leads no período anterior (comparativo)
  const { data: leadsPreviousPeriod } = useQuery({
    queryKey: ["leads-period-previous", previousPeriod],
    queryFn: async () => {
      if (!previousPeriod?.from || !previousPeriod?.to) return 0;
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfDay(previousPeriod.from).toISOString())
        .lte("created_at", endOfDay(previousPeriod.to).toISOString());
      return count || 0;
    },
    enabled: !!previousPeriod?.from && !!previousPeriod?.to,
  });

  // KPI 2: Leads qualificados no período
  const { data: qualifiedLeads, isLoading: loadingQualified } = useQuery({
    queryKey: ["leads-qualified", dateRange],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return 0;
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "qualified")
        .gte("created_at", startOfDay(dateRange.from).toISOString())
        .lte("created_at", endOfDay(dateRange.to).toISOString());
      return count || 0;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Leads qualificados no período anterior
  const { data: qualifiedPreviousPeriod } = useQuery({
    queryKey: ["leads-qualified-previous", previousPeriod],
    queryFn: async () => {
      if (!previousPeriod?.from || !previousPeriod?.to) return 0;
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "qualified")
        .gte("created_at", startOfDay(previousPeriod.from).toISOString())
        .lte("created_at", endOfDay(previousPeriod.to).toISOString());
      return count || 0;
    },
    enabled: !!previousPeriod?.from && !!previousPeriod?.to,
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

  // KPI 5: Tarefas vencidas
  const { data: overdueTasks, isLoading: loadingOverdueTasks } = useQuery({
    queryKey: ["tasks-overdue"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .lt("due_date", today)
        .neq("status", "completed");
      return count || 0;
    },
  });

  // KPI 6: Campanhas ativas
  const { data: activeCampaigns, isLoading: loadingActiveCampaigns } = useQuery({
    queryKey: ["campaigns-active"],
    queryFn: async () => {
      const { count } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("status", "running");
      return count || 0;
    },
  });

  // KPI 7: Agendamentos hoje
  const { data: appointmentsToday, isLoading: loadingAppointmentsToday } = useQuery({
    queryKey: ["appointments-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_date", `${today}T00:00:00`)
        .lt("appointment_date", `${today}T23:59:59`);
      return count || 0;
    },
  });

  // KPI 8: Total tarefas pendentes
  const { data: pendingTasksTotal, isLoading: loadingPendingTasks } = useQuery({
    queryKey: ["tasks-pending-total"],
    queryFn: async () => {
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .neq("status", "completed");
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

  // Jornada: Clientes por fase COM status de deadline
  const { data: clientsJourneyData, isLoading: loadingJornada } = useQuery({
    queryKey: ["clients-journey-detailed"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name, phase, phase_diagnostico_end, phase_estruturacao_end, phase_operacao_guiada_end, phase_transferencia_end")
        .eq("status", "ativo");
      
      const result: Record<string, { total: number; ok: number; warning: number; overdue: number }> = {};
      phaseOrder.forEach(phase => {
        result[phase] = { total: 0, ok: 0, warning: 0, overdue: 0 };
      });
      
      data?.forEach((client) => {
        if (client.phase && result[client.phase]) {
          result[client.phase].total++;
          const endField = getPhaseEndField(client.phase);
          const endDate = client[endField as keyof typeof client] as string | null;
          const { status } = getDeadlineStatus(endDate);
          if (status === "ok") result[client.phase].ok++;
          else if (status === "warning") result[client.phase].warning++;
          else if (status === "overdue") result[client.phase].overdue++;
        }
      });
      
      return result;
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

  // Fila de Ação: Clientes com fase atrasada
  const { data: clientsOverduePhase, isLoading: loadingOverduePhase } = useQuery({
    queryKey: ["clients-overdue-phase"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("clients")
        .select("id, name, phase, phase_diagnostico_end, phase_estruturacao_end, phase_operacao_guiada_end, phase_transferencia_end")
        .eq("status", "ativo");
      
      const overdueClients: { id: string; name: string; phase: string; daysOverdue: number }[] = [];
      
      data?.forEach((client) => {
        if (client.phase) {
          const endField = getPhaseEndField(client.phase);
          const endDate = client[endField as keyof typeof client] as string | null;
          if (endDate && endDate < today) {
            const daysOverdue = differenceInDays(new Date(), new Date(endDate));
            overdueClients.push({
              id: client.id,
              name: client.name,
              phase: client.phase,
              daysOverdue
            });
          }
        }
      });
      
      return overdueClients.sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 3);
    },
  });

  // Fila de Ação: Tarefas vencidas há mais de 3 dias
  const { data: severeOverdueTasks, isLoading: loadingSevereTasks } = useQuery({
    queryKey: ["tasks-severe-overdue"],
    queryFn: async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const { data } = await supabase
        .from("tasks")
        .select("id, title, due_date, client_id, clients(name)")
        .lt("due_date", threeDaysAgo.toISOString().split('T')[0])
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  // Tarefas por cliente (Top 5)
  const { data: tasksByClient, isLoading: loadingTasksByClient } = useQuery({
    queryKey: ["tasks-by-client"],
    queryFn: async () => {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("client_id, status, due_date, clients(name)");
      
      if (!tasks) return [];
      
      const today = new Date().toISOString().split('T')[0];
      const clientStats: Record<string, { 
        id: string; 
        name: string; 
        total: number; 
        completed: number; 
        overdue: number 
      }> = {};
      
      tasks.forEach((task) => {
        if (!task.client_id) return;
        if (!clientStats[task.client_id]) {
          clientStats[task.client_id] = {
            id: task.client_id,
            name: (task.clients as any)?.name || "Cliente",
            total: 0,
            completed: 0,
            overdue: 0
          };
        }
        clientStats[task.client_id].total++;
        if (task.status === "completed") clientStats[task.client_id].completed++;
        if (task.due_date && task.due_date < today && task.status !== "completed") {
          clientStats[task.client_id].overdue++;
        }
      });
      
      return Object.values(clientStats)
        .sort((a, b) => (b.total - b.completed) - (a.total - a.completed))
        .slice(0, 5);
    },
  });

  // Agendamentos da semana
  const { data: weekAppointments, isLoading: loadingWeekAppointments } = useQuery({
    queryKey: ["appointments-week"],
    queryFn: async () => {
      const today = new Date();
      const weekLater = addDays(today, 7);
      const { data } = await supabase
        .from("appointments")
        .select("id, title, appointment_date, status, clients(name)")
        .gte("appointment_date", today.toISOString())
        .lt("appointment_date", weekLater.toISOString())
        .order("appointment_date", { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  // Atividade Recente: audit_logs com mais tipos
  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ["recent-activity-extended"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, client_id, new_data, old_data, created_at, clients(name)")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  // === HELPERS ===
  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  const formatAppointmentDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return `Hoje, ${format(d, "HH:mm")}`;
    if (isTomorrow(d)) return `Amanhã, ${format(d, "HH:mm")}`;
    return format(d, "EEE, dd/MM 'às' HH:mm", { locale: ptBR });
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
      case "task_created":
      case "task_completed":
        return <ListTodo className="h-4 w-4 text-blue-500" />;
      case "campaign_started":
      case "campaign_completed":
        return <Megaphone className="h-4 w-4 text-purple-500" />;
      case "file_uploaded":
        return <FileUp className="h-4 w-4 text-cyan-500" />;
      case "approval_received":
        return <FileCheck className="h-4 w-4 text-emerald-500" />;
      case "comment_added":
        return <MessageSquare className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionText = (log: any) => {
    const newData = log.new_data as Record<string, any> | null;
    const clientName = log.clients?.name;
    
    switch (log.action) {
      case "phase_changed":
        const toPhase = newData?.phase ? phaseLabels[newData.phase] || newData.phase : "nova fase";
        return clientName ? `${clientName} → ${toPhase}` : `Cliente avançou para ${toPhase}`;
      case "lead_converted":
        return clientName ? `${clientName} convertido` : "Lead convertido em cliente";
      case "ponto_focal_set":
        return clientName ? `Ponto focal em ${clientName}` : "Ponto focal definido";
      case "project_created":
        return clientName ? `Projeto em ${clientName}` : "Novo projeto criado";
      case "task_created":
        return clientName ? `Tarefa criada para ${clientName}` : "Nova tarefa criada";
      case "task_completed":
        return clientName ? `Tarefa concluída em ${clientName}` : "Tarefa concluída";
      case "experiment_started":
        return clientName ? `Experimento iniciado em ${clientName}` : "Experimento iniciado";
      case "experiment_completed":
        return clientName ? `Experimento finalizado em ${clientName}` : "Experimento finalizado";
      case "file_uploaded":
        return clientName ? `Arquivo enviado para ${clientName}` : "Arquivo enviado";
      case "approval_received":
        return clientName ? `Aprovação recebida de ${clientName}` : "Aprovação recebida";
      default:
        return log.action?.replace(/_/g, " ") || "Ação registrada";
    }
  };

  // Calcular total de alertas
  const totalAlerts = 
    (staleLeads?.length || 0) + 
    (clientsWithoutFocal?.length || 0) + 
    (clientsOverduePhase?.length || 0) + 
    (severeOverdueTasks?.length || 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const isLoadingKPIs = loadingLeadsPeriod || loadingQualified || loadingActiveClients || loadingOperacao || 
                        loadingOverdueTasks || loadingActiveCampaigns || loadingAppointmentsToday || loadingPendingTasks;

  // Componente de variação percentual
  const PercentageChange = ({ current, previous }: { current: number; previous: number }) => {
    if (previous === 0 && current === 0) {
      return <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /></span>;
    }
    if (previous === 0) {
      return <span className="text-[10px] text-emerald-600 flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> Novo</span>;
    }
    const percentChange = ((current - previous) / previous) * 100;
    const isPositive = percentChange > 0;
    const isNeutral = percentChange === 0;
    if (isNeutral) {
      return <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /> =</span>;
    }
    return (
      <span className={`text-[10px] flex items-center gap-0.5 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? "+" : ""}{percentChange.toFixed(0)}%
      </span>
    );
  };

  // Dados para exportação Excel
  const exportData = useMemo(() => ({
    kpis: {
      leadsUltimos30Dias: leadsInPeriod || 0,
      leadsQualificados: qualifiedLeads || 0,
      clientesAtivos: activeClients || 0,
      clientesEmOperacao: clientsOperacao || 0,
      tarefasVencidas: overdueTasks || 0,
      campanhasAtivas: activeCampaigns || 0,
      agendamentosHoje: appointmentsToday || 0,
      tarefasPendentesTotal: pendingTasksTotal || 0,
    },
    leadsPipeline: Object.entries(leadsByStatus || {}).map(([status, count]) => ({
      status: statusLabels[status] || status,
      count: count as number,
    })),
    clientJourney: Object.entries(clientsJourneyData || {}).map(([phase, data]) => ({
      phase: phaseLabels[phase] || phase,
      count: (data as any).total,
      deadlineStatus: (data as any).overdue > 0 ? "Atrasado" : (data as any).warning > 0 ? "Atenção" : "OK",
    })),
    tasksByClient: (tasksByClient || []).map(item => ({
      clientName: item.name,
      total: item.total,
      overdue: item.overdue,
    })),
    attentionItems: {
      staleLeads: (staleLeads || []).map(lead => ({
        name: lead.name,
        createdAt: format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR }),
      })),
      clientsWithoutFocal: (clientsWithoutFocal || []).map(client => ({
        name: client.name,
      })),
      overdueClients: (clientsOverduePhase || []).map(client => ({
        name: client.name,
        phase: phaseLabels[client.phase] || client.phase,
      })),
      severelyOverdueTasks: (severeOverdueTasks || []).map((task: any) => ({
        title: task.title,
        clientName: task.clients?.name || "Sem cliente",
        dueDate: task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR }) : "",
      })),
    },
    appointments: (weekAppointments || []).map((apt: any) => ({
      title: apt.title,
      clientName: apt.clients?.name || "Sem cliente",
      date: apt.appointment_date ? format(new Date(apt.appointment_date), "dd/MM/yyyy", { locale: ptBR }) : "",
      time: apt.appointment_date ? format(new Date(apt.appointment_date), "HH:mm", { locale: ptBR }) : "",
    })),
    dateRange: {
      from: dateRange?.from || new Date(),
      to: dateRange?.to || new Date(),
    },
  }), [
    leadsInPeriod, qualifiedLeads, activeClients, clientsOperacao,
    overdueTasks, activeCampaigns, appointmentsToday, pendingTasksTotal,
    leadsByStatus, clientsJourneyData, tasksByClient, staleLeads, clientsWithoutFocal,
    clientsOverduePhase, severeOverdueTasks, weekAppointments, dateRange
  ]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header com filtro e exportação */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {profile?.full_name || "Admin"}! Aqui está o resumo da agência.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedPreset={selectedPreset}
            onPresetChange={setSelectedPreset}
          />
          <ExportDashboard
            data={exportData}
            isLoading={isLoadingKPIs}
          />
        </div>
      </motion.div>

      {/* BLOCO 1: KPIs Rápidos - Linha 1 */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads no período */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/leads")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leads (período)</p>
                {loadingLeadsPeriod ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold text-foreground">{leadsInPeriod}</p>
                    <PercentageChange current={leadsInPeriod || 0} previous={leadsPreviousPeriod || 0} />
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads qualificados */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/leads?status=qualified")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Qualificados</p>
                {loadingQualified ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold text-foreground">{qualifiedLeads}</p>
                    <PercentageChange current={qualifiedLeads || 0} previous={qualifiedPreviousPeriod || 0} />
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clientes ativos */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/clientes?status=ativo")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clientes Ativos</p>
                {loadingActiveClients ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{activeClients}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operação guiada */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/clientes?phase=operacao_guiada")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Op. Guiada</p>
                {loadingOperacao ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{clientsOperacao}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Compass className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* BLOCO 1.5: KPIs Rápidos - Linha 2 */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarefas vencidas */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${(overdueTasks || 0) > 0 ? 'border-red-500/50 hover:border-red-500' : 'hover:border-primary/50'}`}
          onClick={() => navigate("/admin/tarefas?status=overdue")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tarefas Vencidas</p>
                {loadingOverdueTasks ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className={`text-2xl font-bold ${(overdueTasks || 0) > 0 ? 'text-red-500' : 'text-foreground'}`}>
                    {overdueTasks}
                  </p>
                )}
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${(overdueTasks || 0) > 0 ? 'bg-red-500/10' : 'bg-muted'}`}>
                <AlertCircle className={`h-5 w-5 ${(overdueTasks || 0) > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campanhas ativas */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/campanhas")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Campanhas</p>
                {loadingActiveCampaigns ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{activeCampaigns}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agendamentos hoje */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/agendamentos")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agend. Hoje</p>
                {loadingAppointmentsToday ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{appointmentsToday}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarefas pendentes total */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/admin/tarefas")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tarefas Pend.</p>
                {loadingPendingTasks ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{pendingTasksTotal}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-amber-500" />
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
                    className={`flex-1 min-w-[100px] p-4 rounded-lg border transition-all hover:shadow-md hover:scale-[1.02] ${statusColors[status]}`}
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

      {/* BLOCO 3: Jornada dos Clientes com indicadores de prazo */}
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
                  <Skeleton key={i} className="h-24 flex-1" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-stretch gap-2">
                {phaseOrder.map((phase, index) => {
                  const data = clientsJourneyData?.[phase] || { total: 0, ok: 0, warning: 0, overdue: 0 };
                  return (
                    <div key={phase} className="flex items-center">
                      <button
                        onClick={() => navigate(`/admin/clientes?phase=${phase}`)}
                        className={`flex-1 min-w-[130px] p-4 rounded-lg border transition-all hover:shadow-md hover:scale-[1.02] ${phaseColors[phase]}`}
                      >
                        <p className="text-2xl font-bold">{data.total}</p>
                        <p className="text-sm font-medium mb-2">{phaseLabels[phase]}</p>
                        {data.total > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {data.ok > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                                {data.ok} ok
                              </Badge>
                            )}
                            {data.warning > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
                                {data.warning} alerta
                              </Badge>
                            )}
                            {data.overdue > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-600 border-red-500/30">
                                {data.overdue} atrasado
                              </Badge>
                            )}
                          </div>
                        )}
                      </button>
                      {index < phaseOrder.length - 1 && (
                        <ChevronRight className="h-5 w-5 text-muted-foreground mx-1 hidden sm:block" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* BLOCO 4 e 5: Grid de duas colunas */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* BLOCO 4: Fila de Ação Expandida */}
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
              {(loadingStaleLeads || loadingNoFocal || loadingOverduePhase || loadingSevereTasks) ? (
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
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {/* Clientes com fase atrasada - CRÍTICO */}
                  {clientsOverduePhase?.map((client) => (
                    <button
                      key={`overdue-${client.id}`}
                      onClick={() => navigate(`/admin/clientes/${client.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          "{client.name}" - fase atrasada
                        </p>
                        <p className="text-xs text-red-500">
                          {client.daysOverdue} dias além do prazo em {phaseLabels[client.phase]}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}

                  {/* Tarefas vencidas há mais de 3 dias - CRÍTICO */}
                  {severeOverdueTasks?.map((task: any) => (
                    <button
                      key={`task-${task.id}`}
                      onClick={() => navigate(`/admin/tarefas`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <ListTodo className="h-4 w-4 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          "{task.title}" vencida
                        </p>
                        <p className="text-xs text-red-500">
                          {task.clients?.name} • Vencida {formatRelativeTime(task.due_date)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}

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
                      <UserPlus className="h-4 w-4 text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          "{client.name}" sem ponto focal
                        </p>
                        <p className="text-xs text-muted-foreground">Definir responsável</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* BLOCO 5: Agendamentos da Semana */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-muted-foreground" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWeekAppointments ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : !weekAppointments || weekAppointments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum agendamento nos próximos 7 dias.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {weekAppointments.map((apt: any) => (
                    <button
                      key={apt.id}
                      onClick={() => navigate("/admin/agendamentos")}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left border border-border"
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isToday(new Date(apt.appointment_date)) ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Calendar className={`h-5 w-5 ${
                          isToday(new Date(apt.appointment_date)) ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{apt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.clients?.name} • {formatAppointmentDate(apt.appointment_date)}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`shrink-0 ${
                          apt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                          apt.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'pending' ? 'Pendente' : apt.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* BLOCO 6 e 7: Grid de duas colunas */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* BLOCO 6: Tarefas por Cliente */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-muted-foreground" />
                Tarefas Pendentes por Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTasksByClient ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !tasksByClient || tasksByClient.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma tarefa pendente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasksByClient.map((client) => {
                    const pending = client.total - client.completed;
                    const percentage = client.total > 0 ? Math.round((client.completed / client.total) * 100) : 0;
                    return (
                      <button
                        key={client.id}
                        onClick={() => navigate(`/admin/clientes/${client.id}`)}
                        className="w-full text-left hover:bg-muted/50 rounded-lg p-3 transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium truncate flex-1">{client.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {client.completed}/{client.total} ({percentage}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="h-2 flex-1" />
                          {client.overdue > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-600 border-red-500/30 shrink-0">
                              {client.overdue} venc.
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* BLOCO 7: Atividade Recente */}
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
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
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
