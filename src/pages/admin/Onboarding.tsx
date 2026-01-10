import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ClipboardList, Target, CreditCard, Calculator, BookOpen } from "lucide-react";
import { ContractTab } from "@/components/admin/onboarding/ContractTab";
import { BriefingTab } from "@/components/admin/onboarding/BriefingTab";
import { PlanningTab } from "@/components/admin/onboarding/PlanningTab";
import { PaymentsTab } from "@/components/admin/onboarding/PaymentsTab";
import { CalculatorsTab } from "@/components/admin/onboarding/CalculatorsTab";
import { GuideTab } from "@/components/admin/onboarding/GuideTab";

export default function Onboarding() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding de Clientes</h1>
        <p className="text-muted-foreground mt-1">
          Processo profissional para iniciar contratos e gerir a documentação dos seus clientes
        </p>
      </div>

      <Tabs defaultValue="contract" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
          <TabsTrigger 
            value="contract" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Contrato</span>
          </TabsTrigger>
          <TabsTrigger 
            value="briefing" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Briefing</span>
          </TabsTrigger>
          <TabsTrigger 
            value="planning" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Planejamento</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pagamentos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="calculators" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculadoras</span>
          </TabsTrigger>
          <TabsTrigger 
            value="guide" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Guia</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contract" className="mt-6">
          <ContractTab />
        </TabsContent>

        <TabsContent value="briefing" className="mt-6">
          <BriefingTab />
        </TabsContent>

        <TabsContent value="planning" className="mt-6">
          <PlanningTab />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentsTab />
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
