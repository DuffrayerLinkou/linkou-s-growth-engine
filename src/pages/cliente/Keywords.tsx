import { useEffect, useMemo, useState } from "react";
import { KeyRound, Search, Loader2, Filter, TrendingUp, Target, Sparkles, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { KeywordTable, type KeywordRow } from "@/components/admin/keywords/KeywordTable";
import { keywordStatusLabels } from "@/lib/keyword-config";

export default function ClienteKeywords() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const clientId = profile?.client_id || "";
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [clusters, setClusters] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [kwRes, clRes, rkRes] = await Promise.all([
        supabase
          .from("keywords")
          .select("id, term, intent, search_volume, difficulty, cpc, current_position, target_url, status, cluster_id, tags, client_id")
          .eq("client_id", clientId)
          .order("search_volume", { ascending: false, nullsFirst: false }),
        supabase.from("keyword_clusters").select("id, name").eq("client_id", clientId),
        supabase
          .from("keyword_rankings")
          .select("keyword_id, position, checked_at")
          .eq("client_id", clientId)
          .order("checked_at", { ascending: true })
          .limit(2000),
      ]);
      if (kwRes.error) throw kwRes.error;
      const cl = clRes.data || [];
      setClusters(cl);
      const clusterById = new Map(cl.map((c) => [c.id, c.name]));
      const hist: Record<string, number[]> = {};
      (rkRes.data || []).forEach((r: any) => {
        if (!hist[r.keyword_id]) hist[r.keyword_id] = [];
        hist[r.keyword_id].push(r.position);
      });
      setKeywords((kwRes.data || []).map((k: any) => ({
        ...k,
        cluster_name: k.cluster_id ? clusterById.get(k.cluster_id) || null : null,
        history: hist[k.id] || (k.current_position != null ? [k.current_position] : []),
      })));
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [clientId]);

  const filtered = useMemo(() =>
    keywords.filter((k) =>
      (!search || k.term.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === "all" || k.status === statusFilter)
    ), [keywords, search, statusFilter]);

  const kpis = useMemo(() => ({
    total: keywords.length,
    top10: keywords.filter((k) => k.current_position != null && k.current_position <= 10).length,
    volume: keywords.reduce((s, k) => s + (k.search_volume || 0), 0),
    opportunities: keywords.filter((k) => (k.search_volume || 0) >= 500 && (k.difficulty ?? 100) < 40).length,
  }), [keywords]);

  const noop = () => {
    toast({ title: "Somente leitura", description: "A gestão de palavras-chave é feita pela equipe Linkou." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <KeyRound className="h-7 w-7 text-primary" />
          Palavras-chave
        </h1>
        <p className="text-muted-foreground">
          Mapa SEO do seu negócio: termos monitorados, posições e oportunidades.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Kpi icon={<BarChart3 className="h-4 w-4" />} label="Monitoradas" value={kpis.total} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Top 10" value={kpis.top10} accent />
        <Kpi icon={<Target className="h-4 w-4" />} label="Volume / mês" value={kpis.volume.toLocaleString("pt-BR")} />
        <Kpi icon={<Sparkles className="h-4 w-4" />} label="Oportunidades" value={kpis.opportunities} accent />
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar termo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-[170px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(keywordStatusLabels).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : keywords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <KeyRound className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhuma palavra-chave cadastrada ainda.</p>
            <p className="text-sm">A equipe Linkou irá montar seu mapa SEO em breve.</p>
          </CardContent>
        </Card>
      ) : (
        <KeywordTable keywords={filtered} onEdit={noop} onDelete={noop} onViewHistory={noop} />
      )}
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className={accent ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          {icon}
          {label}
        </div>
        <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}