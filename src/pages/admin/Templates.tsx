import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, Eye, EyeOff } from "lucide-react";

interface TaskTemplate {
  id: string;
  journey_phase: string;
  title: string;
  description: string | null;
  priority: string;
  order_index: number;
  visible_to_client: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const phases = [
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "estruturacao", label: "Estruturação" },
  { value: "operacao_guiada", label: "Operação Guiada" },
  { value: "transferencia", label: "Transferência" },
];

const priorities = [
  { value: "low", label: "Baixa", color: "bg-muted text-muted-foreground" },
  { value: "medium", label: "Média", color: "bg-primary/20 text-primary" },
  { value: "high", label: "Alta", color: "bg-orange-500/20 text-orange-600" },
  { value: "urgent", label: "Urgente", color: "bg-destructive/20 text-destructive" },
];

const Templates = () => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState("diagnostico");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<TaskTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    order_index: 0,
    visible_to_client: true,
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("task_templates")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar templates");
      console.error(error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (template?: TaskTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        title: template.title,
        description: template.description || "",
        priority: template.priority,
        order_index: template.order_index,
        visible_to_client: template.visible_to_client,
        is_active: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      const phaseTemplates = templates.filter((t) => t.journey_phase === activePhase);
      const maxOrder = phaseTemplates.reduce((max, t) => Math.max(max, t.order_index), 0);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        order_index: maxOrder + 1,
        visible_to_client: true,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (editingTemplate) {
      const { error } = await supabase
        .from("task_templates")
        .update({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          order_index: formData.order_index,
          visible_to_client: formData.visible_to_client,
          is_active: formData.is_active,
        })
        .eq("id", editingTemplate.id);

      if (error) {
        toast.error("Erro ao atualizar template");
        console.error(error);
      } else {
        toast.success("Template atualizado com sucesso");
        fetchTemplates();
        handleCloseDialog();
      }
    } else {
      const { error } = await supabase.from("task_templates").insert({
        journey_phase: activePhase,
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        order_index: formData.order_index,
        visible_to_client: formData.visible_to_client,
        is_active: formData.is_active,
      });

      if (error) {
        toast.error("Erro ao criar template");
        console.error(error);
      } else {
        toast.success("Template criado com sucesso");
        fetchTemplates();
        handleCloseDialog();
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    const { error } = await supabase
      .from("task_templates")
      .delete()
      .eq("id", deletingTemplate.id);

    if (error) {
      toast.error("Erro ao excluir template");
      console.error(error);
    } else {
      toast.success("Template excluído com sucesso");
      fetchTemplates();
    }
    setIsDeleteDialogOpen(false);
    setDeletingTemplate(null);
  };

  const handleToggleActive = async (template: TaskTemplate) => {
    const { error } = await supabase
      .from("task_templates")
      .update({ is_active: !template.is_active })
      .eq("id", template.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    } else {
      toast.success(template.is_active ? "Template desativado" : "Template ativado");
      fetchTemplates();
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = priorities.find((pr) => pr.value === priority);
    return p ? (
      <Badge className={`${p.color} border-0`}>{p.label}</Badge>
    ) : (
      <Badge variant="outline">{priority}</Badge>
    );
  };

  const filteredTemplates = templates.filter((t) => t.journey_phase === activePhase);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Templates de Tarefas</h1>
            <p className="text-muted-foreground">
              Gerencie os templates padrão para cada fase da jornada
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Tabs value={activePhase} onValueChange={setActivePhase}>
            <TabsList className="grid w-full grid-cols-4">
              {phases.map((phase) => (
                <TabsTrigger key={phase.value} value={phase.value}>
                  {phase.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum template encontrado para esta fase</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="w-24">Prioridade</TableHead>
                  <TableHead className="w-24">Visível</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow
                    key={template.id}
                    className={!template.is_active ? "opacity-50" : ""}
                  >
                    <TableCell className="font-medium">{template.order_index}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.title}</p>
                        {template.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(template.priority)}</TableCell>
                    <TableCell>
                      {template.visible_to_client ? (
                        <Eye className="h-4 w-4 text-primary" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => handleToggleActive(template)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingTemplate(template);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar template */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Mapear funil atual de vendas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que deve ser feito nesta tarefa..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Ordem</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  value={formData.order_index}
                  onChange={(e) =>
                    setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Visível para cliente</Label>
                <p className="text-sm text-muted-foreground">
                  A tarefa aparecerá no painel do cliente
                </p>
              </div>
              <Switch
                checked={formData.visible_to_client}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, visible_to_client: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Template ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Disponível para criação em lote
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Template</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir o template{" "}
            <strong>"{deletingTemplate?.title}"</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
