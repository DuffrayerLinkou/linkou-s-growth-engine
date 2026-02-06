import { useState, useEffect } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { logLeadActivity, replaceTemplateVars } from "@/lib/lead-activity-utils";

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  segment: string | null;
  objective: string | null;
}

interface WhatsAppTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSent: () => void;
}

export function WhatsAppTemplateSelector({ open, onOpenChange, lead, onSent }: WhatsAppTemplateSelectorProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

  useEffect(() => {
    if (open) {
      supabase
        .from("whatsapp_templates")
        .select("*")
        .eq("is_active", true)
        .order("name")
        .then(({ data }) => {
          setTemplates((data as WhatsAppTemplate[]) || []);
        });
    }
  }, [open]);

  const sendMessage = async (message: string) => {
    if (!lead.phone) return;
    const cleanPhone = lead.phone.replace(/\D/g, "");
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    try {
      await logLeadActivity(
        lead.id,
        "whatsapp",
        `WhatsApp enviado: ${message.substring(0, 120)}${message.length > 120 ? "..." : ""}`,
        selectedTemplate ? { template_id: selectedTemplate.id, template_name: selectedTemplate.name } : undefined
      );
    } catch {
      // ignore
    }

    setCustomMessage("");
    setSelectedTemplate(null);
    onSent();
  };

  const handleTemplateClick = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setCustomMessage(replaceTemplateVars(template.content, lead));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            Enviar WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Templates */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Templates</p>
              <div className="grid gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateClick(t)}
                    className={`text-left p-3 rounded-lg border text-sm transition-colors hover:bg-accent ${
                      selectedTemplate?.id === t.id ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{t.content}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom/Preview */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {selectedTemplate ? "Mensagem (editável)" : "Mensagem livre"}
            </p>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={4}
            />
          </div>

          <Button
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
            onClick={() => sendMessage(customMessage)}
            disabled={!customMessage.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Abrir WhatsApp com mensagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
