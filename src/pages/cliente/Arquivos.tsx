import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FileDown,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  Filter,
  Download,
  Eye,
  Calendar,
  FolderOpen,
  Search,
  Upload,
  User,
  Users,
  Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
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
import { toast } from "sonner";
import { FileUploader } from "@/components/shared/FileUploader";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FileRecord {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_type: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string | null;
  project_id: string | null;
  task_id: string | null;
  category: string | null;
  uploaded_by: string | null;
  projects?: {
    name: string;
  } | null;
  tasks?: {
    title: string;
  } | null;
}

const fileTypeConfig: Record<string, { icon: typeof File; color: string }> = {
  pdf: { icon: FileText, color: "text-red-500" },
  doc: { icon: FileText, color: "text-blue-500" },
  docx: { icon: FileText, color: "text-blue-500" },
  xls: { icon: FileSpreadsheet, color: "text-green-500" },
  xlsx: { icon: FileSpreadsheet, color: "text-green-500" },
  csv: { icon: FileSpreadsheet, color: "text-green-500" },
  png: { icon: FileImage, color: "text-purple-500" },
  jpg: { icon: FileImage, color: "text-purple-500" },
  jpeg: { icon: FileImage, color: "text-purple-500" },
  gif: { icon: FileImage, color: "text-purple-500" },
  svg: { icon: FileImage, color: "text-purple-500" },
  mp4: { icon: Video, color: "text-pink-500" },
  mov: { icon: Video, color: "text-pink-500" },
  webm: { icon: Video, color: "text-pink-500" },
};

const categoryLabels: Record<string, string> = {
  general: "Geral",
  campaign_asset: "Mídia para Campanha",
  document_request: "Documento Solicitado",
  deliverable: "Entregável",
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

export default function ClienteArquivos() {
  const { clientInfo, user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>("general");
  const [uploadDescription, setUploadDescription] = useState("");

  const canUploadFiles = profile?.ponto_focal === true || profile?.user_type === 'manager';

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["client-files", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];

      const { data, error } = await supabase
        .from("files")
        .select(`
          *,
          projects:project_id (name),
          tasks:task_id (title)
        `)
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FileRecord[];
    },
    enabled: !!clientInfo?.id,
  });

  // Get unique projects
  const projects = [...new Set(files.map((f) => f.projects?.name).filter(Boolean))] as string[];

  // Check if file is from client (uploaded by current user)
  const isFromClient = (file: FileRecord) => {
    return file.uploaded_by === user?.id;
  };

  // Filter files
  const filteredFiles = files.filter((file) => {
    const ext = getFileExtension(file.name);
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "document" && ["pdf", "doc", "docx"].includes(ext)) ||
      (typeFilter === "spreadsheet" && ["xls", "xlsx", "csv"].includes(ext)) ||
      (typeFilter === "image" && ["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) ||
      (typeFilter === "video" && ["mp4", "mov", "webm"].includes(ext));

    const matchesSearch =
      !searchQuery ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject =
      projectFilter === "all" || file.projects?.name === projectFilter;

    const matchesOrigin =
      originFilter === "all" ||
      (originFilter === "mine" && isFromClient(file)) ||
      (originFilter === "team" && !isFromClient(file));

    return matchesType && matchesSearch && matchesProject && matchesOrigin;
  });

  const handleDownload = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from("client-files")
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download iniciado!");
    } catch {
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handlePreview = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from("client-files")
        .createSignedUrl(file.file_path, 3600); // 1 hour

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Erro ao visualizar arquivo");
    }
  };

  // Stats
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, f) => acc + (f.file_size || 0), 0);
  const myUploadsCount = files.filter((f) => isFromClient(f)).length;
  const teamUploadsCount = files.filter((f) => !isFromClient(f)).length;

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["client-files"] });
    setIsUploadOpen(false);
    setUploadDescription("");
    setUploadCategory("general");
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Arquivos & Entregáveis</h1>
          <p className="text-muted-foreground">
            Acesse os arquivos e materiais do seu projeto
          </p>
        </div>

        {/* Upload Button for Ponto Focal */}
        {canUploadFiles && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Enviar Arquivo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Enviar Arquivo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign_asset">Foto/Vídeo para Campanha</SelectItem>
                      <SelectItem value="document_request">Documento Solicitado</SelectItem>
                      <SelectItem value="general">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o arquivo..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <FileUploader
                  clientId={clientInfo?.id || ""}
                  category={uploadCategory as "general" | "campaign_asset" | "document_request" | "deliverable"}
                  description={uploadDescription}
                  onUploadComplete={handleUploadComplete}
                  maxFiles={5}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFiles}</p>
                <p className="text-xs text-muted-foreground">Total de Arquivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileDown className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
                <p className="text-xs text-muted-foreground">Tamanho Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myUploadsCount}</p>
                <p className="text-xs text-muted-foreground">Seus Envios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamUploadsCount}</p>
                <p className="text-xs text-muted-foreground">Da Equipe</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar arquivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={originFilter} onValueChange={setOriginFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="mine">Meus Envios</SelectItem>
            <SelectItem value="team">Da Equipe</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo de arquivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="document">Documentos</SelectItem>
            <SelectItem value="spreadsheet">Planilhas</SelectItem>
            <SelectItem value="image">Imagens</SelectItem>
            <SelectItem value="video">Vídeos</SelectItem>
          </SelectContent>
        </Select>
        {projects.length > 0 && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project} value={project}>
                  {project}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum arquivo ainda</h3>
            <p className="text-muted-foreground mb-4">
              Os arquivos e entregáveis do seu projeto aparecerão aqui.
            </p>
            {canUploadFiles && (
              <Button onClick={() => setIsUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Enviar seu primeiro arquivo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file, index) => {
            const ext = getFileExtension(file.name);
            const config = fileTypeConfig[ext] || { icon: File, color: "text-muted-foreground" };
            const FileIcon = config.icon;
            const fromClient = isFromClient(file);

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "hover:border-primary/50 transition-colors",
                  fromClient && "border-l-4 border-l-blue-500"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                        <FileIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {file.name}
                        </CardTitle>
                        {file.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {file.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {/* Origin Badge */}
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          fromClient
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-green-500/10 text-green-600"
                        )}
                      >
                        {fromClient ? (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            Seu envio
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3 mr-1" />
                            Da equipe
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ext.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)}
                      </span>
                    </div>

                    {/* Category and Project */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {file.category && file.category !== "general" && (
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[file.category] || file.category}
                        </Badge>
                      )}
                      {file.projects?.name && (
                        <Badge variant="secondary" className="text-xs">
                          {file.projects.name}
                        </Badge>
                      )}
                      {file.tasks?.title && (
                        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600">
                          📋 {file.tasks.title}
                        </Badge>
                      )}
                    </div>

                    {file.created_at && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePreview(file)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
