import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail, Plus, Pencil, Trash2, Eye, ChevronRight, Users, Layers, Play, Pause, CheckCircle2, Clock, Search, UserPlus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Funnel {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface FunnelStep {
  id: string;
  funnel_id: string;
  step_number: number;
  delay_days: number;
  subject: string;
  html_body: string;
}

interface Enrollment {
  id: string;
  lead_id: string;
  funnel_id: string;
  enrolled_at: string;
  status: string;
  leads: { name: string; email: string; segment: string | null } | null;
  email_funnels: { name: string } | null;
  emails_sent_count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const statusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "Ativo", variant: "default" },
    paused: { label: "Pausado", variant: "secondary" },
    completed: { label: "Concluído", variant: "outline" },
    converted: { label: "Convertido", variant: "outline" },
  };
  const { label, variant } = map[status] || { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EmailFunnel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
  const [funnelDialog, setFunnelDialog] = useState<{ open: boolean; funnel?: Funnel }>({ open: false });
  const [stepDialog, setStepDialog] = useState<{ open: boolean; step?: FunnelStep }>({ open: false });
  const [previewStep, setPreviewStep] = useState<FunnelStep | null>(null);
  const [enrollDialog, setEnrollDialog] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: funnels = [], isLoading: loadingFunnels } = useQuery({
    queryKey: ["email_funnels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_funnels")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Funnel[];
    },
  });

  const { data: steps = [] } = useQuery({
    queryKey: ["email_funnel_steps", selectedFunnelId],
    enabled: !!selectedFunnelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_funnel_steps")
        .select("*")
        .eq("funnel_id", selectedFunnelId!)
        .order("delay_days", { ascending: true });
      if (error) throw error;
      return data as FunnelStep[];
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["lead_funnel_enrollments_enriched"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_funnel_enrollments")
        .select(`
          id, lead_id, funnel_id, enrolled_at, status,
          leads(name, email, segment),
          email_funnels(name)
        `)
        .order("enrolled_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      // Count emails sent per enrollment
      const ids = (data || []).map((e: any) => e.id);
      const { data: sentData } = await supabase
        .from("lead_funnel_emails_sent")
        .select("enrollment_id")
        .in("enrollment_id", ids);

      const sentCounts: Record<string, number> = {};
      (sentData || []).forEach((r: any) => {
        sentCounts[r.enrollment_id] = (sentCounts[r.enrollment_id] || 0) + 1;
      });

      return (data || []).map((e: any) => ({ ...e, emails_sent_count: sentCounts[e.id] || 0 })) as Enrollment[];
    },
  });

  const selectedFunnel = funnels.find((f) => f.id === selectedFunnelId);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveFunnel = useMutation({
    mutationFn: async (values: Partial<Funnel>) => {
      if (values.id) {
        const { error } = await supabase.from("email_funnels").update({ name: values.name, description: values.description, is_active: values.is_active }).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("email_funnels").insert([{ name: values.name!, description: values.description, is_active: values.is_active ?? true }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email_funnels"] });
      setFunnelDialog({ open: false });
      toast({ title: "Funil salvo!" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const deleteFunnel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_funnels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email_funnels"] });
      if (selectedFunnelId === deleteFunnel.variables) setSelectedFunnelId(null);
      toast({ title: "Funil excluído." });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const toggleFunnelActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("email_funnels").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_funnels"] }),
  });

  const saveStep = useMutation({
    mutationFn: async (values: Partial<FunnelStep>) => {
      if (values.id) {
        const { error } = await supabase.from("email_funnel_steps").update({ delay_days: values.delay_days, subject: values.subject, html_body: values.html_body, step_number: values.step_number }).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("email_funnel_steps").insert([{ funnel_id: values.funnel_id!, delay_days: values.delay_days!, subject: values.subject!, html_body: values.html_body!, step_number: values.step_number ?? 1 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email_funnel_steps", selectedFunnelId] });
      setStepDialog({ open: false });
      toast({ title: "Step salvo!" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_funnel_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email_funnel_steps", selectedFunnelId] });
      toast({ title: "Step excluído." });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  const updateEnrollmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("lead_funnel_enrollments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead_funnel_enrollments_enriched"] });
      toast({ title: "Status atualizado." });
    },
  });

  const manualEnroll = useMutation({
    mutationFn: async ({ leadId, funnelId }: { leadId: string; funnelId: string }) => {
      const { data: existing } = await supabase
        .from("lead_funnel_enrollments")
        .select("id, status")
        .eq("lead_id", leadId)
        .eq("funnel_id", funnelId)
        .in("status", ["active", "paused"])
        .maybeSingle();

      if (existing) throw new Error("Lead já está inscrito neste funil.");

      const { error } = await supabase
        .from("lead_funnel_enrollments")
        .insert({ lead_id: leadId, funnel_id: funnelId, status: "active" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead_funnel_enrollments_enriched"] });
      setEnrollDialog(false);
      toast({ title: "Lead inscrito com sucesso!" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Erro", description: e.message }),
  });

  // ── Enrollment counts per funnel ──────────────────────────────────────────
  const enrollmentCounts = funnels.reduce((acc, f) => {
    acc[f.id] = enrollments.filter((e) => e.funnel_id === f.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Funil de Email
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie sequências automáticas de emails para novos leads.</p>
      </div>

      <Tabs defaultValue="funnels">
        <TabsList>
          <TabsTrigger value="funnels" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Funis
          </TabsTrigger>
          <TabsTrigger value="steps" className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" /> Editor de Steps
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Leads Inscritos
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Funis ── */}
        <TabsContent value="funnels" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setFunnelDialog({ open: true })}>
              <Plus className="h-4 w-4 mr-2" /> Novo Funil
            </Button>
          </div>
          {loadingFunnels ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {funnels.map((f) => (
                <Card key={f.id} className={`relative ${!f.is_active ? "opacity-60" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{f.name}</CardTitle>
                        {f.description && (
                          <CardDescription className="mt-1 text-xs line-clamp-2">{f.description}</CardDescription>
                        )}
                      </div>
                      <Switch
                        checked={f.is_active}
                        onCheckedChange={(v) => toggleFunnelActive.mutate({ id: f.id, is_active: v })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {enrollmentCounts[f.id] || 0} inscritos
                      </span>
                      <Badge variant={f.is_active ? "default" : "secondary"} className="text-xs">
                        {f.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setSelectedFunnelId(f.id); }}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Editar Steps
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFunnelDialog({ open: true, funnel: f })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Excluir este funil? Todos os steps e inscrições serão removidos.")) {
                            deleteFunnel.mutate(f.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {funnels.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full">Nenhum funil criado ainda.</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Steps ── */}
        <TabsContent value="steps" className="mt-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Selecione o funil</Label>
              <div className="flex gap-2 flex-wrap">
                {funnels.map((f) => (
                  <Button
                    key={f.id}
                    variant={selectedFunnelId === f.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFunnelId(f.id)}
                  >
                    {f.name}
                  </Button>
                ))}
              </div>
            </div>
            {selectedFunnelId && (
              <Button
                onClick={() => setStepDialog({ open: true })}
                className="mt-5"
              >
                <Plus className="h-4 w-4 mr-2" /> Adicionar Step
              </Button>
            )}
          </div>

          {!selectedFunnelId ? (
            <p className="text-muted-foreground text-sm">Selecione um funil acima para gerenciar seus steps.</p>
          ) : steps.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum step criado para este funil.</p>
          ) : (
            <div className="space-y-3">
              {steps.map((step, i) => (
                <Card key={step.id}>
                  <CardContent className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{step.subject}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Dia {step.delay_days} após inscrição</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-sm">
                          {step.html_body.replace(/<[^>]+>/g, " ").trim().substring(0, 100)}…
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setPreviewStep(step)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setStepDialog({ open: true, step })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Excluir este step?")) deleteStep.mutate(step.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Variables hint */}
          {selectedFunnelId && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <strong>Variáveis disponíveis:</strong> {"{{"+"nome"+"}}"}, {"{{"+"segmento"+"}}"}, {"{{"+"objetivo"+"}}"} — serão substituídas pelos dados de cada lead.
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Leads ── */}
        <TabsContent value="leads" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setEnrollDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Inscrever Lead
            </Button>
          </div>
          <div className="space-y-3">
            {enrollments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum lead inscrito ainda.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lead</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Funil</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inscrito em</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Emails enviados</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {enrollments.map((e) => (
                      <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{e.leads?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{e.leads?.email || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{e.email_funnels?.name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(e.enrolled_at), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            {e.emails_sent_count}
                          </div>
                        </td>
                        <td className="px-4 py-3">{statusBadge(e.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {e.status === "active" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => updateEnrollmentStatus.mutate({ id: e.id, status: "paused" })}
                              >
                                <Pause className="h-3.5 w-3.5 mr-1" /> Pausar
                              </Button>
                            )}
                            {e.status === "paused" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => updateEnrollmentStatus.mutate({ id: e.id, status: "active" })}
                              >
                                <Play className="h-3.5 w-3.5 mr-1" /> Reativar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Create/Edit Funnel ── */}
      <FunnelDialog
        open={funnelDialog.open}
        funnel={funnelDialog.funnel}
        onClose={() => setFunnelDialog({ open: false })}
        onSave={(values) => saveFunnel.mutate(values)}
        loading={saveFunnel.isPending}
      />

      {/* ── Dialog: Create/Edit Step ── */}
      <StepDialog
        open={stepDialog.open}
        step={stepDialog.step}
        funnelId={selectedFunnelId || ""}
        onClose={() => setStepDialog({ open: false })}
        onSave={(values) => saveStep.mutate(values)}
        loading={saveStep.isPending}
      />

      {/* ── Dialog: Enroll Lead Manually ── */}
      <EnrollLeadDialog
        open={enrollDialog}
        funnels={funnels}
        onClose={() => setEnrollDialog(false)}
        onEnroll={(leadId, funnelId) => manualEnroll.mutate({ leadId, funnelId })}
        loading={manualEnroll.isPending}
      />

      {/* ── Dialog: Preview Step ── */}
      {previewStep && (
        <Dialog open={!!previewStep} onOpenChange={() => setPreviewStep(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {previewStep.subject}</DialogTitle>
            </DialogHeader>
            <div
              className="prose prose-sm max-w-none mt-2 border rounded-lg p-4 bg-background"
              dangerouslySetInnerHTML={{
                __html: previewStep.html_body
                  .replace(/\{\{nome\}\}/g, "João Silva")
                  .replace(/\{\{segmento\}\}/g, "E-commerce")
                  .replace(/\{\{objetivo\}\}/g, "aumentar vendas online"),
              }}
            />
            <p className="text-xs text-muted-foreground">Preview com dados de exemplo. Variáveis substituídas.</p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function FunnelDialog({ open, funnel, onClose, onSave, loading }: {
  open: boolean;
  funnel?: Funnel;
  onClose: () => void;
  onSave: (v: Partial<Funnel>) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(funnel?.name || "");
  const [description, setDescription] = useState(funnel?.description || "");

  // Reset when funnel changes
  useState(() => {
    setName(funnel?.name || "");
    setDescription(funnel?.description || "");
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{funnel ? "Editar Funil" : "Novo Funil"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Funil Padrão" />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descrição opcional..." />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onSave({ id: funnel?.id, name, description: description || null })}
            disabled={!name.trim() || loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StepDialog({ open, step, funnelId, onClose, onSave, loading }: {
  open: boolean;
  step?: FunnelStep;
  funnelId: string;
  onClose: () => void;
  onSave: (v: Partial<FunnelStep>) => void;
  loading: boolean;
}) {
  const [delayDays, setDelayDays] = useState(step?.delay_days ?? 1);
  const [subject, setSubject] = useState(step?.subject || "");
  const [htmlBody, setHtmlBody] = useState(step?.html_body || "");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step ? "Editar Step" : "Novo Step"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Enviar após quantos dias da inscrição?</Label>
            <Input
              type="number"
              min={1}
              value={delayDays}
              onChange={(e) => setDelayDays(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>Assunto do email</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Olá {{nome}}, conheça a Linkou"
            />
          </div>
          <div className="space-y-1">
            <Label>Corpo do email (HTML)</Label>
            <Textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={12}
              className="font-mono text-xs"
              placeholder="<h2>Olá, {{nome}}!</h2><p>...</p>"
            />
            <p className="text-xs text-muted-foreground">
              Use {"{{"+"nome"+"}}"}, {"{{"+"segmento"+"}}"}, {"{{"+"objetivo"+"}}"} para personalizar.
            </p>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onSave({
              id: step?.id,
              funnel_id: funnelId,
              step_number: step?.step_number || 1,
              delay_days: delayDays,
              subject,
              html_body: htmlBody,
            })}
            disabled={!subject.trim() || !htmlBody.trim() || loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── EnrollLeadDialog ────────────────────────────────────────────────────────
function EnrollLeadDialog({ open, funnels, onClose, onEnroll, loading }: {
  open: boolean;
  funnels: Funnel[];
  onClose: () => void;
  onEnroll: (leadId: string, funnelId: string) => void;
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<{ id: string; name: string; email: string } | null>(null);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");

  const { data: leadResults = [], isFetching } = useQuery({
    queryKey: ["leads_search", search],
    enabled: search.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, email")
        .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(50);
      if (error) throw error;
      return data as { id: string; name: string; email: string }[];
    },
  });

  const activeFunnels = funnels.filter((f) => f.is_active);

  const handleClose = () => {
    setSearch("");
    setSelectedLead(null);
    setSelectedFunnelId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Inscrever Lead no Funil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Lead search */}
          <div className="space-y-2">
            <Label>Buscar lead</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Digite nome ou email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedLead(null);
                }}
              />
            </div>

            {/* Results list */}
            {search.trim().length >= 2 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {isFetching ? (
                  <p className="text-sm text-muted-foreground p-3">Buscando...</p>
                ) : leadResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3">Nenhum lead encontrado.</p>
                ) : (
                  leadResults.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors border-b last:border-b-0 ${
                        selectedLead?.id === lead.id ? "bg-primary/10 text-primary font-medium" : ""
                      }`}
                      onClick={() => {
                        setSelectedLead(lead);
                        setSearch(lead.name);
                      }}
                    >
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.email}</div>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedLead && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-md text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium">{selectedLead.name}</span>
                <span className="text-muted-foreground truncate">{selectedLead.email}</span>
              </div>
            )}
          </div>

          {/* Funnel select */}
          <div className="space-y-2">
            <Label>Funil</Label>
            <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funil..." />
              </SelectTrigger>
              <SelectContent>
                {activeFunnels.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            disabled={!selectedLead || !selectedFunnelId || loading}
            onClick={() => selectedLead && onEnroll(selectedLead.id, selectedFunnelId)}
          >
            {loading ? "Inscrevendo..." : "Inscrever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
