import { useState } from "react";
import { Sparkles, FileText, ChevronLeft, ChevronRight, Download, Save, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { proposalTemplates, type ProposalSlide } from "./ProposalTemplates";
import { ProposalSlidePreview } from "./ProposalSlidePreview";
import { ProposalSlideEditor } from "./ProposalSlideEditor";
import { exportProposalPDF } from "./ProposalPDFExport";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string | null;
  objective: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onCreated?: () => void;
}

export function ProposalGenerator({ open, onOpenChange, lead, onCreated }: Props) {
  const [step, setStep] = useState<"choose" | "preview">("choose");
  const [slides, setSlides] = useState<ProposalSlide[]>([]);
  const [proposalTitle, setProposalTitle] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSlide, setEditingSlide] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setStep("choose");
    setSlides([]);
    setProposalTitle("");
    setCurrentSlide(0);
    setSelectedTemplate("");
    setServiceType("");
    setCustomContext("");
    setEditingSlide(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleUseTemplate = () => {
    const template = proposalTemplates.find((t) => t.id === selectedTemplate);
    if (!template) return;
    setSlides(template.slides.map((s) => ({ ...s })));
    setProposalTitle(template.slides[0]?.title || template.label);
    setServiceType(template.serviceType);
    setStep("preview");
  };

  const handleGenerateAI = async () => {
    if (!serviceType) {
      toast({ variant: "destructive", title: "Selecione um tipo de serviço" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-proposal", {
        body: {
          lead_name: lead.name,
          lead_segment: lead.segment,
          lead_objective: lead.objective,
          service_type: serviceType,
          custom_context: customContext,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setSlides(data.slides || []);
      setProposalTitle(data.title || "Proposta Comercial");
      setStep("preview");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao gerar proposta", description: e.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (status: string = "draft") => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("proposals" as any).insert({
        lead_id: lead.id,
        client_name: lead.name,
        client_segment: lead.segment,
        service_type: serviceType,
        title: proposalTitle,
        slides: slides as any,
        status,
        created_by: user?.id,
      } as any);
      if (error) throw error;
      toast({ title: status === "draft" ? "Rascunho salvo" : "Proposta salva" });
      onCreated?.();
      handleOpenChange(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    exportProposalPDF({ title: proposalTitle, clientName: lead.name, slides });
  };

  const updateSlide = (updated: ProposalSlide) => {
    setSlides((prev) => prev.map((s, i) => (i === currentSlide ? updated : s)));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "choose" ? "Gerar Proposta Comercial" : proposalTitle}
          </DialogTitle>
        </DialogHeader>

        {step === "choose" && (
          <Tabs defaultValue="template">
            <TabsList className="w-full">
              <TabsTrigger value="template" className="flex-1 gap-1.5">
                <FileText className="h-4 w-4" /> Template Pronto
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 gap-1.5">
                <Sparkles className="h-4 w-4" /> Gerar com IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Escolha um template pronto para {lead.name}:</p>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger><SelectValue placeholder="Selecione o template" /></SelectTrigger>
                <SelectContent>
                  {proposalTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleUseTemplate} disabled={!selectedTemplate} className="w-full">
                Usar Template
              </Button>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">A IA vai gerar uma proposta personalizada para {lead.name}.</p>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger><SelectValue placeholder="Tipo de serviço" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestao">Gestão de Tráfego</SelectItem>
                  <SelectItem value="auditoria">Auditoria</SelectItem>
                  <SelectItem value="producao">Produção de Mídia</SelectItem>
                  <SelectItem value="site">Site / Landing Page</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="webapp">Aplicação Web</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Contexto adicional (opcional): detalhes sobre o lead, necessidades específicas..."
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                rows={3}
              />
              <Button onClick={handleGenerateAI} disabled={generating || !serviceType} className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                {generating ? "Gerando proposta..." : "Gerar com IA"}
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {step === "preview" && slides.length > 0 && (
          <div className="space-y-4">
            {/* Slide preview */}
            <div className="rounded-lg overflow-hidden border">
              <ProposalSlidePreview
                slide={slides[currentSlide]}
                clientName={lead.name}
                proposalTitle={proposalTitle}
                slideIndex={currentSlide}
                totalSlides={slides.length}
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
                disabled={currentSlide === slides.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Editor toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSlide(!editingSlide)}
              className="gap-1.5 w-full"
            >
              <Pencil className="h-3.5 w-3.5" />
              {editingSlide ? "Fechar editor" : "Editar este slide"}
            </Button>

            {editingSlide && (
              <div className="border rounded-lg p-4">
                <ProposalSlideEditor slide={slides[currentSlide]} onChange={updateSlide} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setStep("choose")} className="gap-1.5">
                <ChevronLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button size="sm" onClick={() => handleSave("draft")} disabled={saving} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar Rascunho"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
