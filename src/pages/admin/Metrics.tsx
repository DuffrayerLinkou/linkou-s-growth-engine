import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BarChart3, Plus, Pencil, Trash2, Download, TrendingDown,
  DollarSign, Users, Target, ShoppingCart, Eye, MousePointerClick,
} from "lucide-react";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const currentYear = new Date().getFullYear();

function fmt(v: number | null | undefined, prefix = "") {
  if (v == null || isNaN(v)) return "—";
  return prefix + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtInt(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR");
}

const emptyForm = {
  month: new Date().getMonth() + 1,
  year: currentYear,
  investimento: "",
  alcance: "",
  impressoes: "",
  frequencia: "",
  cliques: "",
  quantidade_leads: "",
  quantidade_sql: "",
  quantidade_vendas: "",
};

export default function AdminMetrics() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: clients = [] } = useQuery({
    queryKey: ["admin-metrics-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name, status").order("name");
      return data || [];
    },
  });

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["admin-metrics", selectedClient, selectedYear],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data } = await supabase
        .from("traffic_metrics")
        .select("*")
        .eq("client_id", selectedClient)
        .eq("year", selectedYear)
        .order("month", { ascending: true });
      return data || [];
    },
    enabled: !!selectedClient,
  });

  const { data: allClientsLatest = [] } = useQuery({
    queryKey: ["admin-metrics-overview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("traffic_metrics")
        .select("*, clients!inner(name)")
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (!data) return [];
      const seen = new Set<string>();
      return data.filter((m: any) => {
        if (seen.has(m.client_id)) return false;
        seen.add(m.client_id);
        return true;
      });
    },
  });

  const latestMonth = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  function calcMetrics(f: typeof emptyForm) {
    const inv = parseFloat(f.investimento) || 0;
    const leads = parseInt(f.quantidade_leads) || 0;
    const vendas = parseInt(f.quantidade_vendas) || 0;
    const sql = parseInt(f.quantidade_sql) || 0;
    const cliques = parseInt(f.cliques) || 0;
    return {
      custo_por_lead: leads > 0 ? inv / leads : null,
      custo_por_venda: vendas > 0 ? inv / vendas : null,
      custo_por_sql: sql > 0 ? inv / sql : null,
      custo_por_clique: cliques > 0 ? inv / cliques : null,
    };
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const calc = calcMetrics(form);
      const payload = {
        client_id: selectedClient,
        month: form.month,
        year: form.year,
        investimento: parseFloat(form.investimento) || null,
        alcance: parseFloat(form.alcance) || null,
        impressoes: parseFloat(form.impressoes) || null,
        frequencia: parseFloat(form.frequencia) || null,
        cliques: parseInt(form.cliques) || null,
        quantidade_leads: parseInt(form.quantidade_leads) || null,
        quantidade_sql: parseInt(form.quantidade_sql) || null,
        quantidade_vendas: parseInt(form.quantidade_vendas) || null,
        ...calc,
        updated_by: user?.id,
      };

      if (editingId) {
        const { error } = await supabase.from("traffic_metrics").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("traffic_metrics").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Métrica atualizada" : "Métrica criada");
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
      qc.invalidateQueries({ queryKey: ["admin-metrics-overview"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("traffic_metrics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro excluído");
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
      qc.invalidateQueries({ queryKey: ["admin-metrics-overview"] });
    },
  });

  function openEdit(row: any) {
    setEditingId(row.id);
    setForm({
      month: row.month,
      year: row.year,
      investimento: row.investimento?.toString() || "",
      alcance: row.alcance?.toString() || "",
      impressoes: row.impressoes?.toString() || "",
      frequencia: row.frequencia?.toString() || "",
      cliques: row.cliques?.toString() || "",
      quantidade_leads: row.quantidade_leads?.toString() || "",
      quantidade_sql: row.quantidade_sql?.toString() || "",
      quantidade_vendas: row.quantidade_vendas?.toString() || "",
    });
    setDialogOpen(true);
  }

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm, year: selectedYear });
    setDialogOpen(true);
  }

  async function exportXLSX() {
    if (!metrics.length) return;
    const clientName = clients.find((c) => c.id === selectedClient)?.name || "cliente";
    const headers = ["Mês", "Investimento", "Alcance", "Impressões", "Frequência", "Cliques", "CPC", "Leads", "CPL", "SQLs", "CPSQL", "Vendas", "CPV"];
    const rows = metrics.map((m: any) => [
      `${monthNames[m.month - 1]}/${m.year}`,
      m.investimento, m.alcance, m.impressoes, m.frequencia, m.cliques,
      m.custo_por_clique, m.quantidade_leads, m.custo_por_lead,
      m.quantidade_sql, m.custo_por_sql, m.quantidade_vendas, m.custo_por_venda,
    ]);

    const csv = [headers.join(";"), ...rows.map((r: any[]) => r.map((v) => v ?? "").join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metricas-${clientName}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const years = useMemo(() => {
    const y = new Set<number>();
    for (let i = currentYear - 3; i <= currentYear + 1; i++) y.add(i);
    return Array.from(y).sort((a, b) => b - a);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Métricas de Tráfego
          </h1>
          <p className="text-sm text-muted-foreground">Gestão centralizada de métricas por cliente</p>
        </div>
      </div>

      <Tabs defaultValue="client" className="space-y-4">
        <TabsList>
          <TabsTrigger value="client">Por Cliente</TabsTrigger>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="client" className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-64">
              <Label>Cliente</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.status !== "active" && <span className="text-xs text-muted-foreground ml-1">({c.status})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Label>Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClient && (
              <>
                <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Novo Mês</Button>
                <Button onClick={exportXLSX} variant="outline" size="sm" disabled={!metrics.length}>
                  <Download className="h-4 w-4 mr-1" />Exportar
                </Button>
              </>
            )}
          </div>

          {latestMonth && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Investimento", value: fmt(latestMonth.investimento, "R$ "), icon: DollarSign, color: "text-green-500" },
                { label: "Leads", value: fmtInt(latestMonth.quantidade_leads), icon: Users, color: "text-blue-500" },
                { label: "CPL", value: fmt(latestMonth.custo_por_lead, "R$ "), icon: Target, color: "text-orange-500" },
                { label: "Vendas", value: fmtInt(latestMonth.quantidade_vendas), icon: ShoppingCart, color: "text-emerald-500" },
                { label: "CPV", value: fmt(latestMonth.custo_por_venda, "R$ "), icon: TrendingDown, color: "text-red-500" },
                { label: "Cliques", value: fmtInt(latestMonth.cliques), icon: MousePointerClick, color: "text-purple-500" },
              ].map((kpi) => (
                <Card key={kpi.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                      <span className="text-xs text-muted-foreground">{kpi.label}</span>
                    </div>
                    <p className="text-lg font-bold">{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {monthNames[latestMonth.month - 1]}/{latestMonth.year}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedClient && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dados Mensais — {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
                ) : metrics.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma métrica registrada para este ano.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Investimento</TableHead>
                        <TableHead className="text-right">Alcance</TableHead>
                        <TableHead className="text-right">Impressões</TableHead>
                        <TableHead className="text-right">Freq.</TableHead>
                        <TableHead className="text-right">Cliques</TableHead>
                        <TableHead className="text-right">CPC</TableHead>
                        <TableHead className="text-right">Leads</TableHead>
                        <TableHead className="text-right">CPL</TableHead>
                        <TableHead className="text-right">SQLs</TableHead>
                        <TableHead className="text-right">CPSQL</TableHead>
                        <TableHead className="text-right">Vendas</TableHead>
                        <TableHead className="text-right">CPV</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{monthNames[m.month - 1]}</TableCell>
                          <TableCell className="text-right">{fmt(m.investimento, "R$ ")}</TableCell>
                          <TableCell className="text-right">{fmtInt(m.alcance)}</TableCell>
                          <TableCell className="text-right">{fmtInt(m.impressoes)}</TableCell>
                          <TableCell className="text-right">{fmt(m.frequencia)}</TableCell>
                          <TableCell className="text-right">{fmtInt(m.cliques)}</TableCell>
                          <TableCell className="text-right">{fmt(m.custo_por_clique, "R$ ")}</TableCell>
                          <TableCell className="text-right">{fmtInt(m.quantidade_leads)}</TableCell>
                          <TableCell className="text-right">{fmt(m.custo_por_lead, "R$ ")}</TableCell>
                          <TableCell className="text-right">{fmtInt(m.quantidade_sql)}</TableCell>
                          <TableCell className="text-right">{fmt(m.custo_por_sql, "R$ ")}</TableCell>
                          <TableCell className="text-right">{fmtInt(m.quantidade_vendas)}</TableCell>
                          <TableCell className="text-right">{fmt(m.custo_por_venda, "R$ ")}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(m.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {!selectedClient && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Selecione um cliente para gerenciar suas métricas de tráfego</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Resumo — Último Mês por Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {allClientsLatest.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma métrica registrada.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Investimento</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">CPL</TableHead>
                      <TableHead className="text-right">SQLs</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">CPV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allClientsLatest.map((m: any) => (
                      <TableRow
                        key={m.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedClient(m.client_id);
                          setSelectedYear(m.year);
                          const tabEl = document.querySelector('[data-state="inactive"][value="client"]') as HTMLElement;
                          tabEl?.click();
                        }}
                      >
                        <TableCell className="font-medium">{(m as any).clients?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{monthNames[m.month - 1]}/{m.year}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{fmt(m.investimento, "R$ ")}</TableCell>
                        <TableCell className="text-right">{fmtInt(m.quantidade_leads)}</TableCell>
                        <TableCell className="text-right">{fmt(m.custo_por_lead, "R$ ")}</TableCell>
                        <TableCell className="text-right">{fmtInt(m.quantidade_sql)}</TableCell>
                        <TableCell className="text-right">{fmtInt(m.quantidade_vendas)}</TableCell>
                        <TableCell className="text-right">{fmt(m.custo_por_venda, "R$ ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Métrica" : "Nova Métrica Mensal"}</DialogTitle>
            <DialogDescription>Preencha os dados brutos — CPC, CPL, CPV e CPSQL são calculados automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mês</Label>
              <Select value={form.month.toString()} onValueChange={(v) => setForm({ ...form, month: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthNames.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ano</Label>
              <Select value={form.year.toString()} onValueChange={(v) => setForm({ ...form, year: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {[
              { key: "investimento", label: "Investimento (R$)", type: "number" },
              { key: "alcance", label: "Alcance", type: "number" },
              { key: "impressoes", label: "Impressões", type: "number" },
              { key: "frequencia", label: "Frequência", type: "number" },
              { key: "cliques", label: "Cliques", type: "number" },
              { key: "quantidade_leads", label: "Leads", type: "number" },
              { key: "quantidade_sql", label: "SQLs", type: "number" },
              { key: "quantidade_vendas", label: "Vendas", type: "number" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type={type}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          {(form.investimento || form.quantidade_leads || form.quantidade_vendas) && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
              <p className="font-semibold text-muted-foreground mb-1">Métricas calculadas:</p>
              {(() => {
                const c = calcMetrics(form);
                return (
                  <>
                    <p>CPC: {fmt(c.custo_por_clique, "R$ ")}</p>
                    <p>CPL: {fmt(c.custo_por_lead, "R$ ")}</p>
                    <p>CPSQL: {fmt(c.custo_por_sql, "R$ ")}</p>
                    <p>CPV: {fmt(c.custo_por_venda, "R$ ")}</p>
                  </>
                );
              })()}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
