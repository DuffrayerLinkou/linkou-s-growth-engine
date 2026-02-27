import { useState } from "react";
import { Send, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function EmailComposer() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

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
        title: "Email enviado com sucesso!",
        description: `Enviado para ${recipients.length} destinatário(s)`,
      });
      setTo("");
      setSubject("");
      setBody("");
      setReplyTo("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar email";
      toast({ variant: "destructive", title: "Falha no envio", description: msg });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Enviar Email
        </h1>
        <p className="text-muted-foreground">Envie emails manualmente via Resend</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Compor Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="page-to">Para *</Label>
            <Input
              id="page-to"
              placeholder="email@exemplo.com (separe múltiplos por vírgula)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="page-subject">Assunto *</Label>
            <Input
              id="page-subject"
              placeholder="Assunto do email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="page-body">Corpo *</Label>
            <Textarea
              id="page-body"
              placeholder="Conteúdo do email (suporta HTML)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="page-reply">Responder para (opcional)</Label>
            <Input
              id="page-reply"
              placeholder="reply@exemplo.com"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSend} disabled={sending} size="lg" className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Enviando..." : "Enviar Email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
