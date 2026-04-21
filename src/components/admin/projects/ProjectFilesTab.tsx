import { useEffect, useState } from "react";
import { Loader2, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface FileRow {
  id: string;
  name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

const formatBytes = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export function ProjectFilesTab({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("files")
        .select("id, name, file_path, mime_type, file_size, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setFiles((data as any) || []);
      setLoading(false);
    })();
  }, [projectId]);

  const handleDownload = async (file: FileRow) => {
    const { data } = await supabase.storage.from("client-files").createSignedUrl(file.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">Nenhum arquivo vinculado a este projeto.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
      {files.map((f) => (
        <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-md border hover:bg-muted/30">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{f.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(f.file_size)} · {format(new Date(f.created_at), "dd/MM/yy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => handleDownload(f)}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}