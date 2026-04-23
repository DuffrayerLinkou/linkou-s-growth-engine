import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { platformOptions, formatOptions, type Priority } from "@/lib/creative-config";
import { Layers } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: { id: string; name: string }[];
  /** Pre-fill these when opened from a Campaign view */
  initialClientId?: string;
  initialCampaignId?: string;
}

export function CreativeBatchCreateDialog({
  open,
  onOpenChange,
  clients,
  initialClientId,
  initialCampaignId,
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [clientId, setClientId] = useState("");
  const [campaignId, setCampaignId] = useState<string>("none");
  const [titlesText, setTitlesText] = useState("");
  const [platform, setPlatform] = useState("");
  const [format, setFormat] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [briefing, setBriefing] = useState("");

  useEffect(() => {
    if (!open) return;
    setClientId(initialClientId || "");
    setCampaignId(initialCampaignId || "none");
    setTitlesText("");
    setPlatform("");
    setFormat("");
    setDeadline("");
    setPriority("medium");
    setBriefing("");
  }, [open, initialClientId, initialCampaignId]);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["admin-client-campaigns", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, status")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const titles = useMemo(
    () =>
      titlesText
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean),
    [titlesText]
  );

  const create = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("Selecione um cliente");
      if (titles.length === 0) throw new Error("Informe ao menos um título");
      const rows = titles.map((title) => ({
        client_id: clientId,
        campaign_id: campaignId !== "none" ? campaignId : null,
        title,
        briefing: briefing.trim() || null,
        platform: platform || null,
        format: format || null,
        deadline: deadline || null,
        priority,
        status: "briefing",
        requested_by: user?.id,
      }));
      const { error } = await supabase.from("creative_demands").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: `${titles.length} demandas criadas` });
      qc.invalidateQueries({ queryKey: ["admin-creative-demands"] });
      qc.invalidateQueries({ queryKey: ["campaign-creative-demands"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" /> Criar demandas em lote
          </DialogTitle>
          <DialogDescription>
            Crie várias demandas criativas de uma vez para a mesma campanha. Uma por linha.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Cliente *</Label>
              <Select value={clientId} onValueChange={setClientId} disabled={!!initialClientId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Campanha</Label>
              <Select value={campaignId} onValueChange={setCampaignId} disabled={!clientId || !!initialCampaignId}>
                <SelectTrigger><SelectValue placeholder={clientId ? "Selecione (opcional)" : "Selecione cliente"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem campanha</SelectItem>
                  {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Títulos das demandas * <span className="text-xs text-muted-foreground">(uma por linha)</span></Label>
            <Textarea
              value={titlesText}
              onChange={(e) => setTitlesText(e.target.value)}
              rows={6}
              placeholder={"Reel hook 1\nReel hook 2\nStory carrossel\nStatic principal"}
            />
            {titles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {titles.length} demanda{titles.length === 1 ? "" : "s"} será{titles.length === 1 ? "" : "ão"} criada{titles.length === 1 ? "" : "s"}.
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Plataforma</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {platformOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Formato</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {formatOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Briefing comum <span className="text-xs text-muted-foreground">(aplicado a todas)</span></Label>
            <Textarea value={briefing} onChange={(e) => setBriefing(e.target.value)} rows={3} placeholder="Diretrizes, tom, referências…" />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
          <Button onClick={() => create.mutate()} disabled={!clientId || titles.length === 0 || create.isPending} className="w-full sm:w-auto">
            Criar {titles.length > 0 ? `${titles.length} demandas` : "demandas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
