import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ImportLeadsProps {
  onImportComplete: () => void;
}

interface ParsedLead {
  nome: string;
  email: string;
  telefone?: string;
  segmento?: string;
  investimento?: string;
  objetivo?: string;
}

interface ValidationResult {
  valid: ParsedLead[];
  errors: { row: number; field: string; message: string }[];
  duplicates: { row: number; email: string }[];
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ImportLeads({ onImportComplete }: ImportLeadsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ParsedLead[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const generateTemplate = () => {
    const templateData = [
      {
        Nome: "Maria Silva",
        Email: "maria.silva@email.com",
        Telefone: "(11) 99999-9999",
        Segmento: "E-commerce",
        Investimento: "R$ 5.000 - R$ 10.000",
        Objetivo: "Aumentar vendas online"
      },
      {
        Nome: "João Santos",
        Email: "joao.santos@empresa.com.br",
        Telefone: "(21) 98888-8888",
        Segmento: "Serviços",
        Investimento: "R$ 10.000 - R$ 20.000",
        Objetivo: "Gerar mais leads qualificados"
      },
      {
        Nome: "Ana Costa",
        Email: "ana@startup.io",
        Telefone: "(31) 97777-7777",
        Segmento: "SaaS",
        Investimento: "Acima de R$ 20.000",
        Objetivo: "Escalar aquisição de clientes"
      }
    ];

    const instructions = [
      { Campo: "Nome", Obrigatório: "Sim", Descrição: "Nome completo do lead" },
      { Campo: "Email", Obrigatório: "Sim", Descrição: "Email válido para contato" },
      { Campo: "Telefone", Obrigatório: "Não", Descrição: "Telefone com DDD" },
      { Campo: "Segmento", Obrigatório: "Não", Descrição: "Área de atuação ou nicho" },
      { Campo: "Investimento", Obrigatório: "Não", Descrição: "Faixa de investimento mensal" },
      { Campo: "Objetivo", Obrigatório: "Não", Descrição: "Objetivo principal do lead" }
    ];

    const wb = XLSX.utils.book_new();
    
    const wsData = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, wsData, "Leads");
    
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instruções");

    XLSX.writeFile(wb, "modelo-importacao-leads.xlsx");
    
    toast({
      title: "Modelo baixado",
      description: "O arquivo modelo-importacao-leads.xlsx foi baixado com sucesso.",
    });
  };

  const parseFile = useCallback(async (file: File) => {
    setIsParsing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

      const parsed: ParsedLead[] = jsonData.map((row) => ({
        nome: String(row["Nome"] || row["nome"] || "").trim(),
        email: String(row["Email"] || row["email"] || "").trim().toLowerCase(),
        telefone: row["Telefone"] || row["telefone"] ? String(row["Telefone"] || row["telefone"]).trim() : undefined,
        segmento: row["Segmento"] || row["segmento"] ? String(row["Segmento"] || row["segmento"]).trim() : undefined,
        investimento: row["Investimento"] || row["investimento"] ? String(row["Investimento"] || row["investimento"]).trim() : undefined,
        objetivo: row["Objetivo"] || row["objetivo"] ? String(row["Objetivo"] || row["objetivo"]).trim() : undefined,
      }));

      setPreviewData(parsed);
      validateLeads(parsed);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o arquivo. Verifique se é um arquivo Excel ou CSV válido.",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  }, []);

  const validateLeads = (leads: ParsedLead[]) => {
    const errors: ValidationResult["errors"] = [];
    const duplicates: ValidationResult["duplicates"] = [];
    const valid: ParsedLead[] = [];
    const seenEmails = new Set<string>();

    leads.forEach((lead, index) => {
      const rowNum = index + 2; // +2 because of header row and 0-index
      let hasError = false;

      if (!lead.nome) {
        errors.push({ row: rowNum, field: "Nome", message: "Nome é obrigatório" });
        hasError = true;
      }

      if (!lead.email) {
        errors.push({ row: rowNum, field: "Email", message: "Email é obrigatório" });
        hasError = true;
      } else if (!emailRegex.test(lead.email)) {
        errors.push({ row: rowNum, field: "Email", message: "Email inválido" });
        hasError = true;
      } else if (seenEmails.has(lead.email)) {
        duplicates.push({ row: rowNum, email: lead.email });
        hasError = true;
      } else {
        seenEmails.add(lead.email);
      }

      if (!hasError) {
        valid.push(lead);
      }
    });

    setValidationResult({ valid, errors, duplicates });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  }, [parseFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;

    setIsImporting(true);
    try {
      const leadsToInsert = validationResult.valid.map((lead) => ({
        name: lead.nome,
        email: lead.email,
        phone: lead.telefone || null,
        segment: lead.segmento || null,
        investment: lead.investimento || null,
        objective: lead.objetivo || null,
        source: "import",
        status: "new",
      }));

      // Insert in batches of 50
      const batchSize = 50;
      let inserted = 0;
      let errors = 0;

      for (let i = 0; i < leadsToInsert.length; i += batchSize) {
        const batch = leadsToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from("leads").insert(batch);
        
        if (error) {
          console.error("Batch insert error:", error);
          errors += batch.length;
        } else {
          inserted += batch.length;
        }
      }

      if (errors > 0) {
        toast({
          title: "Importação parcial",
          description: `${inserted} leads importados com sucesso. ${errors} falharam (possíveis duplicados).`,
          variant: "default",
        });
      } else {
        toast({
          title: "Importação concluída",
          description: `${inserted} leads foram importados com sucesso.`,
        });
      }

      setIsOpen(false);
      resetState();
      onImportComplete();
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao importar os leads. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setValidationResult(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha Excel ou CSV para importar leads em massa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Modelo de Importação</p>
                <p className="text-xs text-muted-foreground">Baixe o modelo com exemplos preenchidos</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={generateTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
              ${file ? "bg-muted/50" : ""}
            `}
          >
            <input {...getInputProps()} />
            {isParsing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processando arquivo...</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">Clique ou arraste para substituir</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? "Solte o arquivo aqui" : "Arraste um arquivo ou clique para selecionar"}
                </p>
                <p className="text-xs text-muted-foreground">Formatos aceitos: .xlsx, .xls, .csv</p>
              </div>
            )}
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{validationResult.valid.length} válidos</span>
                </div>
                {validationResult.errors.length > 0 && (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>{validationResult.errors.length} erros</span>
                  </div>
                )}
                {validationResult.duplicates.length > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>{validationResult.duplicates.length} duplicados</span>
                  </div>
                )}
              </div>

              {/* Preview Valid */}
              {validationResult.valid.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-3 py-2 text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Leads válidos para importar
                  </div>
                  <ScrollArea className="h-[120px]">
                    <div className="divide-y">
                      {validationResult.valid.slice(0, 10).map((lead, index) => (
                        <div key={index} className="px-3 py-2 text-sm flex items-center justify-between">
                          <div>
                            <span className="font-medium">{lead.nome}</span>
                            <span className="text-muted-foreground ml-2">{lead.email}</span>
                          </div>
                          {lead.segmento && (
                            <Badge variant="secondary" className="text-xs">
                              {lead.segmento}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {validationResult.valid.length > 10 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          ... e mais {validationResult.valid.length - 10} leads
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="border border-destructive/50 rounded-lg overflow-hidden">
                  <div className="bg-destructive/10 px-3 py-2 text-sm font-medium flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    Linhas com erro (não serão importadas)
                  </div>
                  <ScrollArea className="h-[80px]">
                    <div className="divide-y divide-destructive/20">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="px-3 py-1.5 text-sm">
                          <span className="text-muted-foreground">Linha {error.row}:</span>{" "}
                          <span className="text-destructive">{error.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Duplicates */}
              {validationResult.duplicates.length > 0 && (
                <div className="border border-yellow-500/50 rounded-lg overflow-hidden">
                  <div className="bg-yellow-500/10 px-3 py-2 text-sm font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                    <AlertCircle className="h-4 w-4" />
                    Emails duplicados no arquivo (não serão importadas)
                  </div>
                  <ScrollArea className="h-[60px]">
                    <div className="divide-y divide-yellow-500/20">
                      {validationResult.duplicates.map((dup, index) => (
                        <div key={index} className="px-3 py-1.5 text-sm">
                          <span className="text-muted-foreground">Linha {dup.row}:</span>{" "}
                          <span>{dup.email}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!validationResult || validationResult.valid.length === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar {validationResult?.valid.length || 0} leads
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
