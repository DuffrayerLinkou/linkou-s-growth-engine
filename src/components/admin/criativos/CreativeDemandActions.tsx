import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { demandStatusConfig, type DemandStatus } from "@/lib/creative-config";
import { MoreVertical, Pencil, Copy, Trash2, ExternalLink, MoveRight } from "lucide-react";
import { CreativeDemandFormDialog, type DemandFormValue } from "./CreativeDemandFormDialog";

interface Props {
  demand: DemandFormValue;
  clients: { id: string; name: string }[];
  onOpen?: () => void;
  onDeleted?: () => void;
  /** Visual variant: ghost icon (kanban card) or default button */
  variant?: "icon" | "button";
  align?: "start" | "end";
}

export function CreativeDemandActions({
  demand,
  clients,
  onOpen,
  onDeleted,
  variant = "icon",
  align = "end",
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const move = useMutation({
    mutationFn: async (status: DemandStatus) => {
      const { error } = await supabase.from("creative_demands").update({ status }).eq("id", demand.id);
      if (error) throw error;
    },
    onSuccess: (_d, status) => {
      toast({ title: "Movido", description: `Demanda movida para "${demandStatusConfig[status].label}".` });
      qc.invalidateQueries({ queryKey: ["admin-creative-demands"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const duplicate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("creative_demands").insert({
        client_id: demand.client_id,
        title: `${demand.title} (cópia)`,
        objective: demand.objective,
        briefing: demand.briefing,
        platform: demand.platform,
        format: demand.format,
        deadline: demand.deadline,
        priority: demand.priority,
        status: "briefing",
        requested_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Demanda duplicada" });
      qc.invalidateQueries({ queryKey: ["admin-creative-demands"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      // Apaga versões → entregáveis → demanda (sem CASCADE no schema)
      const { data: dels } = await supabase
        .from("creative_deliverables")
        .select("id")
        .eq("demand_id", demand.id);
      const ids = (dels || []).map((d) => d.id);
      if (ids.length > 0) {
        await supabase.from("creative_deliverable_versions").delete().in("deliverable_id", ids);
        await supabase.from("creative_deliverables").delete().in("id", ids);
      }
      const { error } = await supabase.from("creative_demands").delete().eq("id", demand.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Demanda apagada" });
      qc.invalidateQueries({ queryKey: ["admin-creative-demands"] });
      setDeleteOpen(false);
      onDeleted?.();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div onClick={stop} onKeyDown={stop} className="inline-flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {variant === "icon" ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 sm:h-8 sm:w-8 -mr-1 -mt-1 text-muted-foreground hover:text-foreground"
                aria-label="Ações da demanda"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" variant="outline">
                <MoreVertical className="h-4 w-4" /> Ações
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align} className="w-52">
            <DropdownMenuLabel className="text-xs">Demanda</DropdownMenuLabel>
            {onOpen && (
              <DropdownMenuItem onClick={onOpen}>
                <ExternalLink className="h-4 w-4" /> Abrir
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <MoveRight className="h-4 w-4" /> Mover para
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {(Object.entries(demandStatusConfig) as [DemandStatus, typeof demandStatusConfig[DemandStatus]][]).map(
                  ([k, v]) => (
                    <DropdownMenuItem
                      key={k}
                      disabled={k === demand.status || move.isPending}
                      onClick={() => move.mutate(k)}
                    >
                      {v.label}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => duplicate.mutate()} disabled={duplicate.isPending}>
              <Copy className="h-4 w-4" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Apagar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreativeDemandFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        clients={clients}
        demand={demand}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={stop}>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar esta demanda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os entregáveis e versões vinculados a
              <span className="font-medium"> "{demand.title}" </span>
              também serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); remove.mutate(); }}
              disabled={remove.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending ? "Apagando…" : "Apagar definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}