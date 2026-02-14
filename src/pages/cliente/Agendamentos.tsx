import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Phone,
  Users,
  CheckCircle,
  CalendarDays,
  ListTodo,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth, isSameDay, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { RequestAppointmentDialog } from "@/components/cliente/RequestAppointmentDialog";

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  duration_minutes: number | null;
  type: string | null;
  status: string | null;
  location: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string | null;
  priority: string | null;
  journey_phase: string | null;
}

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: "appointment" | "task";
  description: string | null;
  appointmentData?: Appointment;
  taskData?: Task;
};

const typeConfig: Record<string, { label: string; icon: typeof Video; color: string }> = {
  meeting: { label: "Reunião", icon: Video, color: "bg-blue-500/20 text-blue-600" },
  call: { label: "Ligação", icon: Phone, color: "bg-green-500/20 text-green-600" },
  review: { label: "Revisão", icon: CheckCircle, color: "bg-purple-500/20 text-purple-600" },
  kickoff: { label: "Kickoff", icon: Users, color: "bg-orange-500/20 text-orange-600" },
  training: { label: "Treinamento", icon: Users, color: "bg-indigo-500/20 text-indigo-600" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Agendado", color: "bg-muted text-muted-foreground" },
  confirmed: { label: "Confirmado", color: "bg-blue-500/20 text-blue-600" },
  completed: { label: "Concluído", color: "bg-green-500/20 text-green-600" },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-600" },
};

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: "A Fazer", color: "bg-slate-500/20 text-slate-600" },
  backlog: { label: "Backlog", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-600" },
  blocked: { label: "Bloqueado", color: "bg-red-500/20 text-red-600" },
  completed: { label: "Concluído", color: "bg-green-500/20 text-green-600" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-muted-foreground" },
  medium: { label: "Média", color: "text-yellow-600" },
  high: { label: "Alta", color: "text-orange-600" },
  urgent: { label: "Urgente", color: "text-red-600" },
};

export default function ClienteAgendamentos() {
  const { clientInfo } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  // Fetch appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["client-appointments", clientInfo?.id, format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      if (!clientInfo?.id) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", clientInfo.id)
        .gte("appointment_date", monthStart.toISOString())
        .lte("appointment_date", monthEnd.toISOString())
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!clientInfo?.id,
  });

  // Fetch tasks with due dates
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["client-tasks-calendar", clientInfo?.id, format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      if (!clientInfo?.id) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, due_date, status, priority, journey_phase")
        .eq("client_id", clientInfo.id)
        .eq("visible_to_client", true)
        .not("due_date", "is", null)
        .gte("due_date", format(monthStart, "yyyy-MM-dd"))
        .lte("due_date", format(monthEnd, "yyyy-MM-dd"))
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!clientInfo?.id,
  });

  const isLoading = appointmentsLoading || tasksLoading;

  // Combine appointments and tasks into calendar events
  const calendarEvents: CalendarEvent[] = [
    ...appointments.map((apt) => ({
      id: apt.id,
      title: apt.title,
      date: new Date(apt.appointment_date),
      type: "appointment" as const,
      description: apt.description,
      appointmentData: apt,
    })),
    ...tasks.map((task) => ({
      id: task.id,
      title: task.title,
      date: parseISO(task.due_date),
      type: "task" as const,
      description: task.description,
      taskData: task,
    })),
  ];

  // Get events for selected date
  const todayEvents = calendarEvents.filter((event) =>
    isSameDay(event.date, selectedDate)
  );

  // Get dates with appointments for calendar highlighting
  const datesWithAppointments = appointments.map((apt) =>
    new Date(apt.appointment_date)
  );

  // Get dates with task deadlines for calendar highlighting
  const datesWithTasks = tasks.map((task) => parseISO(task.due_date));

  // Upcoming appointments
  const now = new Date();
  const upcomingAppointments = appointments.filter((apt) =>
    isAfter(new Date(apt.appointment_date), now)
  );

  // Upcoming task deadlines
  const upcomingTasks = tasks.filter(
    (task) => isAfter(parseISO(task.due_date), now) && task.status !== "completed"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Meus Agendamentos</h1>
          <p className="text-muted-foreground">
            Visualize suas reuniões, compromissos e prazos de tarefas
          </p>
        </div>
        <RequestAppointmentDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reuniões</p>
                <p className="text-2xl font-bold">{appointments.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prazos</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                <ListTodo className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximas reuniões</p>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prazos pendentes</p>
                <p className="text-2xl font-bold">{upcomingTasks.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              modifiers={{
                hasAppointment: datesWithAppointments,
                hasTask: datesWithTasks,
              }}
              modifiersStyles={{
                hasAppointment: {
                  fontWeight: "bold",
                  borderBottom: "2px solid hsl(var(--primary))",
                },
                hasTask: {
                  fontWeight: "bold",
                  borderBottom: "2px solid hsl(25, 95%, 53%)",
                },
              }}
              className="rounded-md border"
            />
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-primary rounded" />
                <span>Reuniões</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-orange-500 rounded" />
                <span>Prazos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayEvents.length > 0 ? (
              <div className="space-y-3">
                {todayEvents.map((event, index) => {
                  if (event.type === "appointment" && event.appointmentData) {
                    const apt = event.appointmentData;
                    const TypeIcon = typeConfig[apt.type || "meeting"]?.icon || Video;
                    return (
                      <motion.div
                        key={`apt-${apt.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  typeConfig[apt.type || "meeting"]?.color ||
                                  "bg-muted"
                                }`}
                              >
                                <TypeIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{apt.title}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      Reunião
                                    </Badge>
                                  </div>
                                  <Badge
                                    className={
                                      statusConfig[apt.status || "scheduled"]?.color
                                    }
                                  >
                                    {statusConfig[apt.status || "scheduled"]?.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {format(new Date(apt.appointment_date), "HH:mm")}
                                  <span>•</span>
                                  <span>{apt.duration_minutes || 60} min</span>
                                </div>
                                {apt.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {apt.description}
                                  </p>
                                )}
                                {apt.location && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    {apt.location.startsWith("http") ? (
                                      <a
                                        href={apt.location}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        Abrir link da reunião
                                      </a>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        {apt.location}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  }

                  if (event.type === "task" && event.taskData) {
                    const task = event.taskData;
                    return (
                      <motion.div
                        key={`task-${task.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-orange-500/30">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-orange-500/20 text-orange-600">
                                <ListTodo className="h-5 w-5" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{task.title}</h4>
                                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/30">
                                      Prazo
                                    </Badge>
                                  </div>
                                  <Badge
                                    className={
                                      taskStatusConfig[task.status || "backlog"]?.color
                                    }
                                  >
                                    {taskStatusConfig[task.status || "backlog"]?.label}
                                  </Badge>
                                </div>
                                {task.priority && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <AlertCircle className={`h-3 w-3 ${priorityConfig[task.priority]?.color}`} />
                                    <span className={priorityConfig[task.priority]?.color}>
                                      Prioridade {priorityConfig[task.priority]?.label}
                                    </span>
                                  </div>
                                )}
                                {task.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  }

                  return null;
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Nenhum evento para este dia
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Próximas Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-2">
                {upcomingAppointments.slice(0, 5).map((apt, index) => {
                  const TypeIcon = typeConfig[apt.type || "meeting"]?.icon || Video;
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[50px]">
                          <div className="text-lg font-bold">
                            {format(new Date(apt.appointment_date), "dd")}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase">
                            {format(new Date(apt.appointment_date), "MMM", {
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium">{apt.title}</h4>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(apt.appointment_date), "HH:mm")} •{" "}
                            {apt.duration_minutes || 60} min
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={typeConfig[apt.type || "meeting"]?.color}>
                          {typeConfig[apt.type || "meeting"]?.label}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma reunião agendada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Task Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Próximos Prazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTasks.slice(0, 5).map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <div className="text-lg font-bold">
                          {format(parseISO(task.due_date), "dd")}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {format(parseISO(task.due_date), "MMM", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        {task.priority && (
                          <div className={`text-sm ${priorityConfig[task.priority]?.color}`}>
                            Prioridade {priorityConfig[task.priority]?.label}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={taskStatusConfig[task.status || "backlog"]?.color}>
                      {taskStatusConfig[task.status || "backlog"]?.label}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum prazo pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
