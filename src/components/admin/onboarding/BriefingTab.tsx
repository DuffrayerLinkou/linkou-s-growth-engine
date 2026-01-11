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
import { Plus, ClipboardList, Clock, CheckCircle, AlertCircle, Edit, Trash2 } from "lucide-react";
import { safeFormatDate } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Briefings de Clientes
            </CardTitle>
            <CardDescription>
              {clientId ? "Briefings do cliente selecionado" : "Gerencie os briefings dos seus clientes"}
            </CardDescription>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Briefing
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : briefingsError ? (
            <div className="text-center py-8 text-destructive">
              Não foi possível carregar os briefings.
            </div>
          ) : briefings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {clientId ? "Nenhum briefing para este cliente" : "Nenhum briefing criado ainda"}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {briefings.map((briefing: any) => {
                const status = statusConfig[briefing.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <Card key={briefing.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{briefing.title}</CardTitle>
                          <CardDescription>{getClientName(briefing.client_id)}</CardDescription>
                        </div>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="space-y-2 text-sm">
                        {briefing.nicho && (
                          <p><span className="font-medium">Nicho:</span> {briefing.nicho}</p>
                        )}
                        {briefing.budget_mensal && (
                          <p><span className="font-medium">Budget:</span> R$ {Number(briefing.budget_mensal).toLocaleString('pt-BR')}</p>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock className="h-3 w-3" />
                          {safeFormatDate(briefing.created_at)}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => openEdit(briefing)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(briefing.id)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBriefing ? "Editar Briefing" : "Novo Briefing"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })} disabled={!!clientId}>
                  <SelectTrigger>
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
                <Label>Título *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nicho</Label>
                <Input value={form.nicho} onChange={(e) => setForm({ ...form, nicho: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Budget Mensal (R$)</Label>
                <Input type="number" value={form.budget_mensal} onChange={(e) => setForm({ ...form, budget_mensal: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Público-Alvo</Label>
              <Textarea value={form.publico_alvo} onChange={(e) => setForm({ ...form, publico_alvo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Objetivos</Label>
              <Textarea value={form.objetivos} onChange={(e) => setForm({ ...form, objetivos: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Concorrentes</Label>
                <Textarea value={form.concorrentes} onChange={(e) => setForm({ ...form, concorrentes: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Diferenciais</Label>
                <Textarea value={form.diferenciais} onChange={(e) => setForm({ ...form, diferenciais: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
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
    </div>
  );
}