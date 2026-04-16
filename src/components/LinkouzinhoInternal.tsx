import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, RotateCcw, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import linkouzinhoImg from "@/assets/linkouzinho.png";
import { useQuery } from "@tanstack/react-query";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Message = { role: "user" | "assistant"; content: string };

interface Props {
  mode: "admin" | "client";
}

const ADMIN_SUGGESTIONS = [
  "Análise do último mês",
  "Comparar CPL das campanhas",
  "Agendar reunião",
  "Criar tarefa",
  "Estruturar campanha",
];

const CLIENT_SUGGESTIONS = [
  "Como estão minhas métricas?",
  "Resumo das campanhas",
  "Qual o próximo passo?",
  "O que é CPL?",
];

function TypingIndicator({ isExecuting }: { isExecuting: boolean }) {
  return (
    <div className="flex items-end gap-2 mb-3">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={linkouzinhoImg} alt="Linkouzinho" />
        <AvatarFallback className="bg-yellow-400 text-black text-xs">LK</AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
        {isExecuting ? (
          <div className="flex gap-1.5 items-center h-4 text-muted-foreground">
            <Settings className="h-3.5 w-3.5 animate-spin" />
            <span className="text-[11px]">Executando ação...</span>
          </div>
        ) : (
          <div className="flex gap-1 items-center h-4">
            <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
}

export function LinkouzinhoInternal({ mode }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { profile, session } = useAuth();

  // For admin mode: fetch clients list
  const { data: clients } = useQuery({
    queryKey: ["assistant-clients-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .eq("status", "ativo")
        .order("name");
      return data || [];
    },
    enabled: mode === "admin",
    staleTime: 1000 * 60 * 5,
  });

  const clientId = mode === "client" ? profile?.client_id : selectedClientId;

  const suggestions = mode === "admin" ? ADMIN_SUGGESTIONS : CLIENT_SUGGESTIONS;
  const subtitle = mode === "admin" ? "Modo Analista" : "Seu Consultor";

  // Session-based storage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`linkouzinho_internal_${mode}`);
      if (stored) setMessages(JSON.parse(stored));
    } catch {}
  }, [mode]);

  useEffect(() => {
    try {
      sessionStorage.setItem(`linkouzinho_internal_${mode}`, JSON.stringify(messages));
    } catch {}
  }, [messages, mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || !clientId) return;

      const userMsg: Message = { role: "user", content: text.trim() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);
      setIsExecuting(false);
      const execTimer = setTimeout(() => setIsExecuting(true), 3000);

      let assistantContent = "";

      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/assistant-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            client_id: clientId,
            mode,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
          throw new Error(err.error || `HTTP ${resp.status}`);
        }

        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const updateAssistant = (content: string) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
            }
            return [...prev, { role: "assistant", content }];
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (delta) {
                assistantContent += delta;
                updateAssistant(assistantContent);
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        // Final flush
        if (buffer.trim()) {
          for (let raw of buffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (delta) {
                assistantContent += delta;
                updateAssistant(assistantContent);
              }
            } catch {}
          }
        }
      } catch (e: any) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `❌ ${e.message || "Erro ao processar. Tente novamente."}` },
        ]);
      } finally {
        clearTimeout(execTimer);
        setIsLoading(false);
        setIsExecuting(false);
      }
    },
    [messages, isLoading, clientId, session, mode]
  );

  const handleReset = () => {
    setMessages([]);
    sessionStorage.removeItem(`linkouzinho_internal_${mode}`);
  };

  const needsClientSelection = mode === "admin" && !selectedClientId;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-yellow-400 hover:bg-yellow-300 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110"
          aria-label="Abrir Linkouzinho"
        >
          <img src={linkouzinhoImg} alt="Linkouzinho" className="w-9 h-9 rounded-full" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col bg-card animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-white shrink-0",
              mode === "admin" ? "bg-zinc-900" : "bg-primary"
            )}
          >
            <Avatar className="h-9 w-9 border-2 border-white/30">
              <AvatarImage src={linkouzinhoImg} alt="Linkouzinho" />
              <AvatarFallback className="bg-yellow-400 text-black text-xs">LK</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Linkouzinho</p>
              <p className="text-[11px] opacity-80 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {subtitle}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
                onClick={handleReset}
                title="Limpar conversa"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Admin: Client Selector */}
          {mode === "admin" && (
            <div className="px-3 py-2 border-b bg-muted/30">
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 px-3 py-3" ref={scrollRef as any}>
            <div ref={scrollRef}>
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-6">
                  <Avatar className="h-16 w-16 mx-auto mb-3">
                    <AvatarImage src={linkouzinhoImg} alt="Linkouzinho" />
                    <AvatarFallback className="bg-yellow-400 text-black">LK</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium mb-1">
                    {mode === "admin" ? "Olá! Selecione um cliente e pergunte." : "Olá! Como posso ajudar?"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {mode === "admin"
                      ? "Tenho acesso às campanhas, métricas e planos estratégicos."
                      : "Posso te ajudar a entender suas métricas e resultados."}
                  </p>
                  {!needsClientSelection && (
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          className="text-[11px] px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex mb-3",
                    msg.role === "user" ? "justify-end" : "items-end gap-2"
                  )}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={linkouzinhoImg} alt="Linkouzinho" />
                      <AvatarFallback className="bg-yellow-400 text-black text-xs">LK</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 max-w-[80%] text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1.5 [&>ul]:mb-1.5 [&>ol]:mb-1.5 [&>table]:text-xs">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading && <TypingIndicator isExecuting={isExecuting} />}
            </div>
          </ScrollArea>

          {/* Quick suggestions after messages */}
          {messages.length > 0 && !isLoading && !needsClientSelection && (
            <div className="px-3 py-1.5 border-t flex gap-1.5 overflow-x-auto scrollbar-none">
              {suggestions.slice(0, 3).map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-[10px] px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground whitespace-nowrap shrink-0 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-2.5 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={needsClientSelection ? "Selecione um cliente acima..." : "Digite sua pergunta..."}
                disabled={isLoading || needsClientSelection}
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 placeholder:text-muted-foreground/60"
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 rounded-full shrink-0"
                disabled={!input.trim() || isLoading || needsClientSelection}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
