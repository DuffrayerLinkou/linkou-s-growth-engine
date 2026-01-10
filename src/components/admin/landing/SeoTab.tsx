import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Save, Globe, Image, FileText, Eye } from "lucide-react";

export function SeoTab() {
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
    site_title: "",
    site_description: "",
    og_image_url: "",
    favicon_url: "",
    robots_txt: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        site_title: settings.site_title || "",
        site_description: settings.site_description || "",
        og_image_url: settings.og_image_url || "",
        favicon_url: settings.favicon_url || "",
        robots_txt: settings.robots_txt || "User-agent: *\nAllow: /\n\nSitemap: https://seusite.com/sitemap.xml",
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
      toast.success("Configurações de SEO salvas!");
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

  const titleLength = formData.site_title.length;
  const descriptionLength = formData.site_description.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SEO Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Meta Tags</CardTitle>
                  <CardDescription>Título e descrição para buscadores</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="site_title">Título do Site</Label>
                  <span className={`text-xs ${titleLength > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {titleLength}/60
                  </span>
                </div>
                <Input
                  id="site_title"
                  placeholder="Agência Linkou | Performance · Tráfego · Vendas"
                  value={formData.site_title}
                  onChange={(e) =>
                    setFormData({ ...formData, site_title: e.target.value })
                  }
                  maxLength={70}
                />
                {titleLength > 60 && (
                  <p className="text-xs text-destructive">
                    Título muito longo. Pode ser cortado nos resultados do Google.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="site_description">Meta Description</Label>
                  <span className={`text-xs ${descriptionLength > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {descriptionLength}/160
                  </span>
                </div>
                <Textarea
                  id="site_description"
                  placeholder="Não gerenciamos contas. Criamos ecossistemas de tráfego e vendas..."
                  value={formData.site_description}
                  onChange={(e) =>
                    setFormData({ ...formData, site_description: e.target.value })
                  }
                  rows={3}
                  maxLength={170}
                />
                {descriptionLength > 160 && (
                  <p className="text-xs text-destructive">
                    Descrição muito longa. Pode ser cortada nos resultados do Google.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Open Graph</CardTitle>
                  <CardDescription>Imagem para compartilhamento social</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="og_image_url">URL da Imagem OG</Label>
                <Input
                  id="og_image_url"
                  placeholder="https://seusite.com/og-image.png"
                  value={formData.og_image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, og_image_url: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Tamanho recomendado: 1200x630 pixels
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon_url">URL do Favicon</Label>
                <Input
                  id="favicon_url"
                  placeholder="https://seusite.com/favicon.ico"
                  value={formData.favicon_url}
                  onChange={(e) =>
                    setFormData({ ...formData, favicon_url: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Robots.txt</CardTitle>
                  <CardDescription>Instruções para crawlers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={formData.robots_txt}
                onChange={(e) =>
                  setFormData({ ...formData, robots_txt: e.target.value })
                }
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Eye className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Preview do Google</CardTitle>
                  <CardDescription>Como seu site aparecerá nos resultados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-sm text-muted-foreground">seusite.com.br</p>
                <p className="text-lg text-blue-600 hover:underline cursor-pointer font-medium">
                  {formData.site_title || "Título do seu site aparecerá aqui"}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {formData.site_description || "A descrição do seu site aparecerá aqui. Escreva algo que atraia cliques e descreva bem o conteúdo da página."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview Social</CardTitle>
              <CardDescription>Como aparecerá quando compartilhado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-muted/30">
                {formData.og_image_url ? (
                  <img
                    src={formData.og_image_url}
                    alt="OG Preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/1200x630/1a1a2e/ffffff?text=OG+Image";
                    }}
                  />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Imagem OG não configurada</p>
                  </div>
                )}
                <div className="p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">seusite.com.br</p>
                  <p className="font-semibold line-clamp-1">
                    {formData.site_title || "Título do Site"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {formData.site_description || "Descrição do site"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
