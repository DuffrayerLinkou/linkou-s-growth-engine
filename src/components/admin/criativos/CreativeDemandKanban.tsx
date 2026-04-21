import { Badge } from "@/components/ui/badge";
import { demandStatusConfig, priorityConfig, type DemandStatus, type Priority } from "@/lib/creative-config";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface Demand {
  id: string;
  client_id: string;
  title: string;
  platform: string | null;
  format: string | null;
  deadline: string | null;
  priority: Priority;
  status: DemandStatus;
  created_at: string;
}

interface Props {
  demands: Demand[];
  clientNames: Record<string, string>;
  onSelect: (d: Demand) => void;
}

const COLUMNS: DemandStatus[] = ["briefing", "in_production", "in_approval", "adjustments", "approved", "delivered"];

export function CreativeDemandKanban({ demands, clientNames, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {COLUMNS.map((col) => {
        const items = demands.filter((d) => d.status === col);
        const cfg = demandStatusConfig[col];
        return (
          <div key={col} className="flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold uppercase tracking-wider">{cfg.label}</p>
              <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[200px] rounded-lg bg-muted/30 p-2">
              {items.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onSelect(d)}
                  className="w-full text-left rounded-lg border bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 truncate">
                    {clientNames[d.client_id] || "Cliente"}
                  </p>
                  <h4 className="text-sm font-semibold line-clamp-2 mb-2">{d.title}</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className={`text-[9px] ${priorityConfig[d.priority].color}`}>
                      {priorityConfig[d.priority].label}
                    </Badge>
                    {d.deadline && (
                      <Badge variant="outline" className="text-[9px] gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {format(new Date(d.deadline), "dd/MM")}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
              {items.length === 0 && (
                <p className="text-[11px] text-center text-muted-foreground/60 py-4 italic">vazio</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}