import { useState, useEffect } from "react";
import { FileText, Download, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProposalSlidePreview } from "@/components/admin/proposals/ProposalSlidePreview";
import { exportProposalPDF } from "@/components/admin/proposals/ProposalPDFExport";
import type { ProposalSlide } from "@/components/admin/proposals/ProposalTemplates";

interface Proposal {
  id: string;
  title: string;
  client_name: string;
  client_segment: string | null;
  service_type: string;
  status: string;
  slides: ProposalSlide[];
  created_at: string;
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  accepted: "Aceita",
  rejected: "Recusada",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null);
  const [viewSlide, setViewSlide] = useState(0);
  const { toast } = useToast();

  const fetchProposals = async () => {
    setLoading(true);
    let query = supabase.from("proposals" as any).select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    const { data, error } = await query;
    if (error) {
      toast({ variant: "destructive", title: "Erro ao carregar propostas" });
    } else {
      setProposals((data as any as Proposal[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProposals();
  }, [statusFilter]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("proposals" as any).delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    } else {
      toast({ title: "Proposta excluída" });
      fetchProposals();
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from("proposals" as any).update({ status } as any).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar status" });
    } else {
      fetchProposals();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Propostas
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie suas propostas comerciais</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="sent">Enviadas</SelectItem>
            <SelectItem value="accepted">Aceitas</SelectItem>
            <SelectItem value="rejected">Recusadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma proposta encontrada.</p>
            <p className="text-sm">Gere propostas a partir da tela de Leads.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {proposals.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.client_name} · {p.service_type}</p>
                </div>
                <Badge variant="secondary" className={statusColors[p.status] || ""}>
                  {statusLabels[p.status] || p.status}
                </Badge>
                <Select value={p.status} onValueChange={(v) => handleStatusChange(p.id, v)}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => { setViewProposal(p); setViewSlide(0); }}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => exportProposalPDF({ title: p.title, clientName: p.client_name, slides: p.slides })}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewProposal} onOpenChange={(v) => !v && setViewProposal(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewProposal?.title}</DialogTitle>
          </DialogHeader>
          {viewProposal && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border">
                <ProposalSlidePreview
                  slide={viewProposal.slides[viewSlide]}
                  clientName={viewProposal.client_name}
                  proposalTitle={viewProposal.title}
                  slideIndex={viewSlide}
                  totalSlides={viewProposal.slides.length}
                />
              </div>
              <div className="flex items-center justify-center gap-1">
                {viewProposal.slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setViewSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === viewSlide ? "bg-primary" : "bg-muted-foreground/30"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
