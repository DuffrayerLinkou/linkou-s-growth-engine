import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  defaultSubject?: string;
  onSent?: () => void;
}

export function EmailComposeDialog({
  open,
  onOpenChange,
  defaultTo = "",
  defaultSubject = "",
  onSent,
}: EmailComposeDialogProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Reset fields when dialog opens with new defaults
  const handleOpenChange = (val: boolean) => {
    if (val) {
      setTo(defaultTo);
      setSubject(defaultSubject);
      setBody("");
      setReplyTo("");
    }
    onOpenChange(val);
  };

  const handleSend = async () => {
    const recipients = to
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (!recipients.length || !subject.trim() || !body.trim()) {
      toast({ variant: "destructive", title: "Preencha todos os campos obrigatórios" });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipients.length === 1 ? recipients[0] : recipients,
          subject: subject.trim(),
          html: body.replace(/\n/g, "<br/>"),
          ...(replyTo.trim() ? { reply_to: replyTo.trim() } : {}),
        },
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: `Enviado para ${recipients.length} destinatário(s)`,
      });
      onSent?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar email";
      toast({ variant: "destructive", title: "Falha no envio", description: msg });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email-to">Para *</Label>
            <Input
              id="email-to"
              placeholder="email@exemplo.com (separe múltiplos por vírgula)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-subject">Assunto *</Label>
            <Input
              id="email-subject"
              placeholder="Assunto do email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-body">Corpo *</Label>
            <Textarea
              id="email-body"
              placeholder="Conteúdo do email (suporta HTML)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-reply">Responder para (opcional)</Label>
            <Input
              id="email-reply"
              placeholder="reply@exemplo.com"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
