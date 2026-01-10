import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ShoppingCart,
  Plus,
  Edit2,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrafficMetric {
  id: string;
  client_id: string;
  year: number;
  month: number;
  alcance: number | null;
  impressoes: number | null;
  frequencia: number | null;
  cliques: number | null;
  custo_por_clique: number | null;
  quantidade_leads: number | null;
  quantidade_vendas: number | null;
  custo_por_lead: number | null;
  custo_por_venda: number | null;
  investimento: number | null;
  created_at: string;
  updated_at: string;
}

interface MetricFormData {
  alcance: string;
  impressoes: string;
  frequencia: string;
  cliques: string;
  custo_por_clique: string;
  quantidade_leads: string;
  quantidade_vendas: string;
  investimento: string;
}

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const formatNumber = (value: number | null, decimals = 0): string => {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export default function MetricasTrafego() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [formData, setFormData] = useState<MetricFormData>({
    alcance: "",
    impressoes: "",
    frequencia: "",
    cliques: "",
    custo_por_clique: "",
    quantidade_leads: "",
    quantidade_vendas: "",
    investimento: "",
  });

  const clientId = profile?.client_id;
  const canEdit = profile?.ponto_focal;

  // Fetch metrics for the selected year
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["traffic-metrics", clientId, selectedYear],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("traffic_metrics")
        .select("*")
        .eq("client_id", clientId)
        .eq("year", selectedYear)
        .order("month", { ascending: true });

      if (error) throw error;
      return data as TrafficMetric[];
    },
    enabled: !!clientId,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      month: number;
      formData: MetricFormData;
      existingId?: string;
    }) => {
      const leads = parseInt(data.formData.quantidade_leads) || 0;
      const vendas = parseInt(data.formData.quantidade_vendas) || 0;
      const investimento = parseFloat(data.formData.investimento) || 0;

      const metricData = {
        client_id: clientId!,
        year: selectedYear,
        month: data.month,
        alcance: parseFloat(data.formData.alcance) || null,
        impressoes: parseFloat(data.formData.impressoes) || null,
        frequencia: parseFloat(data.formData.frequencia) || null,
        cliques: parseInt(data.formData.cliques) || null,
        custo_por_clique: parseFloat(data.formData.custo_por_clique) || null,
        quantidade_leads: leads || null,
        quantidade_vendas: vendas || null,
        custo_por_lead: leads > 0 ? investimento / leads : null,
        custo_por_venda: vendas > 0 ? investimento / vendas : null,
        investimento: investimento || null,
        updated_by: profile?.id,
      };

      if (data.existingId) {
        const { error } = await supabase
          .from("traffic_metrics")
          .update(metricData)
          .eq("id", data.existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("traffic_metrics")
          .insert({ ...metricData, created_by: profile?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["traffic-metrics"] });
      toast.success("Métricas salvas com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Error saving metrics:", error);
      toast.error("Erro ao salvar métricas");
    },
  });

  const resetForm = () => {
    setFormData({
      alcance: "",
      impressoes: "",
      frequencia: "",
      cliques: "",
      custo_por_clique: "",
      quantidade_leads: "",
      quantidade_vendas: "",
      investimento: "",
    });
    setEditingMonth(null);
  };

  const openEditDialog = (month: number) => {
    const existingMetric = metrics?.find((m) => m.month === month);
    if (existingMetric) {
      setFormData({
        alcance: existingMetric.alcance?.toString() || "",
        impressoes: existingMetric.impressoes?.toString() || "",
        frequencia: existingMetric.frequencia?.toString() || "",
        cliques: existingMetric.cliques?.toString() || "",
        custo_por_clique: existingMetric.custo_por_clique?.toString() || "",
        quantidade_leads: existingMetric.quantidade_leads?.toString() || "",
        quantidade_vendas: existingMetric.quantidade_vendas?.toString() || "",
        investimento: existingMetric.investimento?.toString() || "",
      });
    } else {
      resetForm();
    }
    setEditingMonth(month);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingMonth === null) return;
    const existingMetric = metrics?.find((m) => m.month === editingMonth);
    saveMutation.mutate({
      month: editingMonth,
      formData,
      existingId: existingMetric?.id,
    });
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        totalInvestimento: 0,
        totalLeads: 0,
        totalVendas: 0,
        avgCPL: 0,
        avgCAC: 0,
      };
    }

    const totalInvestimento = metrics.reduce(
      (sum, m) => sum + (m.investimento || 0),
      0
    );
    const totalLeads = metrics.reduce(
      (sum, m) => sum + (m.quantidade_leads || 0),
      0
    );
    const totalVendas = metrics.reduce(
      (sum, m) => sum + (m.quantidade_vendas || 0),
      0
    );

    return {
      totalInvestimento,
      totalLeads,
      totalVendas,
      avgCPL: totalLeads > 0 ? totalInvestimento / totalLeads : 0,
      avgCAC: totalVendas > 0 ? totalInvestimento / totalVendas : 0,
    };
  }, [metrics]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return MONTHS.map((monthName, index) => {
      const metric = metrics?.find((m) => m.month === index + 1);
      return {
        name: monthName,
        investimento: metric?.investimento || 0,
        leads: metric?.quantidade_leads || 0,
        vendas: metric?.quantidade_vendas || 0,
      };
    });
  }, [metrics]);

  // Get metric value for a specific month
  const getMetricValue = (month: number, field: keyof TrafficMetric) => {
    const metric = metrics?.find((m) => m.month === month);
    return metric ? metric[field] : null;
  };

  const metricRows = [
    { key: "alcance", label: "Alcance", format: (v: number | null) => formatNumber(v) },
    { key: "impressoes", label: "Impressões", format: (v: number | null) => formatNumber(v) },
    { key: "frequencia", label: "Frequência", format: (v: number | null) => formatNumber(v, 2) },
    { key: "cliques", label: "Cliques", format: (v: number | null) => formatNumber(v) },
    { key: "custo_por_clique", label: "CPC", format: (v: number | null) => formatCurrency(v) },
    { key: "quantidade_leads", label: "Leads", format: (v: number | null) => formatNumber(v) },
    { key: "quantidade_vendas", label: "Vendas", format: (v: number | null) => formatNumber(v) },
    { key: "custo_por_lead", label: "CPL", format: (v: number | null) => formatCurrency(v) },
    { key: "custo_por_venda", label: "CAC", format: (v: number | null) => formatCurrency(v) },
    { key: "investimento", label: "Investimento", format: (v: number | null) => formatCurrency(v) },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Métricas de Tráfego Pago
          </h1>
          <p className="text-muted-foreground">
            Acompanhe os resultados das campanhas de tráfego pago
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investimento Total</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis.totalInvestimento)}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{formatNumber(kpis.totalLeads)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Vendas</p>
                <p className="text-2xl font-bold">{formatNumber(kpis.totalVendas)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <ShoppingCart className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPL Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis.avgCPL)}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500/10">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CAC Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis.avgCAC)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Métricas Mensais</CardTitle>
          {canEdit && (
            <Badge variant="secondary" className="gap-1">
              <Edit2 className="h-3 w-3" />
              Clique em um mês para editar
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 min-w-[120px]">Métrica</TableHead>
                  {MONTHS.map((month, index) => (
                    <TableHead
                      key={month}
                      className={`text-center min-w-[80px] ${canEdit ? "cursor-pointer hover:bg-muted/50" : ""}`}
                      onClick={() => canEdit && openEditDialog(index + 1)}
                    >
                      {month}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium">
                      {row.label}
                    </TableCell>
                    {MONTHS.map((_, index) => (
                      <TableCell
                        key={index}
                        className={`text-center ${canEdit ? "cursor-pointer hover:bg-muted/50" : ""}`}
                        onClick={() => canEdit && openEditDialog(index + 1)}
                      >
                        {row.format(getMetricValue(index + 1, row.key as keyof TrafficMetric) as number | null)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "investimento") return [formatCurrency(value), "Investimento"];
                    if (name === "leads") return [formatNumber(value), "Leads"];
                    if (name === "vendas") return [formatNumber(value), "Vendas"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="investimento"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Investimento"
                  dot={{ fill: "hsl(var(--primary))" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(220, 70%, 50%)"
                  strokeWidth={2}
                  name="Leads"
                  dot={{ fill: "hsl(220, 70%, 50%)" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="vendas"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  name="Vendas"
                  dot={{ fill: "hsl(142, 76%, 36%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMonth !== null
                ? `Métricas de ${MONTH_NAMES[editingMonth - 1]} ${selectedYear}`
                : "Editar Métricas"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alcance">Alcance</Label>
                <Input
                  id="alcance"
                  type="number"
                  value={formData.alcance}
                  onChange={(e) => setFormData({ ...formData, alcance: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impressoes">Impressões</Label>
                <Input
                  id="impressoes"
                  type="number"
                  value={formData.impressoes}
                  onChange={(e) => setFormData({ ...formData, impressoes: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequencia">Frequência</Label>
                <Input
                  id="frequencia"
                  type="number"
                  step="0.01"
                  value={formData.frequencia}
                  onChange={(e) => setFormData({ ...formData, frequencia: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliques">Cliques</Label>
                <Input
                  id="cliques"
                  type="number"
                  value={formData.cliques}
                  onChange={(e) => setFormData({ ...formData, cliques: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custo_por_clique">CPC (R$)</Label>
                <Input
                  id="custo_por_clique"
                  type="number"
                  step="0.01"
                  value={formData.custo_por_clique}
                  onChange={(e) => setFormData({ ...formData, custo_por_clique: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investimento">Investimento (R$)</Label>
                <Input
                  id="investimento"
                  type="number"
                  step="0.01"
                  value={formData.investimento}
                  onChange={(e) => setFormData({ ...formData, investimento: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade_leads">Quantidade de Leads</Label>
                <Input
                  id="quantidade_leads"
                  type="number"
                  value={formData.quantidade_leads}
                  onChange={(e) => setFormData({ ...formData, quantidade_leads: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade_vendas">Quantidade de Vendas</Label>
                <Input
                  id="quantidade_vendas"
                  type="number"
                  value={formData.quantidade_vendas}
                  onChange={(e) => setFormData({ ...formData, quantidade_vendas: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              * CPL e CAC serão calculados automaticamente com base no investimento, leads e vendas.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
