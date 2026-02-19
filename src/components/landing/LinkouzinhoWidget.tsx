import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import linkouzinhoImg from "@/assets/linkouzinho.png";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const CHAT_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function clearChatStorage() {
  ["linkouzinho_messages", "linkouzinho_capture_mode", "linkouzinho_submitted",
   "linkouzinho_wa_url", "linkouzinho_open", "linkouzinho_ts"].forEach((k) =>
    localStorage.removeItem(k)
  );
}

function isChatFresh(): boolean {
  try {
    const ts = localStorage.getItem("linkouzinho_ts");
    return !!ts && Date.now() - Number(ts) < CHAT_TTL_MS;
  } catch {
    return false;
  }
}

type Message = {
  role: "user" | "assistant";
  content: string;
  captureMode?: boolean;
};

const QUICK_SUGGESTIONS = [
  "O que vocês fazem?",
  "Quanto custa a consultoria?",
  "O que é o Ponto Focal?",
  "Quero falar com alguém",
];

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Oi! Sou o **Linkouzinho** 🤖, assistente virtual da Agência Linkou!\n\nPosso te ajudar com dúvidas sobre nossos serviços de consultoria, tráfego e vendas. Por onde quer começar?",
};

function useWhatsAppSettings() {
  const { data } = useQuery({
    queryKey: ["landing-settings-whatsapp-bot"],
    queryFn: async () => {
      const { data } = await supabase
        .from("landing_settings")
        .select("whatsapp_number, whatsapp_message")
        .limit(1)
        .single();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
  return data?.whatsapp_number || "5541988988054";
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={linkouzinhoImg} alt="Linkouzinho" />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">LK</AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
        <div className="flex gap-1 items-center h-4">
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function CaptureForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (name: string, email: string, phone: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSubmit(name.trim(), email.trim(), phone.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-muted/50 rounded-xl p-4 border border-border/50 space-y-3 mt-2">
      <p className="text-sm font-medium text-foreground">
        Preencha para continuar com nosso time 😊
      </p>
      <Input
        placeholder="Seu nome *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="h-9 text-sm"
      />
      <Input
        type="email"
        placeholder="Seu e-mail *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-9 text-sm"
      />
      <Input
        placeholder="WhatsApp (opcional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="h-9 text-sm"
      />
      <Button
        type="submit"
        className="w-full h-9 text-sm font-semibold"
        disabled={isLoading || !name.trim() || !email.trim()}
      >
        {isLoading ? "Enviando..." : "Enviar e continuar no WhatsApp →"}
      </Button>
    </form>
  );
}

export function LinkouzinhoWidget() {
  const [isOpen, setIsOpen] = useState<boolean>(() =>
    isChatFresh() ? loadFromStorage("linkouzinho_open", false) : false
  );
  const [messages, setMessages] = useState<Message[]>(() =>
    isChatFresh() ? loadFromStorage("linkouzinho_messages", [WELCOME_MESSAGE]) : [WELCOME_MESSAGE]
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasUnread, setHasUnread] = useState<boolean>(() => {
    if (!isChatFresh()) return true;
    const saved = loadFromStorage<Message[]>("linkouzinho_messages", []);
    return saved.length <= 1;
  });
  const [captureMode, setCaptureMode] = useState<boolean>(() =>
    isChatFresh() ? loadFromStorage("linkouzinho_capture_mode", false) : false
  );
  const [captureSubmitted, setCaptureSubmitted] = useState<boolean>(() =>
    isChatFresh() ? loadFromStorage("linkouzinho_submitted", false) : false
  );
  const [captureLoading, setCaptureLoading] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(() =>
    isChatFresh() ? loadFromStorage("linkouzinho_wa_url", null) : null
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const whatsappNumber = useWhatsAppSettings();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isStreaming, captureMode]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasUnread(false);
    }
  }, [isOpen]);

  // Persist state to localStorage
  useEffect(() => { saveToStorage("linkouzinho_messages", messages); saveToStorage("linkouzinho_ts", Date.now()); }, [messages]);
  useEffect(() => { saveToStorage("linkouzinho_capture_mode", captureMode); }, [captureMode]);
  useEffect(() => { saveToStorage("linkouzinho_submitted", captureSubmitted); }, [captureSubmitted]);
  useEffect(() => { saveToStorage("linkouzinho_wa_url", whatsappUrl); }, [whatsappUrl]);
  useEffect(() => { saveToStorage("linkouzinho_open", isOpen); }, [isOpen]);

  const streamChat = useCallback(async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setInput("");

    abortRef.current = new AbortController();

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/linkouzinho-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        let errorMsg = "Ops! Algo deu errado. Tente novamente 😅";
        try {
          const json = await resp.json();
          if (json.error) errorMsg = json.error;
        } catch {}
        setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
        setIsStreaming(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let hasCaptureTag = false;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              fullContent += delta;
              // Check for capture tag
              if (fullContent.includes("<CAPTURE_MODE>")) {
                hasCaptureTag = true;
                fullContent = fullContent.replace("<CAPTURE_MODE>", "").trim();
              }
              const displayContent = fullContent;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: displayContent };
                return next;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final flush
      if (hasCaptureTag) {
        setCaptureMode(true);
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Ops! Perdi a conexão. Tente novamente! 😅" },
        ]);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    streamChat(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    if (isStreaming) return;
    streamChat(suggestion);
  };

  const handleCapture = async (name: string, email: string, phone: string) => {
    setCaptureLoading(true);
    try {
      // Build conversation summary
      const summary = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("; ")
        .slice(0, 300);

      await supabase.from("leads").insert({
        name,
        email,
        phone: phone || null,
        source: "bot_linkouzinho",
        status: "new",
        objective: summary || "Contato via bot Linkouzinho",
      });

      // Fire CAPI events (fire and forget)
      supabase.functions.invoke("meta-capi-event", {
        body: { email, phone, name, source_url: window.location.origin, event_name: "Lead" },
      }).catch(() => {});
      supabase.functions.invoke("tiktok-capi-event", {
        body: { email, phone, name, source_url: window.location.origin, event_name: "SubmitForm" },
      }).catch(() => {});

      const waMsg = encodeURIComponent(
        `Olá! Conversei com o Linkouzinho e tenho interesse nos serviços da Linkou. Meu nome é ${name}.${summary ? ` Falamos sobre: ${summary}` : ""}`
      );
      const url = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${waMsg}&type=phone_number&app_absent=0`;
      setWhatsappUrl(url);
      setCaptureSubmitted(true);
      setCaptureMode(false);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Perfeito, **${name}**! 🎉 Seus dados foram enviados com sucesso. Nosso time vai entrar em contato em breve. Pode clicar no botão abaixo para continuar a conversa no WhatsApp!`,
        },
      ]);
    } catch (err) {
      console.error("Capture error:", err);
    } finally {
      setCaptureLoading(false);
    }
  };

  const handleNewConversation = () => {
    clearChatStorage();
    setMessages([WELCOME_MESSAGE]);
    setCaptureMode(false);
    setCaptureSubmitted(false);
    setWhatsappUrl(null);
    setHasUnread(false);
    setInput("");
  };

  const showSuggestions = messages.length === 1 && !isStreaming;

  return (
    <>
      {/* Floating avatar button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tooltip hint (shown when closed and unread) */}
        {!isOpen && hasUnread && (
          <div className="bg-popover text-popover-foreground text-sm rounded-xl rounded-br-none shadow-lg px-4 py-2 border border-border animate-fade-in max-w-[200px] text-right">
            Oi! Posso te ajudar? 👋
          </div>
        )}

        <button
          onClick={() => setIsOpen((v) => !v)}
          className={cn(
          "relative h-16 w-16 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-yellow-400/40",
            "bg-yellow-400 p-0 overflow-visible",
            !isOpen && "animate-pulse-slow"
          )}
          aria-label="Abrir chat com Linkouzinho"
        >
          <img
            src={linkouzinhoImg}
            alt="Linkouzinho"
            className="h-16 w-16 rounded-full object-cover"
          />
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow">
              1
            </span>
          )}
        </button>
      </div>

      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 shadow-2xl border border-border/50 bg-background rounded-2xl flex flex-col overflow-hidden",
            "bottom-24 right-6 w-[380px] h-[560px]",
            "max-md:bottom-0 max-md:right-0 max-md:left-0 max-md:w-full max-md:h-[85vh] max-md:rounded-t-2xl max-md:rounded-b-none"
          )}
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shrink-0">
            <Avatar className="h-9 w-9 border-2 border-primary-foreground/30">
              <AvatarImage src={linkouzinhoImg} alt="Linkouzinho" />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">LK</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Linkouzinho</p>
              <p className="text-primary-foreground/70 text-xs">Agência Linkou · Online agora</p>
            </div>
            {messages.length > 1 && (
              <button
                onClick={handleNewConversation}
                className="h-8 w-8 rounded-full hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
                aria-label="Nova conversa"
                title="Nova conversa"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
              aria-label="Fechar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as any}>
            <div className="space-y-1">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "assistant" ? (
                    <div className="flex items-end gap-2 mb-3">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={linkouzinhoImg} alt="Linkouzinho" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">LK</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%] text-sm leading-relaxed">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end mb-3">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%] text-sm leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <TypingIndicator />
              )}

              {/* Quick suggestions */}
              {showSuggestions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className="text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full px-3 py-1.5 transition-colors font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Capture form */}
              {captureMode && !captureSubmitted && (
                <CaptureForm onSubmit={handleCapture} isLoading={captureLoading} />
              )}

              {/* WhatsApp CTA after capture */}
              {captureSubmitted && whatsappUrl && (
                <div className="mt-3">
                  <Button
                    className="w-full bg-[hsl(142,71%,35%)] hover:bg-[hsl(142,71%,30%)] text-white text-sm font-semibold h-10"
                    onClick={() => window.open(whatsappUrl, "_blank")}
                  >
                    💬 Continuar no WhatsApp
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="border-t border-border/50 px-3 py-3 shrink-0 bg-background">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 h-9 text-sm rounded-xl border-border/60"
                disabled={isStreaming || captureSubmitted}
              />
              <Button
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0"
                onClick={handleSend}
                disabled={isStreaming || !input.trim() || captureSubmitted}
                aria-label="Enviar mensagem"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              Linkouzinho · Agência Linkou
            </p>
          </div>
        </div>
      )}

      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
