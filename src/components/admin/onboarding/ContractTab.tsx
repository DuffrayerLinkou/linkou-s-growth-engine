import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DEFAULT_CONTRACT_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE GESTÃO DE TRÁFEGO PAGO

CONTRATANTE: [NOME_CLIENTE]
CONTRATADA: [SUA_EMPRESA]
DATA: [DATA_ATUAL]
GESTOR RESPONSÁVEL: [NOME_GESTOR]

1. DO OBJETO
O presente contrato tem como objeto a prestação de serviços de gestão de tráfego pago, incluindo:
- Planejamento e execução de campanhas publicitárias
- Gestão de orçamento de mídia
- Otimização contínua de resultados
- Relatórios mensais de performance

2. DO PRAZO
O presente contrato terá vigência de 12 (doze) meses, iniciando-se na data de assinatura.

3. DO VALOR
O valor dos serviços será acordado conforme proposta comercial anexa.

4. DAS OBRIGAÇÕES
4.1. Da Contratada:
- Executar os serviços com profissionalismo
- Manter confidencialidade das informações
- Entregar relatórios conforme acordado

4.2. Do Contratante:
- Fornecer informações necessárias
- Realizar pagamentos nos prazos acordados
- Aprovar campanhas quando solicitado

5. DO FORO
Fica eleito o foro da comarca de [CIDADE] para dirimir quaisquer dúvidas.

[CIDADE], [DATA_ATUAL]

_______________________________
CONTRATANTE

_______________________________
CONTRATADA`;

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: FileText },
  sent: { label: "Enviado", color: "bg-blue-500/20 text-blue-600", icon: Send },
  signed: { label: "Assinado", color: "bg-green-500/20 text-green-600", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-600", icon: XCircle },
};

interface ContractTabProps {
  clientId?: string;
}

export function ContractTab({ clientId }: ContractTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [managerName, setManagerName] = useState("");
  const [content, setContent] = useState(DEFAULT_CONTRACT_TEMPLATE);
  const [viewingContract, setViewingContract] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set selected client when clientId prop changes
  useEffect(() => {
    if (clientId) {
      setSelectedClient(clientId);
    }
  }, [clientId]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: contracts = [], isLoading, error: contractsError } = useQuery({
    queryKey: ["contracts", clientId],
    queryFn: async () => {
      let query = supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Helper to get client name by id
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || "Cliente";

  const createContractMutation = useMutation({
    mutationFn: async () => {
      const client = clients.find(c => c.id === selectedClient);
      const processedContent = content
        .replace(/\[NOME_CLIENTE\]/g, client?.name || "")
        .replace(/\[SUA_EMPRESA\]/g, "Linkou")
        .replace(/\[NOME_GESTOR\]/g, managerName)
        .replace(/\[DATA_ATUAL\]/g, format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }))
        .replace(/\[CIDADE\]/g, "São Paulo");

      const { error } = await supabase.from("contracts").insert({
        client_id: selectedClient,
        template_name: "Contrato Padrão",
        content: processedContent,
        manager_name: managerName,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contracts-progress"] });
      setIsDialogOpen(false);
      if (!clientId) setSelectedClient("");
      setManagerName("");
      setContent(DEFAULT_CONTRACT_TEMPLATE);
      toast({ title: "Contrato criado!", description: "O contrato foi salvo como rascunho." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar o contrato.", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === "sent") {
        updateData.sent_at = new Date().toISOString();
      } else if (status === "signed") {
        updateData.signed_at = new Date().toISOString();
      }
      const { error } = await supabase.from("contracts").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contracts-progress"] });
      toast({ title: "Status atualizado!" });
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        {/* CardHeader responsivo - empilhado em mobile */}
        <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Modelo de Contrato</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {clientId 
                ? "Contratos do cliente selecionado" 
                : "Preencha e envie para o cliente"}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Novo Contrato</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">Criar Novo Contrato</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Cliente</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient} disabled={!!clientId}>
                      <SelectTrigger className="h-9 sm:h-10">
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
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Nome do Gestor</Label>
                    <Input
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="h-9 sm:h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Conteúdo do Contrato</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[250px] sm:min-h-[400px] font-mono text-xs sm:text-sm"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Use: [NOME_CLIENTE], [SUA_EMPRESA], [NOME_GESTOR], [DATA_ATUAL], [CIDADE]
                  </p>
                </div>
                <Button
                  onClick={() => createContractMutation.mutate()}
                  disabled={!selectedClient || !managerName || createContractMutation.isPending}
                  className="w-full"
                >
                  Criar Contrato
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          {isLoading ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : contractsError ? (
            <div className="text-center py-6 sm:py-8 text-destructive text-sm">
              Não foi possível carregar os contratos.
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              {clientId ? "Nenhum contrato para este cliente" : "Nenhum contrato criado ainda"}
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {contracts.map((contract: any) => {
                const status = statusConfig[contract.status as keyof typeof statusConfig] || statusConfig.draft;
                const StatusIcon = status.icon;
                return (
                  <div
                    key={contract.id}
                    className="flex flex-col gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    {/* Linha 1: Cliente e status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-muted shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{getClientName(contract.client_id)}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                            <Clock className="h-3 w-3" />
                            {contract.created_at ? format(new Date(contract.created_at), "dd/MM/yy") : "Sem data"}
                            {contract.manager_name && (
                              <span className="hidden sm:inline">• {contract.manager_name}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${status.color} shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">{status.label}</span>
                      </Badge>
                    </div>
                    
                    {/* Linha 2: Ações */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setViewingContract(contract)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      {contract.status === "draft" && (
                        <Button
                          size="sm"
                          className="h-8 text-xs flex-1 sm:flex-none"
                          onClick={() => updateStatusMutation.mutate({ id: contract.id, status: "sent" })}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          <span className="truncate">Enviado</span>
                        </Button>
                      )}
                      {contract.status === "sent" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs flex-1 sm:flex-none"
                          onClick={() => updateStatusMutation.mutate({ id: contract.id, status: "signed" })}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span className="truncate">Assinado</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Contract Dialog */}
      <Dialog open={!!viewingContract} onOpenChange={() => setViewingContract(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Contrato</DialogTitle>
          </DialogHeader>
          <div className="bg-muted p-6 rounded-lg">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {viewingContract?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}