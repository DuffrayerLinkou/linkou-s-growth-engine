import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Plus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { KeywordRow } from "./KeywordTable";
import { positionColor } from "@/lib/keyword-config";

interface RankingRow {
  id: string;
  position: number;
  checked_at: string;
  source: string;
  notes: string | null;
}

interface Props {
  keyword: KeywordRow | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function KeywordDetailDialog({ keyword, open, onClose, onUpdated }: Props) {
  const { toast } = useToast();
  const [rankings, setRankings] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPos, setNewPos] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!keyword || !open) return;
    setLoading(true);
    supabase
      .from("keyword_rankings")
      .select("id, position, checked_at, source, notes")
      .eq("keyword_id", keyword.id)
      .order("checked_at", { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (!error && data) setRankings(data as RankingRow[]);
        setLoading(false);
      });
  }, [keyword, open]);

  const recordRanking = async () => {
    if (!keyword) return;
    const pos = parseInt(newPos, 10);
    if (Number.isNaN(pos) || pos < 1 || pos > 200) {
      toast({ variant: "destructive", title: "Posição inválida", description: "Use um número entre 1 e 200." });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("keyword_rankings").insert({
        keyword_id: keyword.id,
        client_id: (keyword as any).client_id,
        position: pos,
        source: "manual",
      });
      if (error) throw error;
      // Update current_position on the keyword as latest snapshot
      await supabase.from("keywords").update({ current_position: pos }).eq("id", keyword.id);
      toast({ title: "Posição registrada", description: `#${pos} salva no histórico.` });
      setNewPos("");
      // refresh rankings
      const { data } = await supabase
        .from("keyword_rankings")
        .select("id, position, checked_at, source, notes")
        .eq("keyword_id", keyword.id)
        .order("checked_at", { ascending: false })
        .limit(60);
      if (data) setRankings(data as RankingRow[]);
      onUpdated();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (!keyword) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{keyword.term}</DialogTitle>
          <DialogDescription>
            Histórico de posição e métricas SEO desta palavra-chave.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
          <Stat label="Posição atual" value={keyword.current_position != null ? `#${keyword.current_position}` : "—"} colorClass={positionColor(keyword.current_position)} />
          <Stat label="Volume" value={keyword.search_volume?.toLocaleString("pt-BR") || "—"} />
          <Stat label="Dificuldade" value={keyword.difficulty != null ? String(keyword.difficulty) : "—"} />
          <Stat label="CPC" value={keyword.cpc != null ? `R$${Number(keyword.cpc).toFixed(2)}` : "—"} />
        </div>

        {keyword.tags && keyword.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {keyword.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        )}

        <div className="border rounded-md p-3 bg-muted/30">
          <Label className="text-xs">Registrar nova posição</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              type="number"
              min={1}
              max={200}
              placeholder="Ex: 7"
              value={newPos}
              onChange={(e) => setNewPos(e.target.value)}
              className="max-w-[120px]"
            />
            <Button onClick={recordRanking} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              Registrar
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Histórico</h4>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rankings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum ponto histórico registrado ainda.
            </p>
          ) : (
            <div className="space-y-1 max-h-[260px] overflow-y-auto">
              {rankings.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(r.checked_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
                    <span className={`tabular-nums font-medium ${positionColor(r.position)}`}>#{r.position}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="border rounded-md p-2.5 bg-card">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-base font-semibold tabular-nums mt-0.5 ${colorClass || ""}`}>{value}</p>
    </div>
  );
}