import { useState } from "react";
import { Pencil, Trash2, ExternalLink, History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MiniSparkline } from "./MiniSparkline";
import {
  intentLabels,
  intentColors,
  keywordStatusLabels,
  keywordStatusColors,
  difficultyColor,
  positionColor,
} from "@/lib/keyword-config";

export interface KeywordRow {
  id: string;
  term: string;
  intent: string | null;
  search_volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  current_position: number | null;
  target_url: string | null;
  status: string;
  cluster_id: string | null;
  cluster_name?: string | null;
  history?: number[];
  tags?: string[];
}

interface Props {
  keywords: KeywordRow[];
  onEdit: (k: KeywordRow) => void;
  onDelete: (k: KeywordRow) => void;
  onViewHistory: (k: KeywordRow) => void;
}

export function KeywordTable({ keywords, onEdit, onDelete, onViewHistory }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (keywords.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Nenhuma palavra-chave encontrada com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Termo</TableHead>
            <TableHead>Intenção</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Dificuldade</TableHead>
            <TableHead className="text-right">CPC</TableHead>
            <TableHead className="text-right">Posição</TableHead>
            <TableHead>Evolução</TableHead>
            <TableHead>Cluster</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[1%]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.map((k) => (
            <TableRow
              key={k.id}
              onMouseEnter={() => setHovered(k.id)}
              onMouseLeave={() => setHovered(null)}
              className="group"
            >
              <TableCell className="font-medium">
                <div className="flex flex-col gap-0.5">
                  <span>{k.term}</span>
                  {k.target_url && (
                    <a
                      href={k.target_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1 truncate max-w-[260px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{k.target_url.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {k.intent ? (
                  <Badge variant="outline" className={intentColors[k.intent] || ""}>
                    {intentLabels[k.intent] || k.intent}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {k.search_volume?.toLocaleString("pt-BR") || "—"}
              </TableCell>
              <TableCell className={`text-right tabular-nums ${difficultyColor(k.difficulty)}`}>
                {k.difficulty != null ? k.difficulty : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {k.cpc != null
                  ? `R$${Number(k.cpc).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"}
              </TableCell>
              <TableCell className={`text-right tabular-nums ${positionColor(k.current_position)}`}>
                {k.current_position != null ? `#${k.current_position}` : "—"}
              </TableCell>
              <TableCell>
                <MiniSparkline data={k.history || []} />
              </TableCell>
              <TableCell>
                {k.cluster_name ? (
                  <span className="text-xs text-muted-foreground">{k.cluster_name}</span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={keywordStatusColors[k.status] || ""}>
                  {keywordStatusLabels[k.status] || k.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className={`flex items-center gap-1 ${hovered === k.id ? "opacity-100" : "opacity-0 lg:opacity-60"} transition-opacity`}>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onViewHistory(k)} title="Histórico de posição">
                    <History className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(k)} title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(k)} title="Excluir">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}