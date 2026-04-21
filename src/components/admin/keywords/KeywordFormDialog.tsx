import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { intentLabels, keywordStatusLabels } from "@/lib/keyword-config";
import type { KeywordRow } from "./KeywordTable";

interface Cluster {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clusters: Cluster[];
  editing: KeywordRow | null;
  onSaved: () => void;
}

export function KeywordFormDialog({ open, onClose, clientId, clusters, editing, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    term: "",
    intent: "informational",
    search_volume: "",
    difficulty: "",
    cpc: "",
    current_position: "",
    target_url: "",
    status: "target",
    cluster_id: "",
    tags: "",
    notes: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        term: editing.term,
        intent: editing.intent || "informational",
        search_volume: editing.search_volume?.toString() || "",
        difficulty: editing.difficulty?.toString() || "",
        cpc: editing.cpc?.toString() || "",
        current_position: editing.current_position?.toString() || "",
        target_url: editing.target_url || "",
        status: editing.status,
        cluster_id: editing.cluster_id || "",
        tags: (editing.tags || []).join(", "),
        notes: (editing as any).notes || "",
      });
    } else {
      setForm({
        term: "",
        intent: "informational",
        search_volume: "",
        difficulty: "",
        cpc: "",
        current_position: "",
        target_url: "",
        status: "target",
        cluster_id: "",
        tags: "",
        notes: "",
      });
    }
  }, [editing, open]);

  const save = async () => {
    if (!form.term.trim()) {
      toast({ variant: "destructive", title: "Termo é obrigatório" });
      return;
    }
    if (!clientId) {
      toast({ variant: "destructive", title: "Selecione um cliente" });
      return;
    }
    setSaving(true);
    try {
      const num = (v: string) => (v.trim() ? Number(v.replace(",", ".")) : null);
      const intNum = (v: string) => (v.trim() ? parseInt(v, 10) : null);
      const payload: Record<string, unknown> = {
        client_id: clientId,
        term: form.term.trim(),
        intent: form.intent,
        search_volume: intNum(form.search_volume),
        difficulty: intNum(form.difficulty),
        cpc: num(form.cpc),
        current_position: intNum(form.current_position),
        target_url: form.target_url.trim() || null,
        status: form.status,
        cluster_id: form.cluster_id || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: form.notes.trim() || null,
      };

      if (editing) {
        const { error } = await supabase.from("keywords").update(payload).eq("id", editing.id);
        if (error) throw error;
        // If position changed, snapshot in history
        const newPos = payload.current_position as number | null;
        if (newPos != null && newPos !== editing.current_position) {
          await supabase.from("keyword_rankings").insert({
            keyword_id: editing.id,
            client_id: clientId,
            position: newPos,
            source: "manual",
          });
        }
        toast({ title: "Palavra-chave atualizada" });
      } else {
        const { data, error } = await supabase.from("keywords").insert(payload as any).select("id").single();
        if (error) throw error;
        // Snapshot initial position
        if (payload.current_position != null && data) {
          await supabase.from("keyword_rankings").insert({
            keyword_id: data.id,
            client_id: clientId,
            position: payload.current_position as number,
            source: "manual",
          });
        }
        toast({ title: "Palavra-chave criada" });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar palavra-chave" : "Nova palavra-chave"}</DialogTitle>
          <DialogDescription>
            Defina termo, intenção e métricas SEO. URL alvo e cluster são opcionais.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="term">Termo *</Label>
            <Input id="term" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="consultoria de tráfego pago" />
          </div>

          <div className="space-y-1.5">
            <Label>Intenção</Label>
            <Select value={form.intent} onValueChange={(v) => setForm({ ...form, intent: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(intentLabels).map(([k, l]) => (
                  <SelectItem key={k} value={k}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(keywordStatusLabels).map(([k, l]) => (
                  <SelectItem key={k} value={k}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vol">Volume mensal</Label>
            <Input id="vol" type="number" value={form.search_volume} onChange={(e) => setForm({ ...form, search_volume: e.target.value })} placeholder="1900" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dif">Dificuldade (0-100)</Label>
            <Input id="dif" type="number" min={0} max={100} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} placeholder="42" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpc">CPC (R$)</Label>
            <Input id="cpc" value={form.cpc} onChange={(e) => setForm({ ...form, cpc: e.target.value })} placeholder="7.50" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pos">Posição atual (#)</Label>
            <Input id="pos" type="number" min={1} max={200} value={form.current_position} onChange={(e) => setForm({ ...form, current_position: e.target.value })} placeholder="7" />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="url">URL alvo</Label>
            <Input id="url" value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} placeholder="https://site.com/servicos/trafego" />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label>Cluster / pillar</Label>
            <Select value={form.cluster_id || "__none"} onValueChange={(v) => setForm({ ...form, cluster_id: v === "__none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Sem cluster" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Sem cluster</SelectItem>
                {clusters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="BR, mobile, local" />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}