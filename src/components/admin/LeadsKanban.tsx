import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Phone, Building2, Calendar, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string | null;
  investment: string | null;
  objective: string | null;
  status: string | null;
  source: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  new: { label: "Novo", color: "text-blue-500", bgColor: "bg-blue-500/10 border-blue-500/30" },
  contacted: { label: "Contatado", color: "text-yellow-500", bgColor: "bg-yellow-500/10 border-yellow-500/30" },
  qualified: { label: "Qualificado", color: "text-green-500", bgColor: "bg-green-500/10 border-green-500/30" },
  converted: { label: "Convertido", color: "text-purple-500", bgColor: "bg-purple-500/10 border-purple-500/30" },
  lost: { label: "Perdido", color: "text-red-500", bgColor: "bg-red-500/10 border-red-500/30" },
};

const statusOrder = ["new", "contacted", "qualified", "converted", "lost"];

interface LeadsKanbanProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: string) => Promise<void>;
  onLeadClick: (lead: Lead) => void;
}

export function LeadsKanban({ leads, onStatusChange, onLeadClick }: LeadsKanbanProps) {
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não foi solto em um destino válido
    if (!destination) return;

    // Se foi solto na mesma posição
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Atualizar o status do lead
    const newStatus = destination.droppableId;
    await onStatusChange(draggableId, newStatus);
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => (lead.status || "new") === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusOrder.map((status) => {
          const config = statusConfig[status];
          const columnLeads = getLeadsByStatus(status);

          return (
            <div
              key={status}
              className="flex-shrink-0 w-[280px] md:w-[300px]"
            >
              {/* Column Header */}
              <div
                className={cn(
                  "rounded-t-lg border-t-2 p-3 mb-2",
                  config.bgColor
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("font-semibold", config.color)}>
                    {config.label}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {columnLeads.length}
                  </Badge>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[400px] rounded-b-lg border border-dashed p-2 transition-colors",
                        snapshot.isDraggingOver
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/20"
                      )}
                    >
                      {columnLeads.map((lead, index) => (
                        <Draggable
                          key={lead.id}
                          draggableId={lead.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "mb-2 cursor-grab active:cursor-grabbing transition-shadow",
                                snapshot.isDragging && "shadow-lg ring-2 ring-primary"
                              )}
                              onClick={() => onLeadClick(lead)}
                            >
                              <CardContent className="p-3 space-y-2">
                                {/* Nome */}
                                <div className="font-medium text-sm truncate">
                                  {lead.name}
                                </div>

                                {/* Email */}
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{lead.email}</span>
                                </div>

                                {/* Telefone */}
                                {lead.phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}

                                {/* Segmento */}
                                {lead.segment && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Building2 className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{lead.segment}</span>
                                  </div>
                                )}

                                                {/* Data */}
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
                                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                                  <span>
                                                    {format(new Date(lead.created_at), "dd/MM/yy", {
                                                      locale: ptBR,
                                                    })}
                                                  </span>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-1 pt-2 border-t mt-2">
                                                  {lead.phone && (
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      className="flex-1 h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(
                                                          `https://wa.me/55${lead.phone!.replace(/\D/g, "")}`,
                                                          "_blank"
                                                        );
                                                      }}
                                                    >
                                                      <MessageCircle className="h-3 w-3 mr-1" />
                                                      WhatsApp
                                                    </Button>
                                                  )}
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="flex-1 h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      window.open(`mailto:${lead.email}`, "_blank");
                                                    }}
                                                  >
                                                    <Mail className="h-3 w-3 mr-1" />
                                                    Email
                                                  </Button>
                                                </div>
                                              </CardContent>
                                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {columnLeads.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                          Nenhum lead
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
