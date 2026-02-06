import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Archive, Trash2, Mail, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadQuickActions } from "./LeadQuickActions";
import { LeadActivityTimeline } from "./LeadActivityTimeline";
import { LeadFollowUpForm } from "./LeadFollowUpForm";
import {
  leadStatusLabels as statusLabels,
  leadStatusColors as statusColors,
} from "@/lib/status-config";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string | null;
  investment: string | null;
  objective: string | null;
  status: string | null;
  source: string | null;
  created_at: string;
}

interface LeadDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onStatusChange: (leadId: string, status: string) => void;
  onConvert: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onLeadUpdated: (lead: Lead) => void;
}

export function LeadDetailDialog({
  open,
  onOpenChange,
  lead,
  onStatusChange,
  onConvert,
  onDelete,
  onLeadUpdated,
}: LeadDetailDialogProps) {
  const [activityRefresh, setActivityRefresh] = useState(0);

  if (!lead) return null;

  const handleActivityLogged = () => {
    setActivityRefresh((p) => p + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-lg">{lead.name}</DialogTitle>
            <Badge variant="secondary" className={statusColors[lead.status || "new"]}>
              {statusLabels[lead.status || "new"]}
            </Badge>
          </div>
        </DialogHeader>

        {/* Status selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={lead.status || "new"}
            onValueChange={(value) => {
              onStatusChange(lead.id, value);
              onLeadUpdated({ ...lead, status: value });
            }}
          >
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <LeadQuickActions lead={lead} onActivityLogged={handleActivityLogged} />

        {/* Tabs */}
        <Tabs defaultValue="activities" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="activities" className="flex-1 text-xs">Atividades</TabsTrigger>
            <TabsTrigger value="followups" className="flex-1 text-xs">Follow-ups</TabsTrigger>
            <TabsTrigger value="data" className="flex-1 text-xs">Dados</TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="mt-3">
            <LeadActivityTimeline leadId={lead.id} refreshKey={activityRefresh} />
          </TabsContent>

          <TabsContent value="followups" className="mt-3">
            <LeadFollowUpForm leadId={lead.id} refreshKey={activityRefresh} onCreated={handleActivityLogged} />
          </TabsContent>

          <TabsContent value="data" className="mt-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                    {lead.email}
                  </a>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.phone}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Segmento</span>
                  <p className="font-medium">{lead.segment || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Investimento</span>
                  <p className="font-medium">{lead.investment || "-"}</p>
                </div>
              </div>

              {lead.objective && (
                <div>
                  <span className="text-sm text-muted-foreground">Objetivo</span>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{lead.objective}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground border-t pt-3">
                Capturado em{" "}
                {format(new Date(lead.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                {lead.source && ` via ${lead.source}`}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom Actions */}
        <div className="border-t pt-3 space-y-2 mt-2">
          {lead.status !== "converted" && lead.status !== "archived" && (
            <div className="flex gap-2">
              <Button className="flex-1" size="sm" onClick={() => onConvert(lead)}>
                <Building2 className="h-4 w-4 mr-1.5" />
                Converter em Cliente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onStatusChange(lead.id, "archived");
                  onLeadUpdated({ ...lead, status: "archived" });
                }}
              >
                <Archive className="h-4 w-4 mr-1.5" />
                Arquivar
              </Button>
            </div>
          )}
          {lead.status === "converted" && (
            <div className="p-3 bg-primary/10 text-primary rounded-lg text-center text-sm font-medium">
              Este lead já foi convertido em cliente
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(lead)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Excluir Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
