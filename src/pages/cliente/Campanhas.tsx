import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Megaphone,
  Target,
  Calendar,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommentSection } from "@/components/cliente/CommentSection";
import { ApprovalButton } from "@/components/cliente/ApprovalButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

type CampaignStatus = "draft" | "pending_approval" | "running" | "completed" | "paused";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  strategy: string | null;
  status: string | null;
  results: string | null;
  metrics: Record<string, unknown> | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  project_id: string;
  platform: string | null;
  objective: string | null;
  objective_detail: string | null;
  budget: number | null;
  daily_budget: number | null;
  headline: string | null;
  ad_copy: string | null;
  call_to_action: string | null;
  placements: string[] | null;
  bidding_strategy: string | null;
  approved_by_ponto_focal: boolean;
  approved_at: string | null;
  approved_by: string | null;
  projects?: {
    name: string;
  } | null;
  approver?: {
    full_name: string | null;
  } | null;
}

const statusConfig: Record<
  CampaignStatus,
  { label: string; color: string; icon: typeof Play }
> = {
  draft: { label: "Rascunho", color: "bg-slate-500/20 text-slate-600 border-slate-500/30", icon: Pause },
  pending_approval: { label: "Aguardando Aprovação", color: "bg-amber-500/20 text-amber-600 border-amber-500/30", icon: Target },
  running: { label: "Ativa", color: "bg-green-500/20 text-green-600 border-green-500/30", icon: Play },
  completed: { label: "Concluída", color: "bg-blue-500/20 text-blue-600 border-blue-500/30", icon: Target },
  paused: { label: "Pausada", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30", icon: Pause },
};

const platformLabels: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
};

const placementLabels: Record<string, string> = {
  feed_facebook: "Feed Facebook",
  feed_instagram: "Feed Instagram",
  stories: "Stories",
  reels: "Reels",
  messenger: "Messenger",
  audience_network: "Audience Network",
  search: "Rede de Pesquisa",
  display: "Rede de Display",
  youtube: "YouTube",
  discovery: "Discovery",
  gmail: "Gmail",
  feed: "Feed",
  topview: "TopView",
  branded_hashtag: "Branded Hashtag",
  messaging: "InMail",
  sidebar: "Barra Lateral",
};

export default function ClienteCampanhas() {
  const { clientInfo } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["client-campaigns", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];

      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          projects:project_id (name),
          approver:approved_by (full_name)
        `)
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!clientInfo?.id,
  });

  const filteredCampaigns = campaigns.filter((camp) => {
    if (statusFilter === "all") return true;
    return camp.status === statusFilter;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "running").length;
  const completedCampaigns = campaigns.filter((c) => c.status === "completed").length;
  const approvedCampaigns = campaigns.filter((c) => c.approved_by_ponto_focal).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Campanhas</h1>
        <p className="text-muted-foreground">
          Acompanhe as campanhas de marketing do seu projeto
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCampaigns}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCampaigns}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCampaigns}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCampaigns}</p>
                <p className="text-xs text-muted-foreground">Aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
            <SelectItem value="running">Ativa</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma campanha ainda</h3>
              <p className="text-muted-foreground">
                As campanhas do seu projeto aparecerão aqui quando forem criadas.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign, index) => {
            const status = (campaign.status || "draft") as CampaignStatus;
            const statusInfo = statusConfig[status] || statusConfig.draft;
            const isExpanded = expandedIds.has(campaign.id);

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(campaign.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="secondary" className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                            {campaign.platform && (
                              <Badge variant="outline">
                                {platformLabels[campaign.platform] || campaign.platform}
                              </Badge>
                            )}
                            {campaign.projects?.name && (
                              <Badge variant="outline">{campaign.projects.name}</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          {campaign.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {campaign.description}
                            </p>
                          )}
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        {campaign.start_date && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Início: {format(new Date(campaign.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        {campaign.end_date && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Fim: {format(new Date(campaign.end_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        {campaign.budget && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            R$ {campaign.budget.toLocaleString("pt-BR")}
                          </span>
                        )}
                        <ApprovalButton
                          entityType="campaign"
                          entityId={campaign.id}
                          clientId={clientInfo?.id || ""}
                          isApproved={campaign.approved_by_ponto_focal}
                          approvedAt={campaign.approved_at}
                          approvedByName={campaign.approver?.full_name}
                        />
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {/* Criativo Preview */}
                        {(campaign.headline || campaign.ad_copy) && (
                          <div className="p-4 rounded-lg border bg-card">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Preview do Anúncio</p>
                            {campaign.headline && (
                              <p className="font-semibold text-lg mb-1">{campaign.headline}</p>
                            )}
                            {campaign.ad_copy && (
                              <p className="text-sm text-muted-foreground mb-2">{campaign.ad_copy}</p>
                            )}
                            {campaign.call_to_action && (
                              <Badge variant="default" className="mt-2">{campaign.call_to_action}</Badge>
                            )}
                          </div>
                        )}

                        {campaign.objective && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Objetivo</p>
                            <p className="text-sm font-medium">{campaign.objective}</p>
                            {campaign.objective_detail && (
                              <p className="text-sm text-muted-foreground mt-1">{campaign.objective_detail}</p>
                            )}
                          </div>
                        )}

                        {campaign.strategy && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Estratégia</p>
                            <p className="text-sm">{campaign.strategy}</p>
                          </div>
                        )}

                        {campaign.placements && campaign.placements.length > 0 && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Posicionamentos</p>
                            <div className="flex flex-wrap gap-1">
                              {campaign.placements.map((placement) => (
                                <Badge key={placement} variant="outline" className="text-xs">
                                  {placementLabels[placement] || placement}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {(campaign.budget || campaign.daily_budget || campaign.bidding_strategy) && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Orçamento e Lances</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              {campaign.budget && (
                                <div>
                                  <span className="text-muted-foreground">Total:</span>{" "}
                                  <span className="font-medium">R$ {campaign.budget.toLocaleString("pt-BR")}</span>
                                </div>
                              )}
                              {campaign.daily_budget && (
                                <div>
                                  <span className="text-muted-foreground">Diário:</span>{" "}
                                  <span className="font-medium">R$ {campaign.daily_budget.toLocaleString("pt-BR")}</span>
                                </div>
                              )}
                              {campaign.bidding_strategy && (
                                <div>
                                  <span className="text-muted-foreground">Estratégia:</span>{" "}
                                  <span className="font-medium">{campaign.bidding_strategy.toUpperCase()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {campaign.results && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-xs font-medium text-green-600 mb-1">Resultados</p>
                            <p className="text-sm">{campaign.results}</p>
                          </div>
                        )}

                        {campaign.metrics && Object.keys(campaign.metrics).length > 0 && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Métricas</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(campaign.metrics).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="text-muted-foreground">{key}:</span>{" "}
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t pt-4">
                          <CommentSection
                            entityType="campaign"
                            entityId={campaign.id}
                            clientId={clientInfo?.id || ""}
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
