import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, FileText, Check, CheckCheck, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  direction: string;
  type: string;
  content: string | null;
  template_name: string | null;
  status: string;
  created_at: string;
  metadata: any;
}

interface ChatWindowProps {
  phone: string;
  leadId: string | null;
  leadName: string | null;
  messages: Message[];
  onMessageSent: () => void;
}

export function ChatWindow({ phone, leadId, leadName, messages, onMessageSent }: ChatWindowProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-api", {
        body: { action: "send-text", phone, message: text.trim(), lead_id: leadId },
      });

      // Parse the response - supabase functions.invoke returns the parsed body
      if (error) {
        toast({ variant: "destructive", title: "Erro ao enviar", description: error.message });
      } else {
        setText("");
        onMessageSent();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao enviar mensagem" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div>
          <h3 className="font-semibold text-sm">{leadName || formatPhone(phone)}</h3>
          <p className="text-xs text-muted-foreground">{formatPhone(phone)}</p>
        </div>
        {leadId && (
          <Link to={`/admin/leads`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ExternalLink className="h-3 w-3" />
              Ver Lead
            </Button>
          </Link>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.direction === "outbound" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  msg.direction === "outbound"
                    ? "bg-[#DCF8C6] dark:bg-[#025C4C] text-foreground rounded-br-md"
                    : "bg-card border rounded-bl-md"
                )}
              >
                {msg.type === "template" && (
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="h-3 w-3" />
                    <span className="text-[10px] font-medium opacity-70">Template: {msg.template_name}</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.content || "[sem conteúdo]"}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] opacity-60">
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                  </span>
                  {msg.direction === "outbound" && (
                    <StatusIcon status={msg.status} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="bg-[#25D366] hover:bg-[#20BD5A] text-white shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "read":
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 opacity-60" />;
    case "sent":
      return <Check className="h-3 w-3 opacity-60" />;
    case "pending":
      return <Clock className="h-3 w-3 opacity-60" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    default:
      return null;
  }
}

function formatPhone(phone: string) {
  if (phone.length === 13) {
    return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }
  return phone;
}
