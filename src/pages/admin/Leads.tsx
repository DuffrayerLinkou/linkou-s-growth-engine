import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DateRangeFilter, presets } from "@/components/admin/DateRangeFilter";
import { LeadsKanban } from "@/components/admin/LeadsKanban";
import { ExportLeads } from "@/components/admin/ExportLeads";

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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">(
    (searchParams.get("view") as "list" | "kanban") || "list"
  );
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertFormData, setConvertFormData] = useState({
    name: "",
    segment: "",
  });
  const { toast } = useToast();

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
    const urlView = searchParams.get("view") as "list" | "kanban";
    if (urlView && urlView !== viewMode) {
      setViewMode(urlView);
    }
  }, [searchParams]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", value);
    }
    setSearchParams(searchParams);
  };

  const handleViewModeChange = (mode: "list" | "kanban") => {
    setViewMode(mode);
    searchParams.set("view", mode);
    setSearchParams(searchParams);
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      // Filtro por período
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

      // Filtro por status (apenas na lista, kanban mostra todos)
      if (statusFilter !== "all" && viewMode === "list") {
        query = query.eq("status", statusFilter);
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
  }, [statusFilter, dateRange, viewMode]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

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

  const filteredLeads = useMemo(() => {
    let result = leads;
    
    // Aplicar filtro de busca
    if (searchQuery) {
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phone?.includes(searchQuery)
      );
    }

    // Aplicar filtro de status apenas na lista
    if (statusFilter !== "all" && viewMode === "list") {
      result = result.filter((lead) => lead.status === statusFilter);
    }

    return result;
  }, [leads, searchQuery, statusFilter, viewMode]);

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  const openConvertDialog = (lead: Lead) => {
    // Try to match lead segment with client segments
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
      // 1. Create client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: convertFormData.name,
          segment: convertFormData.segment || null,
          status: "active",
          phase: "diagnostico",
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Update lead status to converted
      const { error: leadError } = await supabase
        .from("leads")
        .update({ status: "converted" })
        .eq("id", selectedLead.id);

      if (leadError) throw leadError;

      toast({
        title: "Cliente criado com sucesso!",
        description: `${convertFormData.name} foi adicionado como cliente.`,
      });

      // Close dialogs and navigate to client
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

  // Calcular contagem por status (todos os leads do período, sem filtro de status)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(statusLabels).forEach((status) => {
      counts[status] = leads.filter((l) => (l.status || "new") === status).length;
    });
    return counts;
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Gerencie os leads capturados pela landing page.
          </p>
        </div>
        <Button onClick={fetchLeads} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedPreset={selectedPreset}
            onPresetChange={setSelectedPreset}
          />
          <ExportLeads
            leads={filteredLeads}
            dateRange={dateRange}
            statusFilter={statusFilter}
          />
        </div>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => handleViewModeChange(v as "list" | "kanban")}>
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
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
              <CardHeader className="pb-2 p-4">
                <CardDescription className="text-xs">{label}</CardDescription>
                <CardTitle className="text-xl">{count}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {viewMode === "list" && (
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar status" />
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
      </div>

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
                      transition={{ delay: index * 0.03 }}
                      className="group cursor-pointer hover:bg-muted/50"
                      onClick={() => openLeadDetail(lead)}
                    >
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
                          <DropdownMenuContent align="end">
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
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
            <DialogDescription>
              Informações completas do lead capturado.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Nome</label>
                  <p className="font-medium">{selectedLead.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Select
                      value={selectedLead.status || "new"}
                      onValueChange={(value) => {
                        updateLeadStatus(selectedLead.id, value);
                        setSelectedLead({ ...selectedLead, status: value });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="text-primary hover:underline"
                  >
                    {selectedLead.email}
                  </a>
                </div>
                {selectedLead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`https://wa.me/55${selectedLead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedLead.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="flex gap-3 pt-3 border-t">
                {selectedLead.phone && (
                  <Button
                    className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white"
                    onClick={() =>
                      window.open(
                        `https://wa.me/55${selectedLead.phone!.replace(/\D/g, "")}`,
                        "_blank"
                      )
                    }
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`mailto:${selectedLead.email}`, "_blank")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Segmento</label>
                  <p>{selectedLead.segment || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Investimento
                  </label>
                  <p>{selectedLead.investment || "-"}</p>
                </div>
              </div>

              {selectedLead.objective && (
                <div>
                  <label className="text-sm text-muted-foreground">Objetivo</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                    {selectedLead.objective}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t text-sm text-muted-foreground">
                Capturado em{" "}
                {format(new Date(selectedLead.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
                {selectedLead.source && ` via ${selectedLead.source}`}
              </div>

              {/* Convert to Client Button */}
              {selectedLead.status !== "converted" && (
                <Button
                  className="w-full mt-4"
                  onClick={() => openConvertDialog(selectedLead)}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Converter em Cliente
                </Button>
              )}

              {selectedLead.status === "converted" && (
                <div className="mt-4 p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-center text-sm font-medium">
                  Este lead já foi convertido em cliente
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
