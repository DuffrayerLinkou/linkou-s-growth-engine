import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Save, Code, MessageCircle, Flame, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ScriptsTab() {
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
    head_scripts: "",
    body_scripts: "",
    chat_widget_enabled: false,
    chat_widget_script: "",
    hotjar_id: "",
    hotjar_enabled: false,
    whatsapp_number: "",
    whatsapp_message: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        head_scripts: settings.head_scripts || "",
        body_scripts: settings.body_scripts || "",
        chat_widget_enabled: settings.chat_widget_enabled || false,
        chat_widget_script: settings.chat_widget_script || "",
        hotjar_id: settings.hotjar_id || "",
        hotjar_enabled: settings.hotjar_enabled || false,
        whatsapp_number: settings.whatsapp_number || "",
        whatsapp_message: settings.whatsapp_message || "Olá! Vim do site e gostaria de mais informações.",
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
      toast.success("Scripts e integrações salvos!");
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

      <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Tenha cuidado ao adicionar scripts customizados. Scripts maliciosos podem comprometer a segurança do site.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Custom Scripts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Scripts Customizados</CardTitle>
                <CardDescription>Código adicional para head e body</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="head_scripts">Scripts do Head</Label>
              <Textarea
                id="head_scripts"
                placeholder="<script>...</script>"
                value={formData.head_scripts}
                onChange={(e) =>
                  setFormData({ ...formData, head_scripts: e.target.value })
                }
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Será inserido antes de {"</head>"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body_scripts">Scripts do Body</Label>
              <Textarea
                id="body_scripts"
                placeholder="<script>...</script>"
                value={formData.body_scripts}
                onChange={(e) =>
                  setFormData({ ...formData, body_scripts: e.target.value })
                }
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Será inserido antes de {"</body>"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Chat Widget */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Widget de Chat</CardTitle>
                    <CardDescription>Intercom, Crisp, Tidio, etc.</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={formData.chat_widget_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, chat_widget_enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chat_widget_script">Script do Widget</Label>
                <Textarea
                  id="chat_widget_script"
                  placeholder="<script>window.intercomSettings = {...}</script>"
                  value={formData.chat_widget_script}
                  onChange={(e) =>
                    setFormData({ ...formData, chat_widget_script: e.target.value })
                  }
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Hotjar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Hotjar</CardTitle>
                    <CardDescription>Heatmaps e gravações</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={formData.hotjar_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hotjar_enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hotjar_id">Site ID</Label>
                <Input
                  id="hotjar_id"
                  placeholder="1234567"
                  value={formData.hotjar_id}
                  onChange={(e) =>
                    setFormData({ ...formData, hotjar_id: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-600/10">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">WhatsApp</CardTitle>
                  <CardDescription>Botão flutuante</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
                <Input
                  id="whatsapp_number"
                  placeholder="5511999999999"
                  value={formData.whatsapp_number}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_number: e.target.value.replace(/\D/g, "") })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Formato: código do país + DDD + número (sem espaços)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_message">Mensagem Padrão</Label>
                <Textarea
                  id="whatsapp_message"
                  placeholder="Olá! Vim do site..."
                  value={formData.whatsapp_message}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_message: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
