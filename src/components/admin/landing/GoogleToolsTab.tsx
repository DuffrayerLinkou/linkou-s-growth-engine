import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ExternalLink, Save, Box, BarChart3, Search, CheckCircle2, XCircle } from "lucide-react";

export function GoogleToolsTab() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["landing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_settings")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    gtm_id: "",
    gtm_enabled: false,
    ga4_measurement_id: "",
    ga4_enabled: false,
    search_console_verification: "",
    search_console_verified: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        gtm_id: settings.gtm_id || "",
        gtm_enabled: settings.gtm_enabled || false,
        ga4_measurement_id: settings.ga4_measurement_id || "",
        ga4_enabled: settings.ga4_enabled || false,
        search_console_verification: settings.search_console_verification || "",
        search_console_verified: settings.search_console_verified || false,
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
      toast.success("Configurações Google salvas!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações");
    },
  });

  const handleSave = () => {
    mutation.mutate(formData);
  };

  const validateGtmId = (id: string) => /^GTM-[A-Z0-9]+$/.test(id);
  const validateGa4Id = (id: string) => /^G-[A-Z0-9]+$/.test(id);

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Google Tag Manager */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Box className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Tag Manager</CardTitle>
                  <CardDescription>Gerenciador de Tags</CardDescription>
                </div>
              </div>
              <Switch
                checked={formData.gtm_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, gtm_enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gtm_id">Container ID</Label>
              <div className="relative">
                <Input
                  id="gtm_id"
                  placeholder="GTM-XXXXXXX"
                  value={formData.gtm_id}
                  onChange={(e) =>
                    setFormData({ ...formData, gtm_id: e.target.value.toUpperCase() })
                  }
                />
                {formData.gtm_id && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {validateGtmId(formData.gtm_id) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {formData.gtm_id && !validateGtmId(formData.gtm_id) && (
                <p className="text-xs text-destructive">Formato: GTM-XXXXXXX</p>
              )}
            </div>
            <a
              href="https://tagmanager.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Acessar Tag Manager <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        {/* Google Analytics 4 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Analytics 4</CardTitle>
                  <CardDescription>Métricas e Relatórios</CardDescription>
                </div>
              </div>
              <Switch
                checked={formData.ga4_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ga4_enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ga4_measurement_id">Measurement ID</Label>
              <div className="relative">
                <Input
                  id="ga4_measurement_id"
                  placeholder="G-XXXXXXXXXX"
                  value={formData.ga4_measurement_id}
                  onChange={(e) =>
                    setFormData({ ...formData, ga4_measurement_id: e.target.value.toUpperCase() })
                  }
                />
                {formData.ga4_measurement_id && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {validateGa4Id(formData.ga4_measurement_id) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {formData.ga4_measurement_id && !validateGa4Id(formData.ga4_measurement_id) && (
                <p className="text-xs text-destructive">Formato: G-XXXXXXXXXX</p>
              )}
            </div>
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Acessar Analytics <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        {/* Search Console */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Search className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Search Console</CardTitle>
                  <CardDescription>Verificação do Site</CardDescription>
                </div>
              </div>
              {formData.search_console_verified ? (
                <Badge variant="default" className="bg-green-500">Verificado</Badge>
              ) : (
                <Badge variant="secondary">Pendente</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search_console_verification">Meta Tag de Verificação</Label>
              <Input
                id="search_console_verification"
                placeholder="google-site-verification=..."
                value={formData.search_console_verification}
                onChange={(e) =>
                  setFormData({ ...formData, search_console_verification: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Copie o valor do atributo "content" da meta tag
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="search_console_verified"
                checked={formData.search_console_verified}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, search_console_verified: checked })
                }
              />
              <Label htmlFor="search_console_verified" className="text-sm">
                Marcar como verificado
              </Label>
            </div>
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Acessar Search Console <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="p-2 rounded-lg bg-primary/10 h-fit">
              <Box className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Dica: Use o Google Tag Manager</h4>
              <p className="text-sm text-muted-foreground">
                Recomendamos usar o GTM para gerenciar todos os seus pixels e tags em um só lugar. 
                Assim você pode adicionar Meta Pixel, TikTok, Google Ads e outros diretamente no GTM, 
                sem precisar modificar o código do site.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
