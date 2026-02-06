import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, RefreshCw, Loader2, CheckCircle2, XCircle, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ConfigData {
  config: {
    id: string;
    is_enabled: boolean;
    webhook_configured: boolean;
    verify_token: string;
    last_synced_at: string | null;
  };
  has_secrets: boolean;
  webhook_url: string;
  verify_token: string;
}

interface ConnectionResult {
  connected: boolean;
  phone_number?: string;
  quality_rating?: string;
  verified_name?: string;
  error?: string;
}

export function WhatsAppConfig() {
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configData, isLoading } = useQuery<ConfigData>({
    queryKey: ["whatsapp-config"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("whatsapp-api", { body: { action: "get-config" } });
      if (error) throw error;
      return data as ConfigData;
    },
  });

  const { data: templateCount = 0 } = useQuery({
    queryKey: ["whatsapp-templates-count"],
    queryFn: async () => {
      const { count } = await (supabase.from("whatsapp_templates") as any)
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      return count || 0;
    },
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-api", { body: { action: "test-connection" } });
      if (error) throw error;
      setConnectionResult(data as ConnectionResult);
    } catch {
      setConnectionResult({ connected: false, error: "Erro ao testar conexão" });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncTemplates = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-api", { body: { action: "sync-templates" } });
      if (error) throw error;
      toast({ title: "Templates sincronizados", description: `${data.count} templates aprovados encontrados` });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates-count"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
    } catch {
      toast({ variant: "destructive", title: "Erro ao sincronizar templates" });
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {configData?.has_secrets ? (
              <Wifi className="h-5 w-5 text-[#25D366]" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            Status da Conexão
          </CardTitle>
          <CardDescription>
            {configData?.has_secrets
              ? "Secrets configurados. Teste a conexão para verificar."
              : "Configure os secrets para ativar a API."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={configData?.has_secrets ? "default" : "secondary"}>
              {configData?.has_secrets ? "Secrets OK" : "Secrets Pendentes"}
            </Badge>
          </div>

          {!configData?.has_secrets && (
            <div className="p-3 rounded-lg bg-muted text-sm space-y-2">
              <p className="font-medium">Secrets necessários:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
                <li><code>WHATSAPP_ACCESS_TOKEN</code> - Token permanente da Meta</li>
                <li><code>WHATSAPP_PHONE_NUMBER_ID</code> - ID do número</li>
                <li><code>WHATSAPP_BUSINESS_ACCOUNT_ID</code> - ID da conta business</li>
                <li><code>WHATSAPP_VERIFY_TOKEN</code> - Token de verificação do webhook</li>
              </ul>
            </div>
          )}

          <Button onClick={handleTestConnection} disabled={testing} variant="outline" className="w-full gap-2">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
            Testar Conexão
          </Button>

          {connectionResult && (
            <div className={`p-3 rounded-lg text-sm ${connectionResult.connected ? "bg-[#25D366]/10" : "bg-destructive/10"}`}>
              <div className="flex items-center gap-2 mb-1">
                {connectionResult.connected ? (
                  <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="font-medium">
                  {connectionResult.connected ? "Conectado" : "Desconectado"}
                </span>
              </div>
              {connectionResult.connected ? (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Número: {connectionResult.phone_number}</p>
                  <p>Nome: {connectionResult.verified_name}</p>
                  <p>Qualidade: {connectionResult.quality_rating}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{connectionResult.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook</CardTitle>
          <CardDescription>
            Cole estas informações no Meta Developers → WhatsApp → Configuration → Webhook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Webhook URL</Label>
            <div className="flex gap-2 mt-1">
              <Input value={configData?.webhook_url || ""} readOnly className="text-xs font-mono" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy(configData?.webhook_url || "", "URL")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs">Verify Token</Label>
            <div className="flex gap-2 mt-1">
              <Input value={configData?.verify_token || ""} readOnly className="text-xs font-mono" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy(configData?.verify_token || "", "Token")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
            <p className="font-medium mb-1">Campos para assinar no webhook:</p>
            <code>messages, message_deliveries, message_reads</code>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Templates Aprovados</CardTitle>
            <CardDescription>
              {templateCount} template{templateCount !== 1 ? "s" : ""} disponíve{templateCount !== 1 ? "is" : "l"}
              {configData?.config?.last_synced_at && (
                <> · Última sincronização: {new Date(configData.config.last_synced_at).toLocaleString("pt-BR")}</>
              )}
            </CardDescription>
          </div>
          <Button onClick={handleSyncTemplates} disabled={syncing} variant="outline" className="gap-2">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sincronizar
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
