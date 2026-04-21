import { useEffect, useState } from "react";
import { Loader2, Megaphone, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { campaignStatusColors, campaignStatusLabels } from "@/lib/status-config";

interface Campaign {
  id: string;
  name: string;
  status: string | null;
  platform: string | null;
  budget: number | null;
  objective: string | null;
}

export function ProjectCampaignsTab({ projectId }: { projectId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id, name, status, platform, budget, objective")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setCampaigns((data as any) || []);
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

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Megaphone className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">Nenhuma campanha vinculada a este projeto.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 max-h-[60vh] overflow-y-auto pr-2">
      {campaigns.map((c) => (
        <Card key={c.id} className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm leading-tight">{c.name}</p>
              <Badge variant="secondary" className={campaignStatusColors[c.status || "draft"]}>
                {campaignStatusLabels[c.status || "draft"]}
              </Badge>
            </div>
            {c.objective && <p className="text-xs text-muted-foreground line-clamp-2">{c.objective}</p>}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span className="capitalize">{c.platform || "—"}</span>
              {c.budget && (
                <span className="flex items-center gap-1 text-foreground font-medium">
                  <DollarSign className="h-3 w-3" />
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(c.budget)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}