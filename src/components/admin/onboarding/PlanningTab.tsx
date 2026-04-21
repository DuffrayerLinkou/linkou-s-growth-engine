import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Target, Clock, FileText, CheckCircle, Edit, Trash2, Eye, Download, X, Users, TrendingUp, TrendingDown, Layers, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { safeFormatDate } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: FileText },
  active: { label: "Ativo", color: "bg-blue-500/20 text-blue-600", icon: Target },
  completed: { label: "Concluído", color: "bg-green-500/20 text-green-600", icon: CheckCircle },
};

const campaignTypes = [
  { id: "awareness", label: "Awareness (Reconhecimento)" },
  { id: "consideration", label: "Consideração" },
  { id: "conversion", label: "Conversão" },
  { id: "remarketing", label: "Remarketing" },
  { id: "lookalike", label: "Lookalike" },
];

const channelOptions = ["Meta Ads", "Google Ads", "TikTok Ads", "LinkedIn Ads", "YouTube", "SEO", "Email", "WhatsApp", "Orgânico"];
const kpiCategories = ["Aquisição", "Conversão", "Retenção", "Engajamento", "Receita"];

// ====== Tipos ======
interface Objective { name: string; description?: string; metric?: string; baseline?: string; target?: string; deadline?: string; owner?: string; }
interface KPI { name: string; category?: string; unit?: string; current?: string; target?: string; source?: string; frequency?: string; }
interface Persona { name: string; demographics?: string; pain_points?: string[]; desires?: string[]; objections?: string[]; channels?: string[]; message_hook?: string; }
interface FunnelStage { goal?: string; channels?: string[]; creatives?: string; kpi?: string; budget_pct?: number; }
interface FunnelStrategy { topo?: FunnelStage; meio?: FunnelStage; fundo?: FunnelStage; reengajamento?: FunnelStage; }
interface Competitor { name: string; strengths?: string; weaknesses?: string; }
interface Diagnostic { current_situation?: string; competitors?: Competitor[]; opportunities?: string[]; risks?: string[]; positioning?: string; }
interface Wave { name: string; period?: string; deliverables?: string[]; milestones?: string[]; }
interface Governance { call_cadence?: string; reports?: string; tools?: string; responsibles?: string; }
interface ExecutionPlan { waves?: Wave[]; governance?: Governance; }
interface BudgetAllocation { total_monthly?: number; by_channel?: Record<string, number>; by_phase?: { topo?: number; meio?: number; fundo?: number }; reserve_pct?: number; }

interface PlanForm {
  client_id: string;
  title: string;
  status: string;
  timeline_start: string;
  timeline_end: string;
  executive_summary: string;
  objectives: Objective[];
  kpis: KPI[];
  personas: Persona[];
  funnel_strategy: FunnelStrategy;
  campaign_types: string[];
  diagnostic: Diagnostic;
  execution_plan: ExecutionPlan;
  budget_allocation: BudgetAllocation;
}

const emptyStage: FunnelStage = { goal: "", channels: [], creatives: "", kpi: "", budget_pct: 0 };

const initialForm: PlanForm = {
  client_id: "",
  title: "",
  status: "draft",
  timeline_start: "",
  timeline_end: "",
  executive_summary: "",
  objectives: [],
  kpis: [],
  personas: [],
  funnel_strategy: { topo: { ...emptyStage }, meio: { ...emptyStage }, fundo: { ...emptyStage } },
  campaign_types: [],
  diagnostic: { current_situation: "", competitors: [], opportunities: [], risks: [], positioning: "" },
  execution_plan: { waves: [], governance: { call_cadence: "", reports: "", tools: "", responsibles: "" } },
  budget_allocation: { total_monthly: 0, by_channel: {}, by_phase: { topo: 30, meio: 40, fundo: 30 }, reserve_pct: 10 },
};

interface PlanningTabProps { clientId?: string; }

// Helper para listas string editáveis
function StringListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { e.preventDefault(); onChange([...items, draft.trim()]); setDraft(""); } }}
          placeholder={placeholder}
          className="h-9"
        />
        <Button type="button" size="sm" variant="outline" onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); } }}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
              <span className="text-xs">{it}</span>
              <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="hover:bg-destructive/20 rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Multi-select compacto
function ChannelMultiSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (c: string) => onChange(value.includes(c) ? value.filter(x => x !== c) : [...value, c]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {channelOptions.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => toggle(c)}
          className={`px-2 py-1 rounded-md text-xs border transition-colors ${value.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted"}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function PlanningTab({ clientId }: PlanningTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [viewingPlan, setViewingPlan] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(initialForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: plans = [], isLoading, error: plansError } = useQuery({
    queryKey: ["strategic-plans", clientId],
    queryFn: async () => {
      let query = supabase.from("strategic_plans").select("*").order("created_at", { ascending: false });
      if (clientId) query = query.eq("client_id", clientId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || "Cliente";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        client_id: form.client_id,
        title: form.title,
        status: form.status,
        timeline_start: form.timeline_start || null,
        timeline_end: form.timeline_end || null,
        executive_summary: form.executive_summary || null,
        objectives: form.objectives.length > 0 ? form.objectives : null,
        kpis: form.kpis.length > 0 ? form.kpis : null,
        personas: form.personas.length > 0 ? form.personas : null,
        funnel_strategy: form.funnel_strategy as any,
        campaign_types: form.campaign_types.length > 0 ? form.campaign_types : null,
        diagnostic: form.diagnostic as any,
        execution_plan: form.execution_plan as any,
        budget_allocation: form.budget_allocation as any,
      };

      if (editingPlan) {
        const { error } = await supabase.from("strategic_plans").update(payload).eq("id", editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("strategic_plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategic-plans"] });
      queryClient.invalidateQueries({ queryKey: ["strategic-plans-progress"] });
      setIsDialogOpen(false);
      setEditingPlan(null);
      setForm(clientId ? { ...initialForm, client_id: clientId } : initialForm);
      toast({ title: editingPlan ? "Plano atualizado!" : "Plano criado!" });
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e?.message || "Não foi possível salvar.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("strategic_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategic-plans"] });
      queryClient.invalidateQueries({ queryKey: ["strategic-plans-progress"] });
      setDeleteId(null);
      toast({ title: "Plano excluído!" });
    },
  });

  // Migra estruturas antigas → novas ao abrir edição
  const normalizeFromDB = (plan: any): PlanForm => {
    // objectives
    let objectives: Objective[] = [];
    if (Array.isArray(plan.objectives)) objectives = plan.objectives;
    else if (plan.objectives?.list) objectives = plan.objectives.list.map((s: string) => ({ name: s }));
    // kpis
    let kpis: KPI[] = [];
    if (Array.isArray(plan.kpis)) kpis = plan.kpis;
    else if (plan.kpis?.list) kpis = plan.kpis.list.map((s: string) => ({ name: s }));
    // personas
    let personas: Persona[] = [];
    if (Array.isArray(plan.personas)) personas = plan.personas;
    else if (plan.personas?.description) personas = [{ name: "Persona", demographics: plan.personas.description }];
    // funnel
    let funnel: FunnelStrategy = { topo: { ...emptyStage }, meio: { ...emptyStage }, fundo: { ...emptyStage } };
    if (plan.funnel_strategy && typeof plan.funnel_strategy === "object") funnel = { ...funnel, ...plan.funnel_strategy };

    return {
      client_id: plan.client_id,
      title: plan.title || "",
      status: plan.status || "draft",
      timeline_start: plan.timeline_start || "",
      timeline_end: plan.timeline_end || "",
      executive_summary: plan.executive_summary || "",
      objectives,
      kpis,
      personas,
      funnel_strategy: funnel,
      campaign_types: plan.campaign_types || [],
      diagnostic: plan.diagnostic || { current_situation: "", competitors: [], opportunities: [], risks: [], positioning: "" },
      execution_plan: plan.execution_plan || { waves: [], governance: { call_cadence: "", reports: "", tools: "", responsibles: "" } },
      budget_allocation: plan.budget_allocation || { total_monthly: 0, by_channel: {}, by_phase: { topo: 30, meio: 40, fundo: 30 }, reserve_pct: 10 },
    };
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm(normalizeFromDB(plan));
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingPlan(null);
    setForm(clientId ? { ...initialForm, client_id: clientId } : initialForm);
    setIsDialogOpen(true);
  };

  const toggleCampaignType = (typeId: string) => {
    setForm(prev => ({ ...prev, campaign_types: prev.campaign_types.includes(typeId) ? prev.campaign_types.filter(t => t !== typeId) : [...prev.campaign_types, typeId] }));
  };

  // ===== Repeater helpers =====
  const updateObjective = (i: number, patch: Partial<Objective>) => setForm(f => ({ ...f, objectives: f.objectives.map((o, idx) => idx === i ? { ...o, ...patch } : o) }));
  const updateKPI = (i: number, patch: Partial<KPI>) => setForm(f => ({ ...f, kpis: f.kpis.map((k, idx) => idx === i ? { ...k, ...patch } : k) }));
  const updatePersona = (i: number, patch: Partial<Persona>) => setForm(f => ({ ...f, personas: f.personas.map((p, idx) => idx === i ? { ...p, ...patch } : p) }));
  const updateStage = (key: keyof FunnelStrategy, patch: Partial<FunnelStage>) => setForm(f => ({ ...f, funnel_strategy: { ...f.funnel_strategy, [key]: { ...(f.funnel_strategy[key] || emptyStage), ...patch } } }));
  const updateWave = (i: number, patch: Partial<Wave>) => setForm(f => ({ ...f, execution_plan: { ...f.execution_plan, waves: (f.execution_plan.waves || []).map((w, idx) => idx === i ? { ...w, ...patch } : w) } }));

  const exportPDF = async (plan: any) => {
    const { generateStrategicPlanPDF } = await import("@/lib/pdf-generator");
    generateStrategicPlanPDF(normalizeFromDB(plan) as any, getClientName(plan.client_id));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="h-4 w-4 sm:h-5 sm:w-5" />
              Planos Estratégicos
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {clientId ? "Planos do cliente selecionado" : "Documentos estratégicos completos"}
            </CardDescription>
          </div>
          <Button onClick={openNew} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Novo Plano</span>
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : plansError ? (
            <div className="text-center py-8 text-destructive text-sm">Não foi possível carregar os planos.</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">{clientId ? "Nenhum plano para este cliente" : "Nenhum plano criado ainda"}</div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan: any) => {
                const status = statusConfig[plan.status as keyof typeof statusConfig] || statusConfig.draft;
                const StatusIcon = status.icon;
                const personasCount = Array.isArray(plan.personas) ? plan.personas.length : (plan.personas?.description ? 1 : 0);
                const objectivesCount = Array.isArray(plan.objectives) ? plan.objectives.length : (plan.objectives?.list?.length || 0);
                return (
                  <Card key={plan.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="p-3 sm:pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-sm sm:text-base truncate">{plan.title}</CardTitle>
                          <CardDescription className="text-xs">{getClientName(plan.client_id)}</CardDescription>
                        </div>
                        <Badge className={`${status.color} shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">{status.label}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:pt-2">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex gap-3 text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{personasCount} personas</span>
                          <span className="flex items-center gap-1"><Target className="h-3 w-3" />{objectivesCount} objetivos</span>
                        </div>
                        {plan.timeline_start && plan.timeline_end && (
                          <p className="text-muted-foreground">
                            {safeFormatDate(plan.timeline_start, "dd/MM/yy", "")} - {safeFormatDate(plan.timeline_end, "dd/MM/yy", "")}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {safeFormatDate(plan.created_at)}
                        </div>
                      </div>
                      <div className="flex gap-1 mt-3 flex-wrap">
                        <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => setViewingPlan(plan)}>
                          <Eye className="h-3 w-3 mr-1" />Ver
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => openEdit(plan)}>
                          <Edit className="h-3 w-3 mr-1" />Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => exportPDF(plan)}>
                          <Download className="h-3 w-3 mr-1" />PDF
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs px-2 text-destructive" onClick={() => setDeleteId(plan.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog — 6 tabs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editingPlan ? "Editar Plano Estratégico" : "Novo Plano Estratégico"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full mt-2">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="overview" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Visão</TabsTrigger>
              <TabsTrigger value="diagnostic" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Diagnóstico</TabsTrigger>
              <TabsTrigger value="personas" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Personas</TabsTrigger>
              <TabsTrigger value="okrs" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Obj/KPIs</TabsTrigger>
              <TabsTrigger value="funnel" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Funil</TabsTrigger>
              <TabsTrigger value="execution" className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Execução</TabsTrigger>
            </TabsList>

            {/* === VISÃO GERAL === */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Cliente *</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })} disabled={!!clientId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Título *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9" placeholder="Plano Estratégico Q2 2026" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Início</Label>
                  <Input type="date" value={form.timeline_start} onChange={(e) => setForm({ ...form, timeline_start: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fim</Label>
                  <Input type="date" value={form.timeline_end} onChange={(e) => setForm({ ...form, timeline_end: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Sumário Executivo</Label>
                <Textarea value={form.executive_summary} onChange={(e) => setForm({ ...form, executive_summary: e.target.value })} placeholder="Resumo de 3-5 linhas do plano..." className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Tipos de Campanha</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {campaignTypes.map((t) => (
                    <div key={t.id} className="flex items-center space-x-2">
                      <Checkbox id={t.id} checked={form.campaign_types.includes(t.id)} onCheckedChange={() => toggleCampaignType(t.id)} />
                      <Label htmlFor={t.id} className="text-xs font-normal cursor-pointer">{t.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* === DIAGNÓSTICO === */}
            <TabsContent value="diagnostic" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Situação Atual</Label>
                <Textarea value={form.diagnostic.current_situation || ""} onChange={(e) => setForm({ ...form, diagnostic: { ...form.diagnostic, current_situation: e.target.value } })} placeholder="Onde o cliente está hoje, principais gargalos e contexto de mercado..." className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Posicionamento</Label>
                <Textarea value={form.diagnostic.positioning || ""} onChange={(e) => setForm({ ...form, diagnostic: { ...form.diagnostic, positioning: e.target.value } })} placeholder="Como o cliente quer ser percebido no mercado..." className="min-h-[60px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-600" />Oportunidades</Label>
                  <StringListEditor items={form.diagnostic.opportunities || []} onChange={(v) => setForm({ ...form, diagnostic: { ...form.diagnostic, opportunities: v } })} placeholder="Ex: Demanda crescente em..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1"><TrendingDown className="h-3 w-3 text-destructive" />Riscos</Label>
                  <StringListEditor items={form.diagnostic.risks || []} onChange={(v) => setForm({ ...form, diagnostic: { ...form.diagnostic, risks: v } })} placeholder="Ex: Sazonalidade no Q3..." />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Concorrentes</Label>
                  <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, diagnostic: { ...form.diagnostic, competitors: [...(form.diagnostic.competitors || []), { name: "", strengths: "", weaknesses: "" }] } })}>
                    <Plus className="h-3 w-3 mr-1" />Adicionar
                  </Button>
                </div>
                {(form.diagnostic.competitors || []).map((c, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 border rounded-md">
                    <Input value={c.name} onChange={(e) => setForm({ ...form, diagnostic: { ...form.diagnostic, competitors: form.diagnostic.competitors!.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x) } })} placeholder="Nome" className="h-8 text-xs" />
                    <Input value={c.strengths || ""} onChange={(e) => setForm({ ...form, diagnostic: { ...form.diagnostic, competitors: form.diagnostic.competitors!.map((x, idx) => idx === i ? { ...x, strengths: e.target.value } : x) } })} placeholder="Pontos fortes" className="h-8 text-xs" />
                    <div className="flex gap-1">
                      <Input value={c.weaknesses || ""} onChange={(e) => setForm({ ...form, diagnostic: { ...form.diagnostic, competitors: form.diagnostic.competitors!.map((x, idx) => idx === i ? { ...x, weaknesses: e.target.value } : x) } })} placeholder="Pontos fracos" className="h-8 text-xs" />
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setForm({ ...form, diagnostic: { ...form.diagnostic, competitors: form.diagnostic.competitors!.filter((_, idx) => idx !== i) } })}><X className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* === PERSONAS === */}
            <TabsContent value="personas" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Defina pelo menos 2-3 personas com dores, desejos e canais.</p>
                <Button type="button" size="sm" onClick={() => setForm({ ...form, personas: [...form.personas, { name: "", demographics: "", pain_points: [], desires: [], objections: [], channels: [], message_hook: "" }] })}>
                  <Plus className="h-4 w-4 mr-1" />Persona
                </Button>
              </div>
              {form.personas.length === 0 && <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-md">Nenhuma persona ainda</div>}
              {form.personas.map((p, i) => (
                <Card key={i} className="border-l-4 border-l-primary">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <Input value={p.name} onChange={(e) => updatePersona(i, { name: e.target.value })} placeholder="Nome da persona (ex: Mariana, gestora de clínica)" className="h-9 text-sm font-medium" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, personas: form.personas.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Demografia</Label>
                      <Textarea value={p.demographics || ""} onChange={(e) => updatePersona(i, { demographics: e.target.value })} placeholder="Idade, profissão, localização, renda..." className="min-h-[50px] text-xs" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Dores</Label>
                        <StringListEditor items={p.pain_points || []} onChange={(v) => updatePersona(i, { pain_points: v })} placeholder="Ex: falta tempo para gerir agenda" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Desejos</Label>
                        <StringListEditor items={p.desires || []} onChange={(v) => updatePersona(i, { desires: v })} placeholder="Ex: previsibilidade de faturamento" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Objeções</Label>
                        <StringListEditor items={p.objections || []} onChange={(v) => updatePersona(i, { objections: v })} placeholder="Ex: já tentou agência antes" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Canais preferidos</Label>
                        <ChannelMultiSelect value={p.channels || []} onChange={(v) => updatePersona(i, { channels: v })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Mensagem-chave / Hook</Label>
                      <Input value={p.message_hook || ""} onChange={(e) => updatePersona(i, { message_hook: e.target.value })} placeholder="Frase que ressoa diretamente com a dor desta persona" className="h-8 text-xs" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* === OBJETIVOS & KPIs === */}
            <TabsContent value="okrs" className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold flex items-center gap-1"><Target className="h-4 w-4" />Objetivos SMART</Label>
                  <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, objectives: [...form.objectives, { name: "", metric: "", baseline: "", target: "", deadline: "", owner: "" }] })}>
                    <Plus className="h-3 w-3 mr-1" />Objetivo
                  </Button>
                </div>
                {form.objectives.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-md">Nenhum objetivo ainda</div>}
                <div className="space-y-2">
                  {form.objectives.map((o, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-7 gap-1.5 p-2 border rounded-md items-start">
                      <Input value={o.name} onChange={(e) => updateObjective(i, { name: e.target.value })} placeholder="Nome" className="h-8 text-xs md:col-span-2" />
                      <Input value={o.metric || ""} onChange={(e) => updateObjective(i, { metric: e.target.value })} placeholder="Métrica" className="h-8 text-xs" />
                      <Input value={o.baseline || ""} onChange={(e) => updateObjective(i, { baseline: e.target.value })} placeholder="Baseline" className="h-8 text-xs" />
                      <Input value={o.target || ""} onChange={(e) => updateObjective(i, { target: e.target.value })} placeholder="Meta" className="h-8 text-xs" />
                      <Input type="date" value={o.deadline || ""} onChange={(e) => updateObjective(i, { deadline: e.target.value })} className="h-8 text-xs" />
                      <div className="flex gap-1">
                        <Input value={o.owner || ""} onChange={(e) => updateObjective(i, { owner: e.target.value })} placeholder="Dono" className="h-8 text-xs" />
                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setForm({ ...form, objectives: form.objectives.filter((_, idx) => idx !== i) })}><X className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold flex items-center gap-1"><Layers className="h-4 w-4" />KPIs</Label>
                  <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, kpis: [...form.kpis, { name: "", category: "Aquisição", unit: "", current: "", target: "", source: "", frequency: "Semanal" }] })}>
                    <Plus className="h-3 w-3 mr-1" />KPI
                  </Button>
                </div>
                {form.kpis.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-md">Nenhum KPI ainda</div>}
                <div className="space-y-2">
                  {form.kpis.map((k, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-7 gap-1.5 p-2 border rounded-md items-start">
                      <Input value={k.name} onChange={(e) => updateKPI(i, { name: e.target.value })} placeholder="Nome" className="h-8 text-xs md:col-span-2" />
                      <Select value={k.category || ""} onValueChange={(v) => updateKPI(i, { category: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                        <SelectContent>{kpiCategories.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input value={k.unit || ""} onChange={(e) => updateKPI(i, { unit: e.target.value })} placeholder="Unidade" className="h-8 text-xs" />
                      <Input value={k.current || ""} onChange={(e) => updateKPI(i, { current: e.target.value })} placeholder="Atual" className="h-8 text-xs" />
                      <Input value={k.target || ""} onChange={(e) => updateKPI(i, { target: e.target.value })} placeholder="Meta" className="h-8 text-xs" />
                      <div className="flex gap-1">
                        <Input value={k.frequency || ""} onChange={(e) => updateKPI(i, { frequency: e.target.value })} placeholder="Freq." className="h-8 text-xs" />
                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setForm({ ...form, kpis: form.kpis.filter((_, idx) => idx !== i) })}><X className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* === FUNIL === */}
            <TabsContent value="funnel" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">Defina objetivo, canais, KPI e % do orçamento por etapa.</p>
              {(["topo", "meio", "fundo"] as const).map((stage) => {
                const s = form.funnel_strategy[stage] || emptyStage;
                const labels = { topo: "Topo (Atração)", meio: "Meio (Consideração)", fundo: "Fundo (Conversão)" };
                return (
                  <Card key={stage} className="border-l-4 border-l-primary">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold capitalize">{labels[stage]}</Label>
                        <div className="flex items-center gap-1">
                          <Input type="number" min={0} max={100} value={s.budget_pct ?? 0} onChange={(e) => updateStage(stage, { budget_pct: parseInt(e.target.value) || 0 })} className="h-7 w-20 text-xs" />
                          <span className="text-xs text-muted-foreground">% budget</span>
                        </div>
                      </div>
                      <Textarea value={s.goal || ""} onChange={(e) => updateStage(stage, { goal: e.target.value })} placeholder="Objetivo desta etapa" className="min-h-[50px] text-xs" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Canais</Label>
                          <ChannelMultiSelect value={s.channels || []} onChange={(v) => updateStage(stage, { channels: v })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">KPI principal</Label>
                          <Input value={s.kpi || ""} onChange={(e) => updateStage(stage, { kpi: e.target.value })} placeholder="Ex: CTR, CPL, CPA" className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Criativos / Mensagens</Label>
                        <Textarea value={s.creatives || ""} onChange={(e) => updateStage(stage, { creatives: e.target.value })} placeholder="Tipos de criativo, hooks, formatos..." className="min-h-[50px] text-xs" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* === EXECUÇÃO === */}
            <TabsContent value="execution" className="mt-4 space-y-4">
              {/* Budget */}
              <Card>
                <CardContent className="p-3 space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1"><DollarSign className="h-4 w-4" />Alocação de Budget</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Total mensal (R$)</Label>
                      <Input type="number" value={form.budget_allocation.total_monthly || 0} onChange={(e) => setForm({ ...form, budget_allocation: { ...form.budget_allocation, total_monthly: parseFloat(e.target.value) || 0 } })} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">% Topo</Label>
                      <Input type="number" value={form.budget_allocation.by_phase?.topo || 0} onChange={(e) => setForm({ ...form, budget_allocation: { ...form.budget_allocation, by_phase: { ...form.budget_allocation.by_phase, topo: parseInt(e.target.value) || 0 } } })} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">% Meio</Label>
                      <Input type="number" value={form.budget_allocation.by_phase?.meio || 0} onChange={(e) => setForm({ ...form, budget_allocation: { ...form.budget_allocation, by_phase: { ...form.budget_allocation.by_phase, meio: parseInt(e.target.value) || 0 } } })} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">% Fundo</Label>
                      <Input type="number" value={form.budget_allocation.by_phase?.fundo || 0} onChange={(e) => setForm({ ...form, budget_allocation: { ...form.budget_allocation, by_phase: { ...form.budget_allocation.by_phase, fundo: parseInt(e.target.value) || 0 } } })} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Reserva (% do total para teste/oportunidades)</Label>
                    <Input type="number" value={form.budget_allocation.reserve_pct || 0} onChange={(e) => setForm({ ...form, budget_allocation: { ...form.budget_allocation, reserve_pct: parseInt(e.target.value) || 0 } })} className="h-8 text-xs w-32" />
                  </div>
                </CardContent>
              </Card>

              {/* Ondas */}
              <Card>
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold flex items-center gap-1"><CalendarIcon className="h-4 w-4" />Cronograma de Ondas (Sprints)</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, execution_plan: { ...form.execution_plan, waves: [...(form.execution_plan.waves || []), { name: "", period: "", deliverables: [], milestones: [] }] } })}>
                      <Plus className="h-3 w-3 mr-1" />Onda
                    </Button>
                  </div>
                  {(form.execution_plan.waves || []).length === 0 && <div className="text-center py-3 text-xs text-muted-foreground border border-dashed rounded-md">Nenhuma onda ainda</div>}
                  {(form.execution_plan.waves || []).map((w, i) => (
                    <div key={i} className="p-2 border rounded-md space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input value={w.name} onChange={(e) => updateWave(i, { name: e.target.value })} placeholder="Nome (Onda 1, Mês 1...)" className="h-8 text-xs" />
                        <Input value={w.period || ""} onChange={(e) => updateWave(i, { period: e.target.value })} placeholder="Período (Mês 1-30)" className="h-8 text-xs" />
                        <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setForm({ ...form, execution_plan: { ...form.execution_plan, waves: form.execution_plan.waves!.filter((_, idx) => idx !== i) } })}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Entregas</Label>
                          <StringListEditor items={w.deliverables || []} onChange={(v) => updateWave(i, { deliverables: v })} placeholder="Ex: 5 criativos novos" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Marcos</Label>
                          <StringListEditor items={w.milestones || []} onChange={(v) => updateWave(i, { milestones: v })} placeholder="Ex: 100 leads qualificados" />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Governança */}
              <Card>
                <CardContent className="p-3 space-y-3">
                  <Label className="text-sm font-semibold">Governança</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Cadência de calls</Label>
                      <Input value={form.execution_plan.governance?.call_cadence || ""} onChange={(e) => setForm({ ...form, execution_plan: { ...form.execution_plan, governance: { ...form.execution_plan.governance, call_cadence: e.target.value } } })} placeholder="Ex: Semanal toda segunda 10h" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Relatórios</Label>
                      <Input value={form.execution_plan.governance?.reports || ""} onChange={(e) => setForm({ ...form, execution_plan: { ...form.execution_plan, governance: { ...form.execution_plan.governance, reports: e.target.value } } })} placeholder="Ex: Mensal + dashboard live" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ferramentas</Label>
                      <Input value={form.execution_plan.governance?.tools || ""} onChange={(e) => setForm({ ...form, execution_plan: { ...form.execution_plan, governance: { ...form.execution_plan.governance, tools: e.target.value } } })} placeholder="Ex: Painel Linkou, Looker, WhatsApp" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Responsáveis</Label>
                      <Input value={form.execution_plan.governance?.responsibles || ""} onChange={(e) => setForm({ ...form, execution_plan: { ...form.execution_plan, governance: { ...form.execution_plan.governance, responsibles: e.target.value } } })} placeholder="Ex: Leo Santana (estratégia), João (mídia)" className="h-8 text-xs" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-3 border-t mt-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.client_id || !form.title || saveMutation.isPending} className="flex-1">
              {saveMutation.isPending ? "Salvando..." : (editingPlan ? "Salvar Alterações" : "Criar Plano")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Plan Dialog */}
      <Dialog open={!!viewingPlan} onOpenChange={() => setViewingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {viewingPlan?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingPlan && (() => {
            const v = normalizeFromDB(viewingPlan);
            return (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig[viewingPlan.status as keyof typeof statusConfig]?.color}>
                    {statusConfig[viewingPlan.status as keyof typeof statusConfig]?.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{getClientName(viewingPlan.client_id)}</span>
                </div>
                {v.executive_summary && <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Sumário</p><p>{v.executive_summary}</p></div>}
                {v.personas.length > 0 && <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground mb-2">{v.personas.length} Personas</p><div className="flex flex-wrap gap-1">{v.personas.map((p, i) => <Badge key={i} variant="secondary">{p.name || `Persona ${i+1}`}</Badge>)}</div></div>}
                {v.objectives.length > 0 && <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Objetivos ({v.objectives.length})</p><ul className="list-disc list-inside text-xs space-y-0.5">{v.objectives.map((o, i) => <li key={i}>{o.name} {o.target && <span className="text-muted-foreground">→ {o.target}</span>}</li>)}</ul></div>}
                {v.kpis.length > 0 && <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground mb-1">KPIs ({v.kpis.length})</p><ul className="list-disc list-inside text-xs space-y-0.5">{v.kpis.map((k, i) => <li key={i}>{k.name} {k.target && <span className="text-muted-foreground">({k.target})</span>}</li>)}</ul></div>}
              </div>
            );
          })()}
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => viewingPlan && exportPDF(viewingPlan)}>
              <Download className="h-4 w-4 mr-2" />Exportar PDF
            </Button>
            <Button variant="ghost" onClick={() => setViewingPlan(null)}>Fechar</Button>
            <Button onClick={() => { const p = viewingPlan; setViewingPlan(null); openEdit(p); }}>
              <Edit className="h-4 w-4 mr-2" />Editar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
