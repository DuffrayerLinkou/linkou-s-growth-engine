import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Search,
  Plus,
  Building2,
  Loader2,
  ChevronRight,
  AlertCircle,
  Circle,
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
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  segment: string | null;
  status: string | null;
  phase: string;
  created_at: string;
  user_count?: number;
  has_ponto_focal?: boolean;
}

const clientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  segment: z.string().optional().or(z.literal("")),
  status: z.string().default("ativo"),
});

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

const phaseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  estruturacao: "Estruturação",
  operacao_guiada: "Operação Guiada",
  transferencia: "Transferência",
};

const phaseColors: Record<string, string> = {
  diagnostico: "bg-blue-500/10 text-blue-600",
  estruturacao: "bg-purple-500/10 text-purple-600",
  operacao_guiada: "bg-orange-500/10 text-orange-600",
  transferencia: "bg-green-500/10 text-green-600",
};

export default function AdminClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    segment: "",
    status: "ativo",
  });

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar contagem de usuários e status de ponto focal para cada cliente
      const clientsWithDetails = await Promise.all(
        (data || []).map(async (client) => {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id);

          const { data: pontoFocalData } = await supabase
            .from("profiles")
            .select("id")
            .eq("client_id", client.id)
            .eq("ponto_focal", true)
            .limit(1);

          return {
            ...client,
            user_count: count || 0,
            has_ponto_focal: (pontoFocalData?.length || 0) > 0,
          };
        })
      );

      setClients(clientsWithDetails);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openForm = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        name: client.name,
        segment: client.segment || "",
        status: client.status || "ativo",
      });
    } else {
      setSelectedClient(null);
      setFormData({
        name: "",
        segment: "",
        status: "ativo",
      });
    }
    setErrors({});
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    setErrors({});
    const result = clientSchema.safeParse(formData);

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
      const clientData = {
        name: formData.name.trim(),
        segment: formData.segment || null,
        status: formData.status,
      };

      if (selectedClient) {
        const { error } = await supabase
          .from("clients")
          .update(clientData)
          .eq("id", selectedClient.id);

        if (error) throw error;

        toast({
          title: "Cliente atualizado",
          description: "As informações foram salvas.",
        });
      } else {
        const { error } = await supabase
          .from("clients")
          .insert(clientData);

        if (error) throw error;

        toast({
          title: "Cliente criado",
          description: "O novo cliente foi adicionado.",
        });
      }

      setIsFormOpen(false);
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.segment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes e seus usuários.
          </p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum cliente encontrado</p>
              <Button variant="link" onClick={() => openForm()}>
                Criar primeiro cliente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Segmento</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Usuários</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/clientes/${client.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="font-medium flex items-center gap-2">
                          {client.name}
                          {client.user_count! > 0 && !client.has_ponto_focal && (
                            <span title="Sem ponto focal">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {client.segment || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={phaseColors[client.phase] || "bg-muted"}
                      >
                        <Circle className="h-2 w-2 mr-1 fill-current" />
                        {phaseLabels[client.phase] || client.phase}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="secondary"
                        className={statusColors[client.status || "ativo"]}
                      >
                        {statusLabels[client.status || "ativo"]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {client.user_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {selectedClient
                ? "Atualize as informações do cliente."
                : "Preencha os dados do novo cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da empresa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do cliente"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Select
                  value={formData.segment}
                  onValueChange={(value) =>
                    setFormData({ ...formData, segment: value })
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
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
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
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {selectedClient ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
