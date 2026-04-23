import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, ExternalLink, Calendar } from "lucide-react";
import { demandStatusConfig, priorityConfig, type DemandStatus, type Priority } from "@/lib/creative-config";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateOnly } from "@/lib/utils";

interface Props {
  campaignId: string;
  clientId: string;
  onAddBatch: () => void;
}

interface DemandRow {
  id: string;
  title: string;
  status: DemandStatus;
  priority: Priority;
  deadline: string | null;
  platform: string | null;
  format: string | null;
}

export function CampaignCreativesSection({ campaignId, clientId, onAddBatch }: Props) {
  const { data: demands = [], isLoading, error } = useQuery({
    queryKey: ["campaign-creative-demands", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_demands")
        .select("id, title, status, priority, deadline, platform, format")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DemandRow[];
    },
    enabled: !!campaignId,
    retry: false,
  });

  const demandIds = demands.map((d) => d.id);
  const { data: deliverableCounts = {} } = useQuery({
    queryKey: ["campaign-deliverable-counts", campaignId, demandIds.join(",")],
    queryFn: async () => {
      if (demandIds.length === 0) return {};
      const { data, error } = await supabase
        .from("creative_deliverables")
        .select("demand_id, status")
        .in("demand_id", demandIds);
      if (error) throw error;
      const map: Record<string, { total: number; approved: number }> = {};
      (data || []).forEach((row) => {
        const id = row.demand_id as string;
        if (!map[id]) map[id] = { total: 0, approved: 0 };
        map[id].total += 1;
        if (row.status === "approved") map[id].approved += 1;
      });
      return map;
    },
    enabled: demandIds.length > 0,
    retry: false,
  });

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Criativos desta campanha
          <Badge variant="outline" className="text-[10px]">{demands.length}</Badge>
        </h4>
        <Button size="sm" variant="outline" onClick={onAddBatch}>
          <Plus className="h-3.5 w-3.5" /> Adicionar criativos
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          Erro ao carregar criativos: {(error as Error).message}
        </div>
      ) : demands.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Nenhum criativo vinculado a esta campanha.
          <br />
          Use "Adicionar criativos" para criar várias demandas de uma vez.
        </div>
      ) : (
        <div className="space-y-2">
          {demands.map((d) => {
            const counts = deliverableCounts[d.id];
            const statusCfg = demandStatusConfig[d.status] ?? { label: d.status, color: "bg-muted text-muted-foreground border-border", description: "" };
            const prioCfg = priorityConfig[d.priority] ?? { label: d.priority, color: "bg-muted text-muted-foreground" };
            return (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{d.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                    <Badge variant="secondary" className={`text-[9px] ${prioCfg.color}`}>
                      {prioCfg.label}
                    </Badge>
                    {d.platform && <Badge variant="outline" className="text-[9px]">{d.platform}</Badge>}
                    {d.format && <Badge variant="outline" className="text-[9px]">{d.format}</Badge>}
                    {d.deadline && (
                      <Badge variant="outline" className="text-[9px] gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {format(parseDateOnly(d.deadline) ?? new Date(0), "dd/MM", { locale: ptBR })}
                      </Badge>
                    )}
                    {counts && (
                      <span className="text-[10px] text-muted-foreground">
                        · {counts.total} entregável{counts.total === 1 ? "" : "is"}
                        {counts.approved > 0 && ` · ${counts.approved} aprovado${counts.approved === 1 ? "" : "s"}`}
                      </span>
                    )}
                  </div>
                </div>
                <Button asChild size="sm" variant="ghost" className="sm:shrink-0">
                  <Link to={`/admin/criativos?demand=${d.id}`}>
                    <ExternalLink className="h-3.5 w-3.5" /> Abrir
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
