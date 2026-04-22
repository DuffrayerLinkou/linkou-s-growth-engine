import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { deliverableStatusConfig, deliverableTypeConfig, type DeliverableStatus, type DeliverableType } from "@/lib/creative-config";
import { Send, Upload, History, Loader2, MessageSquare, MoreVertical, Copy, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

interface Deliverable {
  id: string;
  client_id: string;
  demand_id: string;
  title: string;
  type: DeliverableType;
  content: string | null;
  current_version: number;
  status: DeliverableStatus;
  feedback: string | null;
}

interface Props {
  deliverable: Deliverable;
}

export function CreativeDeliverableEditor({ deliverable }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState(deliverable.content || "");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const typeCfg = deliverableTypeConfig[deliverable.type];
  const statusCfg = deliverableStatusConfig[deliverable.status];
  const Icon = typeCfg.icon;

  const { data: versions } = useQuery({
    queryKey: ["deliverable-versions-admin", deliverable.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_deliverable_versions")
        .select("*")
        .eq("deliverable_id", deliverable.id)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveVersion = useMutation({
    mutationFn: async ({ filePath, fileUrl }: { filePath?: string; fileUrl?: string }) => {
      const newVersion = deliverable.current_version + (versions && versions.length > 0 ? 1 : 0);
      const versionToCreate = versions && versions.length > 0 ? deliverable.current_version + 1 : 1;

      const { error: vErr } = await supabase.from("creative_deliverable_versions").insert({
        deliverable_id: deliverable.id,
        client_id: deliverable.client_id,
        version_number: versionToCreate,
        content: content || null,
        file_path: filePath || null,
        file_url: fileUrl || null,
        notes: notes || null,
        created_by: user?.id,
      });
      if (vErr) throw vErr;

      const { error: dErr } = await supabase
        .from("creative_deliverables")
        .update({ content: content || null, current_version: versionToCreate })
        .eq("id", deliverable.id);
      if (dErr) throw dErr;
    },
    onSuccess: () => {
      toast({ title: "Versão salva", description: "Nova versão registrada." });
      qc.invalidateQueries({ queryKey: ["deliverable-versions-admin", deliverable.id] });
      qc.invalidateQueries({ queryKey: ["admin-creative-deliverables"] });
      setNotes("");
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const sendForApproval = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("creative_deliverables")
        .update({ status: "in_approval" })
        .eq("id", deliverable.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Enviado para aprovação", description: "O Ponto Focal será notificado." });
      qc.invalidateQueries({ queryKey: ["admin-creative-deliverables"] });
      qc.invalidateQueries({ queryKey: ["admin-creative-demands"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const duplicateDeliverable = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("creative_deliverables").insert({
        demand_id: deliverable.demand_id,
        client_id: deliverable.client_id,
        type: deliverable.type,
        title: `${deliverable.title} (cópia)`,
        content: deliverable.content,
        status: "in_production",
        current_version: 1,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Entregável duplicado" });
      qc.invalidateQueries({ queryKey: ["admin-creative-deliverables", deliverable.demand_id] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeDeliverable = useMutation({
    mutationFn: async () => {
      await supabase
        .from("creative_deliverable_versions")
        .delete()
        .eq("deliverable_id", deliverable.id);
      const { error } = await supabase
        .from("creative_deliverables")
        .delete()
        .eq("id", deliverable.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Entregável apagado" });
      qc.invalidateQueries({ queryKey: ["admin-creative-deliverables", deliverable.demand_id] });
      setDeleteOpen(false);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `creative-deliverables/${deliverable.client_id}/${deliverable.id}/v${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("client-files").upload(path, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("client-files").createSignedUrl
        ? await supabase.storage.from("client-files").createSignedUrl(path, 60 * 60 * 24 * 365)
        : { data: { signedUrl: "" } };
      await saveVersion.mutateAsync({ filePath: path, fileUrl: urlData?.signedUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no upload";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
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
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Ações do entregável">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => duplicateDeliverable.mutate()} disabled={duplicateDeliverable.isPending}>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {deliverable.feedback && deliverable.status === "adjustments" && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-sm">
            <p className="font-medium text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> Feedback do cliente
            </p>
            <p className="text-foreground/80">{deliverable.feedback}</p>
          </div>
        )}

        {(deliverable.type === "video_copy" || deliverable.type === "static_copy") && (
          <div>
            <Label htmlFor={`content-${deliverable.id}`}>Conteúdo</Label>
            <Textarea
              id={`content-${deliverable.id}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Roteiro, copy, headline, CTA…"
            />
          </div>
        )}

        <div>
          <Label htmlFor={`notes-${deliverable.id}`}>Notas da versão (opcional)</Label>
          <Input
            id={`notes-${deliverable.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="O que mudou nesta versão?"
          />
        </div>

        <input ref={fileInputRef} type="file" hidden onChange={handleUpload} />

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveVersion.mutate({})}
            disabled={saveVersion.isPending || (!content.trim() && !notes.trim())}
          >
            {saveVersion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
            Salvar versão
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload de arquivo
          </Button>
          {deliverable.status !== "approved" && deliverable.status !== "delivered" && (
            <Button
              size="sm"
              onClick={() => sendForApproval.mutate()}
              disabled={sendForApproval.isPending || deliverable.status === "in_approval"}
            >
              <Send className="h-4 w-4" />
              {deliverable.status === "in_approval" ? "Aguardando aprovação" : "Enviar para aprovação"}
            </Button>
          )}
        </div>

        {versions && versions.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Versões ({versions.length})
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-xs rounded-md bg-muted/40 px-2 py-1.5">
                  <span>v{v.version_number} {v.notes && `· ${v.notes}`}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{format(new Date(v.created_at), "dd/MM HH:mm")}</span>
                    {v.file_url && (
                      <a href={v.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        ver
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar este entregável?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as versões salvas de <span className="font-medium">"{deliverable.title}"</span> serão apagadas.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); removeDeliverable.mutate(); }}
              disabled={removeDeliverable.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeDeliverable.isPending ? "Apagando…" : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}