import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  Users,
  Star,
  UserPlus,
  Loader2,
  AlertTriangle,
  Pencil,
  Trash2,
  Mail,
  Route,
  ArrowRight,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { JourneyStepper, Phase, getPhaseLabel, getAllPhases } from "@/components/journey/JourneyStepper";

interface Client {
  id: string;
  name: string;
  segment: string | null;
  status: string | null;
  phase: Phase;
  autonomy: boolean;
  created_at: string;
}

interface ClientUser {
  id: string;
  email: string;
  full_name: string | null;
  ponto_focal: boolean;
  created_at: string;
}

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  old_data: { phase?: string } | null;
  new_data: { phase?: string } | null;
}

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  ponto_focal: z.boolean(),
});

const statusColors: Record<string, string> = {
  ativo: "bg-green-500/10 text-green-500",
  pausado: "bg-yellow-500/10 text-yellow-500",
  encerrado: "bg-red-500/10 text-red-500",
};

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
};

const segments = [
  "Construtora / Incorporadora",
  "Imobiliária",
  "B2B / Serviços",
  "E-commerce",
  "SaaS",
  "Educação",
  "Saúde",
  "Outro",
];

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isDeleteClientOpen, setIsDeleteClientOpen] = useState(false);
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPhase, setSelectedPhase] = useState<Phase>("diagnostico");
  const { toast } = useToast();

  const [userFormData, setUserFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    ponto_focal: false,
  });

  const [clientFormData, setClientFormData] = useState({
    name: "",
    segment: "",
    status: "ativo",
  });

  const hasPontoFocal = users.some((u) => u.ponto_focal);

  const fetchClient = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setClient(data as Client);
      setSelectedPhase(data.phase as Phase);
      setClientFormData({
        name: data.name,
        segment: data.segment || "",
        status: data.status || "ativo",
      });
    } catch (error) {
      console.error("Error fetching client:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar cliente",
        description: "Cliente não encontrado.",
      });
      navigate("/admin/clientes");
    }
  };

  const fetchUsers = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, ponto_focal, created_at")
        .eq("client_id", id)
        .order("ponto_focal", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchAuditLogs = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, created_at, action, old_data, new_data")
        .eq("client_id", id)
        .eq("action", "phase_changed")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setAuditLogs((data || []) as AuditLog[]);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchClient(), fetchUsers(), fetchAuditLogs()]);
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  const handleCreateUser = async () => {
    setErrors({});
    const result = userSchema.safeParse(userFormData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userFormData.email,
        password: userFormData.password,
        options: {
          data: {
            full_name: userFormData.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          client_id: id,
          full_name: userFormData.full_name,
          ponto_focal: userFormData.ponto_focal,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      if (userFormData.ponto_focal) {
        await supabase.rpc("set_ponto_focal", {
          _user_id: authData.user.id,
          _client_id: id,
        });
      }

      toast({
        title: "Usuário criado",
        description: "O usuário foi adicionado ao cliente.",
      });

      setIsUserFormOpen(false);
      setUserFormData({
        email: "",
        full_name: "",
        password: "",
        ponto_focal: false,
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPontoFocal = async (userId: string) => {
    try {
      await supabase.rpc("set_ponto_focal", {
        _user_id: userId,
        _client_id: id,
      });

      toast({
        title: "Ponto focal definido",
        description: "O usuário foi definido como ponto focal.",
      });

      fetchUsers();
    } catch (error) {
      console.error("Error setting ponto focal:", error);
      toast({
        variant: "destructive",
        title: "Erro ao definir ponto focal",
        description: "Tente novamente.",
      });
    }
  };

  const handleUpdateClient = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name: clientFormData.name,
          segment: clientFormData.segment || null,
          status: clientFormData.status,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Cliente atualizado",
        description: "As informações foram salvas.",
      });

      setIsEditClientOpen(false);
      fetchClient();
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePhase = async () => {
    if (!client || !user) return;

    setIsSubmitting(true);
    try {
      const fromPhase = client.phase;
      const toPhase = selectedPhase;

      // Update client phase
      const updateData: any = { phase: toPhase };
      if (toPhase === "transferencia") {
        updateData.autonomy = true;
      }

      const { error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Log the change
      await supabase.rpc("log_phase_change", {
        _client_id: id,
        _actor_user_id: user.id,
        _from_phase: fromPhase,
        _to_phase: toPhase,
      });

      toast({
        title: "Fase alterada",
        description: `Cliente movido para "${getPhaseLabel(toPhase)}".`,
      });

      setIsPhaseDialogOpen(false);
      fetchClient();
      fetchAuditLogs();
    } catch (error) {
      console.error("Error changing phase:", error);
      toast({
        variant: "destructive",
        title: "Erro ao alterar fase",
        description: "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido.",
      });

      navigate("/admin/clientes");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Tente novamente.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clientes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{client.segment || "Sem segmento"}</span>
                <span>•</span>
                <Badge
                  variant="secondary"
                  className={statusColors[client.status || "ativo"]}
                >
                  {statusLabels[client.status || "ativo"]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditClientOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteClientOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Alert sem ponto focal */}
      {users.length > 0 && !hasPontoFocal && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção!</AlertTitle>
          <AlertDescription>
            Este cliente não possui um ponto focal definido. Defina um usuário como ponto focal abaixo.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="journey" className="space-y-4">
        <TabsList>
          <TabsTrigger value="journey" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Jornada
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* Journey Tab */}
        <TabsContent value="journey" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Jornada Linkou</CardTitle>
                <CardDescription>
                  Acompanhe e gerencie a fase atual do cliente.
                </CardDescription>
              </div>
              <Button onClick={() => {
                setSelectedPhase(client.phase);
                setIsPhaseDialogOpen(true);
              }}>
                Alterar Fase
              </Button>
            </CardHeader>
            <CardContent>
              <JourneyStepper currentPhase={client.phase} />

              {/* Audit Log Timeline */}
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-medium mb-4">Histórico de Alterações</h4>
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ainda não há histórico de mudanças de fase.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log, index) => {
                      const fromPhase = (log.old_data as any)?.phase as Phase;
                      const toPhase = (log.new_data as any)?.phase as Phase;

                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 text-sm"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          <span className="text-muted-foreground">
                            {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </span>
                          <span>Fase alterada de</span>
                          <Badge variant="outline" className="text-xs">
                            {getPhaseLabel(fromPhase)}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge className="bg-primary/10 text-primary text-xs">
                            {getPhaseLabel(toPhase)}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Todo cliente precisa ter exatamente 1 ponto focal. O ponto focal é o contato principal.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Usuários do Cliente</CardTitle>
                <CardDescription>Gerencie os usuários vinculados a este cliente.</CardDescription>
              </div>
              <Button onClick={() => setIsUserFormOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Usuário
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum usuário vinculado</p>
                  <Button variant="link" onClick={() => setIsUserFormOpen(true)}>
                    Criar primeiro usuário
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                      <TableHead className="w-[150px]">Ponto Focal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.full_name || "Sem nome"}</span>
                            {user.ponto_focal && (
                              <Badge className="bg-yellow-500/10 text-yellow-600 gap-1">
                                <Star className="h-3 w-3" />
                                Ponto Focal
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {format(new Date(user.created_at), "dd/MM/yy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {user.ponto_focal ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              Atual
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetPontoFocal(user.id)}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Definir
                            </Button>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Phase Change Dialog */}
      <Dialog open={isPhaseDialogOpen} onOpenChange={setIsPhaseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alterar Fase</DialogTitle>
            <DialogDescription>
              Selecione a nova fase para o cliente {client.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fase atual</Label>
              <Badge variant="outline" className="text-sm">
                {getPhaseLabel(client.phase)}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>Nova fase</Label>
              <Select
                value={selectedPhase}
                onValueChange={(value) => setSelectedPhase(value as Phase)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAllPhases().map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPhase === "transferencia" && (
              <p className="text-sm text-muted-foreground">
                ⚠️ Ao mover para Transferência, o cliente será marcado como autônomo.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhaseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleChangePhase} 
              disabled={isSubmitting || selectedPhase === client.phase}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Alterar Fase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário para o cliente {client.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo *</Label>
              <Input
                id="full_name"
                value={userFormData.full_name}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, full_name: e.target.value })
                }
                placeholder="Nome do usuário"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, email: e.target.value })
                }
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={userFormData.password}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, password: e.target.value })
                }
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ponto_focal"
                checked={userFormData.ponto_focal}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, ponto_focal: e.target.checked })
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="ponto_focal" className="cursor-pointer">
                Definir como Ponto Focal
              </Label>
            </div>

            {!hasPontoFocal && users.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Este será o primeiro usuário. Considere defini-lo como ponto focal.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize as informações do cliente.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Nome *</Label>
              <Input
                id="client_name"
                value={clientFormData.name}
                onChange={(e) =>
                  setClientFormData({ ...clientFormData, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Select
                  value={clientFormData.segment}
                  onValueChange={(value) =>
                    setClientFormData({ ...clientFormData, segment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.map((seg) => (
                      <SelectItem key={seg} value={seg}>
                        {seg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={clientFormData.status}
                  onValueChange={(value) =>
                    setClientFormData({ ...clientFormData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditClientOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateClient} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Client Alert */}
      <AlertDialog open={isDeleteClientOpen} onOpenChange={setIsDeleteClientOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente "{client.name}" e todos os dados
              associados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
