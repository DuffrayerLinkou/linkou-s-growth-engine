import { useEffect, useState } from "react";
import { Loader2, Lightbulb, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Learning {
  id: string;
  title: string;
  description: string | null;
  impact: string | null;
  category: string | null;
  tags: string[] | null;
  approved_by_ponto_focal: boolean;
  created_at: string;
}

export function ProjectLearningsTab({ projectId }: { projectId: string }) {
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("learnings")
        .select("id, title, description, impact, category, tags, approved_by_ponto_focal, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setLearnings((data as any) || []);
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (learnings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
        <Lightbulb className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">Nenhum aprendizado registrado ainda.</p>
        <p className="text-xs mt-1">Registre hipóteses validadas e descobertas conforme o projeto avança.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
      {learnings.map((l) => (
        <div key={l.id} className="p-4 rounded-md border space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="font-medium text-sm leading-tight">{l.title}</p>
            </div>
            {l.approved_by_ponto_focal && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 shrink-0">
                <Check className="h-3 w-3 mr-1" />
                Aprovado
              </Badge>
            )}
          </div>
          {l.description && <p className="text-sm text-muted-foreground">{l.description}</p>}
          {l.impact && (
            <div className="text-xs">
              <span className="text-muted-foreground">Impacto: </span>
              <span className="font-medium">{l.impact}</span>
            </div>
          )}
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            {l.category && <Badge variant="outline" className="text-[10px]">{l.category}</Badge>}
            {(l.tags || []).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
            ))}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {format(new Date(l.created_at), "dd/MM/yy", { locale: ptBR })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}