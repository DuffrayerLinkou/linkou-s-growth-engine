import { useState } from "react";
import { Phone, MessageCircle, Mail, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { logLeadActivity } from "@/lib/lead-activity-utils";
import { WhatsAppTemplateSelector } from "./WhatsAppTemplateSelector";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string | null;
  objective: string | null;
}

interface LeadQuickActionsProps {
  lead: Lead;
  onActivityLogged: () => void;
}

export function LeadQuickActions({ lead, onActivityLogged }: LeadQuickActionsProps) {
  const [callNoteOpen, setCallNoteOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [callNote, setCallNote] = useState("");
  const { toast } = useToast();

  const handleCall = async () => {
    if (!lead.phone) return;
    const cleanPhone = lead.phone.replace(/\D/g, "");
    window.open(`tel:+55${cleanPhone}`, "_self");

    try {
      await logLeadActivity(lead.id, "call", "Ligação realizada");
      onActivityLogged();
    } catch {
      // silently fail logging
    }

    setTimeout(() => setCallNoteOpen(true), 2000);
  };

  const saveCallNote = async () => {
    if (callNote.trim()) {
      try {
        await logLeadActivity(lead.id, "note", `Nota da ligação: ${callNote}`);
        onActivityLogged();
      } catch {
        // ignore
      }
    }
    setCallNote("");
    setCallNoteOpen(false);
  };

  const handleEmail = async () => {
    window.open(`mailto:${lead.email}`, "_blank");
    try {
      await logLeadActivity(lead.id, "email", `Email enviado para ${lead.email}`);
      onActivityLogged();
    } catch {
      // ignore
    }
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;
    try {
      await logLeadActivity(lead.id, "note", noteText);
      toast({ title: "Nota adicionada" });
      onActivityLogged();
    } catch {
      toast({ variant: "destructive", title: "Erro ao salvar nota" });
    }
    setNoteText("");
    setNoteDialogOpen(false);
  };

  const handleWhatsAppSent = () => {
    setWhatsappOpen(false);
    onActivityLogged();
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {lead.phone && (
          <Button size="sm" variant="outline" onClick={handleCall} className="gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            Ligar
          </Button>
        )}
        {lead.phone && (
          <Button
            size="sm"
            className="gap-1.5 bg-[#25D366] hover:bg-[#20BD5A] text-white"
            onClick={() => setWhatsappOpen(true)}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleEmail} className="gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          Email
        </Button>
        <Button size="sm" variant="outline" onClick={() => setNoteDialogOpen(true)} className="gap-1.5">
          <StickyNote className="h-3.5 w-3.5" />
          Nota
        </Button>
      </div>

      {/* Call Note Dialog */}
      <Dialog open={callNoteOpen} onOpenChange={setCallNoteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Anotações da Ligação</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Como foi a ligação? Resultado..."
            value={callNote}
            onChange={(e) => setCallNote(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setCallNoteOpen(false)}>
              Pular
            </Button>
            <Button size="sm" onClick={saveCallNote}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Nota</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Escreva uma observação sobre este lead..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setNoteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={saveNote} disabled={!noteText.trim()}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Template Selector */}
      <WhatsAppTemplateSelector
        open={whatsappOpen}
        onOpenChange={setWhatsappOpen}
        lead={lead}
        onSent={handleWhatsAppSent}
      />
    </>
  );
}
