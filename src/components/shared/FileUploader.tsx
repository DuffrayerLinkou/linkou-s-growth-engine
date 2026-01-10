import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileIcon, Loader2, CheckCircle2, Image, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
}

interface FileUploaderProps {
  clientId: string;
  projectId?: string | null;
  taskId?: string | null;
  category?: "general" | "campaign_asset" | "document_request" | "deliverable";
  description?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  compact?: boolean;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return FileIcon;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function FileUploader({
  clientId,
  projectId,
  taskId,
  category = "general",
  description,
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes,
  compact = false,
}: FileUploaderProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.slice(0, maxFiles - files.length).map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - files.length,
    accept: acceptedTypes
      ? acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {})
      : undefined,
    disabled: files.length >= maxFiles || isUploading,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0 || !user?.id) return;

    setIsUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const { file } = files[i];

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" as const } : f))
      );

      try {
        // Generate unique file path
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${clientId}/${timestamp}_${safeName}`;

        // Upload to storage
        const { error: storageError } = await supabase.storage
          .from("client-files")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (storageError) throw storageError;

        // Create record in files table
        const { data: fileRecord, error: dbError } = await supabase
          .from("files")
          .insert({
            name: file.name,
            description: description || null,
            file_path: filePath,
            file_type: file.name.split(".").pop()?.toLowerCase() || null,
            mime_type: file.type,
            file_size: file.size,
            client_id: clientId,
            project_id: projectId || null,
            task_id: taskId || null,
            category: category,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        uploadedFiles.push({
          id: fileRecord.id,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        });

        // Update status to success
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "success" as const, progress: 100 } : f
          )
        );
      } catch (error) {
        console.error("Upload error:", error);
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "error" as const, error: "Erro ao fazer upload" }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    if (uploadedFiles.length > 0) {
      toast.success(`${uploadedFiles.length} arquivo(s) enviado(s) com sucesso!`);
      onUploadComplete?.(uploadedFiles);
      // Clear successful uploads
      setFiles((prev) => prev.filter((f) => f.status !== "success"));
    }
  };

  const hasFilesToUpload = files.some((f) => f.status === "pending");

  if (compact) {
    return (
      <div className="space-y-3">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            (files.length >= maxFiles || isUploading) && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? "Solte o arquivo aqui" : "Clique ou arraste arquivos"}
          </p>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => {
              const Icon = getFileIcon(file.file.type);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                >
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{file.file.name}</span>
                  {file.status === "uploading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {file.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {file.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
            {hasFilesToUpload && (
              <Button
                size="sm"
                className="w-full"
                onClick={uploadFiles}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar {files.filter((f) => f.status === "pending").length} arquivo(s)
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          (files.length >= maxFiles || isUploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          {isDragActive ? (
            <p className="text-lg font-medium text-primary">Solte os arquivos aqui...</p>
          ) : (
            <>
              <p className="text-lg font-medium">Arraste arquivos ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground">
                Máximo de {maxFiles} arquivos. Formatos aceitos: imagens, vídeos, documentos.
              </p>
            </>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file, index) => {
            const Icon = getFileIcon(file.file.type);
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  file.status === "success" && "bg-green-500/5 border-green-500/30",
                  file.status === "error" && "bg-red-500/5 border-red-500/30",
                  file.status === "pending" && "bg-muted/50",
                  file.status === "uploading" && "bg-blue-500/5 border-blue-500/30"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    file.status === "success" && "bg-green-500/10",
                    file.status === "error" && "bg-red-500/10",
                    file.status === "pending" && "bg-muted",
                    file.status === "uploading" && "bg-blue-500/10"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.file.size)}</span>
                    {file.status === "uploading" && <span>Enviando...</span>}
                    {file.status === "success" && (
                      <span className="text-green-600">Enviado!</span>
                    )}
                    {file.status === "error" && (
                      <span className="text-red-600">{file.error}</span>
                    )}
                  </div>
                  {file.status === "uploading" && (
                    <Progress value={50} className="h-1 mt-2" />
                  )}
                </div>

                {file.status === "uploading" && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                )}
                {file.status === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
                {file.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Button */}
      {hasFilesToUpload && (
        <Button className="w-full" onClick={uploadFiles} disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando arquivos...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Enviar {files.filter((f) => f.status === "pending").length} arquivo(s)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
