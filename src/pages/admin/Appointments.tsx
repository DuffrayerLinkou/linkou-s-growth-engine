import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Video,
  Phone,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth, isSameDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  client_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  appointment_date: string;
  duration_minutes: number | null;
  type: string | null;
  status: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string | null;
  clients?: { name: string } | null;
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

export default function AdminAppointments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_id: "",
    appointment_date: "",
    appointment_time: "10:00",
    duration_minutes: "60",
    type: "meeting",
    status: "scheduled",
    location: "",
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["admin-appointments", clientFilter, format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`*, clients(name)`)
        .gte("appointment_date", monthStart.toISOString())
        .lte("appointment_date", monthEnd.toISOString())
        .order("appointment_date", { ascending: true });

      if (clientFilter && clientFilter !== "all") {
        query = query.eq("client_id", clientFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Create/Update mutation
  const appointmentMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const appointmentDateTime = new Date(`${data.appointment_date}T${data.appointment_time}`);
      
      const appointmentData = {
        title: data.title,
        description: data.description || null,
        client_id: data.client_id,
        appointment_date: appointmentDateTime.toISOString(),
        duration_minutes: parseInt(data.duration_minutes) || 60,
        type: data.type,
        status: data.status,
        location: data.location || null,
        created_by: user?.id || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("appointments").insert(appointmentData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      setIsDialogOpen(false);
      setEditingAppointment(null);
      resetForm();
      toast({
        title: editingAppointment ? "Agendamento atualizado!" : "Agendamento criado!",
        description: "O agendamento foi salvo com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar agendamento",
        description: error.message,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      setDeleteId(null);
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      client_id: "",
      appointment_date: "",
      appointment_time: "10:00",
      duration_minutes: "60",
      type: "meeting",
      status: "scheduled",
      location: "",
    });
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    const date = new Date(appointment.appointment_date);
    setFormData({
      title: appointment.title,
      description: appointment.description || "",
      client_id: appointment.client_id,
      appointment_date: format(date, "yyyy-MM-dd"),
      appointment_time: format(date, "HH:mm"),
      duration_minutes: String(appointment.duration_minutes || 60),
      type: appointment.type || "meeting",
      status: appointment.status || "scheduled",
      location: appointment.location || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.client_id || !formData.appointment_date) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha o título, cliente e data.",
      });
      return;
    }
    appointmentMutation.mutate(
      editingAppointment ? { ...formData, id: editingAppointment.id } : formData
    );
  };

  // Get appointments for selected date
  const todayAppointments = appointments.filter((apt) =>
    isSameDay(new Date(apt.appointment_date), selectedDate)
  );

  // Get dates with appointments for calendar highlighting
  const datesWithAppointments = appointments.map((apt) =>
    new Date(apt.appointment_date)
  );

  // Upcoming appointments (next 7 days)
  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.appointment_date);
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return aptDate >= today && aptDate <= nextWeek;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie reuniões e compromissos com clientes
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAppointment(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Reunião de alinhamento"
                />
              </div>

              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) =>
                      setFormData({ ...formData, appointment_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) =>
                      setFormData({ ...formData, appointment_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Select
                    value={formData.duration_minutes}
                    onValueChange={(value) =>
                      setFormData({ ...formData, duration_minutes: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h30</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Local / Link</Label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Ex: https://meet.google.com/xxx"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Notas sobre a reunião..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={appointmentMutation.isPending}>
                  {appointmentMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Clientes</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((apt) => {
                  const TypeIcon = typeConfig[apt.type || "meeting"]?.icon || Video;
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  typeConfig[apt.type || "meeting"]?.color ||
                                  "bg-muted"
                                }`}
                              >
                                <TypeIcon className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-semibold">{apt.title}</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {format(new Date(apt.appointment_date), "HH:mm")}
                                  <span>•</span>
                                  <span>{apt.duration_minutes} min</span>
                                </div>
                                <Badge variant="outline">{apt.clients?.name}</Badge>
                                {apt.location && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {apt.location.startsWith("http") ? (
                                      <a
                                        href={apt.location}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        Abrir link
                                      </a>
                                    ) : (
                                      apt.location
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  statusConfig[apt.status || "scheduled"]?.color
                                }
                              >
                                {statusConfig[apt.status || "scheduled"]?.label}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(apt)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setDeleteId(apt.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-2">
              {upcomingAppointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => openEditDialog(apt)}
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
                        {apt.clients?.name} •{" "}
                        {format(new Date(apt.appointment_date), "HH:mm")}
                      </div>
                    </div>
                  </div>
                  <Badge className={typeConfig[apt.type || "meeting"]?.color}>
                    {typeConfig[apt.type || "meeting"]?.label}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Nenhum agendamento nos próximos 7 dias
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agendamento será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
