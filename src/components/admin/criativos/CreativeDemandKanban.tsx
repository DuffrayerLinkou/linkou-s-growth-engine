import { Badge } from "@/components/ui/badge";
import { demandStatusConfig, priorityConfig, type DemandStatus, type Priority } from "@/lib/creative-config";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { CreativeDemandActions } from "./CreativeDemandActions";
import { parseDateOnly } from "@/lib/utils";

type Demand = {
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
};

interface Props {
  demands: Demand[];
  clientNames: Record<string, string>;
  onSelect: (d: Demand) => void;
  clients: { id: string; name: string }[];
}

const COLUMNS: DemandStatus[] = ["briefing", "in_production", "in_approval", "adjustments", "approved", "delivered"];

export function CreativeDemandKanban({ demands, clientNames, onSelect, clients }: Props) {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-6 xl:overflow-visible xl:px-0 xl:mx-0">
      {COLUMNS.map((col) => {
        const items = demands.filter((d) => d.status === col);
        const cfg = demandStatusConfig[col];
        return (
          <div key={col} className="flex flex-col flex-shrink-0 w-[240px] sm:w-[260px] xl:w-auto">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold uppercase tracking-wider truncate">{cfg.label}</p>
              <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{items.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[200px] rounded-lg bg-muted/30 p-2">
              {items.map((d) => (
                <div
                  key={d.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(d)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(d); } }}
                  className="group relative w-full text-left rounded-lg border bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate flex-1">
                      {clientNames[d.client_id] || "Cliente"}
                    </p>
                    <CreativeDemandActions
                      demand={d}
                      clients={clients}
                      onOpen={() => onSelect(d)}
                    />
                  </div>
                  <h4 className="text-sm font-semibold line-clamp-2 mb-2">{d.title}</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className={`text-[9px] ${priorityConfig[d.priority].color}`}>
                      {priorityConfig[d.priority].label}
                    </Badge>
                    {d.deadline && (
                      <Badge variant="outline" className="text-[9px] gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {format((parseDateOnly(d.deadline) ?? new Date(0)), "dd/MM")}
                      </Badge>
                    )}
                  </div>
                </div>
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