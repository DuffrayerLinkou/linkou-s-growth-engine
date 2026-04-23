import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { platformOptions, formatOptions, demandStatusConfig, type Priority, type DemandStatus } from "@/lib/creative-config";

export interface DemandFormValue {
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
  campaign_id?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: { id: string; name: string }[];
  /** When provided → edit mode; otherwise → create mode */
  demand?: DemandFormValue | null;
}

export function CreativeDemandFormDialog({ open, onOpenChange, clients, demand }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isEdit = !!demand;

  const [fClient, setFClient] = useState("");
  const [fCampaign, setFCampaign] = useState<string>("none");
  const [fTitle, setFTitle] = useState("");
  const [fObjective, setFObjective] = useState("");
  const [fBriefing, setFBriefing] = useState("");
  const [fPlatform, setFPlatform] = useState("");
  const [fFormat, setFFormat] = useState("");
  const [fDeadline, setFDeadline] = useState("");
  const [fPriority, setFPriority] = useState<Priority>("medium");
  const [fStatus, setFStatus] = useState<DemandStatus>("briefing");

  useEffect(() => {
    if (!open) return;
    if (demand) {
      setFClient(demand.client_id);
      setFCampaign(demand.campaign_id || "none");
      setFTitle(demand.title);
      setFObjective(demand.objective || "");
      setFBriefing(demand.briefing || "");
      setFPlatform(demand.platform || "");
      setFFormat(demand.format || "");
      setFDeadline(demand.deadline || "");
      setFPriority(demand.priority);
      setFStatus(demand.status);
    } else {
      setFClient(""); setFCampaign("none"); setFTitle(""); setFObjective(""); setFBriefing("");
      setFPlatform(""); setFFormat(""); setFDeadline(""); setFPriority("medium");
      setFStatus("in_production");
    }
  }, [open, demand]);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["admin-client-campaigns", fClient],
    queryFn: async () => {
      if (!fClient) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("client_id", fClient)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!fClient,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!fClient || !fTitle.trim()) throw new Error("Preencha cliente e título");
      const payload = {
        client_id: fClient,
        campaign_id: fCampaign !== "none" ? fCampaign : null,
        title: fTitle.trim(),
        objective: fObjective.trim() || null,
        briefing: fBriefing.trim() || null,
        platform: fPlatform || null,
        format: fFormat || null,
        deadline: fDeadline || null,
        priority: fPriority,
        status: fStatus,
      };
      if (isEdit && demand) {
        const { error } = await supabase.from("creative_demands").update(payload).eq("id", demand.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("creative_demands").insert({
          ...payload,
          requested_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: isEdit ? "Demanda atualizada" : "Demanda criada" });
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
          <DialogTitle>{isEdit ? "Editar demanda" : "Nova demanda criativa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Cliente *</Label>
            <Select value={fClient} onValueChange={setFClient}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Campanha vinculada</Label>
            <Select value={fCampaign} onValueChange={setFCampaign} disabled={!fClient}>
              <SelectTrigger>
                <SelectValue placeholder={fClient ? "Selecione (opcional)" : "Selecione um cliente primeiro"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem campanha</SelectItem>
                {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título *</Label>
            <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
          </div>
          <div>
            <Label>Objetivo</Label>
            <Input value={fObjective} onChange={(e) => setFObjective(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Plataforma</Label>
              <Select value={fPlatform} onValueChange={setFPlatform}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {platformOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Formato</Label>
              <Select value={fFormat} onValueChange={setFFormat}>
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
              <Input type="date" value={fDeadline} onChange={(e) => setFDeadline(e.target.value)} />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={fPriority} onValueChange={(v) => setFPriority(v as Priority)}>
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
          {isEdit && (
            <div>
              <Label>Status</Label>
              <Select value={fStatus} onValueChange={(v) => setFStatus(v as DemandStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(demandStatusConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Briefing</Label>
            <Textarea value={fBriefing} onChange={(e) => setFBriefing(e.target.value)} rows={5} />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={!fClient || !fTitle.trim() || save.isPending} className="w-full sm:w-auto">
            {isEdit ? "Salvar alterações" : "Criar demanda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}