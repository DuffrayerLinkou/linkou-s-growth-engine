import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClientPermissions } from "@/hooks/useClientPermissions";
import { toast } from "@/hooks/use-toast";
import { deliverableStatusConfig, deliverableTypeConfig, type DeliverableStatus, type DeliverableType } from "@/lib/creative-config";
import { CheckCircle2, MessageSquareWarning, History, Download } from "lucide-react";
import { format } from "date-fns";

interface Deliverable {
  id: string;
  client_id: string;
  title: string;
  type: DeliverableType;
  content: string | null;
  current_version: number;
  status: DeliverableStatus;
  approved_by_ponto_focal: boolean;
  feedback: string | null;
}

interface Props {
  deliverable: Deliverable;
}

export function CreativeDeliverableViewer({ deliverable }: Props) {
  const { user } = useAuth();
  const { canApprove, isPontoFocal } = useClientPermissions();
  const qc = useQueryClient();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const typeCfg = deliverableTypeConfig[deliverable.type];
  const statusCfg = deliverableStatusConfig[deliverable.status];
  const Icon = typeCfg.icon;

  const { data: versions } = useQuery({
    queryKey: ["deliverable-versions", deliverable.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_deliverable_versions")
        .select("*")
        .eq("deliverable_id", deliverable.id)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: historyOpen,
  });

  const currentVersion = versions?.find((v) => v.version_number === deliverable.current_version);

  const approve = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("creative_deliverables")
        .update({
          approved_by_ponto_focal: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          status: "approved",
        })
        .eq("id", deliverable.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Aprovado!", description: "O entregável foi aprovado." });
      qc.invalidateQueries({ queryKey: ["creative-demands"] });
      qc.invalidateQueries({ queryKey: ["creative-deliverables"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const requestAdjustment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("creative_deliverables")
        .update({ status: "adjustments", feedback: feedbackText })
        .eq("id", deliverable.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Ajustes solicitados", description: "Time interno foi notificado." });
      qc.invalidateQueries({ queryKey: ["creative-demands"] });
      qc.invalidateQueries({ queryKey: ["creative-deliverables"] });
      setAdjustOpen(false);
      setFeedbackText("");
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const isPreviewable = deliverable.status === "in_approval" || deliverable.status === "approved" || deliverable.status === "delivered";

  const renderPreview = (fileUrl: string | null, content: string | null) => {
    if (deliverable.type === "video" && fileUrl) {
      return <video src={fileUrl} controls className="w-full rounded-lg max-h-96 bg-black" />;
    }
    if (deliverable.type === "image" && fileUrl) {
      return <img src={fileUrl} alt={deliverable.title} className="w-full rounded-lg max-h-96 object-contain bg-muted" />;
    }
    if (content) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm">
          {content}
        </div>
      );
    }
    return <p className="text-sm text-muted-foreground italic">Nenhum conteúdo ainda.</p>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{deliverable.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{typeCfg.label} · v{deliverable.current_version}</p>
              </div>
            </div>
            <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPreviewable ? (
            renderPreview(currentVersion?.file_url ?? null, deliverable.content)
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Aguardando produção. Você poderá visualizar quando estiver pronto para aprovação.
            </p>
          )}

          {deliverable.feedback && deliverable.status === "adjustments" && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-sm">
              <p className="font-medium text-orange-600 dark:text-orange-400 mb-1">Feedback enviado:</p>
              <p className="text-foreground/80">{deliverable.feedback}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4" /> Histórico
            </Button>
            {currentVersion?.file_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={currentVersion.file_url} target="_blank" rel="noreferrer" download>
                  <Download className="h-4 w-4" /> Baixar
                </a>
              </Button>
            )}
            {deliverable.status === "in_approval" && canApprove && (
              <>
                <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending}>
                  <CheckCircle2 className="h-4 w-4" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAdjustOpen(true)}>
                  <MessageSquareWarning className="h-4 w-4" /> Solicitar ajustes
                </Button>
              </>
            )}
            {deliverable.status === "in_approval" && !canApprove && (
              <p className="text-xs text-muted-foreground">
                Apenas o Ponto Focal ou o Gestor podem aprovar este entregável.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar ajustes</DialogTitle>
          </DialogHeader>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={5}
            placeholder="Descreva com clareza os ajustes necessários…"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjustOpen(false)}>Cancelar</Button>
            <Button onClick={() => requestAdjustment.mutate()} disabled={!feedbackText.trim() || requestAdjustment.isPending}>
              Enviar feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Histórico de versões</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {versions?.length === 0 && <p className="text-sm text-muted-foreground">Sem versões ainda.</p>}
            {versions?.map((v) => (
              <div key={v.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Versão {v.version_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(v.created_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
                {v.notes && <p className="text-xs text-muted-foreground italic mb-2">{v.notes}</p>}
                {v.content && <p className="text-sm whitespace-pre-wrap line-clamp-4">{v.content}</p>}
                {v.file_url && (
                  <Button variant="link" size="sm" className="px-0" asChild>
                    <a href={v.file_url} target="_blank" rel="noreferrer">Ver arquivo</a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}