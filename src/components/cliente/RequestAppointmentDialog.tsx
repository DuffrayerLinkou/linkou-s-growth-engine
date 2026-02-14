import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RequestAppointmentDialog() {
  const { clientInfo, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("meeting");
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!clientInfo?.id || !user?.id) throw new Error("Dados do cliente não encontrados");

      const { error } = await supabase.from("appointments").insert({
        title,
        type,
        appointment_date: new Date(dateTime).toISOString(),
        duration_minutes: parseInt(duration),
        description: description || null,
        client_id: clientInfo.id,
        created_by: user.id,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      toast({ title: "Reunião solicitada!", description: "Sua solicitação foi enviada. A equipe confirmará o horário." });
      resetForm();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao solicitar reunião", description: error.message });
    },
  });

  const resetForm = () => {
    setOpen(false);
    setTitle("");
    setType("meeting");
    setDateTime("");
    setDuration("60");
    setDescription("");
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Solicitar Reunião
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Reunião</DialogTitle>
            <DialogDescription>
              Sugira um horário para reunião. A equipe confirmará a disponibilidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apt-title">Título *</Label>
              <Input
                id="apt-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Alinhamento de campanha"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Alinhamento</SelectItem>
                    <SelectItem value="review">Revisão</SelectItem>
                    <SelectItem value="call">Dúvida</SelectItem>
                    <SelectItem value="training">Treinamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apt-datetime">Data e hora sugerida *</Label>
              <Input
                id="apt-datetime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apt-desc">Descrição</Label>
              <Textarea
                id="apt-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sobre o que gostaria de tratar..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!title.trim() || !dateTime || createMutation.isPending}
            >
              {createMutation.isPending ? "Enviando..." : "Solicitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
