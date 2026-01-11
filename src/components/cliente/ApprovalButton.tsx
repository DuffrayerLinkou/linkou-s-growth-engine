import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ApprovalButtonProps {
  entityType: "campaign" | "learning";
  entityId: string;
  clientId: string;
  isApproved: boolean;
  approvedAt?: string | null;
  approvedByName?: string | null;
  onApprovalChange?: () => void;
}

export function ApprovalButton({
  entityType,
  entityId,
  clientId,
  isApproved,
  approvedAt,
  approvedByName,
  onApprovalChange,
}: ApprovalButtonProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Check if user is ponto focal
  const { data: isPontoFocal = false } = useQuery({
    queryKey: ["is-ponto-focal", profile?.id, clientId],
    queryFn: async () => {
      if (!profile?.id || !clientId) return false;
      const { data, error } = await supabase.rpc("is_ponto_focal", {
        _user_id: profile.id,
        _client_id: clientId,
      });
      if (error) return false;
      return data as boolean;
    },
    enabled: !!profile?.id && !!clientId,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const table = entityType === "campaign" ? "campaigns" : "learnings";
      const { error } = await supabase
        .from(table)
        .update({
          approved_by_ponto_focal: true,
          approved_at: new Date().toISOString(),
          approved_by: profile?.id,
          // Quando campanha é aprovada pelo ponto focal, muda status para "running"
          ...(entityType === "campaign" ? { status: "running" } : {}),
        })
        .eq("id", entityId);

      if (error) throw error;

      // Log the approval
      await supabase.from("audit_logs").insert({
        user_id: profile?.id,
        client_id: clientId,
        action: `${entityType}_approved`,
        entity_type: table,
        entity_id: entityId,
        new_data: { approved_by_ponto_focal: true },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityType === "campaign" ? "campaigns" : "learnings"] });
      queryClient.invalidateQueries({ queryKey: ["client-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["client-learnings"] });
      toast.success(
        entityType === "campaign"
          ? "Campanha aprovada com sucesso!"
          : "Aprendizado aprovado com sucesso!"
      );
      setOpen(false);
      onApprovalChange?.();
    },
    onError: () => {
      toast.error("Erro ao aprovar");
    },
  });

  if (isApproved) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>
        {approvedAt && (
          <span className="text-xs text-muted-foreground">
            em {format(new Date(approvedAt), "dd/MM/yyyy", { locale: ptBR })}
            {approvedByName && ` por ${approvedByName}`}
          </span>
        )}
      </div>
    );
  }

  if (!isPontoFocal) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Shield className="h-3 w-3 mr-1" />
        Aguardando aprovação
      </Badge>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Aprovar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Aprovação</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a aprovar {entityType === "campaign" ? "esta campanha" : "este aprendizado"}. Esta ação
            não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Confirmar Aprovação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
