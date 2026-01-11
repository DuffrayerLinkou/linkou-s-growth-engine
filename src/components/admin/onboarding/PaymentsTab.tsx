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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, CreditCard, Clock, CheckCircle, AlertCircle, XCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-600", icon: Clock },
  paid: { label: "Pago", color: "bg-green-500/20 text-green-600", icon: CheckCircle },
  overdue: { label: "Atrasado", color: "bg-red-500/20 text-red-600", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const typeConfig = {
  setup: { label: "Setup", color: "bg-purple-500/20 text-purple-600" },
  monthly: { label: "Mensal", color: "bg-blue-500/20 text-blue-600" },
  bonus: { label: "Bônus", color: "bg-orange-500/20 text-orange-600" },
  ad_budget: { label: "Verba de Anúncio", color: "bg-green-500/20 text-green-600" },
};

interface PaymentForm {
  client_id: string;
  type: string;
  description: string;
  amount: string;
  status: string;
  due_date: string;
  payment_method: string;
  invoice_number: string;
  notes: string;
}

const initialForm: PaymentForm = {
  client_id: "",
  type: "monthly",
  description: "",
  amount: "",
  status: "pending",
  due_date: "",
  payment_method: "",
  invoice_number: "",
  notes: "",
};

interface PaymentsTabProps {
  clientId?: string;
}

export function PaymentsTab({ clientId }: PaymentsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentForm>(initialForm);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set client_id in form when clientId prop changes
  useEffect(() => {
    if (clientId && !editingPayment) {
      setForm(prev => ({ ...prev, client_id: clientId }));
    }
  }, [clientId, editingPayment]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [], isLoading, error: paymentsError } = useQuery({
    queryKey: ["payments", clientId],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select("*")
        .order("due_date", { ascending: true });
      
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

  const filteredPayments = payments.filter((p: any) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const totals = {
    pending: payments.filter((p: any) => p.status === "pending").reduce((sum: number, p: any) => sum + Number(p.amount), 0),
    paid: payments.filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + Number(p.amount), 0),
    overdue: payments.filter((p: any) => p.status === "overdue").reduce((sum: number, p: any) => sum + Number(p.amount), 0),
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        client_id: form.client_id,
        type: form.type,
        description: form.description || null,
        amount: parseFloat(form.amount),
        status: form.status,
        due_date: form.due_date || null,
        payment_method: form.payment_method || null,
        invoice_number: form.invoice_number || null,
        notes: form.notes || null,
        paid_at: form.status === "paid" ? new Date().toISOString() : null,
      };

      if (editingPayment) {
        const { error } = await supabase.from("payments").update(payload).eq("id", editingPayment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments-progress"] });
      setIsDialogOpen(false);
      setEditingPayment(null);
      setForm(clientId ? { ...initialForm, client_id: clientId } : initialForm);
      toast({ title: editingPayment ? "Pagamento atualizado!" : "Pagamento registrado!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível salvar o pagamento.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments-progress"] });
      setDeleteId(null);
      toast({ title: "Pagamento excluído!" });
    },
  });

  const openEdit = (payment: any) => {
    setEditingPayment(payment);
    setForm({
      client_id: payment.client_id,
      type: payment.type,
      description: payment.description || "",
      amount: payment.amount?.toString() || "",
      status: payment.status,
      due_date: payment.due_date || "",
      payment_method: payment.payment_method || "",
      invoice_number: payment.invoice_number || "",
      notes: payment.notes || "",
    });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingPayment(null);
    setForm(clientId ? { ...initialForm, client_id: clientId } : initialForm);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards - responsivo */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/20">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Pendente</p>
                <p className="text-lg sm:text-2xl font-bold truncate">R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-green-500/20">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Pago</p>
                <p className="text-lg sm:text-2xl font-bold truncate">R$ {totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-red-500/20">
                <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Atrasado</p>
                <p className="text-lg sm:text-2xl font-bold truncate">R$ {totals.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              {clientId ? "Pagamentos do Cliente" : "Pagamentos"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {clientId ? "Pagamentos do cliente selecionado" : "Registre pagamentos"}
            </CardDescription>
          </div>
          <Button onClick={openNew} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Novo Pagamento</span>
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          {/* Filters */}
          <div className="flex gap-2 sm:gap-4 mb-3 sm:mb-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : paymentsError ? (
            <div className="text-center py-6 sm:py-8 text-destructive text-sm">
              Não foi possível carregar os pagamentos.
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              {clientId ? "Nenhum pagamento para este cliente" : "Nenhum pagamento encontrado"}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0 rounded-md border">
              <div className="min-w-[600px] sm:min-w-0 px-3 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {!clientId && <TableHead className="text-xs sm:text-sm">Cliente</TableHead>}
                      <TableHead className="text-xs sm:text-sm w-[80px]">Tipo</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Descrição</TableHead>
                      <TableHead className="text-xs sm:text-sm w-[100px]">Valor</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell w-[90px]">Venc.</TableHead>
                      <TableHead className="text-xs sm:text-sm w-[80px]">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm w-[70px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment: any) => {
                      const status = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
                      const type = typeConfig[payment.type as keyof typeof typeConfig] || typeConfig.monthly;
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={payment.id}>
                          {!clientId && <TableCell className="font-medium text-xs sm:text-sm">{getClientName(payment.client_id)}</TableCell>}
                          <TableCell>
                            <Badge className={`${type.color} text-[10px] sm:text-xs px-1.5`}>{type.label}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-xs sm:text-sm hidden sm:table-cell">{payment.description || "-"}</TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                            {payment.due_date ? format(new Date(payment.due_date), "dd/MM/yy") : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${status.color} text-[10px] sm:text-xs px-1.5`}>
                              <StatusIcon className="h-3 w-3 mr-0.5 sm:mr-1" />
                              <span className="hidden sm:inline">{status.label}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => openEdit(payment)}>
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setDeleteId(payment.id)}>
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editingPayment ? "Editar Pagamento" : "Novo Pagamento"}</DialogTitle>
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
                <Label className="text-xs sm:text-sm">Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="setup">Setup</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="bonus">Bônus</SelectItem>
                    <SelectItem value="ad_budget">Verba de Anúncio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-9 sm:h-10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Valor (R$) *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-9 sm:h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Vencimento</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="h-9 sm:h-10" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Método de Pagamento</Label>
                <Input value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} placeholder="PIX, Boleto" className="h-9 sm:h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Nº Nota/Fatura</Label>
                <Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} className="h-9 sm:h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[80px]" />
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.client_id || !form.amount || saveMutation.isPending}
              className="w-full"
            >
              {editingPayment ? "Salvar Alterações" : "Registrar Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pagamento?</AlertDialogTitle>
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