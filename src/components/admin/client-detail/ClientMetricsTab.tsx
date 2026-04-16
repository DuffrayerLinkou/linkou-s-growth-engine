import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, Plus, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign, Users, Target, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TrafficMetric {
  id: string;
  month: number;
  year: number;
  investimento: number | null;
  alcance: number | null;
  impressoes: number | null;
  frequencia: number | null;
  cliques: number | null;
  custo_por_clique: number | null;
  quantidade_leads: number | null;
  custo_por_lead: number | null;
  quantidade_sql: number | null;
  custo_por_sql: number | null;
  quantidade_vendas: number | null;
  custo_por_venda: number | null;
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const defaultForm = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  investimento: "",
  alcance: "",
  impressoes: "",
  frequencia: "",
  cliques: "",
  quantidade_leads: "",
  quantidade_sql: "",
  quantidade_vendas: "",
};

export default function ClientMetricsTab({ clientId }: { clientId: string }) {
  const [metrics, setMetrics] = useState<TrafficMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchMetrics = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("traffic_metrics")
      .select("*")
      .eq("client_id", clientId)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (!error && data) setMetrics(data as TrafficMetric[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchMetrics(); }, [clientId]);

  const latest = metrics[0];

  const handleOpen = (metric?: TrafficMetric) => {
    if (metric) {
      setEditingId(metric.id);
      setForm({
        month: metric.month,
        year: metric.year,
        investimento: metric.investimento?.toString() || "",
        alcance: metric.alcance?.toString() || "",
        impressoes: metric.impressoes?.toString() || "",
        frequencia: metric.frequencia?.toString() || "",
        cliques: metric.cliques?.toString() || "",
        quantidade_leads: metric.quantidade_leads?.toString() || "",
        quantidade_sql: metric.quantidade_sql?.toString() || "",
        quantidade_vendas: metric.quantidade_vendas?.toString() || "",
      });
    } else {
      setEditingId(null);
      setForm(defaultForm);
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    const inv = parseFloat(form.investimento) || 0;
    const leads = parseInt(form.quantidade_leads) || 0;
    const vendas = parseInt(form.quantidade_vendas) || 0;
    const sql = parseInt(form.quantidade_sql) || 0;
    const cliques = parseInt(form.cliques) || 0;

    const payload = {
      client_id: clientId,
      month: form.month,
      year: form.year,
      investimento: inv || null,
      alcance: parseFloat(form.alcance) || null,
      impressoes: parseFloat(form.impressoes) || null,
      frequencia: parseFloat(form.frequencia) || null,
      cliques: cliques || null,
      quantidade_leads: leads || null,
      quantidade_sql: sql || null,
      quantidade_vendas: vendas || null,
      custo_por_clique: cliques > 0 ? +(inv / cliques).toFixed(2) : null,
      custo_por_lead: leads > 0 ? +(inv / leads).toFixed(2) : null,
      custo_por_sql: sql > 0 ? +(inv / sql).toFixed(2) : null,
      custo_por_venda: vendas > 0 ? +(inv / vendas).toFixed(2) : null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("traffic_metrics").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("traffic_metrics").insert(payload));
    }

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: editingId ? "Atualizado" : "Criado", description: "Métricas salvas com sucesso." });
      setIsFormOpen(false);
      fetchMetrics();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("traffic_metrics").delete().eq("id", deleteId);
    if (!error) {
      toast({ title: "Excluído", description: "Registro removido." });
      fetchMetrics();
    }
    setIsDeleteOpen(false);
    setDeleteId(null);
  };

  const fmt = (v: number | null) => v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
  const fmtN = (v: number | null) => v != null ? v.toLocaleString("pt-BR") : "—";

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" /> Investimento
              </div>
              <p className="text-lg font-bold">{fmt(latest.investimento)}</p>
              <p className="text-xs text-muted-foreground">{monthNames[(latest.month || 1) - 1]}/{latest.year}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Users className="h-3.5 w-3.5" /> Leads
              </div>
              <p className="text-lg font-bold">{fmtN(latest.quantidade_leads)}</p>
              <p className="text-xs text-muted-foreground">CPL: {fmt(latest.custo_por_lead)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Target className="h-3.5 w-3.5" /> SQLs
              </div>
              <p className="text-lg font-bold">{fmtN(latest.quantidade_sql)}</p>
              <p className="text-xs text-muted-foreground">CPSQL: {fmt(latest.custo_por_sql)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <ShoppingCart className="h-3.5 w-3.5" /> Vendas
              </div>
              <p className="text-lg font-bold">{fmtN(latest.quantidade_vendas)}</p>
              <p className="text-xs text-muted-foreground">CPV: {fmt(latest.custo_por_venda)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Métricas de Tráfego
          </CardTitle>
          <Button size="sm" onClick={() => handleOpen()}>
            <Plus className="h-4 w-4 mr-1" /> Novo Mês
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>
          ) : metrics.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma métrica cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">CPV</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{monthNames[(m.month || 1) - 1]}/{m.year}</TableCell>
                      <TableCell className="text-right">{fmt(m.investimento)}</TableCell>
                      <TableCell className="text-right">{fmtN(m.quantidade_leads)}</TableCell>
                      <TableCell className="text-right">{fmt(m.custo_por_lead)}</TableCell>
                      <TableCell className="text-right">{fmtN(m.quantidade_vendas)}</TableCell>
                      <TableCell className="text-right">{fmt(m.custo_por_venda)}</TableCell>
                      <TableCell className="text-right">{fmtN(m.cliques)}</TableCell>
                      <TableCell className="text-right">{fmt(m.custo_por_clique)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpen(m)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeleteId(m.id); setIsDeleteOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Métricas" : "Nova Métrica Mensal"}</DialogTitle>
            <DialogDescription>Preencha os dados brutos. CPL, CPV e CPC são calculados automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.month} onChange={(e) => setForm({ ...form, month: +e.target.value })}>
                {monthNames.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Investimento (R$)</Label>
              <Input type="number" step="0.01" value={form.investimento} onChange={(e) => setForm({ ...form, investimento: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Alcance</Label>
              <Input type="number" value={form.alcance} onChange={(e) => setForm({ ...form, alcance: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Impressões</Label>
              <Input type="number" value={form.impressoes} onChange={(e) => setForm({ ...form, impressoes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Input type="number" step="0.01" value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cliques</Label>
              <Input type="number" value={form.cliques} onChange={(e) => setForm({ ...form, cliques: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Leads</Label>
              <Input type="number" value={form.quantidade_leads} onChange={(e) => setForm({ ...form, quantidade_leads: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>SQLs</Label>
              <Input type="number" value={form.quantidade_sql} onChange={(e) => setForm({ ...form, quantidade_sql: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Vendas</Label>
              <Input type="number" value={form.quantidade_vendas} onChange={(e) => setForm({ ...form, quantidade_vendas: e.target.value })} />
            </div>
          </div>

          {/* Auto-calc preview */}
          {form.investimento && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
              <p className="font-medium text-sm mb-1">Cálculos automáticos:</p>
              {form.quantidade_leads && +form.quantidade_leads > 0 && (
                <p>CPL: {(+form.investimento / +form.quantidade_leads).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              )}
              {form.quantidade_vendas && +form.quantidade_vendas > 0 && (
                <p>CPV: {(+form.investimento / +form.quantidade_vendas).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              )}
              {form.cliques && +form.cliques > 0 && (
                <p>CPC: {(+form.investimento / +form.cliques).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              )}
              {form.quantidade_sql && +form.quantidade_sql > 0 && (
                <p>CPSQL: {(+form.investimento / +form.quantidade_sql).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
