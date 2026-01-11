import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Target, Clock, FileText, CheckCircle, Edit, Trash2 } from "lucide-react";
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

interface PlanForm {
  client_id: string;
  title: string;
  objectives: string;
  kpis: string;
  personas: string;
  funnel_strategy: string;
  campaign_types: string[];
  timeline_start: string;
  timeline_end: string;
  status: string;
}

const initialForm: PlanForm = {
  client_id: "",
  title: "",
  objectives: "",
  kpis: "",
  personas: "",
  funnel_strategy: "",
  campaign_types: [],
  timeline_start: "",
  timeline_end: "",
  status: "draft",
};

interface PlanningTabProps {
  clientId?: string;
}

export function PlanningTab({ clientId }: PlanningTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(initialForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set client_id in form when clientId prop changes
  useEffect(() => {
    if (clientId && !editingPlan) {
      setForm(prev => ({ ...prev, client_id: clientId }));
    }
  }, [clientId, editingPlan]);

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
      let query = supabase
        .from("strategic_plans")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Helper to get client name by id
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || "Cliente";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        client_id: form.client_id,
        title: form.title,
        objectives: form.objectives ? { list: form.objectives.split("\n").filter(Boolean) } : null,
        kpis: form.kpis ? { list: form.kpis.split("\n").filter(Boolean) } : null,
        personas: form.personas ? { description: form.personas } : null,
        funnel_strategy: form.funnel_strategy || null,
        campaign_types: form.campaign_types.length > 0 ? form.campaign_types : null,
        timeline_start: form.timeline_start || null,
        timeline_end: form.timeline_end || null,
        status: form.status,
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
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível salvar o plano.", variant: "destructive" });
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

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      client_id: plan.client_id,
      title: plan.title,
      objectives: plan.objectives?.list?.join("\n") || "",
      kpis: plan.kpis?.list?.join("\n") || "",
      personas: plan.personas?.description || "",
      funnel_strategy: plan.funnel_strategy || "",
      campaign_types: plan.campaign_types || [],
      timeline_start: plan.timeline_start || "",
      timeline_end: plan.timeline_end || "",
      status: plan.status,
    });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingPlan(null);
    setForm(clientId ? { ...initialForm, client_id: clientId } : initialForm);
    setIsDialogOpen(true);
  };

  const toggleCampaignType = (typeId: string) => {
    setForm(prev => ({
      ...prev,
      campaign_types: prev.campaign_types.includes(typeId)
        ? prev.campaign_types.filter(t => t !== typeId)
        : [...prev.campaign_types, typeId]
    }));
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
              {clientId ? "Planos do cliente selecionado" : "Gerencie os planos estratégicos"}
            </CardDescription>
          </div>
          <Button onClick={openNew} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Novo Plano</span>
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          {isLoading ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : plansError ? (
            <div className="text-center py-6 sm:py-8 text-destructive text-sm">
              Não foi possível carregar os planos.
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              {clientId ? "Nenhum plano para este cliente" : "Nenhum plano criado ainda"}
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan: any) => {
                const status = statusConfig[plan.status as keyof typeof statusConfig] || statusConfig.draft;
                const StatusIcon = status.icon;
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
                      <div className="space-y-1.5 text-xs sm:text-sm">
                        {plan.campaign_types && plan.campaign_types.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {plan.campaign_types.slice(0, 2).map((type: string) => (
                              <Badge key={type} variant="secondary" className="text-[10px] sm:text-xs px-1.5">
                                {campaignTypes.find(t => t.id === type)?.label.split(" ")[0] || type}
                              </Badge>
                            ))}
                            {plan.campaign_types.length > 2 && (
                              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5">+{plan.campaign_types.length - 2}</Badge>
                            )}
                          </div>
                        )}
                        {plan.timeline_start && plan.timeline_end && (
                          <p className="text-muted-foreground text-[10px] sm:text-xs">
                            {safeFormatDate(plan.timeline_start, "dd/MM/yy", "")} - {safeFormatDate(plan.timeline_end, "dd/MM/yy", "")}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground text-[10px] sm:text-xs">
                          <Clock className="h-3 w-3" />
                          {safeFormatDate(plan.created_at)}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEdit(plan)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setDeleteId(plan.id)}>
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

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editingPlan ? "Editar Plano" : "Novo Plano Estratégico"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Cliente *</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })} disabled={!!clientId}>
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Título *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 sm:h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Objetivos (um por linha)</Label>
              <Textarea 
                value={form.objectives} 
                onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                placeholder="Aumentar vendas em 30%&#10;Reduzir CAC em 20%"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">KPIs (um por linha)</Label>
              <Textarea 
                value={form.kpis} 
                onChange={(e) => setForm({ ...form, kpis: e.target.value })}
                placeholder="ROAS > 3x&#10;CPA < R$ 50"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Personas e Segmentações</Label>
              <Textarea 
                value={form.personas} 
                onChange={(e) => setForm({ ...form, personas: e.target.value })}
                placeholder="Descreva o público-alvo"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Estratégia de Funil</Label>
              <Textarea 
                value={form.funnel_strategy} 
                onChange={(e) => setForm({ ...form, funnel_strategy: e.target.value })}
                placeholder="Descreva a estratégia"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Tipos de Campanha</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {campaignTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={form.campaign_types.includes(type.id)}
                      onCheckedChange={() => toggleCampaignType(type.id)}
                    />
                    <Label htmlFor={type.id} className="text-xs sm:text-sm font-normal cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Data Início</Label>
                <Input type="date" value={form.timeline_start} onChange={(e) => setForm({ ...form, timeline_start: e.target.value })} className="h-9 sm:h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Data Fim</Label>
                <Input type="date" value={form.timeline_end} onChange={(e) => setForm({ ...form, timeline_end: e.target.value })} className="h-9 sm:h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.client_id || !form.title || saveMutation.isPending}
              className="w-full"
            >
              {editingPlan ? "Salvar Alterações" : "Criar Plano"}
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
    </div>
  );
}