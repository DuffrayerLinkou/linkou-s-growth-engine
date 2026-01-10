import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string | null;
  investment: string | null;
  objective: string | null;
  status: string | null;
  source: string | null;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
};

interface ExportLeadsProps {
  leads: Lead[];
  dateRange?: DateRange;
  statusFilter: string;
}

export function ExportLeads({ leads, dateRange, statusFilter }: ExportLeadsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (leads.length === 0) {
      toast.error("Nenhum lead para exportar");
      return;
    }

    setIsExporting(true);

    try {
      // Preparar dados para exportação
      const exportData = leads.map((lead) => ({
        Nome: lead.name,
        Email: lead.email,
        Telefone: lead.phone || "-",
        Segmento: lead.segment || "-",
        Investimento: lead.investment || "-",
        Objetivo: lead.objective || "-",
        Status: statusLabels[lead.status || "new"],
        Fonte: lead.source || "-",
        "Data de Captura": format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", {
          locale: ptBR,
        }),
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 25 }, // Nome
        { wch: 30 }, // Email
        { wch: 15 }, // Telefone
        { wch: 20 }, // Segmento
        { wch: 15 }, // Investimento
        { wch: 40 }, // Objetivo
        { wch: 12 }, // Status
        { wch: 12 }, // Fonte
        { wch: 18 }, // Data
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Leads");

      // Gerar nome do arquivo
      let fileName = "leads";
      
      if (statusFilter !== "all") {
        fileName += `-${statusLabels[statusFilter].toLowerCase()}`;
      }
      
      if (dateRange?.from) {
        fileName += `-${format(dateRange.from, "ddMMyy")}`;
        if (dateRange.to) {
          fileName += `-${format(dateRange.to, "ddMMyy")}`;
        }
      }
      
      fileName += ".xlsx";

      // Download
      XLSX.writeFile(wb, fileName);

      toast.success(`${leads.length} leads exportados com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar leads");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || leads.length === 0}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Exportar
    </Button>
  );
}
