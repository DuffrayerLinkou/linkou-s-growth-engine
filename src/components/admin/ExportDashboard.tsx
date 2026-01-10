import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportData {
  kpis: {
    leadsUltimos30Dias: number;
    leadsQualificados: number;
    clientesAtivos: number;
    clientesEmOperacao: number;
    tarefasVencidas: number;
    campanhasAtivas: number;
    agendamentosHoje: number;
    tarefasPendentesTotal: number;
  };
  leadsPipeline: Array<{ status: string; count: number }>;
  clientJourney: Array<{ phase: string; count: number; deadlineStatus: string }>;
  tasksByClient: Array<{ clientName: string; total: number; overdue: number }>;
  attentionItems: {
    staleLeads: Array<{ name: string; createdAt: string }>;
    clientsWithoutFocal: Array<{ name: string }>;
    overdueClients: Array<{ name: string; phase: string }>;
    severelyOverdueTasks: Array<{ title: string; clientName: string; dueDate: string }>;
  };
  appointments: Array<{ title: string; clientName: string; date: string; time: string }>;
  dateRange: { from: Date; to: Date };
}

interface ExportDashboardProps {
  data: ExportData;
  isLoading: boolean;
}

export function ExportDashboard({ data, isLoading }: ExportDashboardProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isLoading) {
      toast.error("Aguarde o carregamento dos dados");
      return;
    }

    setIsExporting(true);

    try {
      const workbook = XLSX.utils.book_new();

      // 1. KPIs Sheet
      const kpisData = [
        ["Métrica", "Valor"],
        ["Leads (período)", data.kpis.leadsUltimos30Dias],
        ["Leads Qualificados", data.kpis.leadsQualificados],
        ["Clientes Ativos", data.kpis.clientesAtivos],
        ["Clientes em Operação Guiada", data.kpis.clientesEmOperacao],
        ["Tarefas Vencidas", data.kpis.tarefasVencidas],
        ["Campanhas Ativas", data.kpis.campanhasAtivas],
        ["Agendamentos Hoje", data.kpis.agendamentosHoje],
        ["Total Tarefas Pendentes", data.kpis.tarefasPendentesTotal],
      ];
      const kpisSheet = XLSX.utils.aoa_to_sheet(kpisData);
      kpisSheet["!cols"] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, kpisSheet, "KPIs");

      // 2. Pipeline de Leads Sheet
      const pipelineData = [
        ["Status", "Quantidade"],
        ...data.leadsPipeline.map((item) => [item.status, item.count]),
      ];
      const pipelineSheet = XLSX.utils.aoa_to_sheet(pipelineData);
      pipelineSheet["!cols"] = [{ wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, pipelineSheet, "Pipeline Leads");

      // 3. Jornada dos Clientes Sheet
      const journeyData = [
        ["Fase", "Clientes", "Status Prazo"],
        ...data.clientJourney.map((item) => [item.phase, item.count, item.deadlineStatus]),
      ];
      const journeySheet = XLSX.utils.aoa_to_sheet(journeyData);
      journeySheet["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, journeySheet, "Jornada Clientes");

      // 4. Tarefas por Cliente Sheet
      const tasksData = [
        ["Cliente", "Total Tarefas", "Vencidas"],
        ...data.tasksByClient.map((item) => [item.clientName, item.total, item.overdue]),
      ];
      const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData);
      tasksSheet["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, tasksSheet, "Tarefas por Cliente");

      // 5. Itens de Atenção Sheet
      const attentionData = [
        ["Tipo", "Item", "Detalhe"],
        ...data.attentionItems.staleLeads.map((item) => [
          "Lead Parado",
          item.name,
          `Criado em: ${item.createdAt}`,
        ]),
        ...data.attentionItems.clientsWithoutFocal.map((item) => [
          "Sem Ponto Focal",
          item.name,
          "",
        ]),
        ...data.attentionItems.overdueClients.map((item) => [
          "Fase Atrasada",
          item.name,
          `Fase: ${item.phase}`,
        ]),
        ...data.attentionItems.severelyOverdueTasks.map((item) => [
          "Tarefa Crítica",
          item.title,
          `Cliente: ${item.clientName} | Vencimento: ${item.dueDate}`,
        ]),
      ];
      const attentionSheet = XLSX.utils.aoa_to_sheet(attentionData);
      attentionSheet["!cols"] = [{ wch: 18 }, { wch: 30 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(workbook, attentionSheet, "Requer Atenção");

      // 6. Agendamentos Sheet
      const appointmentsData = [
        ["Título", "Cliente", "Data", "Horário"],
        ...data.appointments.map((item) => [item.title, item.clientName, item.date, item.time]),
      ];
      const appointmentsSheet = XLSX.utils.aoa_to_sheet(appointmentsData);
      appointmentsSheet["!cols"] = [{ wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(workbook, appointmentsSheet, "Agendamentos");

      // Generate filename with date range
      const fromStr = format(data.dateRange.from, "dd-MM-yyyy", { locale: ptBR });
      const toStr = format(data.dateRange.to, "dd-MM-yyyy", { locale: ptBR });
      const filename = `dashboard-relatorio-${fromStr}-a-${toStr}.xlsx`;

      // Download
      XLSX.writeFile(workbook, filename);
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isLoading || isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Exportar Excel
    </Button>
  );
}
