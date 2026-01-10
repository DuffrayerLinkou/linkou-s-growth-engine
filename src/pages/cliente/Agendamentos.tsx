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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth, isSameDay, addDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

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

export default function ClienteAgendamentos() {
  const { clientInfo } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const { data: appointments = [], isLoading } = useQuery({
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

  // Get appointments for selected date
  const todayAppointments = appointments.filter((apt) =>
    isSameDay(new Date(apt.appointment_date), selectedDate)
  );

  // Get dates with appointments for calendar highlighting
  const datesWithAppointments = appointments.map((apt) =>
    new Date(apt.appointment_date)
  );

  // Upcoming appointments
  const now = new Date();
  const upcomingAppointments = appointments.filter((apt) =>
    isAfter(new Date(apt.appointment_date), now)
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
      <div>
        <h1 className="text-3xl font-bold">Meus Agendamentos</h1>
        <p className="text-muted-foreground">
          Visualize suas reuniões e compromissos agendados
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Este mês</p>
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
                <p className="text-sm text-muted-foreground">Próximos</p>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
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
              }}
              modifiersStyles={{
                hasAppointment: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                },
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Selected Day Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((apt, index) => {
                  const TypeIcon = typeConfig[apt.type || "meeting"]?.icon || Video;
                  return (
                    <motion.div
                      key={apt.id}
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
                                <h4 className="font-semibold">{apt.title}</h4>
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
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Nenhum agendamento para este dia
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Agendamentos</CardTitle>
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
              <p>Nenhum agendamento futuro</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
