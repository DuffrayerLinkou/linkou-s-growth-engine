import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { leadStatusLabels } from "@/lib/status-config";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  status: string | null;
  segment: string | null;
}

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
}

export function BulkSender() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const { toast } = useToast();

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: async () => {
      const { data } = await (supabase.from("whatsapp_templates") as any)
        .select("*")
        .eq("is_active", true)
        .order("name");
      return (data || []) as Template[];
    },
  });

  // Fetch leads
  const { data: leads = [] } = useQuery({
    queryKey: ["leads-for-bulk"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, name, phone, status, segment").order("name");
      return (data || []) as Lead[];
    },
  });

  // Get unique segments
  const segments = useMemo(() => {
    const set = new Set(leads.map((l) => l.segment).filter(Boolean));
    return Array.from(set) as string[];
  }, [leads]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (!l.phone) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (segmentFilter !== "all" && l.segment !== segmentFilter) return false;
      return true;
    });
  }, [leads, statusFilter, segmentFilter]);

  const leadsWithoutPhone = useMemo(() => {
    return leads.filter((l) => {
      if (l.phone) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (segmentFilter !== "all" && l.segment !== segmentFilter) return false;
      return true;
    });
  }, [leads, statusFilter, segmentFilter]);

  const toggleAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleLead = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  const handleSend = async () => {
    if (!selectedTemplate || selectedLeads.size === 0) return;
    setSending(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-api", {
        body: {
          action: "send-bulk",
          lead_ids: Array.from(selectedLeads),
          template_name: selectedTemplate,
          language: "pt_BR",
        },
      });

      if (error) {
        toast({ variant: "destructive", title: "Erro no disparo em massa" });
      } else {
        setResult({ sent: data.sent, failed: data.failed });
        toast({
          title: "Disparo concluído",
          description: `${data.sent} enviados, ${data.failed} falhas`,
        });
        setSelectedLeads(new Set());
      }
    } catch {
      toast({ variant: "destructive", title: "Erro ao disparar mensagens" });
    } finally {
      setSending(false);
    }
  };

  const selectedTemplateData = templates.find((t) => t.name === selectedTemplate);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar template aprovado" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTemplateData && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Preview:</p>
              <p className="text-sm whitespace-pre-wrap">{selectedTemplateData.content}</p>
            </div>
          )}

          {templates.length === 0 && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Nenhum template disponível. Sincronize na aba Configurações.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(leadStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Segmento</label>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {segments.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-1" />
              {filteredLeads.length} leads com telefone
              {leadsWithoutPhone.length > 0 && ` (${leadsWithoutPhone.length} sem telefone)`}
            </span>
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selectedLeads.size === filteredLeads.length ? "Desmarcar todos" : "Selecionar todos"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Leads ({selectedLeads.size} selecionados)
          </CardTitle>
          <Button
            onClick={handleSend}
            disabled={!selectedTemplate || selectedLeads.size === 0 || sending}
            className="bg-[#25D366] hover:bg-[#20BD5A] text-white gap-2"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar para {selectedLeads.size} leads
          </Button>
        </CardHeader>
        <CardContent>
          {result && (
            <div className="mb-4 p-3 rounded-lg bg-muted flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#25D366]" />
              <span className="text-sm">
                Último disparo: {result.sent} enviados, {result.failed} falhas
              </span>
            </div>
          )}

          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {filteredLeads.map((lead) => (
                <label
                  key={lead.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedLeads.has(lead.id)}
                    onCheckedChange={() => toggleLead(lead.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{lead.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{lead.phone}</span>
                  </div>
                  {lead.status && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {leadStatusLabels[lead.status] || lead.status}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
