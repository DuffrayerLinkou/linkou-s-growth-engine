import { useState, useMemo } from "react";
import { Send, Loader2, Mail, Search, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { emailTemplates, emailTemplateCategories, type EmailTemplate } from "@/lib/email-templates-config";

export default function EmailComposer() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredTemplates = useMemo(() => {
    return emailTemplates.filter((t) => {
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !activeCategory || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, EmailTemplate[]> = {};
    filteredTemplates.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTemplates]);

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setBody(template.body);
  };

  const clearTemplate = () => {
    setSelectedTemplate(null);
    setSubject("");
    setBody("");
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
        title: "Email enviado com sucesso!",
        description: `Enviado para ${recipients.length} destinatário(s)`,
      });
      setTo("");
      setSubject("");
      setBody("");
      setReplyTo("");
      setSelectedTemplate(null);
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
        <p className="text-muted-foreground">Envie emails manualmente via Resend com templates editáveis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Templates Panel */}
        <Card className="h-fit lg:max-h-[calc(100vh-12rem)] lg:overflow-hidden flex flex-col">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge
                variant={activeCategory === null ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setActiveCategory(null)}
              >
                Todos
              </Badge>
              {emailTemplateCategories.map((cat) => (
                <Badge
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0 overflow-y-auto flex-1">
            {Object.keys(groupedTemplates).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum template encontrado</p>
            )}
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category} className="mb-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {category}
                </p>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedTemplate?.id === t.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Composer */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Compor Email</CardTitle>
              {selectedTemplate && (
                <Button variant="ghost" size="sm" onClick={clearTemplate} className="gap-1 text-xs h-7">
                  <X className="h-3 w-3" />
                  Limpar template
                </Button>
              )}
            </div>
            {selectedTemplate && (
              <Badge variant="secondary" className="w-fit text-xs">
                Template: {selectedTemplate.name}
              </Badge>
            )}
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
                placeholder="Conteúdo do email (suporta HTML e placeholders como {{nome}})"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
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
    </div>
  );
}
