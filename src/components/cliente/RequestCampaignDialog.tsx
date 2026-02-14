import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function RequestCampaignDialog() {
  const { clientInfo, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [desiredDate, setDesiredDate] = useState("");

  // Fetch client's first project to satisfy NOT NULL constraint
  const { data: defaultProject } = useQuery({
    queryKey: ["client-projects-default", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return null;
      const { data } = await supabase
        .from("projects")
        .select("id")
        .eq("client_id", clientInfo.id)
        .limit(1)
        .single();
      return data;
    },
    enabled: !!clientInfo?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!clientInfo?.id || !user?.id || !defaultProject?.id)
        throw new Error("Dados do cliente ou projeto não encontrados");

      const { error } = await supabase.from("campaigns").insert({
        name,
        objective: objective || null,
        description: description || null,
        strategy: targetAudience ? `Público-alvo: ${targetAudience}` : null,
        start_date: desiredDate || null,
        client_id: clientInfo.id,
        project_id: defaultProject.id,
        created_by: user.id,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-campaigns"] });
      toast({ title: "Solicitação enviada!", description: "Sua solicitação de campanha foi criada. A equipe irá complementar os detalhes técnicos." });
      resetForm();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao solicitar campanha", description: error.message });
    },
  });

  const resetForm = () => {
    setOpen(false);
    setName("");
    setObjective("");
    setDescription("");
    setTargetAudience("");
    setDesiredDate("");
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" disabled={!defaultProject}>
        <Plus className="h-4 w-4 mr-2" />
        Solicitar Campanha
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar Campanha</DialogTitle>
            <DialogDescription>
              Descreva sua ideia de campanha. A equipe técnica complementará os detalhes de plataforma, orçamento e segmentação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="camp-name">Nome da campanha *</Label>
              <Input
                id="camp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Campanha de Leads Janeiro"
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Gerar Leads</SelectItem>
                  <SelectItem value="vendas">Vendas / Conversões</SelectItem>
                  <SelectItem value="reconhecimento">Reconhecimento de Marca</SelectItem>
                  <SelectItem value="engajamento">Engajamento</SelectItem>
                  <SelectItem value="trafego">Tráfego para Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-desc">Mensagem principal / Briefing</Label>
              <Textarea
                id="camp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a ideia, mensagem ou oferta principal da campanha..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-audience">Público-alvo</Label>
              <Textarea
                id="camp-audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Descreva o público que deseja atingir..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-date">Prazo desejado para início</Label>
              <Input
                id="camp-date"
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
