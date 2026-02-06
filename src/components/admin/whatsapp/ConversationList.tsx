import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  phone: string;
  lead_id: string | null;
  lead_name: string | null;
  last_message: string;
  last_message_at: string;
  direction: string;
  unread_count: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedPhone: string | null;
  onSelect: (phone: string) => void;
  isLoading: boolean;
}

export function ConversationList({ conversations, selectedPhone, onSelect, isLoading }: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.phone.includes(q) ||
        c.lead_name?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex-1 p-3 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mb-2" />
            <p className="text-sm">Nenhuma conversa</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map((conv) => (
              <button
                key={conv.phone}
                onClick={() => onSelect(conv.phone)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  selectedPhone === conv.phone
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {conv.lead_name || formatPhone(conv.phone)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.direction === "outbound" && "Você: "}
                      {conv.last_message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.last_message_at), {
                        addSuffix: false,
                        locale: ptBR,
                      })}
                    </span>
                    {conv.unread_count > 0 && (
                      <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-[#25D366]">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function formatPhone(phone: string) {
  if (phone.length === 13) {
    return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }
  return phone;
}
