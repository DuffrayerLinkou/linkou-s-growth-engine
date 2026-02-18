import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  Target,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  UserPlus,
  Mail,
  Phone,
  Loader2,
  RefreshCw,
  List,
  LayoutGrid,
  MessageCircle,
  Building2,
  Archive,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Download,
  CheckSquare,
  X,
  BarChart2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logLeadActivity } from "@/lib/lead-activity-utils";
import { sendCRMEventToMeta } from "@/lib/crm-capi-utils";
import { DateRangeFilter, presets } from "@/components/admin/DateRangeFilter";
import { LeadsKanban } from "@/components/admin/LeadsKanban";
import { ExportLeads } from "@/components/admin/ExportLeads";
import { ImportLeads } from "@/components/admin/ImportLeads";
import { LeadDetailDialog } from "@/components/admin/leads/LeadDetailDialog";
import * as XLSX from "xlsx";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string | null;
  investment: string | null;
  objective: string | null;
  status: string | null;
  source: string | null;
  created_at: string;
}

import { clientSegments, getSegmentIcon } from "@/lib/segments-config";
import {
  leadStatusLabels as statusLabels,
  leadStatusColors as statusColors,
} from "@/lib/status-config";

export default function AdminLeads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [sourceFilter, setSourceFilter] = useState<string>(searchParams.get("source") || "all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">(
    (searchParams.get("view") as "list" | "kanban") || "list"
  );
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [convertFormData, setConvertFormData] = useState({
    name: "",
    segment: "",
  });

  // Multi-selection states
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkActioning, setIsBulkActioning] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [showMetricsBreakdown, setShowMetricsBreakdown] = useState(false);

  // Novo Lead states
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [funnels, setFunnels] = useState<{ id: string; name: string }[]>([]);
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    segment: "",
    objective: "",
    enrollInFunnel: false,
    funnelId: "",
  });

  const { toast } = useToast();

  // Fetch funnels for "Novo Lead" dropdown and bulk enroll
  useEffect(() => {
    supabase
      .from("email_funnels")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setFunnels(data || []));
  }, []);

  // Date range state
  const [selectedPreset, setSelectedPreset] = useState("last30days");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const preset = presets.find((p) => p.value === "last30days");
    return preset?.getRange();
  });

  // Sincronizar filtro com query params
  useEffect(() => {
    const urlStatus = searchParams.get("status");
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    const urlSource = searchParams.get("source");
    if (urlSource && urlSource !== sourceFilter) {
      setSourceFilter(urlSource);
    }
    const urlView = searchParams.get("view") as "list" | "kanban";
    if (urlView && urlView !== viewMode) {
      setViewMode(urlView);
    }
  }, [searchParams]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedLeadIds(new Set());
  }, [statusFilter, sourceFilter, segmentFilter, searchQuery, viewMode]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", value);
    }
    setSearchParams(searchParams);
  };

  const handleSourceFilterChange = (value: string) => {
    setSourceFilter(value);
    if (value === "all") {
      searchParams.delete("source");
    } else {
      searchParams.set("source", value);
    }
    setSearchParams(searchParams);
  };

  const handleViewModeChange = (mode: "list" | "kanban") => {
    setViewMode(mode);
    searchParams.set("view", mode);
    setSearchParams(searchParams);
  };

  // Selection logic
  const toggleLead = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedLeadIds(
      selectedLeadIds.size === filteredLeads.length
        ? new Set()
        : new Set(filteredLeads.map((l) => l.id))
    );
  };

  const clearSelection = () => setSelectedLeadIds(new Set());

  // Bulk actions
  const bulkUpdateStatus = async (newStatus: string) => {
    setIsBulkActioning(true);
    try {
      const ids = Array.from(selectedLeadIds);
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .in("id", ids);
      if (error) throw error;

      setLeads((prev) =>
        prev.map((l) => selectedLeadIds.has(l.id) ? { ...l, status: newStatus } : l)
      );
      toast({
        title: "Status atualizado",
        description: `${ids.length} lead(s) marcados como ${statusLabels[newStatus]}.`,
      });
      clearSelection();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao atualizar status", description: "Tente novamente." });
    } finally {
      setIsBulkActioning(false);
    }
  };

  const bulkEnrollFunnel = async (funnelId: string) => {
    setIsBulkActioning(true);
    try {
      const ids = Array.from(selectedLeadIds);
      const rows = ids.map((lead_id) => ({ lead_id, funnel_id: funnelId, status: "active" }));
      const { error } = await supabase.from("lead_funnel_enrollments").upsert(rows, {
        onConflict: "lead_id,funnel_id",
        ignoreDuplicates: true,
      });
      if (error) throw error;

      const funnel = funnels.find((f) => f.id === funnelId);
      toast({
        title: "Inscrição realizada",
        description: `${ids.length} lead(s) inscritos no funil "${funnel?.name}".`,
      });
      clearSelection();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao inscrever no funil", description: "Tente novamente." });
    } finally {
      setIsBulkActioning(false);
    }
  };

  const bulkArchive = async () => {
    await bulkUpdateStatus("archived");
  };

  const bulkDelete = async () => {
    setIsBulkActioning(true);
    try {
      const ids = Array.from(selectedLeadIds);
      const { error } = await supabase.from("leads").delete().in("id", ids);
      if (error) throw error;

      setLeads((prev) => prev.filter((l) => !selectedLeadIds.has(l.id)));
      toast({
        title: "Leads excluídos",
        description: `${ids.length} lead(s) removidos permanentemente.`,
      });
      clearSelection();
      setIsBulkDeleteOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: "Tente novamente." });
    } finally {
      setIsBulkActioning(false);
    }
  };

  const bulkExport = () => {
    const selectedLeads = filteredLeads.filter((l) => selectedLeadIds.has(l.id));
    const data = selectedLeads.map((l) => ({
      Nome: l.name,
      Email: l.email,
      Telefone: l.phone || "",
      Segmento: l.segment || "",
      Status: statusLabels[l.status || "new"],
      Origem: l.source || "",
      Investimento: l.investment || "",
      Data: format(new Date(l.created_at), "dd/MM/yyyy", { locale: ptBR }),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `leads-selecionados-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const createManualLead = async () => {
    if (!newLeadForm.name || !newLeadForm.email) return;
    setIsSavingLead(true);
    try {
      const { data: lead, error } = await supabase
        .from("leads")
        .insert({
          name: newLeadForm.name,
          email: newLeadForm.email,
          phone: newLeadForm.phone || null,
          segment: newLeadForm.segment || null,
          objective: newLeadForm.objective || null,
          source: "manual",
          status: "new",
        })
        .select()
        .single();

      if (error) throw error;

      if (newLeadForm.enrollInFunnel && newLeadForm.funnelId && lead) {
        const { error: enrollError } = await supabase
          .from("lead_funnel_enrollments")
          .insert({
            lead_id: lead.id,
            funnel_id: newLeadForm.funnelId,
            status: "active",
          });
        if (enrollError) throw enrollError;
      }

      toast({
        title: "Lead criado com sucesso!",
        description: newLeadForm.enrollInFunnel
          ? "Lead adicionado e inscrito no funil de email."
          : "Lead adicionado manualmente.",
      });

      setNewLeadForm({ name: "", email: "", phone: "", segment: "", objective: "", enrollInFunnel: false, funnelId: "" });
      setIsNewLeadOpen(false);
      fetchLeads();
    } catch (error) {
      console.error("Error creating lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar lead",
        description: "Verifique os dados e tente novamente.",
      });
    } finally {
      setIsSavingLead(false);
    }
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateRange?.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        query = query.gte("created_at", fromDate.toISOString());
      }
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", toDate.toISOString());
      }

      if (statusFilter !== "all" && viewMode === "list") {
        query = query.eq("status", statusFilter);
      }

      if (sourceFilter !== "all") {
        query = query.eq("source", sourceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar leads",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sourceFilter, dateRange, viewMode]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      const oldLead = leads.find((l) => l.id === leadId);
      if (oldLead) {
        logLeadActivity(leadId, "status_change", `Status: ${statusLabels[oldLead.status || "new"]} → ${statusLabels[newStatus]}`).catch(() => {});
        sendCRMEventToMeta(oldLead, newStatus).catch(console.error);
      }

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );

      toast({
        title: "Status atualizado",
        description: `Lead marcado como ${statusLabels[newStatus]}.`,
      });
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Tente novamente.",
      });
    }
  };

  const deleteLead = async (leadId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId);

      if (error) throw error;

      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      setIsDeleteDialogOpen(false);
      setIsDetailOpen(false);
      setLeadToDelete(null);

      toast({
        title: "Lead excluído",
        description: "O lead foi removido permanentemente.",
      });
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Tente novamente.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteDialogOpen(true);
  };

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (searchQuery) {
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phone?.includes(searchQuery)
      );
    }

    if (statusFilter !== "all" && viewMode === "list") {
      result = result.filter((lead) => lead.status === statusFilter);
    }

    if (segmentFilter !== "all") {
      result = result.filter((lead) => lead.segment === segmentFilter);
    }

    return result;
  }, [leads, searchQuery, statusFilter, viewMode, segmentFilter]);

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  const openConvertDialog = (lead: Lead) => {
    const matchedSegment = clientSegments.find(
      (s) => lead.segment && s.toLowerCase().includes(lead.segment.toLowerCase())
    ) || "";
    setConvertFormData({
      name: lead.name,
      segment: matchedSegment,
    });
    setIsConvertDialogOpen(true);
  };

  const convertToClient = async () => {
    if (!selectedLead) return;
    setIsConverting(true);
    try {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: convertFormData.name,
          segment: convertFormData.segment || null,
          status: "ativo",
          phase: "diagnostico",
        })
        .select()
        .single();

      if (clientError) throw clientError;

      const { error: leadError } = await supabase
        .from("leads")
        .update({ status: "converted" })
        .eq("id", selectedLead.id);

      if (leadError) throw leadError;

      toast({
        title: "Cliente criado com sucesso!",
        description: `${convertFormData.name} foi adicionado como cliente.`,
      });

      setIsConvertDialogOpen(false);
      setIsDetailOpen(false);
      navigate(`/admin/clientes/${client.id}`);
    } catch (error) {
      console.error("Error converting lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao converter lead",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(statusLabels).forEach((status) => {
      counts[status] = leads.filter((l) => (l.status || "new") === status).length;
    });
    return counts;
  }, [leads]);

  // Metrics breakdown (client-side)
  const segmentBreakdown = useMemo(() =>
    clientSegments
      .map((seg) => ({ segment: seg, count: leads.filter((l) => l.segment === seg).length }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count),
  [leads]);

  const sourceBreakdown = useMemo(() => ({
    landing_page: leads.filter((l) => l.source === "landing_page").length,
    meta_instant_form: leads.filter((l) => l.source === "meta_instant_form").length,
    manual: leads.filter((l) => l.source === "manual").length,
    other: leads.filter((l) => !["landing_page", "meta_instant_form", "manual"].includes(l.source || "")).length,
  }), [leads]);

  const conversionRate = useMemo(() => {
    const converted = leads.filter((l) => l.status === "converted").length;
    return leads.length > 0 ? ((converted / leads.length) * 100).toFixed(1) : "0";
  }, [leads]);

  const avgInvestment = useMemo(() => {
    const withInvestment = leads.filter((l) => l.investment && l.investment.trim() !== "");
    return withInvestment.length;
  }, [leads]);

  const selectedCount = selectedLeadIds.size;
  const allSelected = filteredLeads.length > 0 && selectedCount === filteredLeads.length;
  const someSelected = selectedCount > 0 && selectedCount < filteredLeads.length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie os leads capturados e adicionados manualmente.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button onClick={() => setIsNewLeadOpen(true)} size="sm" className="text-xs sm:text-sm">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Novo Lead
          </Button>
          <Button onClick={fetchLeads} variant="outline" size="sm" className="text-xs sm:text-sm">
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedPreset={selectedPreset}
            onPresetChange={setSelectedPreset}
          />
          <ImportLeads onImportComplete={fetchLeads} />
          <ExportLeads
            leads={filteredLeads}
            dateRange={dateRange}
            statusFilter={statusFilter}
          />
        </div>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => handleViewModeChange(v as "list" | "kanban")}>
          <TabsList className="h-8 sm:h-9">
            <TabsTrigger value="list" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(statusLabels).map(([status, label]) => {
          const count = statusCounts[status] || 0;
          return (
            <Card
              key={status}
              className={`cursor-pointer transition-colors ${
                statusFilter === status ? "border-primary" : "hover:border-primary/50"
              }`}
              onClick={() => handleStatusFilterChange(status === statusFilter ? "all" : status)}
            >
              <CardHeader className="p-2.5 sm:p-4 pb-2">
                <CardDescription className="text-[10px] sm:text-xs truncate">{label}</CardDescription>
                <CardTitle className="text-lg sm:text-xl">{count}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Metrics Breakdown (collapsible) */}
      <Collapsible open={showMetricsBreakdown} onOpenChange={setShowMetricsBreakdown}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm">
            <BarChart2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Análise detalhada
            {showMetricsBreakdown ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Conversion rate */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Taxa de Conversão
                </CardDescription>
                <CardTitle className="text-2xl">{conversionRate}%</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Progress value={parseFloat(conversionRate)} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">
                  {leads.filter((l) => l.status === "converted").length} de {leads.length} leads
                </p>
              </CardContent>
            </Card>

            {/* Investment info */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs">Investimento declarado</CardDescription>
                <CardTitle className="text-2xl">{avgInvestment}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  leads com valor declarado ({leads.length > 0 ? ((avgInvestment / leads.length) * 100).toFixed(0) : 0}%)
                </p>
              </CardContent>
            </Card>

            {/* Source breakdown */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs">Por Origem</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {[
                  { key: "landing_page", label: "Landing Page", count: sourceBreakdown.landing_page },
                  { key: "meta_instant_form", label: "Meta Lead Ads", count: sourceBreakdown.meta_instant_form },
                  { key: "manual", label: "Manual", count: sourceBreakdown.manual },
                  { key: "other", label: "Outros", count: sourceBreakdown.other },
                ]
                  .filter((s) => s.count > 0)
                  .map((s) => (
                    <div key={s.key} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-muted-foreground truncate">{s.label}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Progress
                          value={leads.length > 0 ? (s.count / leads.length) * 100 : 0}
                          className="h-1.5 w-16"
                        />
                        <span className="font-medium w-6 text-right">{s.count}</span>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Segment breakdown */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs">Por Segmento</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {segmentBreakdown.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum segmento cadastrado</p>
                ) : (
                  segmentBreakdown.slice(0, 5).map((s) => {
                    const Icon = getSegmentIcon(s.segment);
                    return (
                      <div key={s.segment} className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground truncate">{s.segment}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Progress
                            value={leads.length > 0 ? (s.count / leads.length) * 100 : 0}
                            className="h-1.5 w-12"
                          />
                          <span className="font-medium w-6 text-right">{s.count}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        {viewMode === "list" && (
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[150px] text-xs sm:text-sm">
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={sourceFilter} onValueChange={handleSourceFilterChange}>
          <SelectTrigger className="w-full sm:w-[160px] text-xs sm:text-sm">
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            <SelectItem value="landing_page">Landing Page</SelectItem>
            <SelectItem value="meta_instant_form">Meta Lead Ads</SelectItem>
            <SelectItem value="manual">Adicionado manualmente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <SelectValue placeholder="Segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os segmentos</SelectItem>
            {clientSegments.map((seg) => (
              <SelectItem key={seg} value={seg}>
                {seg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/60 backdrop-blur-sm"
          >
            <span className="text-sm font-medium mr-1">
              {selectedCount} lead{selectedCount !== 1 ? "s" : ""} selecionado{selectedCount !== 1 ? "s" : ""}
            </span>

            {/* Alterar Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={isBulkActioning}>
                  Alterar status <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="z-50 bg-popover">
                <DropdownMenuLabel className="text-xs">Novo status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(statusLabels).map(([value, label]) => (
                  <DropdownMenuItem key={value} onClick={() => bulkUpdateStatus(value)} className="text-xs">
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Inscrever no funil */}
            {funnels.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={isBulkActioning}>
                    Inscrever no funil <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-50 bg-popover">
                  <DropdownMenuLabel className="text-xs">Selecionar funil</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {funnels.map((f) => (
                    <DropdownMenuItem key={f.id} onClick={() => bulkEnrollFunnel(f.id)} className="text-xs">
                      {f.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Arquivar */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={bulkArchive}
              disabled={isBulkActioning}
            >
              <Archive className="h-3 w-3" />
              Arquivar
            </Button>

            {/* Exportar */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={bulkExport}
              disabled={isBulkActioning}
            >
              <Download className="h-3 w-3" />
              Exportar
            </Button>

            {/* Excluir */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={isBulkActioning}
            >
              <Trash2 className="h-3 w-3" />
              Excluir
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 ml-auto"
              onClick={clearSelection}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "kanban" ? (
        <LeadsKanban
          leads={filteredLeads}
          onStatusChange={updateLeadStatus}
          onLeadClick={openLeadDetail}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum lead encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] pl-4">
                      <Checkbox
                        checked={allSelected}
                        ref={(el) => {
                          if (el) {
                            const input = el as unknown as HTMLButtonElement;
                            if (someSelected) {
                              input.dataset.state = "indeterminate";
                            }
                          }
                        }}
                        data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                        onCheckedChange={toggleAll}
                        aria-label="Selecionar todos"
                        className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Contato</TableHead>
                    <TableHead className="hidden lg:table-cell">Segmento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead, index) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`group cursor-pointer hover:bg-muted/50 border-b transition-colors ${
                        selectedLeadIds.has(lead.id) ? "bg-primary/5" : ""
                      }`}
                      onClick={() => openLeadDetail(lead)}
                    >
                      <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLeadIds.has(lead.id)}
                          onCheckedChange={() => toggleLead(lead.id)}
                          aria-label={`Selecionar ${lead.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-muted-foreground md:hidden">
                          {lead.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{lead.email}</span>
                          {lead.phone && (
                            <span className="text-sm text-muted-foreground">
                              {lead.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = getSegmentIcon(lead.segment);
                            return <Icon className="h-4 w-4 text-muted-foreground" />;
                          })()}
                          {lead.segment || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[lead.status || "new"]}
                        >
                          {statusLabels[lead.status || "new"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {format(new Date(lead.created_at), "dd/MM/yy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-50 bg-popover">
                            <DropdownMenuItem onClick={() => openLeadDetail(lead)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateLeadStatus(lead.id, "contacted")}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Marcar como contatado
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateLeadStatus(lead.id, "qualified")}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Qualificar lead
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateLeadStatus(lead.id, "archived")}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Arquivar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(lead)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lead Detail Dialog */}
      <LeadDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        lead={selectedLead}
        onStatusChange={updateLeadStatus}
        onConvert={openConvertDialog}
        onDelete={openDeleteDialog}
        onLeadUpdated={(updatedLead) => setSelectedLead(updatedLead)}
      />

      {/* Convert to Client Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Converter Lead em Cliente</DialogTitle>
            <DialogDescription>
              Os dados do lead serão usados para criar um novo cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome do Cliente / Empresa</Label>
              <Input
                id="client-name"
                value={convertFormData.name}
                onChange={(e) =>
                  setConvertFormData({ ...convertFormData, name: e.target.value })
                }
                placeholder="Nome do cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-segment">Segmento</Label>
              <Select
                value={convertFormData.segment}
                onValueChange={(value) =>
                  setConvertFormData({ ...convertFormData, segment: value })
                }
              >
                <SelectTrigger id="client-segment">
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  {clientSegments.map((segment) => (
                    <SelectItem key={segment} value={segment}>
                      {segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLead && (
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <p className="font-medium text-muted-foreground">Dados do Lead:</p>
                <p>Email: {selectedLead.email}</p>
                {selectedLead.phone && <p>Telefone: {selectedLead.phone}</p>}
                {selectedLead.investment && <p>Investimento: {selectedLead.investment}</p>}
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsConvertDialogOpen(false)}
              disabled={isConverting}
            >
              Cancelar
            </Button>
            <Button
              onClick={convertToClient}
              disabled={!convertFormData.name || isConverting}
            >
              {isConverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Criar Cliente
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Lead AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lead "{leadToDelete?.name}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leadToDelete && deleteLead(leadToDelete.id)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete AlertDialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedCount} lead{selectedCount !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os {selectedCount} leads selecionados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkActioning}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDelete}
              disabled={isBulkActioning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkActioning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                `Excluir ${selectedCount} lead${selectedCount !== 1 ? "s" : ""}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Novo Lead Dialog */}
      <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Lead</DialogTitle>
            <DialogDescription>
              Cadastre um lead manualmente e inscreva-o em um funil de email se desejar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="nl-name">Nome *</Label>
                <Input
                  id="nl-name"
                  placeholder="Nome completo"
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="nl-email">Email *</Label>
                <Input
                  id="nl-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nl-phone">Telefone</Label>
                <Input
                  id="nl-phone"
                  placeholder="(41) 99999-9999"
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nl-segment">Segmento</Label>
                <Select
                  value={newLeadForm.segment}
                  onValueChange={(v) => setNewLeadForm({ ...newLeadForm, segment: v })}
                >
                  <SelectTrigger id="nl-segment">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientSegments.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="nl-objective">Objetivo / Observação</Label>
                <Textarea
                  id="nl-objective"
                  placeholder="Descreva o objetivo ou como chegou até o lead..."
                  className="min-h-[72px] resize-none"
                  value={newLeadForm.objective}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, objective: e.target.value })}
                />
              </div>
            </div>

            {/* Funnel enrollment */}
            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nl-funnel"
                  checked={newLeadForm.enrollInFunnel}
                  onCheckedChange={(checked) =>
                    setNewLeadForm({ ...newLeadForm, enrollInFunnel: !!checked })
                  }
                />
                <Label htmlFor="nl-funnel" className="cursor-pointer font-normal">
                  Inscrever em funil de email
                </Label>
              </div>
              {newLeadForm.enrollInFunnel && (
                <Select
                  value={newLeadForm.funnelId}
                  onValueChange={(v) => setNewLeadForm({ ...newLeadForm, funnelId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funil" />
                  </SelectTrigger>
                  <SelectContent>
                    {funnels.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewLeadOpen(false)} disabled={isSavingLead}>
              Cancelar
            </Button>
            <Button
              onClick={createManualLead}
              disabled={!newLeadForm.name || !newLeadForm.email || isSavingLead || (newLeadForm.enrollInFunnel && !newLeadForm.funnelId)}
            >
              {isSavingLead ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" />Adicionar Lead</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
