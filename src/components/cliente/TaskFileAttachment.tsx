import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Upload, FileText, Image, Video, File, Eye, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploader } from "@/components/shared/FileUploader";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskFileAttachmentProps {
  taskId: string;
  clientId: string;
  projectId?: string | null;
  canUpload?: boolean;
  showCompact?: boolean;
}

interface FileRecord {
  id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string | null;
  uploaded_by: string | null;
  category: string | null;
}

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function TaskFileAttachment({
  taskId,
  clientId,
  projectId,
  canUpload = false,
  showCompact = false,
}: TaskFileAttachmentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["task-files", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select(`
          id,
          name,
          file_path,
          file_size,
          mime_type,
          created_at,
          uploaded_by,
          category
        `)
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FileRecord[];
    },
    enabled: !!taskId,
  });

  const handleDownload = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from("client-files")
        .download(file.file_path);

      if (error) throw error;

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
        .createSignedUrl(file.file_path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Erro ao visualizar arquivo");
    }
  };

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["task-files", taskId] });
    queryClient.invalidateQueries({ queryKey: ["client-files"] });
    setIsUploadOpen(false);
  };

  const isFromClient = (file: FileRecord) => {
    return file.uploaded_by && file.uploaded_by === user?.id;
  };

  // Compact mode: just show badge with count
  if (showCompact) {
    if (files.length === 0) return null;
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
            <Paperclip className="h-3 w-3" />
            <span className="text-xs">{files.length}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Arquivos Anexados
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {files.map((file) => {
                const Icon = getFileIcon(file.mime_type);
                const fromClient = isFromClient(file);

                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file_size)}</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            fromClient
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-green-500/10 text-green-600"
                          )}
                        >
                          {fromClient ? "Seu envio" : "Da equipe"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePreview(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {canUpload && (
            <div className="pt-4 border-t">
              <FileUploader
                clientId={clientId}
                projectId={projectId}
                taskId={taskId}
                category="document_request"
                onUploadComplete={handleUploadComplete}
                compact
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Full mode: show files list with upload option
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Arquivos ({files.length})
        </h4>
        {canUpload && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Anexar Arquivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Anexar Arquivo à Tarefa</DialogTitle>
              </DialogHeader>
              <FileUploader
                clientId={clientId}
                projectId={projectId}
                taskId={taskId}
                category="document_request"
                onUploadComplete={handleUploadComplete}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
          Nenhum arquivo anexado
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => {
            const Icon = getFileIcon(file.mime_type);
            const fromClient = isFromClient(file);

            return (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  fromClient ? "bg-blue-500/5 border-blue-500/20" : "bg-card"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    fromClient ? "bg-blue-500/10" : "bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{formatFileSize(file.file_size)}</span>
                    {file.created_at && (
                      <span>
                        {format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        fromClient
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-green-500/10 text-green-600"
                      )}
                    >
                      {fromClient ? "Seu envio" : "Da equipe"}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePreview(file)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
