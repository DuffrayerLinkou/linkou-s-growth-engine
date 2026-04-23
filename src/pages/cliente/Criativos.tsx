import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CreativeDemandDialog } from "@/components/cliente/CreativeDemandDialog";
import { CreativeDeliverableViewer } from "@/components/cliente/CreativeDeliverableViewer";
import { demandStatusConfig, deliverableTypeConfig, priorityConfig, type DemandStatus, type DeliverableType, type Priority } from "@/lib/creative-config";
import { Sparkles, Plus, Calendar, Search, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateOnly } from "@/lib/utils";

interface Demand {
  id: string;
  title: string;
  briefing: string | null;
  objective: string | null;
  platform: string | null;
  format: string | null;
  deadline: string | null;
  priority: Priority;
  status: DemandStatus;
  created_at: string;
}

export default function ClienteCriativos() {
  const { profile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Demand | null>(null);
  const [search, setSearch] = useState("");

  const { data: demands = [], isLoading } = useQuery({
    queryKey: ["creative-demands", profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id) return [];
      const { data, error } = await supabase
        .from("creative_demands")
        .select("*")
        .eq("client_id", profile.client_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Demand[];
    },
    enabled: !!profile?.client_id,
  });

  const { data: deliverables = [] } = useQuery({
    queryKey: ["creative-deliverables", selected?.id],
    queryFn: async () => {
      if (!selected?.id) return [];
      const { data, error } = await supabase
        .from("creative_deliverables")
        .select("*")
        .eq("demand_id", selected.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selected?.id,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return demands;
    const q = search.toLowerCase();
    return demands.filter((d) => d.title.toLowerCase().includes(q) || d.objective?.toLowerCase().includes(q));
  }, [demands, search]);

  const buckets = useMemo(() => {
    const open = filtered.filter((d) => d.status !== "delivered");
    const done = filtered.filter((d) => d.status === "delivered");
    return { open, done };
  }, [filtered]);

  if (selected) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">{selected.title}</CardTitle>
                {selected.objective && <p className="text-muted-foreground mt-1">{selected.objective}</p>}
              </div>
              <Badge variant="outline" className={demandStatusConfig[selected.status].color}>
                {demandStatusConfig[selected.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              {selected.platform && <Badge variant="secondary">{selected.platform}</Badge>}
              {selected.format && <Badge variant="secondary">{selected.format}</Badge>}
              <Badge variant="secondary" className={priorityConfig[selected.priority].color}>
                Prioridade: {priorityConfig[selected.priority].label}
              </Badge>
              {selected.deadline && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {format((parseDateOnly(selected.deadline) ?? new Date(0)), "dd 'de' MMM", { locale: ptBR })}
                </Badge>
              )}
            </div>
            {selected.briefing && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Briefing</p>
                <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/40 p-3">{selected.briefing}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-3">Entregáveis</h2>
          {deliverables.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhum entregável criado ainda. O time interno irá adicionar conforme a produção avança.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {deliverables.map((d) => (
                <CreativeDeliverableViewer key={d.id} deliverable={d as Parameters<typeof CreativeDeliverableViewer>[0]["deliverable"]} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Demandas Criativas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Solicite e acompanhe a produção de copies, vídeos e artes.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Nova demanda
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou objetivo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Em andamento ({buckets.open.length})</TabsTrigger>
          <TabsTrigger value="done">Entregues ({buckets.done.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4">
          <DemandList items={buckets.open} loading={isLoading} onSelect={setSelected} />
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          <DemandList items={buckets.done} loading={isLoading} onSelect={setSelected} />
        </TabsContent>
      </Tabs>

      <CreativeDemandDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function DemandList({ items, loading, onSelect }: { items: Demand[]; loading: boolean; onSelect: (d: Demand) => void }) {
  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma demanda por aqui.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((d) => (
        <button
          key={d.id}
          onClick={() => onSelect(d)}
          className="text-left rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm line-clamp-2">{d.title}</h3>
            <Badge variant="outline" className={`shrink-0 ${demandStatusConfig[d.status].color}`}>
              {demandStatusConfig[d.status].label}
            </Badge>
          </div>
          {d.objective && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{d.objective}</p>}
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {d.platform && <Badge variant="secondary" className="text-[10px]">{d.platform}</Badge>}
            {d.format && <Badge variant="secondary" className="text-[10px]">{d.format}</Badge>}
            {d.deadline && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {format((parseDateOnly(d.deadline) ?? new Date(0)), "dd/MM")}
              </Badge>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}