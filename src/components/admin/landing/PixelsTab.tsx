import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ExternalLink, Facebook, Music2, Target, Linkedin, Save, Copy, FileText } from "lucide-react";

export function PixelsTab() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["landing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    meta_pixel_id: "",
    meta_pixel_enabled: false,
    meta_capi_enabled: false,
    meta_capi_access_token: "",
    meta_capi_test_event_code: "",
    tiktok_pixel_id: "",
    tiktok_pixel_enabled: false,
    tiktok_capi_enabled: false,
    tiktok_access_token: "",
    tiktok_test_event_code: "",
    google_ads_id: "",
    google_ads_conversion_id: "",
    google_ads_enabled: false,
    linkedin_partner_id: "",
    linkedin_enabled: false,
    meta_webhook_verify_token: "",
    meta_app_secret: "",
    meta_page_access_token: "",
  });

  const webhookUrl = "https://inkwweudpaszunmfnogq.supabase.co/functions/v1/meta-lead-webhook";

  useEffect(() => {
    if (settings) {
      setFormData({
        meta_pixel_id: settings.meta_pixel_id || "",
        meta_pixel_enabled: settings.meta_pixel_enabled || false,
        meta_capi_enabled: settings.meta_capi_enabled || false,
        meta_capi_access_token: settings.meta_capi_access_token || "",
        meta_capi_test_event_code: settings.meta_capi_test_event_code || "",
        tiktok_pixel_id: settings.tiktok_pixel_id || "",
        tiktok_pixel_enabled: settings.tiktok_pixel_enabled || false,
        tiktok_capi_enabled: settings.tiktok_capi_enabled || false,
        tiktok_access_token: settings.tiktok_access_token || "",
        tiktok_test_event_code: settings.tiktok_test_event_code || "",
        google_ads_id: settings.google_ads_id || "",
        google_ads_conversion_id: settings.google_ads_conversion_id || "",
        google_ads_enabled: settings.google_ads_enabled || false,
        linkedin_partner_id: settings.linkedin_partner_id || "",
        linkedin_enabled: settings.linkedin_enabled || false,
        meta_webhook_verify_token: settings.meta_webhook_verify_token || "",
        meta_app_secret: settings.meta_app_secret || "",
        meta_page_access_token: settings.meta_page_access_token || "",
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("landing_settings")
        .update(data)
        .eq("id", settings?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-settings"] });
      toast.success("Configurações de pixels salvas!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações");
    },
  });

  const handleSave = () => {
    mutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Meta Pixel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Facebook className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Meta Pixel</CardTitle>
                  <CardDescription>Facebook & Instagram</CardDescription>
                </div>
              </div>
              <Switch
                checked={formData.meta_pixel_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, meta_pixel_enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta_pixel_id">Pixel ID</Label>
              <Input
                id="meta_pixel_id"
                placeholder="123456789012345"
                value={formData.meta_pixel_id}
                onChange={(e) =>
                  setFormData({ ...formData, meta_pixel_id: e.target.value })
                }
              />
            </div>
            <a
              href="https://business.facebook.com/events_manager2/list/pixel/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Como encontrar seu Pixel ID <ExternalLink className="h-3 w-3" />
            </a>

            {/* API de Conversões (CAPI) Section */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium">API de Conversões (Server-Side)</h4>
                  <p className="text-xs text-muted-foreground">
                    Envie eventos diretamente do servidor para maior precisão
                  </p>
                </div>
                <Switch
                  checked={formData.meta_capi_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, meta_capi_enabled: checked })
                  }
                  disabled={!formData.meta_pixel_id}
                />
              </div>

              {formData.meta_capi_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_capi_access_token">Access Token</Label>
                    <Input
                      id="meta_capi_access_token"
                      type="password"
                      placeholder="EAAxxxxxxxxxxxxx..."
                      value={formData.meta_capi_access_token}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_capi_access_token: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_capi_test_event_code">
                      Test Event Code <span className="text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      id="meta_capi_test_event_code"
                      placeholder="TEST12345"
                      value={formData.meta_capi_test_event_code}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_capi_test_event_code: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Use para testar eventos sem afetar suas campanhas
                    </p>
                  </div>
                  <a
                    href="https://developers.facebook.com/docs/marketing-api/conversions-api/get-started#access-token"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Como gerar Access Token <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TikTok Pixel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Music2 className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">TikTok Pixel</CardTitle>
                  <CardDescription>TikTok Ads Manager</CardDescription>
                </div>
              </div>
              <Switch
                checked={formData.tiktok_pixel_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, tiktok_pixel_enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tiktok_pixel_id">Pixel ID</Label>
              <Input
                id="tiktok_pixel_id"
                placeholder="CXXXXXXXXXXXXXXXXX"
                value={formData.tiktok_pixel_id}
                onChange={(e) =>
                  setFormData({ ...formData, tiktok_pixel_id: e.target.value })
                }
              />
            </div>
            <a
              href="https://ads.tiktok.com/i18n/events_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Acessar TikTok Events Manager <ExternalLink className="h-3 w-3" />
            </a>

            {/* TikTok Events API (CAPI) Section */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium">Events API (Server-Side)</h4>
                  <p className="text-xs text-muted-foreground">
                    Envie eventos diretamente do servidor para maior precisão
                  </p>
                </div>
                <Switch
                  checked={formData.tiktok_capi_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, tiktok_capi_enabled: checked })
                  }
                  disabled={!formData.tiktok_pixel_id}
                />
              </div>

              {formData.tiktok_capi_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tiktok_access_token">Access Token</Label>
                    <Input
                      id="tiktok_access_token"
                      type="password"
                      placeholder="Token gerado no TikTok Business Center"
                      value={formData.tiktok_access_token}
                      onChange={(e) =>
                        setFormData({ ...formData, tiktok_access_token: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok_test_event_code">
                      Test Event Code <span className="text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      id="tiktok_test_event_code"
                      placeholder="TEST12345"
                      value={formData.tiktok_test_event_code}
                      onChange={(e) =>
                        setFormData({ ...formData, tiktok_test_event_code: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Use para testar eventos sem afetar suas campanhas
                    </p>
                  </div>
                  <a
                    href="https://business-api.tiktok.com/portal/docs?id=1771100865818625"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Como gerar Access Token <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Google Ads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Target className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Google Ads</CardTitle>
                  <CardDescription>Remarketing e Conversões</CardDescription>
                </div>
              </div>
              <Switch
                checked={formData.google_ads_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, google_ads_enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google_ads_id">ID da Conta</Label>
              <Input
                id="google_ads_id"
                placeholder="AW-XXXXXXXXX"
                value={formData.google_ads_id}
                onChange={(e) =>
                  setFormData({ ...formData, google_ads_id: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_ads_conversion_id">Conversion ID (opcional)</Label>
              <Input
                id="google_ads_conversion_id"
                placeholder="AW-XXXXXXXXX/XXXXX"
                value={formData.google_ads_conversion_id}
                onChange={(e) =>
                  setFormData({ ...formData, google_ads_conversion_id: e.target.value })
                }
              />
            </div>
            <a
              href="https://ads.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Acessar Google Ads <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        {/* LinkedIn Insight */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-700/10">
                  <Linkedin className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <CardTitle className="text-lg">LinkedIn Insight</CardTitle>
                  <CardDescription>Campaign Manager</CardDescription>
                </div>
              </div>
              <Switch
                checked={formData.linkedin_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, linkedin_enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin_partner_id">Partner ID</Label>
              <Input
                id="linkedin_partner_id"
                placeholder="123456"
                value={formData.linkedin_partner_id}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin_partner_id: e.target.value })
                }
              />
            </div>
            <a
              href="https://www.linkedin.com/campaignmanager/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Acessar Campaign Manager <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        {/* Meta Lead Ads Webhook */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Meta Lead Ads</CardTitle>
                <CardDescription>Formulários Instantâneos do Facebook/Instagram</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <Label className="text-xs text-muted-foreground">URL do Webhook</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-xs bg-background p-2 rounded border border-border overflow-x-auto">
                  {webhookUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    toast.success("URL copiada!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="meta_webhook_verify_token">Verify Token</Label>
                <Input
                  id="meta_webhook_verify_token"
                  placeholder="meu_token_secreto"
                  value={formData.meta_webhook_verify_token}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_webhook_verify_token: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Defina um token único para verificar o webhook
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_app_secret">App Secret</Label>
                <Input
                  id="meta_app_secret"
                  type="password"
                  placeholder="Seu App Secret do Meta"
                  value={formData.meta_app_secret}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_app_secret: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Encontre em Meta for Developers {'>'} Seu App
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_page_access_token">Page Access Token</Label>
                <Input
                  id="meta_page_access_token"
                  type="password"
                  placeholder="Token de acesso da página"
                  value={formData.meta_page_access_token}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_page_access_token: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Token para buscar dados dos leads
                </p>
              </div>
            </div>

            <a
              href="https://developers.facebook.com/docs/marketing-api/guides/lead-ads/quickstart/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Guia de configuração Lead Ads <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
