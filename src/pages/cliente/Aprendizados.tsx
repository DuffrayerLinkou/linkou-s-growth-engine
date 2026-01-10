import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Tag,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Zap,
  BookOpen,
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

interface Learning {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  impact: string | null;
  tags: string[] | null;
  created_at: string | null;
  project_id: string | null;
  experiment_id: string | null;
  approved_by_ponto_focal: boolean;
  approved_at: string | null;
  approved_by: string | null;
  projects?: {
    name: string;
  } | null;
  experiments?: {
    name: string;
  } | null;
  approver?: {
    full_name: string | null;
  } | null;
}

const impactConfig: Record<string, { label: string; color: string; icon: typeof Sparkles }> = {
  high: { label: "Alto Impacto", color: "bg-green-500/20 text-green-600 border-green-500/30", icon: Zap },
  medium: { label: "Médio Impacto", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30", icon: TrendingUp },
  low: { label: "Baixo Impacto", color: "bg-slate-500/20 text-slate-600 border-slate-500/30", icon: Sparkles },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  processo: { label: "Processo", color: "bg-blue-500/20 text-blue-600" },
  produto: { label: "Produto", color: "bg-purple-500/20 text-purple-600" },
  mercado: { label: "Mercado", color: "bg-orange-500/20 text-orange-600" },
  cliente: { label: "Cliente", color: "bg-pink-500/20 text-pink-600" },
  tecnologia: { label: "Tecnologia", color: "bg-cyan-500/20 text-cyan-600" },
  estrategia: { label: "Estratégia", color: "bg-indigo-500/20 text-indigo-600" },
};

export default function ClienteAprendizados() {
  const { clientInfo } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: learnings = [], isLoading } = useQuery({
    queryKey: ["client-learnings", clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];

      const { data, error } = await supabase
        .from("learnings")
        .select(`
          *,
          projects:project_id (name),
          experiments:experiment_id (name),
          approver:approved_by (full_name)
        `)
        .eq("client_id", clientInfo.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Learning[];
    },
    enabled: !!clientInfo?.id,
  });

  // Get unique categories
  const categories = [...new Set(learnings.map((l) => l.category).filter(Boolean))] as string[];

  const filteredLearnings = learnings.filter((learning) => {
    if (categoryFilter === "all") return true;
    return learning.category === categoryFilter;
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
  const totalLearnings = learnings.length;
  const highImpactLearnings = learnings.filter((l) => l.impact === "high").length;
  const approvedLearnings = learnings.filter((l) => l.approved_by_ponto_focal).length;
  const fromExperiments = learnings.filter((l) => l.experiment_id).length;

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
        <h1 className="text-3xl font-bold">Aprendizados</h1>
        <p className="text-muted-foreground">
          Insights e aprendizados refinados do seu projeto
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLearnings}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{highImpactLearnings}</p>
                <p className="text-xs text-muted-foreground">Alto Impacto</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedLearnings}</p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{fromExperiments}</p>
                <p className="text-xs text-muted-foreground">De Experimentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {categoryConfig[category]?.label || category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Learnings Timeline */}
      <div className="space-y-4">
        {filteredLearnings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum aprendizado ainda</h3>
              <p className="text-muted-foreground">
                Os aprendizados do seu projeto aparecerão aqui quando forem registrados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

            {filteredLearnings.map((learning, index) => {
              const impact = (learning.impact || "medium") as keyof typeof impactConfig;
              const impactInfo = impactConfig[impact] || impactConfig.medium;
              const ImpactIcon = impactInfo.icon;
              const isExpanded = expandedIds.has(learning.id);

              return (
                <motion.div
                  key={learning.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative md:pl-16"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 w-4 h-4 rounded-full bg-primary border-4 border-background hidden md:block" />

                  <Card className="mb-4">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(learning.id)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge variant="secondary" className={impactInfo.color}>
                                <ImpactIcon className="h-3 w-3 mr-1" />
                                {impactInfo.label}
                              </Badge>
                              {learning.category && categoryConfig[learning.category] && (
                                <Badge variant="secondary" className={categoryConfig[learning.category].color}>
                                  {categoryConfig[learning.category].label}
                                </Badge>
                              )}
                              {learning.projects?.name && (
                                <Badge variant="outline">{learning.projects.name}</Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">{learning.title}</CardTitle>
                            {learning.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {learning.description}
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
                          {learning.created_at && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(learning.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                          {learning.experiments?.name && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Sparkles className="h-3 w-3" />
                              De: {learning.experiments.name}
                            </span>
                          )}
                          <ApprovalButton
                            entityType="learning"
                            entityId={learning.id}
                            clientId={clientInfo?.id || ""}
                            isApproved={learning.approved_by_ponto_focal}
                            approvedAt={learning.approved_at}
                            approvedByName={learning.approver?.full_name}
                          />
                        </div>
                      </CardHeader>

                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          {learning.tags && learning.tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              {learning.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="border-t pt-4">
                            <CommentSection
                              entityType="learning"
                              entityId={learning.id}
                              clientId={clientInfo?.id || ""}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
