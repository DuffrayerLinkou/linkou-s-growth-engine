import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, MessageCircle, Mail, StickyNote, ArrowRightLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  type: string;
  description: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  note: StickyNote,
  status_change: ArrowRightLeft,
};

const typeLabels: Record<string, string> = {
  call: "Ligação",
  whatsapp: "WhatsApp",
  email: "Email",
  note: "Nota",
  status_change: "Mudança de status",
};

const typeColors: Record<string, string> = {
  call: "text-blue-500 bg-blue-500/10",
  whatsapp: "text-green-500 bg-green-500/10",
  email: "text-orange-500 bg-orange-500/10",
  note: "text-yellow-500 bg-yellow-500/10",
  status_change: "text-purple-500 bg-purple-500/10",
};

interface LeadActivityTimelineProps {
  leadId: string;
  refreshKey: number;
}

export function LeadActivityTimeline({ leadId, refreshKey }: LeadActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setActivities((data as Activity[]) || []);
        setIsLoading(false);
      });
  }, [leadId, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Nenhuma atividade registrada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = typeIcons[activity.type] || StickyNote;
        const colorClass = typeColors[activity.type] || "text-muted-foreground bg-muted";

        return (
          <div key={activity.id} className="flex gap-3 items-start">
            <div className={`rounded-full p-1.5 mt-0.5 flex-shrink-0 ${colorClass}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{typeLabels[activity.type] || activity.type}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5 break-words">
                  {activity.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
