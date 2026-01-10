import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertCircle, EyeOff, Route, Users, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  TaskStatus,
  JourneyPhase,
  statusConfig,
  priorityConfig,
  journeyPhaseConfig,
  statusColumns,
  isTaskOverdue,
} from "@/lib/task-config";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  client_id: string;
  project_id: string | null;
  assigned_to: string | null;
  created_at: string | null;
  journey_phase: string | null;
  visible_to_client: boolean | null;
  executor_type: string | null;
  clients?: { name: string } | null;
}

interface TasksKanbanProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  onTaskClick: (task: Task) => void;
  assigneeNames: Map<string, string>;
}

export function TasksKanban({ tasks, onStatusChange, onTaskClick, assigneeNames }: TasksKanbanProps) {
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    await onStatusChange(draggableId, newStatus);
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((task) => (task.status || "backlog") === status);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((status) => {
          const config = statusConfig[status];
          const columnTasks = getTasksByStatus(status);

          return (
            <div
              key={status}
              className="flex-shrink-0 w-[260px] md:w-[280px]"
            >
              {/* Column Header */}
              <div
                className={cn(
                  "rounded-t-lg border-t-2 p-3 mb-2",
                  config.color.replace("text-", "border-").split(" ")[0],
                  config.color
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {config.label}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {columnTasks.length}
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
                      {columnTasks.map((task, index) => {
                        const overdue = isTaskOverdue(task.due_date, task.status);

                        return (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "mb-2 cursor-grab active:cursor-grabbing transition-shadow",
                                  snapshot.isDragging && "shadow-lg ring-2 ring-primary",
                                  overdue && "border-red-500 bg-red-500/5"
                                )}
                                onClick={() => onTaskClick(task)}
                              >
                                <CardContent className="p-3 space-y-2">
                                  {/* Title + visibility */}
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-medium text-sm line-clamp-2">
                                      {task.title}
                                    </h4>
                                    {task.visible_to_client === false && (
                                      <EyeOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                  </div>

                                  {/* Client + Executor Type + Phase */}
                                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                                    <Badge variant="outline" className="text-xs">
                                      {task.clients?.name || "Sem cliente"}
                                    </Badge>
                                    {task.executor_type === "client" && (
                                      <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600">
                                        <Users className="h-3 w-3 mr-1" />
                                        Cliente
                                      </Badge>
                                    )}
                                    {task.journey_phase && journeyPhaseConfig[task.journey_phase as JourneyPhase] && (
                                      <Badge
                                        variant="secondary"
                                        className={`text-xs ${journeyPhaseConfig[task.journey_phase as JourneyPhase].color}`}
                                      >
                                        <Route className="h-3 w-3 mr-1" />
                                        {journeyPhaseConfig[task.journey_phase as JourneyPhase].label}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Assignee */}
                                  {task.assigned_to && assigneeNames.get(task.assigned_to) && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <User className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{assigneeNames.get(task.assigned_to)}</span>
                                    </div>
                                  )}

                                  {/* Priority + Due Date */}
                                  <div className="flex items-center justify-between text-xs pt-1 border-t">
                                    {task.priority && (
                                      <span
                                        className={cn(
                                          "flex items-center gap-1",
                                          priorityConfig[task.priority]?.color || "text-muted-foreground"
                                        )}
                                      >
                                        <AlertCircle className="h-3 w-3" />
                                        {priorityConfig[task.priority]?.label || task.priority}
                                      </span>
                                    )}

                                    {task.due_date && (
                                      <span
                                        className={cn(
                                          "flex items-center gap-1",
                                          overdue
                                            ? "text-red-600 font-medium"
                                            : "text-muted-foreground"
                                        )}
                                      >
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(task.due_date), "dd/MM", {
                                          locale: ptBR,
                                        })}
                                        {overdue && <AlertCircle className="h-3 w-3" />}
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}

                      {columnTasks.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                          Nenhuma tarefa
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
