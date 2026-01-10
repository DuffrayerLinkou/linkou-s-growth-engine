import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Link2, Trash2, History, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UtmEntry {
  id: string;
  url: string;
  source: string;
  medium: string;
  campaign: string;
  createdAt: string;
}

const SOURCES = [
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter/X" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "direct", label: "Direto" },
];

const MEDIUMS = [
  { value: "cpc", label: "CPC (Pago por clique)" },
  { value: "cpm", label: "CPM (Pago por impressão)" },
  { value: "social", label: "Social (Orgânico)" },
  { value: "email", label: "Email" },
  { value: "referral", label: "Referência" },
  { value: "organic", label: "Orgânico" },
  { value: "display", label: "Display" },
  { value: "affiliate", label: "Afiliado" },
];

export function UtmBuilderTab() {
  const [baseUrl, setBaseUrl] = useState("https://");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const [history, setHistory] = useState<UtmEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("utm-history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const generateUrl = () => {
    if (!baseUrl || baseUrl === "https://") return "";
    
    const params = new URLSearchParams();
    if (source) params.append("utm_source", source);
    if (medium) params.append("utm_medium", medium);
    if (campaign) params.append("utm_campaign", campaign);
    if (term) params.append("utm_term", term);
    if (content) params.append("utm_content", content);
    
    const queryString = params.toString();
    if (!queryString) return baseUrl;
    
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${queryString}`;
  };

  const generatedUrl = generateUrl();

  const copyToClipboard = async () => {
    if (!generatedUrl) {
      toast.error("Configure a URL primeiro");
      return;
    }
    
    await navigator.clipboard.writeText(generatedUrl);
    toast.success("URL copiada!");
    
    // Save to history
    const newEntry: UtmEntry = {
      id: Date.now().toString(),
      url: generatedUrl,
      source,
      medium,
      campaign,
      createdAt: new Date().toISOString(),
    };
    
    const newHistory = [newEntry, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem("utm-history", JSON.stringify(newHistory));
  };

  const clearForm = () => {
    setBaseUrl("https://");
    setSource("");
    setMedium("");
    setCampaign("");
    setTerm("");
    setContent("");
  };

  const loadFromHistory = (entry: UtmEntry) => {
    const url = new URL(entry.url);
    setBaseUrl(url.origin + url.pathname);
    setSource(url.searchParams.get("utm_source") || "");
    setMedium(url.searchParams.get("utm_medium") || "");
    setCampaign(url.searchParams.get("utm_campaign") || "");
    setTerm(url.searchParams.get("utm_term") || "");
    setContent(url.searchParams.get("utm_content") || "");
    toast.success("UTM carregada do histórico");
  };

  const removeFromHistory = (id: string) => {
    const newHistory = history.filter((h) => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("utm-history", JSON.stringify(newHistory));
    toast.success("Removido do histórico");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("utm-history");
    toast.success("Histórico limpo");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Builder Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Construtor de UTM</CardTitle>
                  <CardDescription>Gere URLs rastreáveis para suas campanhas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">URL Base *</Label>
                <Input
                  id="baseUrl"
                  placeholder="https://seusite.com/pagina"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="source">Origem (source) *</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medium">Mídia (medium) *</Label>
                  <Select value={medium} onValueChange={setMedium}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a mídia" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIUMS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campanha (campaign) *</Label>
                <Input
                  id="campaign"
                  placeholder="black_friday_2024"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                />
                <p className="text-xs text-muted-foreground">
                  Use underscores ao invés de espaços
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="term">Termo (term) - opcional</Label>
                  <Input
                    id="term"
                    placeholder="palavra_chave"
                    value={term}
                    onChange={(e) => setTerm(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo (content) - opcional</Label>
                  <Input
                    id="content"
                    placeholder="banner_topo"
                    value={content}
                    onChange={(e) => setContent(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={copyToClipboard} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar URL
                </Button>
                <Button variant="outline" onClick={clearForm}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">URL Gerada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted font-mono text-sm break-all">
                {generatedUrl || "Configure os campos acima para gerar a URL"}
              </div>
              {generatedUrl && (
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Testar URL <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Histórico</CardTitle>
                  <CardDescription>{history.length} URLs salvas</CardDescription>
                </div>
              </div>
              {history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory}>
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                As URLs geradas aparecerão aqui
              </p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border bg-muted/30 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString("pt-BR")}
                          </p>
                          <p className="text-xs font-medium">
                            {entry.source} / {entry.medium} / {entry.campaign}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => loadFromHistory(entry)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeFromHistory(entry.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs font-mono break-all text-muted-foreground line-clamp-2">
                        {entry.url}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
