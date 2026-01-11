import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Pencil, Trash2, FileText, Eye, EyeOff, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

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
  { value: "operacao_guiada", label: "Op. Guiada" },
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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    // Se não tem destino ou não mudou de posição, ignora
    if (!destination) return;
    if (destination.index === source.index) return;

    // Reordenar localmente primeiro (optimistic update)
    const reordered = Array.from(filteredTemplates);
    const [removed] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, removed);

    // Atualizar order_index de cada item
    const updates = reordered.map((template, index) => ({
      id: template.id,
      order_index: index + 1,
    }));

    // Atualizar estado local imediatamente
    setTemplates(prev => {
      const otherPhaseTemplates = prev.filter(t => t.journey_phase !== activePhase);
      const updatedTemplates = reordered.map((t, idx) => ({
        ...t,
        order_index: idx + 1
      }));
      return [...otherPhaseTemplates, ...updatedTemplates].sort((a, b) => a.order_index - b.order_index);
    });

    // Persistir no banco de dados
    try {
      for (const update of updates) {
        const { error } = await supabase
          .from("task_templates")
          .update({ order_index: update.order_index })
          .eq("id", update.id);
        
        if (error) throw error;
      }
      toast.success("Ordem atualizada com sucesso");
    } catch (error) {
      toast.error("Erro ao reordenar templates");
      fetchTemplates(); // Reverter em caso de erro
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = priorities.find((pr) => pr.value === priority);
    return p ? (
      <Badge className={`${p.color} border-0 text-[10px] sm:text-xs`}>{p.label}</Badge>
    ) : (
      <Badge variant="outline" className="text-[10px] sm:text-xs">{priority}</Badge>
    );
  };

  const filteredTemplates = templates.filter((t) => t.journey_phase === activePhase);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Templates de Tarefas
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gerencie os templates padrão para cada fase
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="text-xs sm:text-sm">Novo Template</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4 pb-3">
          <Tabs value={activePhase} onValueChange={setActivePhase}>
            <TabsList className="flex w-full overflow-x-auto gap-1 p-1 sm:grid sm:grid-cols-4 sm:overflow-visible">
              {phases.map((phase) => (
                <TabsTrigger 
                  key={phase.value} 
                  value={phase.value}
                  className="min-w-[75px] sm:min-w-0 shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                >
                  {phase.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">Nenhum template encontrado para esta fase</p>
              <Button variant="outline" size="sm" className="mt-3 sm:mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Criar primeiro template</span>
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              {/* Mobile: Cards empilhados com Drag and Drop */}
              <Droppable droppableId="templates-mobile">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "block sm:hidden space-y-3 transition-colors rounded-lg p-1",
                      snapshot.isDraggingOver && "bg-primary/5"
                    )}
                  >
                    {filteredTemplates.map((template, index) => (
                      <Draggable key={template.id} draggableId={template.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "p-3 rounded-lg border bg-card",
                              !template.is_active && "opacity-50",
                              snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
                            )}
                          >
                            {/* Linha 1: Handle + Ordem + Título + Prioridade */}
                            <div className="flex items-start gap-2 mb-2">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-0.5 cursor-grab active:cursor-grabbing touch-none"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                                    #{template.order_index}
                                  </span>
                                  <p className="font-medium text-sm truncate">{template.title}</p>
                                </div>
                                {getPriorityBadge(template.priority)}
                              </div>
                            </div>

                            {/* Linha 2: Descrição */}
                            {template.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2 ml-6">
                                {template.description}
                              </p>
                            )}

                            {/* Linha 3: Status + Ações */}
                            <div className="flex items-center justify-between pt-2 border-t ml-6">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  {template.visible_to_client ? (
                                    <Eye className="h-3.5 w-3.5 text-primary" />
                                  ) : (
                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    {template.visible_to_client ? "Visível" : "Oculto"}
                                  </span>
                                </div>
                                <Switch
                                  checked={template.is_active}
                                  onCheckedChange={() => handleToggleActive(template)}
                                  className="scale-90"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenDialog(template)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setDeletingTemplate(template);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Desktop: Tabela com Drag and Drop */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead className="w-24">Prioridade</TableHead>
                      <TableHead className="w-24">Visível</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-24 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Droppable droppableId="templates-desktop">
                    {(provided) => (
                      <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                        {filteredTemplates.map((template, index) => (
                          <Draggable key={template.id} draggableId={template.id} index={index}>
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  !template.is_active && "opacity-50",
                                  snapshot.isDragging && "bg-muted shadow-lg"
                                )}
                              >
                                <TableCell
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </TableCell>
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    )}
                  </Droppable>
                </Table>
              </div>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar template */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="title" className="text-xs sm:text-sm">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Mapear funil atual de vendas"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que deve ser feito..."
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="priority" className="text-xs sm:text-sm">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
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
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="order" className="text-xs sm:text-sm">Ordem</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  value={formData.order_index}
                  onChange={(e) =>
                    setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })
                  }
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5 min-w-0 pr-4">
                <Label className="text-xs sm:text-sm">Visível para cliente</Label>
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  Aparecerá no painel do cliente
                </p>
              </div>
              <Switch
                checked={formData.visible_to_client}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, visible_to_client: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5 min-w-0 pr-4">
                <Label className="text-xs sm:text-sm">Template ativo</Label>
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  Disponível para criação em lote
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseDialog} size="sm" className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSave} size="sm" className="w-full sm:w-auto">
              {editingTemplate ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Excluir Template</DialogTitle>
          </DialogHeader>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tem certeza que deseja excluir o template{" "}
            <strong>"{deletingTemplate?.title}"</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} size="sm" className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} size="sm" className="w-full sm:w-auto">
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
