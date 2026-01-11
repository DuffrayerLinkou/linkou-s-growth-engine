import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertCircle, Route, Star, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
  assigned_to: string | null;
  created_at: string | null;
  journey_phase: string | null;
  visible_to_client: boolean | null;
  executor_type: string | null;
  project_id: string | null;
}

interface TasksKanbanClientProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  currentUserId?: string;
  onTaskClick?: (task: Task) => void;
}

export function TasksKanbanClient({ tasks, onStatusChange, currentUserId, onTaskClick }: TasksKanbanClientProps) {
  const { toast } = useToast();

  // Check if user can move this task
  const canMoveTask = (task: Task) => {
    return task.executor_type === "client" && task.assigned_to === currentUserId;
  };

  // Allowed statuses for client to move to
  const clientAllowedStatuses = ["todo", "in_progress", "completed"];

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Check if user can move this task
    if (!canMoveTask(task)) {
      toast({
        variant: "destructive",
        title: "Ação não permitida",
        description: "Você só pode mover suas próprias tarefas.",
      });
      return;
    }

    // Check if destination is allowed
    if (!clientAllowedStatuses.includes(destination.droppableId)) {
      toast({
        variant: "destructive",
        title: "Status não permitido",
        description: "Você pode mover tarefas apenas entre A Fazer, Em Andamento e Concluído.",
      });
      return;
    }

    const newStatus = destination.droppableId;
    await onStatusChange(draggableId, newStatus);
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((task) => (task.status || "backlog") === status);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0">
        {statusColumns.map((status) => {
          const config = statusConfig[status];
          const columnTasks = getTasksByStatus(status);

          return (
            <div
              key={status}
              className="flex-shrink-0 w-[220px] sm:w-[240px] md:w-[260px] lg:w-[280px]"
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
                  <ScrollArea className="h-[calc(100vh-300px)] sm:h-[calc(100vh-340px)] md:h-[calc(100vh-380px)] min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[300px] sm:min-h-[350px] md:min-h-[400px] rounded-b-lg border border-dashed p-1.5 sm:p-2 transition-colors",
                        snapshot.isDraggingOver
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/20"
                      )}
                    >
                      {columnTasks.map((task, index) => {
                        const overdue = isTaskOverdue(task.due_date, task.status);
                        const isMyTask = canMoveTask(task);
                        const isDraggable = isMyTask && task.status !== "completed";

                        return (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                            isDragDisabled={!isDraggable}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => onTaskClick?.(task)}
                                className={cn(
                                  "mb-2 transition-all",
                                  isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                                  snapshot.isDragging && "shadow-lg ring-2 ring-primary",
                                  isMyTask 
                                    ? "border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/10 to-transparent shadow-sm" 
                                    : "hover:border-primary/50",
                                  overdue && !isMyTask && "border-red-500/50 bg-red-500/5"
                                )}
                              >
                                <CardContent className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                                  {/* Title + My Task indicator */}
                                  <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                                    <h4 className={cn(
                                      "font-medium text-xs sm:text-sm line-clamp-2",
                                      task.status === "completed" && "line-through text-muted-foreground"
                                    )}>
                                      {task.title}
                                    </h4>
                                    {isMyTask && (
                                      <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                                    )}
                                  </div>

                                  {/* My Task Badge + Phase */}
                                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                                    {isMyTask && (
                                      <Badge className="text-xs bg-amber-500 text-white hover:bg-amber-600">
                                        <Star className="h-3 w-3 mr-1 fill-current" />
                                        Sua Responsabilidade
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

                                  {/* Description preview */}
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {task.description}
                                    </p>
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

                                    {task.status === "completed" && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
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
