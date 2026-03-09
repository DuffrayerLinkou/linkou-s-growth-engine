import { useState } from "react";
import { Bell, Send, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SendPushDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendPushDialog({ open, onOpenChange }: SendPushDialogProps) {
  const { session } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/admin");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Título e mensagem são obrigatórios");
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/send-push`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ title: title.trim(), body: body.trim(), url }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar notificações");
      }

      setLastResult(result);
      toast.success(`Notificações enviadas: ${result.sent} de ${result.total}`);

      if (result.sent > 0) {
        setTitle("");
        setBody("");
      }
    } catch (error) {
      console.error("Send push error:", error);
      toast.error(String(error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Enviar Notificação Push
          </DialogTitle>
          <DialogDescription>
            Envie uma notificação para todos os usuários com o app instalado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="push-title">Título *</Label>
            <Input
              id="push-title"
              placeholder="Ex: Nova atualização disponível"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground text-right">{title.length}/80</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-body">Mensagem *</Label>
            <Textarea
              id="push-body"
              placeholder="Ex: Acesse o painel para ver as novidades..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{body.length}/200</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-url">URL ao clicar</Label>
            <Input
              id="push-url"
              placeholder="/admin"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Rota interna (ex: /cliente) ou URL completa
            </p>
          </div>

          {lastResult && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                Enviado para <strong>{lastResult.sent}</strong> de{" "}
                <strong>{lastResult.total}</strong> dispositivos
                {lastResult.failed > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {lastResult.failed} falha(s)
                  </Badge>
                )}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || !title || !body} className="gap-2">
            <Send className="h-4 w-4" />
            {isSending ? "Enviando..." : "Enviar para todos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
