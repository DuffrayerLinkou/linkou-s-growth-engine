import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, ClipboardList, Target, CreditCard, Calculator, BookOpen, Users } from "lucide-react";
import { ContractTab } from "@/components/admin/onboarding/ContractTab";
import { BriefingTab } from "@/components/admin/onboarding/BriefingTab";
import { PlanningTab } from "@/components/admin/onboarding/PlanningTab";
import { PaymentsTab } from "@/components/admin/onboarding/PaymentsTab";
import { CalculatorsTab } from "@/components/admin/onboarding/CalculatorsTab";
import { GuideTab } from "@/components/admin/onboarding/GuideTab";
import { OnboardingProgress } from "@/components/admin/onboarding/OnboardingProgress";

export default function Onboarding() {
  const [selectedClientId, setSelectedClientId] = useState<string>("all");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch onboarding data for progress calculation
  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts", selectedClientId],
    queryFn: async () => {
      let query = supabase.from("contracts").select("id, client_id, status");
      if (selectedClientId !== "all") {
        query = query.eq("client_id", selectedClientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: briefings = [] } = useQuery({
    queryKey: ["briefings-progress", selectedClientId],
    queryFn: async () => {
      let query = supabase.from("briefings").select("id, client_id, status");
      if (selectedClientId !== "all") {
        query = query.eq("client_id", selectedClientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["strategic-plans-progress", selectedClientId],
    queryFn: async () => {
      let query = supabase.from("strategic_plans").select("id, client_id, status");
      if (selectedClientId !== "all") {
        query = query.eq("client_id", selectedClientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments-progress", selectedClientId],
    queryFn: async () => {
      let query = supabase.from("payments").select("id, client_id, status");
      if (selectedClientId !== "all") {
        query = query.eq("client_id", selectedClientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Calculate progress stages
  const getStageStatus = (items: any[], completedStatuses: string[]): "pending" | "in_progress" | "completed" => {
    if (items.length === 0) return "pending";
    const hasCompleted = items.some(item => completedStatuses.includes(item.status));
    const allCompleted = items.every(item => completedStatuses.includes(item.status));
    if (allCompleted) return "completed";
    if (hasCompleted || items.length > 0) return "in_progress";
    return "pending";
  };

  const progressStages = {
    contract: getStageStatus(contracts, ["signed"]),
    briefing: getStageStatus(briefings, ["approved", "completed"]),
    planning: getStageStatus(plans, ["active", "completed"]),
    payments: getStageStatus(payments, ["paid"]),
  };

  const selectedClientName = selectedClientId !== "all" 
    ? clients.find(c => c.id === selectedClientId)?.name 
    : undefined;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Onboarding de Clientes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Processo profissional para iniciar contratos e gerir a documentação dos seus clientes
          </p>
        </div>
        
        {/* Client Selector - full width em mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Label className="text-xs sm:text-sm font-medium">Cliente:</Label>
          </div>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress Component - Only show when a specific client is selected */}
      {selectedClientId !== "all" && (
        <OnboardingProgress 
          stages={progressStages} 
          clientName={selectedClientName}
        />
      )}

      <Tabs defaultValue="contract" className="w-full">
        {/* Menu de Tabs com scroll horizontal e labels sempre visíveis */}
        <TabsList className="flex w-full overflow-x-auto gap-1 bg-muted/50 p-1 rounded-lg h-auto">
          <TabsTrigger 
            value="contract" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 min-w-[60px] sm:min-w-0 shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            <FileText className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm whitespace-nowrap">Contrato</span>
          </TabsTrigger>
          <TabsTrigger 
            value="briefing" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 min-w-[60px] sm:min-w-0 shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm whitespace-nowrap">Briefing</span>
          </TabsTrigger>
          <TabsTrigger 
            value="planning" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 min-w-[60px] sm:min-w-0 shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            <Target className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm whitespace-nowrap">Plano</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 min-w-[60px] sm:min-w-0 shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            <CreditCard className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm whitespace-nowrap">Pagam.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="calculators" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 min-w-[60px] sm:min-w-0 shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            <Calculator className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm whitespace-nowrap">Calc.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="guide" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 min-w-[60px] sm:min-w-0 shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            <BookOpen className="h-4 w-4" />
            <span className="text-[10px] sm:text-sm whitespace-nowrap">Guia</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contract" className="mt-6">
          <ContractTab clientId={selectedClientId !== "all" ? selectedClientId : undefined} />
        </TabsContent>

        <TabsContent value="briefing" className="mt-6">
          <BriefingTab clientId={selectedClientId !== "all" ? selectedClientId : undefined} />
        </TabsContent>

        <TabsContent value="planning" className="mt-6">
          <PlanningTab clientId={selectedClientId !== "all" ? selectedClientId : undefined} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentsTab clientId={selectedClientId !== "all" ? selectedClientId : undefined} />
        </TabsContent>

        <TabsContent value="calculators" className="mt-6">
          <CalculatorsTab />
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          <GuideTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}