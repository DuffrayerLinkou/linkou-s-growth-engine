import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CreativeDemandKanban } from "@/components/admin/criativos/CreativeDemandKanban";
import { CreativeDemandDetail } from "@/components/admin/criativos/CreativeDemandDetail";
import { CreativeDemandFormDialog } from "@/components/admin/criativos/CreativeDemandFormDialog";
import { CreativeBatchCreateDialog } from "@/components/admin/criativos/CreativeBatchCreateDialog";
import { CreativeDemandActions } from "@/components/admin/criativos/CreativeDemandActions";
import { demandStatusConfig, type DemandStatus, type Priority } from "@/lib/creative-config";
import { Sparkles, Plus, Search, Layers, Megaphone } from "lucide-react";

interface Demand {
  id: string;
  client_id: string;
  title: string;
  briefing: string | null;
  objective: string | null;
  platform: string | null;
  format: string | null;
  deadline: string | null;
  priority: Priority;
  status: DemandStatus;
  created_at: string;
  campaign_id: string | null;
}

export default function AdminCriativos() {
  const [selected, setSelected] = useState<Demand | null>(null);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: clients = [] } = useQuery({
    queryKey: ["admin-clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const clientNames = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach((c) => { m[c.id] = c.name; });
    return m;
  }, [clients]);

  const { data: demands = [], isLoading } = useQuery({
    queryKey: ["admin-creative-demands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_demands")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Demand[];
    },
  });

  const filtered = useMemo(() => {
    return demands.filter((d) => {
      if (clientFilter !== "all" && d.client_id !== clientFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!d.title.toLowerCase().includes(q) && !d.objective?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [demands, clientFilter, statusFilter, search]);

  if (selected) {
    const fresh = demands.find((d) => d.id === selected.id) || selected;
    return (
      <CreativeDemandDetail
        demand={fresh}
        clientName={clientNames[fresh.client_id]}
        clients={clients}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            <span className="truncate">Demandas Criativas</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão da produção de criativos por cliente.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4" /> Nova demanda
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
        <div className="relative col-span-full lg:flex-1 lg:min-w-[200px] lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(demandStatusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="mt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <CreativeDemandKanban demands={filtered} clientNames={clientNames} onSelect={setSelected} clients={clients} />
          )}
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma demanda.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((d) => (
                <div
                  key={d.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(d)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(d); } }}
                  className="w-full text-left rounded-lg border bg-card p-3 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">{clientNames[d.client_id]}</p>
                    <p className="font-medium truncate">{d.title}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-md border ${demandStatusConfig[d.status].color}`}>
                      {demandStatusConfig[d.status].label}
                    </span>
                    <CreativeDemandActions demand={d} clients={clients} onOpen={() => setSelected(d)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreativeDemandFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
      />
    </div>
  );
}