import { useEffect, useMemo, useState } from "react";
import { KeyRound, Plus, Search, Building2, Loader2, Filter, Upload, TrendingUp, Target, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KeywordTable, type KeywordRow } from "@/components/admin/keywords/KeywordTable";
import { KeywordDetailDialog } from "@/components/admin/keywords/KeywordDetailDialog";
import { KeywordFormDialog } from "@/components/admin/keywords/KeywordFormDialog";
import { ImportKeywordsDialog } from "@/components/admin/keywords/ImportKeywordsDialog";
import { keywordStatusLabels } from "@/lib/keyword-config";

interface Client { id: string; name: string; }
interface Cluster { id: string; name: string; }

export default function AdminKeywords() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [historyByKw, setHistoryByKw] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clusterFilter, setClusterFilter] = useState<string>("all");
  const [editing, setEditing] = useState<KeywordRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailKw, setDetailKw] = useState<KeywordRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<KeywordRow | null>(null);

  // Load clients on mount
  useEffect(() => {
    supabase
      .from("clients")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) {
          setClients(data);
          if (data.length > 0 && !clientId) setClientId(data[0].id);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [kwRes, clRes, rkRes] = await Promise.all([
        supabase
          .from("keywords")
          .select("id, term, intent, search_volume, difficulty, cpc, current_position, target_url, status, cluster_id, tags, client_id, notes")
          .eq("client_id", clientId)
          .order("search_volume", { ascending: false, nullsFirst: false }),
        supabase.from("keyword_clusters").select("id, name").eq("client_id", clientId).order("name"),
        supabase
          .from("keyword_rankings")
          .select("keyword_id, position, checked_at")
          .eq("client_id", clientId)
          .order("checked_at", { ascending: true })
          .limit(2000),
      ]);
      if (kwRes.error) throw kwRes.error;
      if (clRes.error) throw clRes.error;

      const cl = (clRes.data || []) as Cluster[];
      setClusters(cl);
      const clusterById = new Map(cl.map((c) => [c.id, c.name]));

      const hist: Record<string, number[]> = {};
      (rkRes.data || []).forEach((r: any) => {
        if (!hist[r.keyword_id]) hist[r.keyword_id] = [];
        hist[r.keyword_id].push(r.position);
      });
      setHistoryByKw(hist);

      const enriched: KeywordRow[] = (kwRes.data || []).map((k: any) => ({
        ...k,
        cluster_name: k.cluster_id ? clusterById.get(k.cluster_id) || null : null,
        history: hist[k.id] || (k.current_position != null ? [k.current_position] : []),
      }));
      setKeywords(enriched);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao carregar", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const filtered = useMemo(() => {
    return keywords.filter((k) => {
      const matchSearch = !search || k.term.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || k.status === statusFilter;
      const matchCluster =
        clusterFilter === "all" ||
        (clusterFilter === "__none" ? !k.cluster_id : k.cluster_id === clusterFilter);
      return matchSearch && matchStatus && matchCluster;
    });
  }, [keywords, search, statusFilter, clusterFilter]);

  const kpis = useMemo(() => {
    const total = keywords.length;
    const top10 = keywords.filter((k) => k.current_position != null && k.current_position <= 10).length;
    const totalVolume = keywords.reduce((s, k) => s + (k.search_volume || 0), 0);
    const opportunities = keywords.filter(
      (k) => (k.search_volume || 0) >= 500 && (k.difficulty ?? 100) < 40
    ).length;
    return { total, top10, totalVolume, opportunities };
  }, [keywords]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const { error } = await supabase.from("keywords").delete().eq("id", deleting.id);
      if (error) throw error;
      toast({ title: "Palavra-chave excluída" });
      setDeleting(null);
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <KeyRound className="h-7 w-7 text-primary" />
            Palavras-chave
          </h1>
          <p className="text-muted-foreground">
            Gestão profissional de SEO: ativos transversais para tráfego orgânico, ads e conteúdo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} disabled={!clientId}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} disabled={!clientId}>
            <Plus className="h-4 w-4 mr-2" />
            Nova palavra-chave
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi icon={<BarChart3 className="h-4 w-4" />} label="Monitoradas" value={kpis.total} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Top 10" value={kpis.top10} accent />
        <Kpi icon={<Target className="h-4 w-4" />} label="Volume total / mês" value={kpis.totalVolume.toLocaleString("pt-BR")} />
        <Kpi icon={<Sparkles className="h-4 w-4" />} label="Oportunidades" value={kpis.opportunities} accent />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-full lg:w-[260px]">
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Selecione cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar termo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-[170px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(keywordStatusLabels).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={clusterFilter} onValueChange={setClusterFilter}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Cluster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos clusters</SelectItem>
            <SelectItem value="__none">Sem cluster</SelectItem>
            {clusters.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !clientId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4 opacity-50" />
            <p>Selecione um cliente para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <KeywordTable
          keywords={filtered}
          onEdit={(k) => { setEditing(k); setFormOpen(true); }}
          onDelete={(k) => setDeleting(k)}
          onViewHistory={(k) => { setDetailKw(k); setDetailOpen(true); }}
        />
      )}

      <KeywordFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        clientId={clientId}
        clusters={clusters}
        editing={editing}
        onSaved={fetchData}
      />

      <KeywordDetailDialog
        keyword={detailKw}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={fetchData}
      />

      <ImportKeywordsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        clientId={clientId}
        onImported={fetchData}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir palavra-chave?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.term}" e todo seu histórico de posições serão removidos. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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