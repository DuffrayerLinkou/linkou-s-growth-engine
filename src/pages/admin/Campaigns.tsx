import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Megaphone,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  Building2,
  Loader2,
  Filter,
  Target,
  Users,
  MapPin,
  Eye,
  Play,
  Pause,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { CommentSection } from "@/components/cliente/CommentSection";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  client_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  status: string | null;
  platform: string | null;
  campaign_type: string | null;
  objective: string | null;
  objective_detail: string | null;
  strategy: string | null;
  targeting: unknown;
  placements: string[] | null;
  headline: string | null;
  ad_copy: string | null;
  call_to_action: string | null;
  budget: number | null;
  daily_budget: number | null;
  bidding_strategy: string | null;
  target_cpa: number | null;
  target_roas: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  approved_by_ponto_focal: boolean;
  clients?: Client;
  projects?: Project | null;
}

const campaignSchema = z.object({
  client_id: z.string().min(1, "Selecione um cliente"),
  project_id: z.string().optional().or(z.literal("")),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  description: z.string().max(1000).optional().or(z.literal("")),
  platform: z.string().min(1, "Selecione uma plataforma"),
  campaign_type: z.string().optional().or(z.literal("")),
  objective: z.string().optional().or(z.literal("")),
  objective_detail: z.string().optional().or(z.literal("")),
  strategy: z.string().optional().or(z.literal("")),
  headline: z.string().optional().or(z.literal("")),
  ad_copy: z.string().optional().or(z.literal("")),
  call_to_action: z.string().optional().or(z.literal("")),
  budget: z.string().optional().or(z.literal("")),
  daily_budget: z.string().optional().or(z.literal("")),
  bidding_strategy: z.string().optional().or(z.literal("")),
  target_cpa: z.string().optional().or(z.literal("")),
  target_roas: z.string().optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  status: z.string().default("draft"),
});

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending_approval: "Aguardando Aprovação",
  running: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
};

const statusColors: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-600 border-slate-500/30",
  pending_approval: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  running: "bg-green-500/20 text-green-600 border-green-500/30",
  paused: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  completed: "bg-blue-500/20 text-blue-600 border-blue-500/30",
};

const platformLabels: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
};

const platformObjectives: Record<string, string[]> = {
  meta_ads: ["Reconhecimento", "Tráfego", "Engajamento", "Leads", "Vendas", "Promoção de App"],
  google_ads: ["Search", "Display", "Video (YouTube)", "Shopping", "Performance Max"],
  tiktok: ["Alcance", "Tráfego", "Visualizações de Vídeo", "Conversões"],
  linkedin: ["Reconhecimento", "Visitas ao Site", "Engajamento", "Leads", "Conversões"],
};

const platformPlacements: Record<string, { id: string; label: string }[]> = {
  meta_ads: [
    { id: "feed_facebook", label: "Feed Facebook" },
    { id: "feed_instagram", label: "Feed Instagram" },
    { id: "stories", label: "Stories" },
    { id: "reels", label: "Reels" },
    { id: "messenger", label: "Messenger" },
    { id: "audience_network", label: "Audience Network" },
  ],
  google_ads: [
    { id: "search", label: "Rede de Pesquisa" },
    { id: "display", label: "Rede de Display" },
    { id: "youtube", label: "YouTube" },
    { id: "discovery", label: "Discovery" },
    { id: "gmail", label: "Gmail" },
  ],
  tiktok: [
    { id: "feed", label: "Feed For You" },
    { id: "topview", label: "TopView" },
    { id: "branded_hashtag", label: "Branded Hashtag" },
  ],
  linkedin: [
    { id: "feed", label: "Feed LinkedIn" },
    { id: "messaging", label: "InMail" },
    { id: "sidebar", label: "Anúncio na Barra Lateral" },
  ],
};

const biddingStrategies = [
  { id: "maximize_clicks", label: "Maximizar Cliques" },
  { id: "cpa", label: "CPA Desejado" },
  { id: "roas", label: "ROAS Desejado" },
  { id: "cpc", label: "CPC Manual" },
  { id: "cpm", label: "CPM" },
];

const ctaOptions = [
  "Saiba Mais",
  "Comprar Agora",
  "Cadastre-se",
  "Fale Conosco",
  "Baixar",
  "Inscreva-se",
  "Agendar",
  "Ver Oferta",
  "Solicitar Orçamento",
];

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: "",
    project_id: "",
    name: "",
    description: "",
    platform: "",
    campaign_type: "",
    objective: "",
    objective_detail: "",
    strategy: "",
    headline: "",
    ad_copy: "",
    call_to_action: "",
    budget: "",
    daily_budget: "",
    bidding_strategy: "",
    target_cpa: "",
    target_roas: "",
    start_date: "",
    end_date: "",
    status: "draft",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [campaignsRes, clientsRes, projectsRes] = await Promise.all([
        supabase
          .from("campaigns")
          .select("*, clients(id, name), projects:project_id(id, name)")
          .order("created_at", { ascending: false }),
        supabase.from("clients").select("id, name").eq("status", "ativo"),
        supabase.from("projects").select("id, name").eq("status", "active"),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setCampaigns((campaignsRes.data || []).map(c => ({
        ...c,
        placements: Array.isArray(c.placements) ? c.placements as string[] : null,
      })));
      setClients(clientsRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openForm = (campaign?: Campaign) => {
    if (campaign) {
      setSelectedCampaign(campaign);
      setFormData({
        client_id: campaign.client_id,
        project_id: campaign.project_id || "none",
        name: campaign.name,
        description: campaign.description || "",
        platform: campaign.platform || "",
        campaign_type: campaign.campaign_type || "",
        objective: campaign.objective || "",
        objective_detail: campaign.objective_detail || "",
        strategy: campaign.strategy || "",
        headline: campaign.headline || "",
        ad_copy: campaign.ad_copy || "",
        call_to_action: campaign.call_to_action || "",
        budget: campaign.budget?.toString() || "",
        daily_budget: campaign.daily_budget?.toString() || "",
        bidding_strategy: campaign.bidding_strategy || "",
        target_cpa: campaign.target_cpa?.toString() || "",
        target_roas: campaign.target_roas?.toString() || "",
        start_date: campaign.start_date || "",
        end_date: campaign.end_date || "",
        status: campaign.status || "draft",
      });
      setSelectedPlacements((campaign.placements as string[]) || []);
    } else {
      setSelectedCampaign(null);
      setFormData({
        client_id: "",
        project_id: "none",
        name: "",
        description: "",
        platform: "",
        campaign_type: "",
        objective: "",
        objective_detail: "",
        strategy: "",
        headline: "",
        ad_copy: "",
        call_to_action: "",
        budget: "",
        daily_budget: "",
        bidding_strategy: "",
        target_cpa: "",
        target_roas: "",
        start_date: "",
        end_date: "",
        status: "draft",
      });
      setSelectedPlacements([]);
    }
    setErrors({});
    setActiveTab("basic");
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    setErrors({});
    const result = campaignSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const campaignData = {
        client_id: formData.client_id,
        project_id: formData.project_id && formData.project_id !== "none" ? formData.project_id : null,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        platform: formData.platform,
        campaign_type: formData.campaign_type || null,
        objective: formData.objective || null,
        objective_detail: formData.objective_detail.trim() || null,
        strategy: formData.strategy.trim() || null,
        headline: formData.headline.trim() || null,
        ad_copy: formData.ad_copy.trim() || null,
        call_to_action: formData.call_to_action || null,
        placements: selectedPlacements.length > 0 ? selectedPlacements : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        daily_budget: formData.daily_budget ? parseFloat(formData.daily_budget) : null,
        bidding_strategy: formData.bidding_strategy || null,
        target_cpa: formData.target_cpa ? parseFloat(formData.target_cpa) : null,
        target_roas: formData.target_roas ? parseFloat(formData.target_roas) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
      };

      if (selectedCampaign) {
        const { error } = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", selectedCampaign.id);

        if (error) throw error;

        await fetchData();

        toast({
          title: "Campanha atualizada",
          description: "As informações foram salvas.",
        });
      } else {
        const { error } = await supabase.from("campaigns").insert(campaignData);

        if (error) throw error;

        await fetchData();

        toast({
          title: "Campanha criada",
          description: "A nova campanha foi adicionada.",
        });
      }

      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;

    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", selectedCampaign.id);

      if (error) throw error;

      setCampaigns((prev) => prev.filter((c) => c.id !== selectedCampaign.id));

      toast({
        title: "Campanha excluída",
        description: "A campanha foi removida com sucesso.",
      });

      setIsDeleteOpen(false);
      setSelectedCampaign(null);
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Tente novamente.",
      });
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.clients?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const togglePlacement = (placementId: string) => {
    setSelectedPlacements(prev => 
      prev.includes(placementId)
        ? prev.filter(p => p !== placementId)
        : [...prev, placementId]
    );
  };

  const availableObjectives = formData.platform ? platformObjectives[formData.platform] || [] : [];
  const availablePlacements = formData.platform ? platformPlacements[formData.platform] || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanhas</h1>
          <p className="text-muted-foreground">
            Gerencie as campanhas de marketing da agência.
          </p>
        </div>
        <Button onClick={() => openForm()} disabled={clients.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(statusLabels).map(([status, label]) => {
          const count = campaigns.filter((c) => c.status === status).length;
          return (
            <Card
              key={status}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() =>
                setStatusFilter(status === statusFilter ? "all" : status)
              }
            >
              <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl">{count}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas ou clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4 opacity-50" />
              <p>Crie um cliente primeiro</p>
              <p className="text-sm">Campanhas precisam estar vinculadas a um cliente.</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma campanha encontrada</p>
              <Button variant="link" onClick={() => openForm()}>
                Criar primeira campanha
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Período</TableHead>
                  <TableHead className="hidden sm:table-cell">Budget</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign, index) => (
                  <motion.tr
                    key={campaign.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {campaign.name}
                          {campaign.approved_by_ponto_focal && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        {campaign.objective && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {campaign.objective}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {campaign.clients?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {platformLabels[campaign.platform || ""] || campaign.platform || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[campaign.status || "draft"]}
                      >
                        {statusLabels[campaign.status || "draft"]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {campaign.start_date ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(campaign.start_date), "dd/MM/yy", {
                            locale: ptBR,
                          })}
                          {campaign.end_date && (
                            <>
                              {" - "}
                              {format(new Date(campaign.end_date), "dd/MM/yy", {
                                locale: ptBR,
                              })}
                            </>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {campaign.budget ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {formatCurrency(campaign.budget)}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setDetailCampaign(campaign);
                            setIsDetailOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openForm(campaign)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog with Tabs */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCampaign ? "Editar Campanha" : "Nova Campanha"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da campanha seguindo os padrões de Meta Ads e Google Ads.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="creative">Criativo</TabsTrigger>
              <TabsTrigger value="budget">Orçamento</TabsTrigger>
              <TabsTrigger value="schedule">Cronograma</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, client_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.client_id && (
                    <p className="text-sm text-destructive">{errors.client_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_id">Projeto (opcional)</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, project_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome da Campanha *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Black Friday 2024 - Conversões"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Plataforma *</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) =>
                      setFormData({ ...formData, platform: value, campaign_type: "", objective: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(platformLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.platform && (
                    <p className="text-sm text-destructive">{errors.platform}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective">Objetivo da Campanha</Label>
                  <Select
                    value={formData.objective}
                    onValueChange={(value) =>
                      setFormData({ ...formData, objective: value })
                    }
                    disabled={!formData.platform}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableObjectives.map((obj) => (
                        <SelectItem key={obj} value={obj}>
                          {obj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective_detail">Detalhes do Objetivo</Label>
                <Textarea
                  id="objective_detail"
                  value={formData.objective_detail}
                  onChange={(e) =>
                    setFormData({ ...formData, objective_detail: e.target.value })
                  }
                  placeholder="Descreva em detalhes o objetivo principal desta campanha..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy">Estratégia / Hipótese</Label>
                <Textarea
                  id="strategy"
                  value={formData.strategy}
                  onChange={(e) =>
                    setFormData({ ...formData, strategy: e.target.value })
                  }
                  placeholder="Qual a estratégia ou hipótese por trás desta campanha?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="creative" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Headline / Título Principal</Label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData({ ...formData, headline: e.target.value })
                  }
                  placeholder="O título principal do anúncio"
                />
                <p className="text-xs text-muted-foreground">
                  Meta Ads: máx 40 caracteres | Google Ads: máx 30 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad_copy">Texto do Anúncio (Ad Copy)</Label>
                <Textarea
                  id="ad_copy"
                  value={formData.ad_copy}
                  onChange={(e) =>
                    setFormData({ ...formData, ad_copy: e.target.value })
                  }
                  placeholder="O texto principal que aparecerá no anúncio..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Meta Ads: máx 125 caracteres (primário) | Google Ads: máx 90 caracteres (descrição)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="call_to_action">Call to Action (CTA)</Label>
                <Select
                  value={formData.call_to_action}
                  onValueChange={(value) =>
                    setFormData({ ...formData, call_to_action: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o CTA" />
                  </SelectTrigger>
                  <SelectContent>
                    {ctaOptions.map((cta) => (
                      <SelectItem key={cta} value={cta}>
                        {cta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.platform && availablePlacements.length > 0 && (
                <div className="space-y-3">
                  <Label>Posicionamentos (Placements)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availablePlacements.map((placement) => (
                      <div
                        key={placement.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={placement.id}
                          checked={selectedPlacements.includes(placement.id)}
                          onCheckedChange={() => togglePlacement(placement.id)}
                        />
                        <label
                          htmlFor={placement.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {placement.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="budget" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Orçamento Total (R$)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    placeholder="0,00"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily_budget">Orçamento Diário (R$)</Label>
                  <Input
                    id="daily_budget"
                    type="number"
                    value={formData.daily_budget}
                    onChange={(e) =>
                      setFormData({ ...formData, daily_budget: e.target.value })
                    }
                    placeholder="0,00"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bidding_strategy">Estratégia de Lances</Label>
                <Select
                  value={formData.bidding_strategy}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bidding_strategy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a estratégia" />
                  </SelectTrigger>
                  <SelectContent>
                    {biddingStrategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        {strategy.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.bidding_strategy === "cpa" && (
                <div className="space-y-2">
                  <Label htmlFor="target_cpa">CPA Alvo (R$)</Label>
                  <Input
                    id="target_cpa"
                    type="number"
                    value={formData.target_cpa}
                    onChange={(e) =>
                      setFormData({ ...formData, target_cpa: e.target.value })
                    }
                    placeholder="0,00"
                    step="0.01"
                  />
                </div>
              )}

              {formData.bidding_strategy === "roas" && (
                <div className="space-y-2">
                  <Label htmlFor="target_roas">ROAS Alvo</Label>
                  <Input
                    id="target_roas"
                    type="number"
                    value={formData.target_roas}
                    onChange={(e) =>
                      setFormData({ ...formData, target_roas: e.target.value })
                    }
                    placeholder="Ex: 4.0 (para 400%)"
                    step="0.1"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Término</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview da Campanha
                </h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Nome:</span> {formData.name || "-"}</p>
                  <p><span className="text-muted-foreground">Plataforma:</span> {platformLabels[formData.platform] || "-"}</p>
                  <p><span className="text-muted-foreground">Objetivo:</span> {formData.objective || "-"}</p>
                  <p><span className="text-muted-foreground">Headline:</span> {formData.headline || "-"}</p>
                  <p><span className="text-muted-foreground">CTA:</span> {formData.call_to_action || "-"}</p>
                  <p><span className="text-muted-foreground">Budget:</span> {formData.budget ? `R$ ${formData.budget}` : "-"}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedCampaign ? "Salvar Alterações" : "Criar Campanha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a campanha "{selectedCampaign?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Campaign Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl">{detailCampaign?.name}</DialogTitle>
              {detailCampaign?.approved_by_ponto_focal && (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aprovada
                </Badge>
              )}
            </div>
            <DialogDescription className="flex items-center gap-2 pt-2">
              <Badge variant="outline">
                {platformLabels[detailCampaign?.platform || ""] || detailCampaign?.platform || "-"}
              </Badge>
              <Badge variant="secondary" className={statusColors[detailCampaign?.status || "draft"]}>
                {statusLabels[detailCampaign?.status || "draft"]}
              </Badge>
              {detailCampaign?.clients?.name && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {detailCampaign.clients.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {detailCampaign && (
            <div className="space-y-6 mt-4">
              {/* Description */}
              {detailCampaign.description && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Descrição</h4>
                  <p className="text-sm">{detailCampaign.description}</p>
                </div>
              )}

              {/* Objective & Strategy */}
              <div className="grid grid-cols-2 gap-4">
                {detailCampaign.objective && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Objetivo</h4>
                    <p className="text-sm">{detailCampaign.objective}</p>
                    {detailCampaign.objective_detail && (
                      <p className="text-xs text-muted-foreground mt-1">{detailCampaign.objective_detail}</p>
                    )}
                  </div>
                )}
                {detailCampaign.strategy && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Estratégia</h4>
                    <p className="text-sm">{detailCampaign.strategy}</p>
                  </div>
                )}
              </div>

              {/* Creative */}
              {(detailCampaign.headline || detailCampaign.ad_copy) && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Criativo
                  </h4>
                  {detailCampaign.headline && (
                    <div>
                      <p className="text-xs text-muted-foreground">Headline</p>
                      <p className="font-medium">{detailCampaign.headline}</p>
                    </div>
                  )}
                  {detailCampaign.ad_copy && (
                    <div>
                      <p className="text-xs text-muted-foreground">Texto do Anúncio</p>
                      <p className="text-sm">{detailCampaign.ad_copy}</p>
                    </div>
                  )}
                  {detailCampaign.call_to_action && (
                    <div>
                      <p className="text-xs text-muted-foreground">CTA</p>
                      <Badge variant="outline">{detailCampaign.call_to_action}</Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Budget & Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Orçamento
                  </h4>
                  <div className="space-y-1 text-sm">
                    {detailCampaign.budget && (
                      <p>Total: {formatCurrency(detailCampaign.budget)}</p>
                    )}
                    {detailCampaign.daily_budget && (
                      <p>Diário: {formatCurrency(detailCampaign.daily_budget)}</p>
                    )}
                    {detailCampaign.bidding_strategy && (
                      <p className="text-muted-foreground">
                        {biddingStrategies.find(b => b.id === detailCampaign.bidding_strategy)?.label || detailCampaign.bidding_strategy}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Período
                  </h4>
                  <div className="text-sm">
                    {detailCampaign.start_date ? (
                      <p>
                        {format(new Date(detailCampaign.start_date), "dd/MM/yyyy", { locale: ptBR })}
                        {detailCampaign.end_date && (
                          <> até {format(new Date(detailCampaign.end_date), "dd/MM/yyyy", { locale: ptBR })}</>
                        )}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">Não definido</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Placements */}
              {detailCampaign.placements && detailCampaign.placements.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Posicionamentos
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailCampaign.placements.map((placement) => {
                      const placementInfo = platformPlacements[detailCampaign.platform || ""]?.find(p => p.id === placement);
                      return (
                        <Badge key={placement} variant="secondary">
                          {placementInfo?.label || placement}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comentários
                </h4>
                <CommentSection
                  entityType="campaign"
                  entityId={detailCampaign.id}
                  clientId={detailCampaign.client_id}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}