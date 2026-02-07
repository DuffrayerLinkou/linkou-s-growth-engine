import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, Copy, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CapturePage {
  id: string;
  title: string;
  slug: string;
  headline: string;
  subheadline: string | null;
  benefits: string[];
  button_text: string;
  thank_you_message: string;
  thank_you_redirect_url: string | null;
  primary_color: string;
  background_color: string;
  text_color: string;
  logo_url: string | null;
  background_image_url: string | null;
  form_fields: string[];
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
}

const defaultForm = {
  title: "",
  slug: "",
  headline: "",
  subheadline: "",
  benefits: [""],
  button_text: "Quero começar agora",
  thank_you_message: "Obrigado! Entraremos em contato em breve.",
  thank_you_redirect_url: "",
  primary_color: "#7C3AED",
  background_color: "#0F0A1A",
  text_color: "#FFFFFF",
  logo_url: "",
  background_image_url: "",
  is_active: true,
  meta_title: "",
  meta_description: "",
};

const CapturePages = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [pages, setPages] = useState<CapturePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const fetchPages = async () => {
    const { data } = await supabase
      .from("capture_pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setPages(
        data.map((p: any) => ({
          ...p,
          benefits: Array.isArray(p.benefits) ? p.benefits : [],
          form_fields: Array.isArray(p.form_fields) ? p.form_fields : ["name", "email", "phone"],
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, []);

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: editingId ? f.slug : generateSlug(title),
    }));
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...form.benefits];
    newBenefits[index] = value;
    setForm({ ...form, benefits: newBenefits });
  };

  const addBenefit = () => setForm({ ...form, benefits: [...form.benefits, ""] });
  const removeBenefit = (index: number) =>
    setForm({ ...form, benefits: form.benefits.filter((_, i) => i !== index) });

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (page: CapturePage) => {
    setEditingId(page.id);
    setForm({
      title: page.title,
      slug: page.slug,
      headline: page.headline,
      subheadline: page.subheadline || "",
      benefits: page.benefits.length > 0 ? page.benefits : [""],
      button_text: page.button_text,
      thank_you_message: page.thank_you_message,
      thank_you_redirect_url: page.thank_you_redirect_url || "",
      primary_color: page.primary_color,
      background_color: page.background_color,
      text_color: page.text_color,
      logo_url: page.logo_url || "",
      background_image_url: page.background_image_url || "",
      is_active: page.is_active,
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.headline) {
      toast({ variant: "destructive", title: "Preencha título, slug e headline" });
      return;
    }

    const payload = {
      title: form.title,
      slug: form.slug,
      headline: form.headline,
      subheadline: form.subheadline || null,
      benefits: form.benefits.filter((b) => b.trim()),
      button_text: form.button_text,
      thank_you_message: form.thank_you_message,
      thank_you_redirect_url: form.thank_you_redirect_url || null,
      primary_color: form.primary_color,
      background_color: form.background_color,
      text_color: form.text_color,
      logo_url: form.logo_url || null,
      background_image_url: form.background_image_url || null,
      form_fields: ["name", "email", "phone"],
      is_active: form.is_active,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("capture_pages").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("capture_pages").insert({ ...payload, created_by: user?.id }));
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message.includes("duplicate") ? "Este slug já existe." : error.message,
      });
      return;
    }

    toast({ title: editingId ? "Página atualizada!" : "Página criada!" });
    setDialogOpen(false);
    fetchPages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta página?")) return;
    await supabase.from("capture_pages").delete().eq("id", id);
    toast({ title: "Página excluída" });
    fetchPages();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("capture_pages").update({ is_active: !current }).eq("id", id);
    fetchPages();
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL copiada!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Páginas de Captura</h1>
          <p className="text-muted-foreground text-sm">
            Crie páginas de conversão para suas campanhas
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Página
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma página de captura criada ainda.</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira página
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} className="group relative">
              <div
                className="h-2 rounded-t-lg"
                style={{ backgroundColor: page.primary_color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{page.title}</CardTitle>
                  <Badge variant={page.is_active ? "default" : "secondary"}>
                    {page.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">/c/{page.slug}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{page.headline}</p>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(page)}>
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyUrl(page.slug)}>
                    <Copy className="h-3 w-3 mr-1" />
                    URL
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a href={`/c/${page.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActive(page.id, page.is_active)}
                  >
                    {page.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(page.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Página" : "Nova Página de Captura"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título interno *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex: Black Friday 2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug da URL *</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">/c/</span>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="black-friday"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Headline principal *</Label>
              <Input
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="Aumente suas vendas em até 300%"
              />
            </div>

            <div className="space-y-2">
              <Label>Sub-headline</Label>
              <Input
                value={form.subheadline}
                onChange={(e) => setForm({ ...form, subheadline: e.target.value })}
                placeholder="Texto complementar abaixo da headline"
              />
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <Label>Benefícios / Bullets</Label>
              {form.benefits.map((benefit, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={benefit}
                    onChange={(e) => handleBenefitChange(i, e.target.value)}
                    placeholder={`Benefício ${i + 1}`}
                  />
                  {form.benefits.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeBenefit(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addBenefit}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>

            {/* CTA */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Texto do botão</Label>
                <Input
                  value={form.button_text}
                  onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem de obrigado</Label>
                <Input
                  value={form.thank_you_message}
                  onChange={(e) => setForm({ ...form, thank_you_message: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL de redirecionamento (opcional)</Label>
              <Input
                value={form.thank_you_redirect_url}
                onChange={(e) => setForm({ ...form, thank_you_redirect_url: e.target.value })}
                placeholder="https://seusite.com/obrigado"
              />
              <p className="text-xs text-muted-foreground">
                Se preenchido, redireciona ao invés de mostrar mensagem de obrigado
              </p>
            </div>

            {/* Visual */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Aparência</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cor primária</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={form.primary_color}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor de fundo</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.background_color}
                      onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={form.background_color}
                      onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor do texto</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.text_color}
                      onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={form.text_color}
                      onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>URL do Logo</Label>
                <Input
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL da imagem de fundo</Label>
                <Input
                  value={form.background_image_url}
                  onChange={(e) => setForm({ ...form, background_image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* SEO */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">SEO</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input
                    value={form.meta_title}
                    onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Input
                    value={form.meta_description}
                    onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3 border-t pt-4">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Página ativa</Label>
            </div>

            {/* Preview strip */}
            <div
              className="rounded-lg p-4 text-center"
              style={{
                backgroundColor: form.background_color,
                color: form.text_color,
              }}
            >
              <p className="text-xs opacity-60 mb-1">Preview</p>
              <p className="font-bold">{form.headline || "Sua headline aqui"}</p>
              <button
                className="mt-2 px-4 py-1 rounded text-sm text-white"
                style={{ backgroundColor: form.primary_color }}
              >
                {form.button_text}
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingId ? "Salvar alterações" : "Criar página"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CapturePages;
