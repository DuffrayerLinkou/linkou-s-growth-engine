import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { platformOptions, formatOptions, type Priority } from "@/lib/creative-config";
import { Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreativeDemandDialog({ open, onOpenChange }: Props) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [briefing, setBriefing] = useState("");
  const [objective, setObjective] = useState("");
  const [platform, setPlatform] = useState("");
  const [format, setFormat] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const reset = () => {
    setTitle("");
    setBriefing("");
    setObjective("");
    setPlatform("");
    setFormat("");
    setDeadline("");
    setPriority("medium");
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!profile?.client_id || !user?.id) throw new Error("Dados insuficientes");
      const { error } = await supabase.from("creative_demands").insert({
        client_id: profile.client_id,
        title,
        briefing: briefing || null,
        objective: objective || null,
        platform: platform || null,
        format: format || null,
        deadline: deadline || null,
        priority,
        status: "briefing",
        requested_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Demanda enviada", description: "Sua solicitação foi registrada." });
      qc.invalidateQueries({ queryKey: ["creative-demands"] });
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Nova Demanda Criativa
          </DialogTitle>
          <DialogDescription>
            Descreva o que você precisa. Quanto mais detalhado, mais rápido entregamos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Vídeo institucional de lançamento do produto X"
            />
          </div>

          <div>
            <Label htmlFor="objective">Objetivo</Label>
            <Input
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="O que essa peça precisa atingir?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plataforma</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {platformOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Formato</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {formatOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="deadline">Prazo desejado</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="briefing">Briefing detalhado</Label>
            <Textarea
              id="briefing"
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder="Contexto, público, tom de voz, referências, copy bruta, links úteis…"
              rows={6}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!title.trim() || create.isPending}
          >
            {create.isPending ? "Enviando..." : "Enviar demanda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}