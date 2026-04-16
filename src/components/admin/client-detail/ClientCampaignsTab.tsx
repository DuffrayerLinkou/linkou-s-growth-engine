import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Megaphone, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { platformLabels, getMetricsForChannel, computeMetrics, formatMetricValue, allMetricLabels } from "@/lib/channel-metrics-config";

interface Campaign {
  id: string;
  name: string;
  status: string | null;
  platform: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  metrics: Json | null;
  results: string | null;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending_approval: "Pendente",
  running: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
};

const statusColors: Record<string, string> = {
  draft: "secondary",
  pending_approval: "outline",
  running: "default",
  paused: "secondary",
  completed: "outline",
};

const defaultMetricsForm = {
  impressoes: "",
  cliques: "",
  ctr: "",
  leads: "",
  custo: "",
  cpl: "",
};

export default function ClientCampaignsTab({ clientId }: { clientId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [metricsForm, setMetricsForm] = useState(defaultMetricsForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, name, status, platform, start_date, end_date, budget, metrics")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (!error && data) setCampaigns(data as Campaign[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, [clientId]);

  const openMetrics = (c: Campaign) => {
    setSelectedCampaign(c);
    const m = (c.metrics as Record<string, any>) || {};
    setMetricsForm({
      impressoes: m.impressoes?.toString() || "",
      cliques: m.cliques?.toString() || "",
      ctr: m.ctr?.toString() || "",
      leads: m.leads?.toString() || "",
      custo: m.custo?.toString() || m.cost?.toString() || "",
      cpl: m.cpl?.toString() || "",
    });
    setIsMetricsOpen(true);
  };

  const handleSaveMetrics = async () => {
    if (!selectedCampaign) return;
    setIsSubmitting(true);

    const leads = parseFloat(metricsForm.leads) || 0;
    const custo = parseFloat(metricsForm.custo) || 0;
    const cliques = parseFloat(metricsForm.cliques) || 0;
    const impressoes = parseFloat(metricsForm.impressoes) || 0;

    const metricsPayload: Record<string, number | null> = {
      impressoes: impressoes || null,
      cliques: cliques || null,
      ctr: impressoes > 0 ? +((cliques / impressoes) * 100).toFixed(2) : parseFloat(metricsForm.ctr) || null,
      leads: leads || null,
      custo: custo || null,
      cpl: leads > 0 ? +(custo / leads).toFixed(2) : null,
    };

    const { error } = await supabase
      .from("campaigns")
      .update({ metrics: metricsPayload as unknown as Json })
      .eq("id", selectedCampaign.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: "Salvo", description: "Métricas da campanha atualizadas." });
      setIsMetricsOpen(false);
      fetchCampaigns();
    }
    setIsSubmitting(false);
  };

  const fmt = (v: number | null | undefined) => v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Campanhas do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma campanha encontrada.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const m = (c.metrics as Record<string, any>) || {};
                const hasMetrics = Object.keys(m).length > 0;
                return (
                  <div key={c.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">{c.name}</h4>
                          <Badge variant={statusColors[c.status || "draft"] as any}>
                            {statusLabels[c.status || "draft"] || c.status}
                          </Badge>
                          {c.platform && <Badge variant="outline" className="text-xs">{c.platform}</Badge>}
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          {c.start_date && <span>Início: {format(new Date(c.start_date), "dd/MM/yy")}</span>}
                          {c.budget && <span>Budget: {fmt(c.budget)}</span>}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openMetrics(c)}>
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Métricas
                      </Button>
                    </div>

                    {hasMetrics && (
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3 pt-3 border-t">
                        {m.impressoes != null && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Impressões</p>
                            <p className="font-medium text-sm">{Number(m.impressoes).toLocaleString("pt-BR")}</p>
                          </div>
                        )}
                        {m.cliques != null && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Cliques</p>
                            <p className="font-medium text-sm">{Number(m.cliques).toLocaleString("pt-BR")}</p>
                          </div>
                        )}
                        {m.ctr != null && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">CTR</p>
                            <p className="font-medium text-sm">{Number(m.ctr).toFixed(2)}%</p>
                          </div>
                        )}
                        {m.leads != null && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Leads</p>
                            <p className="font-medium text-sm">{Number(m.leads).toLocaleString("pt-BR")}</p>
                          </div>
                        )}
                        {m.custo != null && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Custo</p>
                            <p className="font-medium text-sm">{fmt(Number(m.custo))}</p>
                          </div>
                        )}
                        {m.cpl != null && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">CPL</p>
                            <p className="font-medium text-sm">{fmt(Number(m.cpl))}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Edit Dialog */}
      <Dialog open={isMetricsOpen} onOpenChange={setIsMetricsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Métricas: {selectedCampaign?.name}</DialogTitle>
            <DialogDescription>CTR e CPL são calculados automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Impressões</Label>
              <Input type="number" value={metricsForm.impressoes} onChange={(e) => setMetricsForm({ ...metricsForm, impressoes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cliques</Label>
              <Input type="number" value={metricsForm.cliques} onChange={(e) => setMetricsForm({ ...metricsForm, cliques: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Leads</Label>
              <Input type="number" value={metricsForm.leads} onChange={(e) => setMetricsForm({ ...metricsForm, leads: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Custo Total (R$)</Label>
              <Input type="number" step="0.01" value={metricsForm.custo} onChange={(e) => setMetricsForm({ ...metricsForm, custo: e.target.value })} />
            </div>
          </div>

          {(metricsForm.impressoes || metricsForm.custo) && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
              <p className="font-medium text-sm mb-1">Cálculos automáticos:</p>
              {metricsForm.impressoes && metricsForm.cliques && +metricsForm.impressoes > 0 && (
                <p>CTR: {((+metricsForm.cliques / +metricsForm.impressoes) * 100).toFixed(2)}%</p>
              )}
              {metricsForm.custo && metricsForm.leads && +metricsForm.leads > 0 && (
                <p>CPL: {(+metricsForm.custo / +metricsForm.leads).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMetricsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMetrics} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
