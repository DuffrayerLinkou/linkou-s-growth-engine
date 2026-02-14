import { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConversationList } from "@/components/admin/whatsapp/ConversationList";
import { ChatWindow } from "@/components/admin/whatsapp/ChatWindow";
import { BulkSender } from "@/components/admin/whatsapp/BulkSender";
import { WhatsAppConfig } from "@/components/admin/whatsapp/WhatsAppConfig";
import { useIsMobile } from "@/hooks/use-mobile";

interface WhatsAppMessage {
  id: string;
  lead_id: string | null;
  phone: string;
  direction: string;
  type: string;
  content: string | null;
  template_name: string | null;
  status: string;
  created_at: string;
  metadata: any;
}

interface Conversation {
  phone: string;
  lead_id: string | null;
  lead_name: string | null;
  last_message: string;
  last_message_at: string;
  direction: string;
  unread_count: number;
}

export default function WhatsApp() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Fetch all messages
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["whatsapp-messages"],
    queryFn: async () => {
      const { data } = await (supabase.from("whatsapp_messages") as any)
        .select("*")
        .order("created_at", { ascending: true });
      return (data || []) as WhatsAppMessage[];
    },
  });

  // Fetch leads for name resolution
  const { data: leads = [] } = useQuery({
    queryKey: ["leads-names"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, name, phone");
      return data || [];
    },
  });

  // Build lead lookup
  const leadsByPhone = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const lead of leads) {
      if (lead.phone) {
        const clean = lead.phone.replace(/\D/g, "");
        map.set(clean, { id: lead.id, name: lead.name });
        // Also map last 8 digits for flexible matching
        if (clean.length >= 8) {
          map.set(clean.slice(-8), { id: lead.id, name: lead.name });
        }
      }
    }
    return map;
  }, [leads]);

  // Build conversations list
  const conversations = useMemo(() => {
    const convMap = new Map<string, Conversation>();

    for (const msg of messages) {
      const existing = convMap.get(msg.phone);
      const leadInfo = leadsByPhone.get(msg.phone) || leadsByPhone.get(msg.phone.slice(-8));

      if (!existing || new Date(msg.created_at) > new Date(existing.last_message_at)) {
        convMap.set(msg.phone, {
          phone: msg.phone,
          lead_id: msg.lead_id || leadInfo?.id || null,
          lead_name: leadInfo?.name || null,
          last_message: msg.content || `[${msg.type}]`,
          last_message_at: msg.created_at,
          direction: msg.direction,
          unread_count: existing
            ? existing.unread_count + (msg.direction === "inbound" && msg.status !== "read" ? 1 : 0)
            : msg.direction === "inbound" && msg.status !== "read"
            ? 1
            : 0,
        });
      } else if (msg.direction === "inbound" && msg.status !== "read") {
        existing.unread_count++;
      }
    }

    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  }, [messages, leadsByPhone]);

  // Messages for selected conversation
  const selectedMessages = useMemo(() => {
    if (!selectedPhone) return [];
    return messages.filter((m) => m.phone === selectedPhone);
  }, [messages, selectedPhone]);

  const selectedConv = conversations.find((c) => c.phone === selectedPhone);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("whatsapp-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleMessageSent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
  }, [queryClient]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie conversas e disparos via API oficial do WhatsApp Business
        </p>
      </div>

      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversations" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Conversas
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            <Send className="h-4 w-4" />
            Disparo em Massa
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="mt-0">
          <div className="border rounded-lg overflow-hidden flex h-[calc(100vh-220px)] md:h-[calc(100vh-220px)] bg-background">
            {/* Conversation List - hidden on mobile when chat is open */}
            {(!isMobile || !selectedPhone) && (
              <div className={isMobile ? "w-full" : "w-[280px] lg:w-[320px] border-r shrink-0"}>
                <ConversationList
                  conversations={conversations}
                  selectedPhone={selectedPhone}
                  onSelect={setSelectedPhone}
                  isLoading={loadingMessages}
                />
              </div>
            )}

            {/* Chat Area - hidden on mobile when no chat selected */}
            {(!isMobile || selectedPhone) && (
              <div className="flex-1">
                {selectedPhone ? (
                  <ChatWindow
                    phone={selectedPhone}
                    leadId={selectedConv?.lead_id || null}
                    leadName={selectedConv?.lead_name || null}
                    messages={selectedMessages}
                    onMessageSent={handleMessageSent}
                    onBack={isMobile ? () => setSelectedPhone(null) : undefined}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">Selecione uma conversa</p>
                      <p className="text-sm">Escolha um contato à esquerda para ver as mensagens</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bulk">
          <BulkSender />
        </TabsContent>

        <TabsContent value="config">
          <WhatsAppConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
