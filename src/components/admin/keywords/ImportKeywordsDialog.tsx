import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onImported: () => void;
}

/**
 * Accepts CSV pasted from Semrush / Ahrefs / Ubersuggest / Keyword Planner.
 * Expected columns (flexible):
 *   term[, volume[, difficulty[, cpc[, intent[, target_url]]]]]
 * Header row is auto-detected and skipped if present.
 */
export function ImportKeywordsDialog({ open, onClose, clientId, onImported }: Props) {
  const { toast } = useToast();
  const [csv, setCsv] = useState("");
  const [importing, setImporting] = useState(false);

  const parseAndImport = async () => {
    if (!clientId) {
      toast({ variant: "destructive", title: "Selecione um cliente antes de importar." });
      return;
    }
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      toast({ variant: "destructive", title: "Cole pelo menos uma linha." });
      return;
    }

    // Detect header
    const first = lines[0].toLowerCase();
    const hasHeader = /\b(term|keyword|palavra|volume|difficulty|cpc|intent|url)\b/.test(first);
    const data = hasHeader ? lines.slice(1) : lines;

    const rows = data.map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const [term, volume, difficulty, cpc, intent, targetUrl] = parts;
      const num = (v: string | undefined) => {
        if (!v) return null;
        const n = parseFloat(v.replace(/[^\d.,-]/g, "").replace(",", "."));
        return Number.isNaN(n) ? null : n;
      };
      return {
        client_id: clientId,
        term: term?.replace(/^["']|["']$/g, "") || "",
        search_volume: volume ? Math.round(num(volume) || 0) || null : null,
        difficulty: difficulty ? Math.round(num(difficulty) || 0) || null : null,
        cpc: num(cpc || ""),
        intent: intent?.toLowerCase() || "informational",
        target_url: targetUrl || null,
        status: "target",
      };
    }).filter((r) => r.term.length > 0);

    if (rows.length === 0) {
      toast({ variant: "destructive", title: "Nenhuma palavra-chave válida encontrada." });
      return;
    }

    setImporting(true);
    try {
      const { error } = await supabase.from("keywords").insert(rows);
      if (error) throw error;
      toast({ title: `${rows.length} palavras-chave importadas` });
      setCsv("");
      onImported();
      onClose();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao importar", description: e.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar palavras-chave</DialogTitle>
          <DialogDescription>
            Cole linhas no formato: <code className="text-xs bg-muted px-1 py-0.5 rounded">termo, volume, dificuldade, cpc, intenção, url</code>
            <br />
            Funciona com export do Semrush, Ahrefs, Ubersuggest, Keyword Planner. Aceita vírgula, ponto e vírgula ou TAB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="csv">CSV / TSV</Label>
          <Textarea
            id="csv"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={"consultoria de tráfego, 1900, 42, 7.50, commercial, /servicos/trafego\nagência de tráfego pago, 880, 38, 6.20, commercial, /agencia"}
            rows={10}
            className="font-mono text-xs"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={parseAndImport} disabled={importing}>
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}