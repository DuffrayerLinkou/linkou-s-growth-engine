import { useState, useMemo, useEffect } from "react";
import { Send, Loader2, Mail, Search, X, FileText, Eye, Edit, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  emailTemplates,
  emailTemplateCategories,
  wrapWithLinkoLayout,
  replacePlaceholders,
  type EmailTemplate,
} from "@/lib/email-templates-config";

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  type: "lead" | "client";
}

export default function EmailComposer() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const { toast } = useToast();

  // Load leads and clients
  useEffect(() => {
    async function loadContacts() {
      const [leadsRes, clientsRes] = await Promise.all([
        supabase.from("leads").select("id, name, email, segment").order("created_at", { ascending: false }).limit(500),
        supabase.from("clients").select("id, name, segment").order("created_at", { ascending: false }).limit(200),
      ]);

      const mapped: Contact[] = [];
      if (leadsRes.data) {
        leadsRes.data.forEach((l) => {
          if (l.email) mapped.push({ id: l.id, name: l.name, email: l.email, company: l.segment || "", type: "lead" });
        });
      }
      if (clientsRes.data) {
        clientsRes.data.forEach((c) => {
          mapped.push({ id: c.id, name: c.name, email: "", company: c.name, type: "client" });
        });
      }
      setContacts(mapped);
    }
    loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts.slice(0, 20);
    const q = contactSearch.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [contactSearch, contacts]);

  const filteredTemplates = useMemo(() => {
    return emailTemplates.filter((t) => {
      const matchesSearch =
        !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
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

  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setTo(contact.email);
    setShowContactDropdown(false);
    setContactSearch("");
    // Replace placeholders in current subject/body
    if (subject) setSubject(replacePlaceholders(subject, { nome: contact.name, empresa: contact.company }));
    if (body) setBody(replacePlaceholders(body, { nome: contact.name, empresa: contact.company }));
  };

  const clearContact = () => {
    setSelectedContact(null);
    setTo("");
    setManualMode(false);
  };

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    let newSubject = template.subject;
    let newBody = template.body;
    if (selectedContact) {
      newSubject = replacePlaceholders(newSubject, { nome: selectedContact.name, empresa: selectedContact.company });
      newBody = replacePlaceholders(newBody, { nome: selectedContact.name, empresa: selectedContact.company });
    }
    setSubject(newSubject);
    setBody(newBody);
  };

  const clearTemplate = () => {
    setSelectedTemplate(null);
    setSubject("");
    setBody("");
  };

  // Build preview HTML
  const previewHtml = useMemo(() => {
    return wrapWithLinkoLayout(body || "Escreva o conteúdo do email...");
  }, [body]);

  const handleSend = async () => {
    const recipients = to.split(",").map((e) => e.trim()).filter(Boolean);
    if (!recipients.length || !subject.trim() || !body.trim()) {
      toast({ variant: "destructive", title: "Preencha todos os campos obrigatórios" });
      return;
    }

    setSending(true);
    try {
      const html = wrapWithLinkoLayout(body);
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipients.length === 1 ? recipients[0] : recipients,
          subject: subject.trim(),
          html,
          ...(replyTo.trim() ? { reply_to: replyTo.trim() } : {}),
        },
      });
      if (error) throw error;

      toast({ title: "Email enviado com sucesso!", description: `Enviado para ${recipients.length} destinatário(s)` });
      setTo("");
      setSubject("");
      setBody("");
      setReplyTo("");
      setSelectedTemplate(null);
      setSelectedContact(null);
      setManualMode(false);
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
        <p className="text-muted-foreground">Emails com design Linkou profissional e assinatura padrão</p>
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
              <Input placeholder="Buscar template..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant={activeCategory === null ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setActiveCategory(null)}>
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
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">{category}</p>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedTemplate?.id === t.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
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
            {/* Contact selector */}
            <div className="space-y-1.5">
              <Label>Destinatário *</Label>
              {selectedContact ? (
                <div className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/50">
                  <Badge variant={selectedContact.type === "lead" ? "default" : "secondary"} className="text-xs">
                    {selectedContact.type === "lead" ? "Lead" : "Cliente"}
                  </Badge>
                  <span className="text-sm font-medium">{selectedContact.name}</span>
                  <span className="text-xs text-muted-foreground">{selectedContact.email}</span>
                  <Button variant="ghost" size="sm" onClick={clearContact} className="ml-auto h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : manualMode ? (
                <div className="space-y-2">
                  <Input
                    placeholder="email@exemplo.com (separe múltiplos por vírgula)"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => setManualMode(false)}>
                    <Users className="h-3 w-3" />
                    Buscar contato
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar lead ou cliente..."
                        value={contactSearch}
                        onChange={(e) => {
                          setContactSearch(e.target.value);
                          setShowContactDropdown(true);
                        }}
                        onFocus={() => setShowContactDropdown(true)}
                        className="pl-9"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="text-xs gap-1 shrink-0" onClick={() => setManualMode(true)}>
                      <UserPlus className="h-3 w-3" />
                      Manual
                    </Button>
                  </div>
                  {showContactDropdown && (
                    <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredContacts.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">Nenhum contato encontrado</p>
                      ) : (
                        filteredContacts.map((c) => (
                          <button
                            key={`${c.type}-${c.id}`}
                            onClick={() => selectContact(c)}
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2"
                          >
                            <Badge variant={c.type === "lead" ? "default" : "secondary"} className="text-[10px] shrink-0">
                              {c.type === "lead" ? "Lead" : "Cliente"}
                            </Badge>
                            <span className="text-sm font-medium truncate">{c.name}</span>
                            {c.email && <span className="text-xs text-muted-foreground truncate ml-auto">{c.email}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="page-subject">Assunto *</Label>
              <Input id="page-subject" placeholder="Assunto do email" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            {/* Body with preview tabs */}
            <Tabs defaultValue="edit" className="space-y-2">
              <TabsList className="h-8">
                <TabsTrigger value="edit" className="text-xs gap-1 h-7">
                  <Edit className="h-3 w-3" />
                  Editar
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs gap-1 h-7">
                  <Eye className="h-3 w-3" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <Textarea
                  placeholder="Conteúdo do email (placeholders: {{nome}}, {{empresa}})"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={14}
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="border rounded-md overflow-hidden bg-background" style={{ minHeight: 360 }}>
                  <iframe
                    srcDoc={previewHtml}
                    title="Email Preview"
                    className="w-full border-0"
                    style={{ height: 500 }}
                    sandbox=""
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Reply-to */}
            <div className="space-y-1.5">
              <Label htmlFor="page-reply">Responder para (opcional)</Label>
              <Input id="page-reply" placeholder="reply@exemplo.com" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
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
