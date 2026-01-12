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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ClipboardList, Clock, CheckCircle, AlertCircle, Edit, Trash2, Eye, Download } from "lucide-react";
import { safeFormatDate } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { generateStructuredPDF } from "@/lib/pdf-generator";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-600", icon: AlertCircle },
  completed: { label: "Completo", color: "bg-blue-500/20 text-blue-600", icon: ClipboardList },
  approved: { label: "Aprovado", color: "bg-green-500/20 text-green-600", icon: CheckCircle },
};

interface BriefingForm {
  client_id: string;
  title: string;
  nicho: string;
  publico_alvo: string;
  budget_mensal: string;
  objetivos: string;
  concorrentes: string;
  diferenciais: string;
  observacoes: string;
  status: string;
}

const initialForm: BriefingForm = {
  client_id: "",
  title: "",
  nicho: "",
  publico_alvo: "",
  budget_mensal: "",
  objetivos: "",
  concorrentes: "",
  diferenciais: "",
  observacoes: "",
  status: "pending",
};

interface BriefingTabProps {
  clientId?: string;
}

export function BriefingTab({ clientId }: BriefingTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBriefing, setEditingBriefing] = useState<any>(null);
  const [viewingBriefing, setViewingBriefing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<BriefingForm>(initialForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set client_id in form when clientId prop changes
  useEffect(() => {
    if (clientId && !editingBriefing) {
      setForm(prev => ({ ...prev, client_id: clientId }));
    }
  }, [clientId, editingBriefing]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: briefings = [], isLoading, error: briefingsError } = useQuery({
    queryKey: ["briefings", clientId],
    queryFn: async () => {
      let query = supabase
        .from("briefings")
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
        nicho: form.nicho || null,
        publico_alvo: form.publico_alvo || null,
        budget_mensal: form.budget_mensal ? parseFloat(form.budget_mensal) : null,
        objetivos: form.objetivos || null,
        concorrentes: form.concorrentes || null,
        diferenciais: form.diferenciais || null,
        observacoes: form.observacoes || null,
        status: form.status,
      };

      if (editingBriefing) {
        const { error } = await supabase.from("briefings").update(payload).eq("id", editingBriefing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("briefings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
      queryClient.invalidateQueries({ queryKey: ["briefings-progress"] });
      setIsDialogOpen(false);
      setEditingBriefing(null);
      setForm(clientId ? { ...initialForm, client_id: clientId } : initialForm);
      toast({ title: editingBriefing ? "Briefing atualizado!" : "Briefing criado!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível salvar o briefing.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("briefings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
      queryClient.invalidateQueries({ queryKey: ["briefings-progress"] });
      setDeleteId(null);
      toast({ title: "Briefing excluído!" });
    },
  });

  const openEdit = (briefing: any) => {
    setEditingBriefing(briefing);
    setForm({
      client_id: briefing.client_id,
      title: briefing.title,
      nicho: briefing.nicho || "",
      publico_alvo: briefing.publico_alvo || "",
      budget_mensal: briefing.budget_mensal?.toString() || "",
      objetivos: briefing.objetivos || "",
      concorrentes: briefing.concorrentes || "",
      diferenciais: briefing.diferenciais || "",
      observacoes: briefing.observacoes || "",
      status: briefing.status,
    });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingBriefing(null);
    setForm(clientId ? { ...initialForm, client_id: clientId } : initialForm);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
              Briefings de Clientes
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {clientId ? "Briefings do cliente selecionado" : "Gerencie os briefings dos seus clientes"}
            </CardDescription>
          </div>
          <Button onClick={openNew} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Novo Briefing</span>
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          {isLoading ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : briefingsError ? (
            <div className="text-center py-6 sm:py-8 text-destructive text-sm">
              Não foi possível carregar os briefings.
            </div>
          ) : briefings.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              {clientId ? "Nenhum briefing para este cliente" : "Nenhum briefing criado ainda"}
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {briefings.map((briefing: any) => {
                const status = statusConfig[briefing.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <Card key={briefing.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="p-3 sm:pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-sm sm:text-base truncate">{briefing.title}</CardTitle>
                          <CardDescription className="text-xs">{getClientName(briefing.client_id)}</CardDescription>
                        </div>
                        <Badge className={`${status.color} shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">{status.label}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:pt-2">
                      <div className="space-y-1.5 text-xs sm:text-sm">
                        {briefing.nicho && (
                          <p className="truncate"><span className="font-medium">Nicho:</span> {briefing.nicho}</p>
                        )}
                        {briefing.budget_mensal && (
                          <p><span className="font-medium">Budget:</span> R$ {Number(briefing.budget_mensal).toLocaleString('pt-BR')}</p>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground text-[10px] sm:text-xs">
                          <Clock className="h-3 w-3" />
                          {safeFormatDate(briefing.created_at)}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setViewingBriefing(briefing)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEdit(briefing)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setDeleteId(briefing.id)}>
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
            <DialogTitle className="text-base sm:text-lg">{editingBriefing ? "Editar Briefing" : "Novo Briefing"}</DialogTitle>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Nicho</Label>
                <Input value={form.nicho} onChange={(e) => setForm({ ...form, nicho: e.target.value })} className="h-9 sm:h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Budget Mensal (R$)</Label>
                <Input type="number" value={form.budget_mensal} onChange={(e) => setForm({ ...form, budget_mensal: e.target.value })} className="h-9 sm:h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Público-Alvo</Label>
              <Textarea value={form.publico_alvo} onChange={(e) => setForm({ ...form, publico_alvo: e.target.value })} className="min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Objetivos</Label>
              <Textarea value={form.objetivos} onChange={(e) => setForm({ ...form, objetivos: e.target.value })} className="min-h-[80px]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Concorrentes</Label>
                <Textarea value={form.concorrentes} onChange={(e) => setForm({ ...form, concorrentes: e.target.value })} className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Diferenciais</Label>
                <Textarea value={form.diferenciais} onChange={(e) => setForm({ ...form, diferenciais: e.target.value })} className="min-h-[80px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Completo</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.client_id || !form.title || saveMutation.isPending}
              className="w-full"
            >
              {editingBriefing ? "Salvar Alterações" : "Criar Briefing"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir briefing?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Briefing Dialog */}
      <Dialog open={!!viewingBriefing} onOpenChange={() => setViewingBriefing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {viewingBriefing?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingBriefing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusConfig[viewingBriefing.status as keyof typeof statusConfig]?.color}>
                  {statusConfig[viewingBriefing.status as keyof typeof statusConfig]?.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getClientName(viewingBriefing.client_id)}
                </span>
              </div>
              
              {viewingBriefing.nicho && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Nicho</p>
                  <p className="text-sm">{viewingBriefing.nicho}</p>
                </div>
              )}
              
              {viewingBriefing.publico_alvo && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Público-Alvo</p>
                  <p className="text-sm whitespace-pre-wrap">{viewingBriefing.publico_alvo}</p>
                </div>
              )}
              
              {viewingBriefing.budget_mensal && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Budget Mensal</p>
                  <p className="text-sm font-medium">R$ {Number(viewingBriefing.budget_mensal).toLocaleString('pt-BR')}</p>
                </div>
              )}
              
              {viewingBriefing.objetivos && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Objetivos</p>
                  <p className="text-sm whitespace-pre-wrap">{viewingBriefing.objetivos}</p>
                </div>
              )}
              
              {viewingBriefing.concorrentes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Concorrentes</p>
                  <p className="text-sm whitespace-pre-wrap">{viewingBriefing.concorrentes}</p>
                </div>
              )}
              
              {viewingBriefing.diferenciais && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Diferenciais</p>
                  <p className="text-sm whitespace-pre-wrap">{viewingBriefing.diferenciais}</p>
                </div>
              )}
              
              {viewingBriefing.observacoes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm whitespace-pre-wrap">{viewingBriefing.observacoes}</p>
                </div>
              )}
              
              <div className="pt-3 border-t text-xs text-muted-foreground">
                Criado em: {safeFormatDate(viewingBriefing.created_at, "dd/MM/yyyy 'às' HH:mm")}
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (!viewingBriefing) return;
                const clientName = getClientName(viewingBriefing.client_id);
                const sections: { title: string; content: string | string[] }[] = [
                  { title: "Cliente", content: clientName },
                  { title: "Status", content: statusConfig[viewingBriefing.status as keyof typeof statusConfig]?.label || "-" },
                ];
                if (viewingBriefing.nicho) sections.push({ title: "Nicho", content: viewingBriefing.nicho });
                if (viewingBriefing.publico_alvo) sections.push({ title: "Público-Alvo", content: viewingBriefing.publico_alvo });
                if (viewingBriefing.budget_mensal) sections.push({ title: "Budget Mensal", content: `R$ ${Number(viewingBriefing.budget_mensal).toLocaleString('pt-BR')}` });
                if (viewingBriefing.objetivos) sections.push({ title: "Objetivos", content: viewingBriefing.objetivos });
                if (viewingBriefing.concorrentes) sections.push({ title: "Concorrentes", content: viewingBriefing.concorrentes });
                if (viewingBriefing.diferenciais) sections.push({ title: "Diferenciais", content: viewingBriefing.diferenciais });
                if (viewingBriefing.observacoes) sections.push({ title: "Observações", content: viewingBriefing.observacoes });
                
                generateStructuredPDF(sections, {
                  filename: `briefing-${clientName.toLowerCase().replace(/\s/g, '-')}.pdf`,
                  title: viewingBriefing.title,
                  subtitle: `Cliente: ${clientName} | Criado em: ${safeFormatDate(viewingBriefing.created_at)}`
                });
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="ghost" onClick={() => setViewingBriefing(null)}>Fechar</Button>
            <Button onClick={() => { const b = viewingBriefing; setViewingBriefing(null); openEdit(b); }}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}