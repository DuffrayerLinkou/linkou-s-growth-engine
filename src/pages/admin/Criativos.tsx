import { useMemo, useState } from "react";
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
import { CreativeDemandActions } from "@/components/admin/criativos/CreativeDemandActions";
import { demandStatusConfig, type DemandStatus, type Priority } from "@/lib/creative-config";
import { Sparkles, Plus, Search } from "lucide-react";

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
}

export default function AdminCriativos() {
  const [selected, setSelected] = useState<Demand | null>(null);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Demandas Criativas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão da produção de criativos por cliente.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Nova demanda
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
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
            <CreativeDemandKanban demands={filtered} clientNames={clientNames} onSelect={setSelected} />
          )}
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma demanda.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className="w-full text-left rounded-lg border bg-card p-3 hover:border-primary/40 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{clientNames[d.client_id]}</p>
                    <p className="font-medium truncate">{d.title}</p>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-1 rounded-md border ${demandStatusConfig[d.status].color}`}>
                    {demandStatusConfig[d.status].label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova demanda criativa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente *</Label>
              <Select value={fClient} onValueChange={setFClient}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
            </div>
            <div>
              <Label>Objetivo</Label>
              <Input value={fObjective} onChange={(e) => setFObjective(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plataforma</Label>
                <Select value={fPlatform} onValueChange={setFPlatform}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Formato</Label>
                <Select value={fFormat} onValueChange={setFFormat}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prazo</Label>
                <Input type="date" value={fDeadline} onChange={(e) => setFDeadline(e.target.value)} />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={fPriority} onValueChange={(v) => setFPriority(v as Priority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Briefing</Label>
              <Textarea value={fBriefing} onChange={(e) => setFBriefing(e.target.value)} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={!fClient || !fTitle || create.isPending}>
              Criar demanda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}