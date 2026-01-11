import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
  FileText,
  CheckSquare,
  Key,
  CheckCircle2,
  MoreHorizontal,
  Briefcase,
  Wrench,
  FolderOpen,
  File,
  FileImage,
  FileSpreadsheet,
  Video,
  Upload,
  Download,
  Eye,
  Search,
} from "lucide-react";
import { FileUploader } from "@/components/shared/FileUploader";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
  phase_diagnostico_start: string | null;
  phase_diagnostico_end: string | null;
  phase_diagnostico_completed_at: string | null;
  phase_estruturacao_start: string | null;
  phase_estruturacao_end: string | null;
  phase_estruturacao_completed_at: string | null;
  phase_operacao_guiada_start: string | null;
  phase_operacao_guiada_end: string | null;
  phase_operacao_guiada_completed_at: string | null;
  phase_transferencia_start: string | null;
  phase_transferencia_end: string | null;
  phase_transferencia_completed_at: string | null;
}

interface ClientUser {
  id: string;
  email: string;
  full_name: string | null;
  ponto_focal: boolean;
  created_at: string;
  user_type?: "operator" | "manager";
  email_confirmed?: boolean;
}

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  old_data: { phase?: string } | null;
  new_data: { phase?: string } | null;
}

interface TaskTemplate {
  id: string;
  journey_phase: string;
  title: string;
  description: string | null;
  priority: string;
  order_index: number;
  visible_to_client: boolean;
  is_active: boolean;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface FileRecord {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_type: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string | null;
  category: string | null;
  uploaded_by: string | null;
  projects?: { name: string } | null;
  tasks?: { title: string } | null;
}

const categoryLabels: Record<string, string> = {
  general: "Geral",
  campaign_asset: "Mídia para Campanha",
  document_request: "Documento Solicitado",
  deliverable: "Entregável",
};

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  ponto_focal: z.boolean(),
});

import { clientSegments as segments } from "@/lib/segments-config";
import {
  clientStatusLabels as statusLabels,
  clientStatusColors as statusColors,
} from "@/lib/status-config";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isDeleteClientOpen, setIsDeleteClientOpen] = useState(false);
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPhase, setSelectedPhase] = useState<Phase>("diagnostico");
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<Profile[]>([]);
  const [templateFormData, setTemplateFormData] = useState({
    assigned_to: "",
    base_date: new Date().toISOString().split("T")[0],
    interval_days: 7,
  });
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [fileSearch, setFileSearch] = useState("");
  const [fileFilter, setFileFilter] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>("deliverable");
  const [uploadDescription, setUploadDescription] = useState("");
  const { toast } = useToast();

  const [userFormData, setUserFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    ponto_focal: false,
    user_type: "operator" as "operator" | "manager",
  });

  const [editUserFormData, setEditUserFormData] = useState({
    email: "",
    full_name: "",
    ponto_focal: false,
    user_type: "operator" as "operator" | "manager",
  });

  const [newPassword, setNewPassword] = useState("");

  const [clientFormData, setClientFormData] = useState({
    name: "",
    segment: "",
    status: "ativo",
    phase_diagnostico_start: "",
    phase_diagnostico_end: "",
    phase_estruturacao_start: "",
    phase_estruturacao_end: "",
    phase_operacao_guiada_start: "",
    phase_operacao_guiada_end: "",
    phase_transferencia_start: "",
    phase_transferencia_end: "",
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
        phase_diagnostico_start: data.phase_diagnostico_start || "",
        phase_diagnostico_end: data.phase_diagnostico_end || "",
        phase_estruturacao_start: data.phase_estruturacao_start || "",
        phase_estruturacao_end: data.phase_estruturacao_end || "",
        phase_operacao_guiada_start: data.phase_operacao_guiada_start || "",
        phase_operacao_guiada_end: data.phase_operacao_guiada_end || "",
        phase_transferencia_start: data.phase_transferencia_start || "",
        phase_transferencia_end: data.phase_transferencia_end || "",
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
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch profiles from Supabase including user_type
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, ponto_focal, user_type, created_at")
        .eq("client_id", id)
        .order("ponto_focal", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!profiles || profiles.length === 0) {
        setUsers([]);
        return;
      }

      // Fetch email confirmation status from edge function
      let usersWithEmailStatus = profiles.map(p => ({
        ...p,
        user_type: (p.user_type || "operator") as "operator" | "manager",
        email_confirmed: true, // Default to true
      }));

      if (session) {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ action: "list-users" }),
          });

          if (response.ok) {
            const { users: authUsers } = await response.json();
            usersWithEmailStatus = profiles.map(p => {
              const authUser = authUsers?.find((u: any) => u.id === p.id);
              return {
                ...p,
                user_type: (p.user_type || "operator") as "operator" | "manager",
                email_confirmed: authUser?.email_confirmed_at ? true : false,
              };
            });
          }
        } catch {
          // If edge function fails, continue with default values
        }
      }

      setUsers(usersWithEmailStatus);
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

  const fetchTemplates = async (phase: Phase) => {
    const { data, error } = await supabase
      .from("task_templates")
      .select("*")
      .eq("journey_phase", phase)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setTemplates(data as TaskTemplate[]);
      setSelectedTemplates(data.map((t) => t.id));
    }
  };

  const fetchAssignees = async () => {
    // Fetch admin and account_manager users
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "account_manager"]);

    if (roleError || !roleData) return;

    const userIds = roleData.map((r) => r.user_id);
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    if (profileData) {
      setAssignees(profileData as Profile[]);
    }
  };

  const fetchFiles = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("files")
        .select(`*, projects:project_id (name), tasks:task_id (title)`)
        .eq("client_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles((data || []) as FileRecord[]);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchClient(), fetchUsers(), fetchAuditLogs(), fetchAssignees(), fetchFiles()]);
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  const handleDownloadFile = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from("client-files")
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        variant: "destructive",
        title: "Erro ao baixar",
        description: "Não foi possível baixar o arquivo.",
      });
    }
  };

  const handlePreviewFile = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from("client-files")
        .createSignedUrl(file.file_path, 3600);

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error creating preview URL:", error);
      toast({
        variant: "destructive",
        title: "Erro ao visualizar",
        description: "Não foi possível abrir o arquivo.",
      });
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = fileSearch === "" || 
      file.name.toLowerCase().includes(fileSearch.toLowerCase()) ||
      (file.description?.toLowerCase().includes(fileSearch.toLowerCase()));
    
    if (fileFilter === "all") return matchesSearch;
    if (fileFilter === "images") return matchesSearch && file.mime_type?.startsWith("image/");
    if (fileFilter === "documents") return matchesSearch && (file.mime_type?.includes("pdf") || file.mime_type?.includes("document"));
    if (fileFilter === "spreadsheets") return matchesSearch && (file.mime_type?.includes("spreadsheet") || file.mime_type?.includes("excel"));
    if (fileFilter === "videos") return matchesSearch && file.mime_type?.startsWith("video/");
    return matchesSearch;
  });

  const totalFileSize = files.reduce((acc, file) => acc + (file.file_size || 0), 0);

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
          user_type: userFormData.user_type,
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
        user_type: "operator",
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

  const handleOpenEditUser = async (clientUser: ClientUser) => {
    setSelectedUser(clientUser);
    setEditUserFormData({
      email: clientUser.email,
      full_name: clientUser.full_name || "",
      ponto_focal: clientUser.ponto_focal,
      user_type: clientUser.user_type || "operator",
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "update-user",
          user_id: selectedUser.id,
          email: editUserFormData.email,
          full_name: editUserFormData.full_name,
          ponto_focal: editUserFormData.ponto_focal,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Update profile including user_type
      await supabase
        .from("profiles")
        .update({
          full_name: editUserFormData.full_name,
          ponto_focal: editUserFormData.ponto_focal,
          user_type: editUserFormData.user_type,
        })
        .eq("id", selectedUser.id);

      if (editUserFormData.ponto_focal && !selectedUser.ponto_focal) {
        await supabase.rpc("set_ponto_focal", {
          _user_id: selectedUser.id,
          _client_id: id,
        });
      }

      toast({
        title: "Usuário atualizado",
        description: "As informações foram salvas.",
      });

      setIsEditUserOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPasswordDialog = (clientUser: ClientUser) => {
    setSelectedUser(clientUser);
    setNewPassword("");
    setIsPasswordDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (!selectedUser || newPassword.length < 6) {
      setErrors({ password: "Senha deve ter pelo menos 6 caracteres" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "update-user",
          user_id: selectedUser.id,
          password: newPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({
        title: "Senha alterada",
        description: "A nova senha foi definida.",
      });

      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEmail = async (clientUser: ClientUser) => {
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "update-user",
          user_id: clientUser.id,
          confirm_email: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({
        title: "Email confirmado",
        description: "O email do usuário foi confirmado manualmente.",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Error confirming email:", error);
      toast({
        variant: "destructive",
        title: "Erro ao confirmar email",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
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
          phase_diagnostico_start: clientFormData.phase_diagnostico_start || null,
          phase_diagnostico_end: clientFormData.phase_diagnostico_end || null,
          phase_estruturacao_start: clientFormData.phase_estruturacao_start || null,
          phase_estruturacao_end: clientFormData.phase_estruturacao_end || null,
          phase_operacao_guiada_start: clientFormData.phase_operacao_guiada_start || null,
          phase_operacao_guiada_end: clientFormData.phase_operacao_guiada_end || null,
          phase_transferencia_start: clientFormData.phase_transferencia_start || null,
          phase_transferencia_end: clientFormData.phase_transferencia_end || null,
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

  const handleOpenTemplateDialog = async () => {
    if (!client) return;
    await fetchTemplates(client.phase);
    setIsTemplateDialogOpen(true);
  };

  const handleCreateTasksFromTemplates = async () => {
    if (!client || !user || selectedTemplates.length === 0) return;

    setIsSubmitting(true);
    try {
      const selectedItems = templates.filter((t) => selectedTemplates.includes(t.id));
      const baseDate = new Date(templateFormData.base_date);

      const tasksToCreate = selectedItems.map((template, index) => {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + index * templateFormData.interval_days);

        return {
          client_id: id,
          title: template.title,
          description: template.description,
          priority: template.priority,
          journey_phase: template.journey_phase,
          visible_to_client: template.visible_to_client,
          assigned_to: templateFormData.assigned_to || null,
          due_date: dueDate.toISOString().split("T")[0],
          status: "backlog",
          created_by: user.id,
        };
      });

      const { error } = await supabase.from("tasks").insert(tasksToCreate);

      if (error) throw error;

      // Invalidate task queries so lists update
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["client-tasks"] });

      toast({
        title: "Tarefas criadas",
        description: `${tasksToCreate.length} tarefas foram criadas com sucesso.`,
      });

      setIsTemplateDialogOpen(false);
      setSelectedTemplates([]);
    } catch (error) {
      console.error("Error creating tasks:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar tarefas",
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => navigate("/admin/clientes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{client.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="truncate">{client.segment || "Sem segmento"}</span>
              <span className="hidden sm:inline">•</span>
              <Badge
                variant="secondary"
                className={`${statusColors[client.status || "ativo"]} flex-shrink-0`}
              >
                {statusLabels[client.status || "ativo"]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-auto sm:ml-0 pl-10 sm:pl-0">
          <Button variant="outline" size="sm" className="sm:size-default" onClick={() => setIsEditClientOpen(true)}>
            <Pencil className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button variant="destructive" size="sm" className="sm:size-default" onClick={() => setIsDeleteClientOpen(true)}>
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Excluir</span>
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
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full">
            <TabsTrigger value="journey" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3">
              <Route className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Jornada</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Usuários</span>
              <span className="xs:hidden">Users</span>
              <span className="ml-0.5">({users.length})</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3">
              <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Arquivos</span>
              <span className="xs:hidden">Files</span>
              <span className="ml-0.5">({files.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Journey Tab */}
        <TabsContent value="journey" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Jornada Linkou</CardTitle>
                <CardDescription className="text-sm">
                  Acompanhe e gerencie a fase atual do cliente.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={handleOpenTemplateDialog}>
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Criar Tarefas do Template</span>
                  <span className="sm:hidden">Templates</span>
                </Button>
                <Button size="sm" className="text-xs sm:text-sm" onClick={() => {
                  setSelectedPhase(client.phase);
                  setIsPhaseDialogOpen(true);
                }}>
                  Alterar Fase
                </Button>
              </div>
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
                  <div className="space-y-0">
                    {auditLogs.map((log, index) => {
                      const fromPhase = (log.old_data as any)?.phase as Phase;
                      const toPhase = (log.new_data as any)?.phase as Phase;

                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex flex-col gap-1.5 text-sm border-l-2 border-primary/30 pl-3 py-2"
                        >
                          {/* Linha 1: Data/hora */}
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 -ml-[17px]" />
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {format(new Date(log.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          
                          {/* Linha 2: Mudança de fase */}
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm text-muted-foreground">De</span>
                            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                              {getPhaseLabel(fromPhase)}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-xs sm:text-sm text-muted-foreground">para</span>
                            <Badge className="bg-primary/10 text-primary text-[10px] sm:text-xs px-1.5 sm:px-2">
                              {getPhaseLabel(toPhase)}
                            </Badge>
                          </div>
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
                <div className="overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((clientUser, index) => (
                      <motion.tr
                        key={clientUser.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{clientUser.full_name || "Sem nome"}</span>
                            {clientUser.ponto_focal && (
                              <Badge className="bg-yellow-500/10 text-yellow-600 gap-1">
                                <Star className="h-3 w-3" />
                                Ponto Focal
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={clientUser.user_type === "manager" 
                              ? "bg-primary/10 text-primary border-primary/20" 
                              : "bg-muted text-muted-foreground"
                            }
                          >
                            {clientUser.user_type === "manager" ? (
                              <>
                                <Briefcase className="h-3 w-3 mr-1" />
                                Gestor
                              </>
                            ) : (
                              <>
                                <Wrench className="h-3 w-3 mr-1" />
                                Operador
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{clientUser.email}</span>
                            {clientUser.email_confirmed === false && (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs">
                                Não confirmado
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {format(new Date(clientUser.created_at), "dd/MM/yy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditUser(clientUser)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenPasswordDialog(clientUser)}>
                                <Key className="h-4 w-4 mr-2" />
                                Trocar Senha
                              </DropdownMenuItem>
                              {clientUser.email_confirmed === false && (
                                <DropdownMenuItem onClick={() => handleConfirmEmail(clientUser)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Confirmar Email
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {!clientUser.ponto_focal && (
                                <DropdownMenuItem onClick={() => handleSetPontoFocal(clientUser.id)}>
                                  <Star className="h-4 w-4 mr-2" />
                                  Definir Ponto Focal
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{files.length}</p>
                    <p className="text-sm text-muted-foreground">Total de arquivos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Download className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatFileSize(totalFileSize)}</p>
                    <p className="text-sm text-muted-foreground">Tamanho total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Upload */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Arquivos do Cliente</CardTitle>
                <CardDescription>Gerencie os arquivos enviados e recebidos.</CardDescription>
              </div>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Arquivo
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou descrição..."
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={fileFilter} onValueChange={setFileFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="images">Imagens</SelectItem>
                    <SelectItem value="documents">Documentos</SelectItem>
                    <SelectItem value="spreadsheets">Planilhas</SelectItem>
                    <SelectItem value="videos">Vídeos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Files Grid */}
              {filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mb-4 opacity-50" />
                  <p>{files.length === 0 ? "Nenhum arquivo enviado" : "Nenhum arquivo encontrado"}</p>
                  {files.length === 0 && (
                    <Button variant="link" onClick={() => setIsUploadDialogOpen(true)}>
                      Enviar primeiro arquivo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFiles.map((file, index) => {
                    const FileIcon = getFileIcon(file.mime_type);
                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" title={file.name}>
                              {file.name}
                            </p>
                            {file.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {file.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {file.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {categoryLabels[file.category] || file.category}
                                </Badge>
                              )}
                              {file.projects?.name && (
                                <Badge variant="outline" className="text-xs">
                                  {file.projects.name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{formatFileSize(file.file_size)}</span>
                              {file.created_at && (
                                <>
                                  <span>•</span>
                                  <span>{format(new Date(file.created_at), "dd/MM/yy", { locale: ptBR })}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handlePreviewFile(file)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
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

            <div className="space-y-2">
              <Label>Tipo de usuário</Label>
              <Select
                value={userFormData.user_type}
                onValueChange={(value: "operator" | "manager") =>
                  setUserFormData({ ...userFormData, user_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Operador
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Gestor do Negócio
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Gestor: responsável pelas decisões. Operador: executa tarefas do dia a dia.
              </p>
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

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Nome completo</Label>
              <Input
                id="edit_full_name"
                value={editUserFormData.full_name}
                onChange={(e) =>
                  setEditUserFormData({ ...editUserFormData, full_name: e.target.value })
                }
                placeholder="Nome do usuário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editUserFormData.email}
                onChange={(e) =>
                  setEditUserFormData({ ...editUserFormData, email: e.target.value })
                }
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de usuário</Label>
              <Select
                value={editUserFormData.user_type}
                onValueChange={(value: "operator" | "manager") =>
                  setEditUserFormData({ ...editUserFormData, user_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Operador
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Gestor do Negócio
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Gestor: responsável pelas decisões. Operador: executa tarefas do dia a dia.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_ponto_focal"
                checked={editUserFormData.ponto_focal}
                onChange={(e) =>
                  setEditUserFormData({ ...editUserFormData, ponto_focal: e.target.checked })
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="edit_ponto_focal" className="cursor-pointer">
                Ponto Focal
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trocar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {selectedUser?.full_name || selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova senha</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize as informações do cliente e os prazos das fases da jornada.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Informações Básicas</h4>
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

            {/* Phase Dates */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Prazos das Fases da Jornada</h4>
              
              {/* Diagnóstico */}
              <div className="space-y-2">
                <Label className="text-primary font-medium">1. Diagnóstico</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input
                      type="date"
                      value={clientFormData.phase_diagnostico_start}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, phase_diagnostico_start: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Término</Label>
                    <Input
                      type="date"
                      value={clientFormData.phase_diagnostico_end}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, phase_diagnostico_end: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Estruturação */}
              <div className="space-y-2">
                <Label className="text-primary font-medium">2. Estruturação</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input
                      type="date"
                      value={clientFormData.phase_estruturacao_start}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, phase_estruturacao_start: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Término</Label>
                    <Input
                      type="date"
                      value={clientFormData.phase_estruturacao_end}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, phase_estruturacao_end: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Operação Guiada */}
              <div className="space-y-2">
                <Label className="text-primary font-medium">3. Operação Guiada</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input
                      type="date"
                      value={clientFormData.phase_operacao_guiada_start}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, phase_operacao_guiada_start: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Término</Label>
                    <Input
                      type="date"
                      value={clientFormData.phase_operacao_guiada_end}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, phase_operacao_guiada_end: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Transferência */}
              <div className="space-y-2">
                <Label className="text-primary font-medium">4. Transferência</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input
                      type="date"
                      value={clientFormData.phase_transferencia_start}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, phase_transferencia_start: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Término</Label>
                    <Input
                      type="date"
                      value={clientFormData.phase_transferencia_end}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, phase_transferencia_end: e.target.value })
                      }
                    />
                  </div>
                </div>
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

      {/* Template Tasks Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Criar Tarefas do Template
            </DialogTitle>
            <DialogDescription>
              Crie tarefas em lote para a fase "{getPhaseLabel(client.phase)}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Nenhum template ativo para esta fase.</p>
                <p className="text-sm">Crie templates em Admin → Templates.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Selecione os templates</Label>
                  <div className="space-y-2 border rounded-lg p-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-start gap-3 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          id={template.id}
                          checked={selectedTemplates.includes(template.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTemplates([...selectedTemplates, template.id]);
                            } else {
                              setSelectedTemplates(
                                selectedTemplates.filter((id) => id !== template.id)
                              );
                            }
                          }}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={template.id}
                            className="font-medium cursor-pointer text-sm"
                          >
                            {template.order_index}. {template.title}
                          </label>
                          {template.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {template.priority === "high"
                            ? "Alta"
                            : template.priority === "low"
                            ? "Baixa"
                            : template.priority === "urgent"
                            ? "Urgente"
                            : "Média"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplates(templates.map((t) => t.id))}
                    >
                      Selecionar todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplates([])}
                    >
                      Limpar seleção
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Responsável</Label>
                  <Select
                    value={templateFormData.assigned_to}
                    onValueChange={(value) =>
                      setTemplateFormData({ ...templateFormData, assigned_to: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignees.map((assignee) => (
                        <SelectItem key={assignee.id} value={assignee.id}>
                          {assignee.full_name || assignee.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_date">Data base</Label>
                    <Input
                      id="base_date"
                      type="date"
                      value={templateFormData.base_date}
                      onChange={(e) =>
                        setTemplateFormData({ ...templateFormData, base_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interval_days">Intervalo (dias)</Label>
                    <Input
                      id="interval_days"
                      type="number"
                      min="0"
                      value={templateFormData.interval_days}
                      onChange={(e) =>
                        setTemplateFormData({
                          ...templateFormData,
                          interval_days: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {selectedTemplates.length} tarefa(s) serão criadas
                  {templateFormData.interval_days > 0 &&
                    `, com intervalo de ${templateFormData.interval_days} dia(s) entre cada uma`}
                  .
                </p>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTasksFromTemplates}
              disabled={isSubmitting || selectedTemplates.length === 0}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar {selectedTemplates.length} Tarefas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        setIsUploadDialogOpen(open);
        if (!open) {
          setUploadCategory("deliverable");
          setUploadDescription("");
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Enviar Arquivo
            </DialogTitle>
            <DialogDescription>
              Envie arquivos para o cliente {client.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upload-category">Categoria</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deliverable">Entregável</SelectItem>
                  <SelectItem value="campaign_asset">Mídia para Campanha</SelectItem>
                  <SelectItem value="document_request">Documento Solicitado</SelectItem>
                  <SelectItem value="general">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-description">Descrição (opcional)</Label>
              <Textarea
                id="upload-description"
                placeholder="Descreva o arquivo..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={2}
              />
            </div>

            <FileUploader
              clientId={id!}
              category={uploadCategory as "general" | "campaign_asset" | "document_request" | "deliverable"}
              description={uploadDescription}
              onUploadComplete={() => {
                fetchFiles();
                setIsUploadDialogOpen(false);
                setUploadCategory("deliverable");
                setUploadDescription("");
                toast({
                  title: "Arquivo enviado",
                  description: "O arquivo foi enviado com sucesso.",
                });
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
