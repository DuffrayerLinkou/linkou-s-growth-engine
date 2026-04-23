import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { CreativeDeliverableEditor } from "./CreativeDeliverableEditor";
import { demandStatusConfig, deliverableTypeConfig, priorityConfig, type DemandStatus, type DeliverableType, type Priority } from "@/lib/creative-config";
import { ArrowLeft, Plus, Calendar, Megaphone, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreativeDemandActions } from "./CreativeDemandActions";
import { parseDateOnly } from "@/lib/utils";

interface Demand {
  id: string;
  client_id: string;
  title: string;
  briefing: string | null;
  objective: string | null;
  platform: string | null;
  format: string | null;
  deadline: string | null;
  priority: Priority;
  status: DemandStatus;
  created_at: string;
  campaign_id?: string | null;
}

interface Props {
  demand: Demand;
  clientName?: string;
  onBack: () => void;
  clients: { id: string; name: string }[];
}

export function CreativeDemandDetail({ demand, clientName, onBack, clients }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState<DeliverableType>("static_copy");
  const [newTitle, setNewTitle] = useState("");

  const { data: deliverables = [] } = useQuery({
    queryKey: ["admin-creative-deliverables", demand.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_deliverables")
        .select("*")
        .eq("demand_id", demand.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: campaign } = useQuery({
    queryKey: ["creative-demand-campaign", demand.campaign_id],
    queryFn: async () => {
      if (!demand.campaign_id) return null;
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("id", demand.campaign_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!demand.campaign_id,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: DemandStatus) => {
      const { error } = await supabase
        .from("creative_demands")
        .update({ status })
        .eq("id", demand.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status atualizado" });
      qc.invalidateQueries({ queryKey: ["admin-creative-demands"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const createDeliverable = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("creative_deliverables").insert({
        demand_id: demand.id,
        client_id: demand.client_id,
        type: newType,
        title: newTitle,
        status: "in_production",
        current_version: 1,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Entregável criado" });
      qc.invalidateQueries({ queryKey: ["admin-creative-deliverables", demand.id] });
      setAddOpen(false);
      setNewTitle("");
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Voltar para o quadro
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1 truncate">{clientName}</p>
              <CardTitle className="text-xl sm:text-2xl break-words">{demand.title}</CardTitle>
              {demand.objective && <p className="text-muted-foreground mt-1 text-sm sm:text-base">{demand.objective}</p>}
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              <Select value={demand.status} onValueChange={(v) => updateStatus.mutate(v as DemandStatus)}>
                <SelectTrigger className="flex-1 sm:flex-none sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(demandStatusConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CreativeDemandActions
                demand={demand}
                clients={clients}
                variant="button"
                onDeleted={onBack}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            {campaign && (
              <Link
                to="/admin/campanhas"
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-primary hover:bg-primary/15 transition-colors"
              >
                <Megaphone className="h-3 w-3" />
                <span className="font-medium">{campaign.name}</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </Link>
            )}
            {demand.platform && <Badge variant="secondary">{demand.platform}</Badge>}
            {demand.format && <Badge variant="secondary">{demand.format}</Badge>}
            <Badge variant="secondary" className={priorityConfig[demand.priority].color}>
              Prioridade: {priorityConfig[demand.priority].label}
            </Badge>
            {demand.deadline && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {format((parseDateOnly(demand.deadline) ?? new Date(0)), "dd 'de' MMM", { locale: ptBR })}
              </Badge>
            )}
          </div>
          {demand.briefing && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Briefing do cliente</p>
              <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/40 p-3">{demand.briefing}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Entregáveis ({deliverables.length})</h2>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Novo entregável
          </Button>
        </div>

        {deliverables.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhum entregável ainda. Crie o primeiro para começar a produção.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deliverables.map((d) => (
              <CreativeDeliverableEditor key={d.id} deliverable={d as Parameters<typeof CreativeDeliverableEditor>[0]["deliverable"]} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo entregável</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as DeliverableType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(deliverableTypeConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Roteiro do reel #1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={() => createDeliverable.mutate()} disabled={!newTitle.trim() || createDeliverable.isPending}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}