import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { CalendarClock, Phone, MessageCircle, Mail, Check, X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FollowUp {
  id: string;
  scheduled_at: string;
  type: string;
  message: string | null;
  status: string;
  completed_at: string | null;
}

interface LeadFollowUpFormProps {
  leadId: string;
  refreshKey: number;
  onCreated: () => void;
}

const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
};

export function LeadFollowUpForm({ leadId, refreshKey, onCreated }: LeadFollowUpFormProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("whatsapp");
  const [formDate, setFormDate] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchFollowUps = () => {
    setIsLoading(true);
    supabase
      .from("lead_follow_ups")
      .select("*")
      .eq("lead_id", leadId)
      .order("scheduled_at", { ascending: true })
      .then(({ data }) => {
        setFollowUps((data as FollowUp[]) || []);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchFollowUps();
  }, [leadId, refreshKey]);

  const createFollowUp = async () => {
    if (!formDate) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from("lead_follow_ups") as any).insert({
        lead_id: leadId,
        scheduled_at: new Date(formDate).toISOString(),
        type: formType,
        message: formMessage || null,
        created_by: user?.id || null,
      });
      if (error) throw error;

      toast({ title: "Follow-up agendado!" });
      setShowForm(false);
      setFormDate("");
      setFormMessage("");
      fetchFollowUps();
      onCreated();
    } catch {
      toast({ variant: "destructive", title: "Erro ao agendar" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id: string, status: "completed" | "cancelled") => {
    const updates: Record<string, unknown> = { status };
    if (status === "completed") updates.completed_at = new Date().toISOString();

    await supabase.from("lead_follow_ups").update(updates).eq("id", id);
    fetchFollowUps();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing follow-ups */}
      {followUps.length > 0 ? (
        <div className="space-y-2">
          {followUps.map((fu) => {
            const Icon = typeIcons[fu.type] || CalendarClock;
            const isPast = new Date(fu.scheduled_at) < new Date() && fu.status === "pending";

            return (
              <div
                key={fu.id}
                className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                  fu.status === "completed" ? "opacity-50" : isPast ? "border-destructive/50 bg-destructive/5" : ""
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {format(new Date(fu.scheduled_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </span>
                    {isPast && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Atrasado</Badge>}
                    {fu.status === "completed" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Concluído</Badge>}
                    {fu.status === "cancelled" && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Cancelado</Badge>}
                  </div>
                  {fu.message && <p className="text-xs text-muted-foreground mt-0.5 truncate">{fu.message}</p>}
                </div>
                {fu.status === "pending" && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus(fu.id, "completed")}>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus(fu.id, "cancelled")}>
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Nenhum follow-up agendado.
        </div>
      )}

      {/* New follow-up form */}
      {showForm ? (
        <div className="space-y-3 p-3 border rounded-lg">
          <div className="flex gap-2">
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Ligação</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="flex-1"
            />
          </div>
          {formType === "whatsapp" && (
            <Textarea
              placeholder="Mensagem planejada (opcional)"
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              rows={2}
            />
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={createFollowUp} disabled={!formDate || isSaving}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Agendar
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Agendar Follow-up
        </Button>
      )}
    </div>
  );
}
