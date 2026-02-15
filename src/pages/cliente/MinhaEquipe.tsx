import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClientPermissions } from "@/hooks/useClientPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Pencil, Star, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  user_type: string | null;
  ponto_focal: boolean;
  avatar_url: string | null;
}

export default function MinhaEquipe() {
  const { user } = useAuth();
  const { canManageTeam } = useClientPermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Invite form state
  const [invEmail, setInvEmail] = useState("");
  const [invPassword, setInvPassword] = useState("");
  const [invName, setInvName] = useState("");
  const [invType, setInvType] = useState("operator");
  const [invPontoFocal, setInvPontoFocal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("operator");
  const [editPontoFocal, setEditPontoFocal] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("manage-users", {
        body: { action: "list-team" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      return (res.data?.members || []) as TeamMember[];
    },
    enabled: canManageTeam,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("manage-users", {
        body: {
          action: "invite-team-member",
          email: invEmail,
          password: invPassword,
          full_name: invName,
          user_type: invType,
          ponto_focal: invPontoFocal,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Membro convidado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setInviteOpen(false);
      setInvEmail(""); setInvPassword(""); setInvName(""); setInvType("operator"); setInvPontoFocal(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao convidar", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingMember) return;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("manage-users", {
        body: {
          action: "update-team-member",
          user_id: editingMember.id,
          full_name: editName,
          user_type: editType,
          ponto_focal: editPontoFocal,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Membro atualizado!" });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setEditOpen(false);
      setEditingMember(null);
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    },
  });

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditName(member.full_name || "");
    setEditType(member.user_type || "operator");
    setEditPontoFocal(member.ponto_focal);
    setEditOpen(true);
  };

  if (!canManageTeam) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a gestores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> Minha Equipe
          </h1>
          <p className="text-muted-foreground">Gerencie os membros da sua equipe</p>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" /> Convidar Membro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Membro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="email@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Senha Temporária *</Label>
                <Input type="password" value={invPassword} onChange={(e) => setInvPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Nome do colaborador" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={invType} onValueChange={setInvType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="manager">Gestor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={invPontoFocal} onCheckedChange={setInvPontoFocal} />
                <Label>Ponto Focal</Label>
              </div>
              <Button className="w-full" onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !invEmail || !invPassword}>
                {inviteMutation.isPending ? "Convidando..." : "Convidar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membros ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum membro encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <span>{m.full_name || "Sem nome"}</span>
                        {m.id === user?.id && (
                          <Badge variant="outline" className="text-[10px]">Você</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>
                      <Badge variant={m.user_type === "manager" ? "default" : "secondary"}>
                        {m.user_type === "manager" ? "Gestor" : "Operador"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {m.ponto_focal && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-[10px] font-medium">
                          <Star className="h-2.5 w-2.5 fill-current" /> Ponto Focal
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operador</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editPontoFocal} onCheckedChange={setEditPontoFocal} />
              <Label>Ponto Focal</Label>
            </div>
            <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
