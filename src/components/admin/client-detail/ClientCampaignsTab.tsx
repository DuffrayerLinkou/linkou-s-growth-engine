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
import { parseDateOnly } from "@/lib/utils";

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

const defaultMetricsForm: Record<string, string> = {};

export default function ClientCampaignsTab({ clientId }: { clientId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [metricsForm, setMetricsForm] = useState<Record<string, string>>(defaultMetricsForm);
  const [resultsText, setResultsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, name, status, platform, start_date, end_date, budget, metrics, results")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (!error && data) setCampaigns(data as Campaign[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, [clientId]);

  const openMetrics = (c: Campaign) => {
    setSelectedCampaign(c);
    const m = (c.metrics as Record<string, any>) || {};
    const mForm: Record<string, string> = {};
    for (const [k, v] of Object.entries(m)) {
      mForm[k] = v != null ? String(v) : "";
    }
    setMetricsForm(mForm);
    setResultsText(c.results || "");
    setIsMetricsOpen(true);
  };

  const handleSaveMetrics = async () => {
    if (!selectedCampaign) return;
    setIsSubmitting(true);

    const platform = selectedCampaign.platform || "other";
    const metricsPayload = computeMetrics(platform, metricsForm);
    const hasMetrics = Object.values(metricsPayload).some(v => v != null);

    const { error } = await supabase
      .from("campaigns")
      .update({
        metrics: (hasMetrics ? metricsPayload : null) as unknown as Json,
        results: resultsText.trim() || null,
      })
      .eq("id", selectedCampaign.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: "Salvo", description: "Métricas e resultados atualizados." });
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
                          {c.platform && <Badge variant="outline" className="text-xs">{platformLabels[c.platform] || c.platform}</Badge>}
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          {c.start_date && <span>Início: {format((parseDateOnly(c.start_date) ?? new Date(0)), "dd/MM/yy")}</span>}
                          {c.budget && <span>Budget: {fmt(c.budget)}</span>}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openMetrics(c)}>
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Métricas
                      </Button>
                    </div>

                    {hasMetrics && (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3 pt-3 border-t">
                        {Object.entries(m).map(([key, value]) => {
                          if (value == null) return null;
                          const label = allMetricLabels[key.toLowerCase()] || key;
                          const display = formatMetricValue(key, value);
                          return (
                            <div key={key} className="text-center">
                              <p className="text-xs text-muted-foreground">{label}</p>
                              <p className="font-medium text-sm">{display}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {c.results && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Relatório:</p>
                        <p className="text-sm line-clamp-2">{c.results}</p>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultados: {selectedCampaign?.name}</DialogTitle>
            <DialogDescription>
              Canal: {platformLabels[selectedCampaign?.platform || ""] || selectedCampaign?.platform || "N/A"} — campos calculados são automáticos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resumo dos Resultados</Label>
              <Textarea
                value={resultsText}
                onChange={(e) => setResultsText(e.target.value)}
                placeholder="Resumo executivo dos resultados para o cliente..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {getMetricsForChannel(selectedCampaign?.platform || "other").filter(f => !f.computed).map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    type="number"
                    step={field.type === "currency" ? "0.01" : "1"}
                    value={metricsForm[field.key] || ""}
                    onChange={(e) => setMetricsForm({ ...metricsForm, [field.key]: e.target.value })}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            {/* Auto-calculated preview */}
            {(() => {
              const platform = selectedCampaign?.platform || "other";
              const computed = computeMetrics(platform, metricsForm);
              const computedFields = getMetricsForChannel(platform).filter(f => f.computed);
              const hasComputed = computedFields.some(f => computed[f.key] != null);
              if (!hasComputed) return null;
              return (
                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium text-sm mb-1">Cálculos automáticos:</p>
                  {computedFields.map((f) => {
                    const val = computed[f.key];
                    if (val == null) return null;
                    const display = f.type === "percent" ? `${val}%` : f.type === "currency" ? val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : val.toLocaleString("pt-BR");
                    return <p key={f.key}>{f.label}: {display}</p>;
                  })}
                </div>
              );
            })()}
          </div>

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
